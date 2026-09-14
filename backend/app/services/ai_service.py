"""Map isolated Harness turns to the existing browser JSON/SSE protocol."""
from collections.abc import AsyncIterator
import asyncio
from contextlib import aclosing, suppress
import json
import threading
import time
from uuid import uuid4
from anyio import CancelScope

from app.config import Settings, settings
from app.observability import log_event
from app.schemas.chat import ChatMessage
from app.services.ai_errors import AIServiceError, safe_error
from app.services.runtime_manager import AgentRuntimeManager
from app.services.stream_buffer import StreamBuffer
from app.services.progressive_reply import ProgressiveReply, SecretRedactor, opaque_id


class AIService:
    def __init__(self, config: Settings = settings, harness_factory=None, runtime_manager=None):
        self.config = runtime_manager.config if runtime_manager else config
        self.harness_factory = harness_factory
        self.runtime_manager = runtime_manager

    def check_configuration(self) -> None:
        if not self.config.DEEPSEEK_API_KEY:
            raise AIServiceError("DeepSeek 尚未配置，请联系站点管理员。", 503, "configuration")
        if self.runtime_manager:
            self.runtime_manager.check_available()

    @staticmethod
    def _input(messages: list[ChatMessage]) -> str:
        # The official SDK accepts a user prompt, not an OpenAI history array.
        # Keep prior roles explicit as data without replaying paid model turns.
        return json.dumps({
            "previous_context": [{"role": m.role, "content": m.content} for m in messages[:-1]],
            "input": messages[-1].content,
        }, ensure_ascii=False)

    @staticmethod
    def _notifications(notification, session_id: str, tool_calls: dict) -> dict | None:
        if notification.method != "session.event" or notification.payload.get("sessionId") != session_id:
            return None
        event = notification.payload.get("event") or {}
        data = event.get("data") or {}
        # SDK deltas can be tool preambles or an incomplete/different draft.
        # Old clients append text, so only the completed canonical final_response
        # is sent as the reply. Tools remain visible while the model is running.
        if event.get("type") == "tool/call":
            name, call_id = data.get("name"), data.get("callId")
            if name in {"site_info", "desktop_apps", "girlfriend_mode"} and isinstance(call_id, str):
                tool_calls[call_id] = name
                return {"event": "tool", "name": name, "call_id": opaque_id(call_id), "status": "running", "message":
                        "正在轻轻敲开彩蛋的门…" if name == "girlfriend_mode" else "正在查询站内内容…"}
        if event.get("type") == "tool/result":
            message = data.get("message") or {}
            for block in message.get("content", []):
                name = tool_calls.pop(block.get("toolCallId"), None)
                if name:
                    failed = bool(data.get("error") or block.get("isError"))
                    return {"event": "tool", "name": name, "call_id": opaque_id(block["toolCallId"]), "status": "failed" if failed else "completed",
                            "message": "站内查询失败" if failed else "站内查询已完成"}
        return None

    @staticmethod
    def _validate_result(result) -> str:
        if result.finish_reason != "completed":
            for event in reversed(result.events):
                if event.get("type") == "turn/end":
                    raise safe_error(json.dumps(event.get("data"), ensure_ascii=False))
            raise AIServiceError("站内 Agent 回复未完成，请稍后再试。")
        if not isinstance(result.final_response, str) or not result.final_response.strip():
            raise AIServiceError("站内 Agent 暂未返回内容，请稍后再试。")
        return result.final_response

    @staticmethod
    def _desktop_action(result, session_id: str) -> str | None:
        # The SDK filters RunResult.events to this owned root session. Correlate
        # actual tool results, never assistant text, arguments or transient events.
        if getattr(result, "session_id", None) != session_id or result.finish_reason != "completed":
            return None
        calls = set()
        for event in result.events:
            data = event.get("data") or {}
            if event.get("type") == "tool/call" and data.get("name") == "girlfriend_mode":
                if isinstance(data.get("callId"), str):
                    calls.add(data["callId"])
            if event.get("type") != "tool/result":
                continue
            for block in (data.get("message") or {}).get("content", []):
                if not isinstance(block, dict) or block.get("type") != "tool-result":
                    continue
                if block.get("toolCallId") not in calls:
                    continue
                calls.discard(block["toolCallId"])
                if data.get("error") or block.get("isError"):
                    continue
                content = block.get("content")
                if not isinstance(content, list) or len(content) != 1:
                    continue
                text = content[0]
                if not isinstance(text, dict) or text.get("type") != "text" or not isinstance(text.get("text"), str):
                    continue
                try:
                    value = json.loads(text["text"])
                except (ValueError, TypeError):
                    continue
                if (isinstance(value, dict) and value.get("unlocked") is True
                        and value.get("progress") == 5 and value.get("next_question") is None):
                    return "unlock-girlfriend"
        return None

    async def stream_response(self, messages: list[ChatMessage], progressive: bool = False) -> AsyncIterator[dict]:
        async with aclosing(self._run(messages, streaming=True, progressive=progressive)) as events:
            async for item in events:
                yield item

    async def generate_response(self, messages: list[ChatMessage]) -> str:
        return (await self.generate_reply(messages))["content"]

    async def generate_reply(self, messages: list[ChatMessage]) -> dict:
        async with aclosing(self._run(messages, streaming=False)) as events:
            async for item in events:
                if item.get("done"):
                    return item
        raise AIServiceError("站内 Agent 暂未返回内容，请稍后再试。")

    async def _run(self, messages: list[ChatMessage], streaming: bool, progressive: bool = False) -> AsyncIterator[dict]:
        self.check_configuration()
        manager = self.runtime_manager or AgentRuntimeManager(self.config, self.harness_factory)
        session_id = "site-" + uuid4().hex
        loop = asyncio.get_running_loop()
        started = time.monotonic()
        buffer = StreamBuffer(loop, self.config.CHAT_STREAM_MAX_EVENTS, self.config.CHAT_STREAM_MAX_BYTES)
        cancelled = threading.Event()
        lease_lock = threading.Lock()
        owned_lease = None
        tool_calls: dict[str, str] = {}
        first_event = False
        first_text = False
        outcome = "cancelled"
        notification_count = 0
        notification_bytes = 0
        secrets = (self.config.DEEPSEEK_API_KEY, self.config.INTERNAL_API_TOKEN)
        projection = ProgressiveReply(session_id, secrets, self.config.DSH_MAX_REPLY_BYTES)

        def progress(stage, message):
            if progressive:
                for event in projection.progress(stage, message):
                    buffer.publish(event)

        def close_owned():
            with lease_lock:
                lease = owned_lease
            if lease:
                with suppress(Exception):
                    lease.close()
            if self.runtime_manager is None:
                manager.close()

        def on_notification(notification):
            nonlocal notification_count, notification_bytes
            if cancelled.is_set():
                return
            # The SDK retains notifications until the run ends. Bound cumulative
            # retention for both JSON and SSE; this callback cannot prevent the
            # SDK from first parsing one oversized upstream notification.
            notification_count += 1
            if notification_count > self.config.DSH_MAX_NOTIFICATION_EVENTS:
                raise AIServiceError("站内 Agent 的回复超出处理范围，请缩短问题后重试。", 502, "response_limit")
            notification_bytes += len(json.dumps(notification.payload, ensure_ascii=False).encode("utf-8"))
            if notification_bytes > self.config.DSH_MAX_NOTIFICATION_BYTES:
                raise AIServiceError("站内 Agent 的回复超出处理范围，请缩短问题后重试。", 502, "response_limit")
            if not streaming:
                return
            if progressive:
                for event in projection.feed(notification):
                    buffer.publish(event)
            event = self._notifications(notification, session_id, tool_calls)
            if event:
                buffer.publish(event)

        def run_sync():
            nonlocal owned_lease
            lease = None
            try:
                if cancelled.is_set():
                    return
                progress('preparing', '正在准备站内助手…')
                lease = manager.acquire(progressive=progressive)
                with lease_lock:
                    owned_lease = lease
                log_event("agent_stage", stage="prepared", duration_ms=round((time.monotonic() - started) * 1000, 2), active=manager.active_count)
                if cancelled.is_set():
                    return
                startup = time.monotonic()
                lease.start()
                log_event("agent_stage", stage="runtime_started", duration_ms=round((time.monotonic() - startup) * 1000, 2))
                if cancelled.is_set():
                    return
                progress('analyzing', '正在处理你的问题…')
                result = lease.run(self._input(messages), session_id=session_id, on_notification=on_notification)
                final = self._validate_result(result)
                if len(final.encode("utf-8")) > self.config.DSH_MAX_REPLY_BYTES:
                    raise AIServiceError("站内 Agent 的回复较长，请缩短问题后重试。", 502, "response_limit")
                final = SecretRedactor(secrets).redact(final)
                progress('finalizing', '正在整理最终回复…')
                buffer.finish("result", {"content": final, "action": self._desktop_action(result, session_id)})
            except Exception as exc:
                buffer.finish("error", safe_error(exc))
            finally:
                if lease:
                    with suppress(Exception):
                        lease.close(final=True)

        worker = asyncio.create_task(asyncio.to_thread(run_sync))
        deadline = loop.time() + self.config.DSH_REQUEST_TIMEOUT_SECONDS
        try:
            while True:
                remaining = deadline - loop.time()
                if remaining <= 0:
                    raise TimeoutError
                try:
                    kind, payload = await buffer.get(min(remaining, self.config.CHAT_HEARTBEAT_SECONDS))
                except TimeoutError:
                    if loop.time() >= deadline:
                        raise
                    if streaming:
                        yield {"event": "heartbeat"}
                    continue
                if kind == "error":
                    raise payload
                if kind == "event":
                    if not first_event:
                        first_event = True
                        log_event("agent_stage", stage="first_event", duration_ms=round((time.monotonic() - started) * 1000, 2))
                    if payload.get('event') == 'reply' and payload.get('content') and not first_text:
                        first_text = True
                        log_event("agent_stage", stage="first_text", duration_ms=round((time.monotonic() - started) * 1000, 2))
                    yield payload
                    continue
                # Completion is the only authoritative source of reply text.
                # Emit it once even if the SDK supplied intermediate text deltas.
                if not first_event:
                    first_event = True
                    log_event("agent_stage", stage="first_event", duration_ms=round((time.monotonic() - started) * 1000, 2))
                if not first_text:
                    log_event("agent_stage", stage="first_text", duration_ms=round((time.monotonic() - started) * 1000, 2))
                if streaming:
                    yield projection.final(payload['content']) if progressive else {"content": payload["content"], "done": False}
                    if payload["action"]:
                        yield {"event": "desktop", "action": payload["action"]}
                    outcome = "completed"
                    yield {"done": True} if progressive else {"content": "", "done": True}
                else:
                    outcome = "completed"
                    yield {"content": payload["content"], "done": True,
                           **({"desktop_action": payload["action"]} if payload["action"] else {})}
                outcome = "completed"
                return
        except TimeoutError:
            outcome = "timeout"
            raise safe_error(TimeoutError()) from None
        except AIServiceError as exc:
            outcome = exc.code
            raise
        finally:
            cancelled.set()
            buffer.stop()
            cleanup_started = time.monotonic()
            cleanup = asyncio.create_task(asyncio.to_thread(close_owned))
            # Retain task ownership after caller cancellation. SDK close itself has
            # bounded shutdown/terminate/kill steps; report a stuck custom runtime.
            cleanup_ok = True
            with CancelScope(shield=True):
                for task in (cleanup, worker):
                    try:
                        await asyncio.wait_for(asyncio.shield(task), timeout=self.config.DSH_CLEANUP_TIMEOUT_SECONDS)
                    except (TimeoutError, asyncio.CancelledError):
                        cleanup_ok = False
            log_event("agent_turn", outcome=outcome, duration_ms=round((time.monotonic() - started) * 1000, 2),
                      cleanup_ms=round((time.monotonic() - cleanup_started) * 1000, 2), cleanup_ok=cleanup_ok,
                      peak_buffer_bytes=buffer.peak_bytes, active=manager.active_count,
                      notification_count=notification_count, notification_bytes=notification_bytes)
