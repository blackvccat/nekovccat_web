"""Run the official DeepSeek Harness SDK with the site's restricted profile."""
from collections.abc import AsyncIterator
import asyncio
from contextlib import aclosing, suppress
import json
from pathlib import Path
import threading
import time
from uuid import uuid4

from app.config import Settings, settings
from app.observability import log_event
from app.schemas.chat import ChatMessage
from app.services.ai_errors import AIServiceError, safe_error
from app.services.harness_adapter import SiteHarness
from app.services.progressive_reply import ProgressiveReply, SecretRedactor, opaque_id
from app.services.runtime_manager import AgentRuntimeManager
from app.services.stream_buffer import StreamBuffer


class AIService:
    def __init__(self, config: Settings = settings, harness_factory=None, runtime_manager=None):
        # 运行时管理器由 chat 路由从 app.state 传进来（进程里只有一份，它持有准备一次的补丁
        # 与在飞租约，每请求新建它就等于没复用它）。缺省时自建一份并在本轮结束时关掉，
        # 那条路只给测试与一次性调用用。
        self.config = runtime_manager.config if runtime_manager else config
        # SiteHarness only adds the pipe cleanup the pinned SDK leaves out; tests inject a fake.
        self.harness_factory = harness_factory or SiteHarness
        self.runtime_manager = runtime_manager

    def _secrets(self) -> tuple[str, ...]:
        """Every server-side secret that could show up in model text, never sent to the browser."""
        return tuple(value for value in (self.config.DEEPSEEK_API_KEY, self.config.INTERNAL_API_TOKEN) if value)

    def check_configuration(self) -> None:
        if not self.config.DEEPSEEK_API_KEY:
            raise AIServiceError("DeepSeek 尚未配置，请联系站点管理员。", 503)
        if not Path(self.config.DSH_PATCH_PATH).is_file():
            raise AIServiceError("站内 Agent 的工具配置尚未就绪，请联系站点管理员。", 503)
        if self.runtime_manager is not None:
            # 进程级管理器把「配置只在重启后刷新」锁在自己内部，这里跟它保持一致：
            # 一旦准备失败就不必每个请求都重新读一遍文件。
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
    def _content_event(notification, session_id: str) -> dict | None:
        """老协议的正文增量：只有 text-delta 成为可见正文，推理内容不出后端。"""
        if notification.method != "session.event" or notification.payload.get("sessionId") != session_id:
            return None
        event = notification.payload.get("event") or {}
        data = event.get("data") or {}
        if event.get("type") != "assistant/chunk":
            return None
        chunk = data.get("chunk") or {}
        if chunk.get("type") == "text-delta" and isinstance(chunk.get("text"), str) and chunk["text"]:
            return {"content": chunk["text"], "done": False}
        return None

    @staticmethod
    def _tool_event(notification, session_id: str, tool_calls: dict) -> dict | None:
        """工具进度两套协议共用：只认站内白名单工具，只带固定文案、状态与脱敏后的调用 id。"""
        if notification.method != "session.event" or notification.payload.get("sessionId") != session_id:
            return None
        event = notification.payload.get("event") or {}
        data = event.get("data") or {}
        if event.get("type") == "tool/call":
            name, call_id = data.get("name"), data.get("callId")
            if name in {"site_info", "desktop_apps"} and isinstance(call_id, str):
                tool_calls[call_id] = name
                # 原始 callId 不出后端：前端只需要一个稳定的去重键（同时发起的同名工具各占一行）。
                return {"event": "tool", "name": name, "status": "running", "message": "正在查询站内内容…",
                        "call_id": opaque_id(call_id)}
        if event.get("type") == "tool/result":
            message = data.get("message") or {}
            for block in message.get("content", []):
                call_id = block.get("toolCallId")
                name = tool_calls.pop(call_id, None)
                if name:
                    failed = bool(data.get("error") or block.get("isError"))
                    return {"event": "tool", "name": name, "status": "failed" if failed else "completed",
                            "message": "站内查询失败" if failed else "站内查询已完成",
                            "call_id": opaque_id(call_id) if isinstance(call_id, str) else None}
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

    async def stream_response(self, messages: list[ChatMessage], progressive: bool = False) -> AsyncIterator[dict]:
        async with aclosing(self._run(messages, streaming=True, progressive=progressive)) as events:
            async for item in events:
                yield item

    async def generate_response(self, messages: list[ChatMessage]) -> str:
        return (await self.generate_reply(messages))["content"]

    async def generate_reply(self, messages: list[ChatMessage]) -> dict:
        async with aclosing(self._run(messages, streaming=False, progressive=False)) as events:
            async for item in events:
                if item.get("done"):
                    return item
        raise AIServiceError("站内 Agent 暂未返回内容，请稍后再试。")

    async def _run(self, messages: list[ChatMessage], streaming: bool, progressive: bool = False) -> AsyncIterator[dict]:
        self.check_configuration()
        # 自建的那份运行时属于本轮，结束时要一起关掉；从 app.state 传进来的那份不归这里管。
        manager = self.runtime_manager or AgentRuntimeManager(self.config, self.harness_factory)
        session_id = "site-" + uuid4().hex
        loop = asyncio.get_running_loop()
        started_at = loop.time()
        buffer = StreamBuffer(loop, self.config.CHAT_STREAM_MAX_EVENTS, self.config.CHAT_STREAM_MAX_BYTES)
        cancelled = threading.Event()
        lease_lock = threading.Lock()
        owned_lease = None
        tool_calls: dict[str, str] = {}
        streamed = False
        usage = {"events": 0, "bytes": 0}
        limited = threading.Event()
        # v2 请求：把通知流投影成 progress / reply(delta) 事件；老请求继续走追加式正文。
        projection = (ProgressiveReply(session_id, self._secrets(), self.config.DSH_MAX_REPLY_BYTES)
                      if progressive else None)
        # 老协议的增量同样要跨块遮蔽：ProjectiveReply 只服务 v2，这里不给老路径配一个遮蔽器的话，
        # 密钥在流里就发出去了，只有最后那一次 result 才遮——等于没遮。
        legacy_redactor = None if projection is not None else SecretRedactor(self._secrets())

        def close_owned():
            with lease_lock:
                lease = owned_lease
            if lease is not None:
                with suppress(Exception):
                    lease.close()
            if self.runtime_manager is None:
                manager.close()

        def stop_with(error: AIServiceError) -> None:
            """Fail the turn exactly once; the SDK keeps producing until the runtime is closed."""
            if limited.is_set():
                return
            limited.set()
            cancelled.set()
            buffer.finish("error", error)

        def publish(event: dict) -> None:
            # 体积上限在「要不要发给前端」之前先算，JSON 与 SSE 两条路受同一个上限约束。
            usage["events"] += 1
            usage["bytes"] += len(json.dumps(event, ensure_ascii=False).encode("utf-8"))
            if (usage["events"] > self.config.DSH_MAX_NOTIFICATION_EVENTS
                    or usage["bytes"] > self.config.DSH_MAX_NOTIFICATION_BYTES):
                stop_with(AIServiceError("这一轮的内容过多，已停止生成。", 502, "response_limit"))
                return
            if not streaming:
                return
            try:
                buffer.publish(event)
            except AIServiceError:
                # 队列满（浏览器读得慢）：终态已经由 StreamBuffer 写好，这里只负责停下 worker。
                cancelled.set()
                raise

        def progress(stage: str, message: str) -> None:
            """阶段进度：只有 v2 请求会看到（老协议没有 progress 事件）。"""
            if projection is None:
                return
            for event in projection.progress(stage, message):
                publish(event)

        def on_notification(notification):
            if cancelled.is_set():
                return
            if projection is not None:
                for event in projection.feed(notification):
                    publish(event)
                tool_event = self._tool_event(notification, session_id, tool_calls)
                if tool_event:
                    publish(tool_event)
                return
            event = self._content_event(notification, session_id)
            if event is not None:
                # 遮蔽器可能把疑似密钥前缀的尾巴扣住；扣住时这一块就是空的，不发空事件。
                # 代价是那条尾巴最多永久少 len(secret)-1 个字符，与 v2 的取舍一致。
                content = legacy_redactor.feed(event["content"])
                if content:
                    publish({**event, "content": content})
                return
            tool_event = self._tool_event(notification, session_id, tool_calls)
            if tool_event:
                publish(tool_event)

        def run_sync():
            nonlocal owned_lease
            lease = None
            try:
                if cancelled.is_set():
                    return
                startup = time.monotonic()
                # 三个阶段事件对应面板上的三行：准备运行时 / 开始处理 / 收尾整理。
                progress('preparing', '正在准备站内助手…')
                lease = manager.acquire(progressive=progressive)
                with lease_lock:
                    owned_lease = lease
                log_event('agent_stage', stage='prepared',
                          duration_ms=round((time.monotonic() - startup) * 1000, 2), active=manager.active_count)
                if cancelled.is_set():
                    return
                runtime_started = time.monotonic()
                lease.start()
                log_event('agent_stage', stage='runtime_started', duration_ms=round((time.monotonic() - runtime_started) * 1000, 2))
                if cancelled.is_set():
                    return
                progress('analyzing', '正在处理你的问题…')
                result = lease.run(self._input(messages), session_id=session_id, on_notification=on_notification)
                final = self._validate_result(result)
                # 按模型原始输出计字节：超限就让整轮失败，截断等于假装成功。
                if len(final.encode("utf-8")) > self.config.DSH_MAX_REPLY_BYTES:
                    raise AIServiceError("这一轮的回答过长，已停止生成。", 502, "response_limit")
                progress('finalizing', '正在整理最终回复…')
                if projection is not None:
                    # final 覆盖前面所有 delta（前端按 message_id 替换），正文按上面那一遍字节数计过。
                    buffer.publish(projection.final(final))
                else:
                    final = SecretRedactor(self._secrets()).redact(final)
                buffer.finish("result", {"content": final})
            except Exception as exc:
                buffer.finish("error", safe_error(exc))
            finally:
                if lease is not None:
                    with suppress(Exception):
                        lease.close(final=True)

        worker = asyncio.create_task(asyncio.to_thread(run_sync))
        deadline = loop.time() + self.config.DSH_REQUEST_TIMEOUT_SECONDS
        # 默认「取消」：只有真的发出终态才算完成。客户端中途断开时生成器被关闭，
        # 走不到下面任何一条赋值语句，这条日志就不会撒谎说这一轮跑完了。
        outcome = "cancelled"
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
                    # 静默期发注释心跳：前端代理的空闲预算与家用路由/NAT 靠它分辨「还在跑」与「断了」。
                    if streaming:
                        yield {"event": "heartbeat"}
                    continue
                if kind == "error":
                    raise payload
                if kind == "event":
                    if payload.get("content") and not streamed:
                        streamed = True
                        # 第一个正文字节到达的时间点：日志里用来区分"模型慢"与"运行时慢"。
                        log_event("agent_stage", stage="first_text",
                                  duration_ms=round((loop.time() - started_at) * 1000, 2))
                    yield payload
                    continue
                if streaming:
                    # v2 的正文已经作为 reply(final) 发过了，这里只发收尾哨兵，避免正文重复。
                    if projection is None and not streamed:
                        yield {"content": payload["content"], "done": False}
                    outcome = "completed"
                    yield {"content": "", "done": True}
                else:
                    outcome = "completed"
                    yield {"content": payload["content"], "done": True}
                return
        except TimeoutError:
            outcome = "timeout"
            raise safe_error(TimeoutError()) from None
        except AIServiceError as exc:
            outcome = exc.code
            raise
        except asyncio.CancelledError:
            outcome = "cancelled"
            raise
        finally:
            cancelled.set()
            buffer.stop()
            cleanup_started = loop.time()
            # Closing the SDK terminates its child and releases blocked readers.
            # Shield cleanup so a disconnected browser cannot orphan a paid run.
            cleanup_ok = True
            with suppress(Exception, asyncio.CancelledError):
                await asyncio.shield(asyncio.to_thread(close_owned))
            try:
                await asyncio.wait_for(asyncio.shield(worker), timeout=self.config.DSH_CLEANUP_TIMEOUT_SECONDS)
            except asyncio.CancelledError:
                cleanup_ok = False
            except Exception:
                # 收尾超时也算「没清干净」：这一行是排查子进程堆积的第一手依据。
                cleanup_ok = False
            # 一轮的收尾汇总：看着这行就能分清「模型慢」（first_text 大）与「清理慢」（cleanup_ms 大）。
            log_event("agent_turn", outcome=outcome,
                      duration_ms=round((loop.time() - started_at) * 1000, 2),
                      cleanup_ms=round((loop.time() - cleanup_started) * 1000, 2), cleanup_ok=cleanup_ok,
                      peak_buffer_bytes=buffer.peak_bytes, active=manager.active_count,
                      notification_count=usage["events"], notification_bytes=usage["bytes"],
                      progressive=progressive, streamed=streamed)
