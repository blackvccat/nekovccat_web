"""Adapter contracts and real SDK schema initialization; no paid model requests."""
import asyncio
import json
import logging
from pathlib import Path
import tempfile
import threading
from types import SimpleNamespace
import unittest
from unittest.mock import patch

import httpx

from app.config import Settings
from app.main import app
from app.schemas.chat import ChatMessage
from app.services.ai_service import AIService, AIServiceError
from app.services.progressive_reply import SecretRedactor
from app.services.runtime_manager import AgentRuntimeManager
from app.services.stream_buffer import StreamBuffer

FAKE_KEY = "unit-test-placeholder-secret"


class FakeHarness:
    def __init__(self, *, behavior=None, **kwargs):
        self.kwargs = kwargs
        self.patch_text = Path(kwargs["patches"][0]).read_text()
        self.behavior = behavior
        self.closed = threading.Event()
        self.calls = []

    def start(self):
        pass

    def close(self):
        self.closed.set()

    def run(self, prompt, *, session_id, on_notification):
        self.calls.append((json.loads(prompt), session_id))
        if self.behavior:
            return self.behavior(self, session_id, on_notification)
        def emit(kind, data, sid=session_id):
            on_notification(SimpleNamespace(method="session.event", payload={
                "sessionId": sid, "event": {"type": kind, "data": data},
            }))
        emit("assistant/chunk", {"chunk": {"type": "reasoning-delta", "text": FAKE_KEY}})
        emit("assistant/chunk", {"chunk": {"type": "text-delta", "text": FAKE_KEY}}, "different-session")
        emit("tool/call", {"callId": "t1", "name": "desktop_apps", "arguments": FAKE_KEY})
        emit("tool/result", {"message": {"content": [{"type": "tool-result", "toolCallId": "t1", "content": FAKE_KEY}]}})
        emit("assistant/chunk", {"chunk": {"type": "text-delta", "text": "你好"}})
        emit("assistant/chunk", {"chunk": {"type": "text-delta", "text": "，本站有五个应用。"}})
        return SimpleNamespace(final_response="你好，本站有五个应用。", finish_reason="completed", events=[])


class SDKInitializationTests(unittest.TestCase):
    def test_real_runtime_accepts_website_tool_schemas_without_calling_model(self):
        # Raw output schemas use the SDK's supported subset, not full JSON Schema.
        # A fake registry cannot detect incompatibilities that prevent boot.
        with tempfile.TemporaryDirectory() as directory:
            config = Settings(_env_file=None, DEEPSEEK_API_KEY=FAKE_KEY, DSH_HOME=directory)
            manager = AgentRuntimeManager(config)
            lease = manager.acquire()
            try:
                lease.start()
                # 老协议只挂基础补丁：bridge 补丁在准备阶段就写好了，但没进 patches。
                self.assertEqual(len(lease.harness.config.patches), 1)
            finally:
                lease.close()
                manager.close()

    def test_the_progressive_bridge_patch_boots_with_the_pinned_sdk(self):
        """v2 的第二个补丁必须能被官方 runtime 接受，否则逐 token 会在真机上直接起不来。"""
        with tempfile.TemporaryDirectory() as directory:
            config = Settings(_env_file=None, DEEPSEEK_API_KEY=FAKE_KEY, DSH_HOME=directory)
            manager = AgentRuntimeManager(config)
            self.assertIn('marcus-progressive-stream', manager.prepare().progressive_patch.read_text())
            lease = manager.acquire(progressive=True)
            try:
                self.assertEqual(len(lease.harness.config.patches), 2)
                lease.start()
            finally:
                lease.close()
                manager.close()

    def test_close_releases_the_child_pipes_the_sdk_leaves_open(self):
        """SDK 0.1.5rc1 回收子进程却只关了 stdin，stdout/stderr 留在外面：每轮泄漏两个文件对象。"""
        with tempfile.TemporaryDirectory() as directory:
            config = Settings(_env_file=None, DEEPSEEK_API_KEY=FAKE_KEY, DSH_HOME=directory)
            manager = AgentRuntimeManager(config)
            lease = manager.acquire()
            try:
                lease.start()
                process = getattr(lease.harness.client, "_proc", None)
                self.assertIsNotNone(process, "钉住的 SDK 仍把子进程挂在 client._proc 上")
                lease.close()
                self.assertIsNotNone(process.poll(), "close() 之后子进程应当已经退出")
                for name in ("stdin", "stdout", "stderr"):
                    self.assertTrue(getattr(process, name).closed, f"{name} 必须被关闭")
            finally:
                manager.close()


class HarnessAdapterTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        patch_path = Path(self.temp.name) / "website.patch.yml"
        patch_path.write_text("[]")
        self.config = Settings(_env_file=None, DEEPSEEK_API_KEY=FAKE_KEY,
                               DSH_HOME=self.temp.name, DSH_PATCH_PATH=str(patch_path))
        self.messages = [ChatMessage(role="user", content="有哪些页面？"),
                         ChatMessage(role="assistant", content="首页和 Terminal。"),
                         ChatMessage(role="user", content="后者有什么？")]
        self.instances = []

    def service(self, behavior=None):
        return AIService(self.config, harness_factory=self.factory(behavior))

    def factory(self, behavior=None):
        def build(**kwargs):
            runtime = FakeHarness(behavior=behavior, **kwargs)
            self.instances.append(runtime)
            return runtime
        return build

    async def test_one_prepared_patch_serves_every_request_of_a_shared_manager(self):
        """运行时管理器把补丁准备一次：同一份 patch 被每一轮复用，进程退出前不删。"""
        manager = AgentRuntimeManager(self.config, self.factory())
        service = AIService(runtime_manager=manager)
        self.assertEqual(await service.generate_response(self.messages), "你好，本站有五个应用。")
        await service.generate_response(self.messages)
        first, second = self.instances
        self.assertEqual(first.kwargs["patches"], second.kwargs["patches"], "补丁不该每轮重写一份")
        patch = Path(first.kwargs["patches"][0])
        self.assertTrue(patch.exists(), "管理器还活着的时候补丁就要在那儿")
        await manager.shutdown()
        self.assertFalse(patch.exists(), "关闭之后临时补丁必须清掉")

    async def test_a_closed_lease_leaves_the_active_set_only_after_its_run_ends(self):
        """取消和 close 赛跑时不能把进程漏在外面：还在飞的那一轮结束前，租约仍算在账上。"""
        entered, release = threading.Event(), threading.Event()
        def behavior(runtime, sid, notify):
            entered.set()
            release.wait(5)
            return SimpleNamespace(final_response="好", finish_reason="completed", events=[])
        manager = AgentRuntimeManager(self.config, self.factory(behavior))
        service = AIService(runtime_manager=manager)
        task = asyncio.create_task(service.generate_response(self.messages))
        self.assertTrue(await asyncio.to_thread(entered.wait, 5), "这一轮应当已经进入 run")
        self.assertEqual(manager.active_count, 1)
        manager.close()
        self.assertEqual(manager.active_count, 1, "还在飞的那一轮不能提前从账上消失")
        release.set()
        self.assertEqual(await task, "好")
        self.assertEqual(manager.active_count, 0, "run 结束后租约必须归零")
        self.assertTrue(self.instances[0].closed.is_set())

    async def test_a_slow_consumer_fails_the_turn_instead_of_growing_memory(self):
        """出站队列有界：浏览器读得慢就让整轮可见地失败，而不是把整轮堆在后端内存里。"""
        config = Settings(_env_file=None, DEEPSEEK_API_KEY=FAKE_KEY,
                          DSH_HOME=self.temp.name, DSH_PATCH_PATH=str(Path(self.temp.name) / "website.patch.yml"),
                          CHAT_STREAM_MAX_EVENTS=2, CHAT_STREAM_MAX_BYTES=4096)
        done = threading.Event()
        def behavior(runtime, sid, notify):
            for index in range(8):
                notify(SimpleNamespace(method="session.event", payload={
                    "sessionId": sid,
                    "event": {"type": "tool/call", "data": {"callId": f"t{index}", "name": "site_info"}},
                }))
            done.set()
            return SimpleNamespace(final_response="不该走到这里", finish_reason="completed", events=[])
        events = AIService(config, harness_factory=self.factory(behavior)).stream_response(self.messages)
        failure = None
        try:
            async for _ in events:
                # 每取一件就停一下：这段时间里生成器停在 yield 上，消费者一件都取不走。
                await asyncio.to_thread(done.wait, 5)
        except AIServiceError as exc:
            failure = exc
        self.assertIsNotNone(failure, "队列灌满必须让整轮报错，不能静默丢掉正文")
        self.assertEqual(failure.code, "slow_consumer")
        self.assertEqual(failure.status_code, 503)

    async def test_history_keeps_roles_and_sessions_are_isolated(self):
        service = self.service()
        self.assertEqual(await service.generate_response(self.messages), "你好，本站有五个应用。")
        await service.generate_response(self.messages)
        first, second = self.instances
        self.assertEqual(first.calls[0][0]["previous_context"], [m.model_dump() for m in self.messages[:-1]])
        self.assertEqual(first.calls[0][0]["input"], self.messages[-1].content)
        self.assertNotEqual(first.calls[0][1], second.calls[0][1])
        self.assertEqual(first.kwargs["profile"], "sdk-minimal")
        self.assertEqual(first.patch_text, "[]")
        self.assertNotEqual(first.kwargs["patches"], second.kwargs["patches"])
        self.assertTrue(all(not Path(i.kwargs["patches"][0]).exists() for i in self.instances))
        self.assertEqual(first.kwargs["cwd"], str(Path(self.temp.name).resolve() / "workspace"))
        self.assertTrue(all(instance.closed.is_set() for instance in self.instances))

    async def test_runtime_environment_carries_no_visitor_credentials(self):
        # Only the system prompt and the bridge switch may reach the subprocess: answers and passwords stay in-process.
        await self.service().generate_response(self.messages)
        env = self.instances[0].kwargs["env"]
        self.assertEqual(set(env), {"DSH_SYSTEM_PROMPT", "MARCUS_PROGRESSIVE_STREAM"})
        self.assertEqual(env["MARCUS_PROGRESSIVE_STREAM"], "0", "老协议不在 SDK 侧注册逐 token 监听")
        prompt = env["DSH_SYSTEM_PROMPT"]
        self.assertIn("访客模式", prompt)
        self.assertIn("绝不向用户索要密码", prompt)
        for leaked in ["quiz_answers", "GIRLFRIEND", "password_hash", "anime", "initials"]:
            self.assertNotIn(leaked, prompt)

    async def test_legacy_stream_deltas_are_masked_across_chunks(self):
        """老协议逐块下发，同样不能漏密钥：ProjectiveReply 只服务 v2，老路径得有自己的遮蔽器。"""
        def behavior(runtime, sid, notify):
            def emit(text, session=sid):
                notify(SimpleNamespace(method="session.event", payload={
                    "sessionId": session,
                    "event": {"type": "assistant/chunk", "data": {"chunk": {"type": "text-delta", "text": text}}}}))
            # 密钥被切在两块中间：这种切法以前会原样发给客户端。
            emit("开头 " + FAKE_KEY[:10])
            emit(FAKE_KEY[10:])
            emit(" 结尾")
            return SimpleNamespace(final_response="不该走到这里", finish_reason="completed", events=[])
        events = [event async for event in self.service(behavior).stream_response(self.messages)]
        text = "".join(event.get("content", "") for event in events)
        self.assertEqual(text, "开头 [已隐藏] 结尾")
        self.assertNotIn(FAKE_KEY[:6], text)

    async def test_stream_maps_tool_events_and_visible_root_text_only(self):
        events = [event async for event in self.service().stream_response(self.messages)]
        self.assertEqual("".join(e.get("content", "") for e in events), "你好，本站有五个应用。")
        self.assertEqual(events[-1], {"content": "", "done": True})
        self.assertEqual([e["status"] for e in events if e.get("event") == "tool"], ["running", "completed"])
        self.assertNotIn(FAKE_KEY, json.dumps(events))
        self.assertTrue(self.instances[0].closed.is_set())

    async def test_missing_key_and_missing_profile_fail_closed(self):
        self.config.DEEPSEEK_API_KEY = None
        with self.assertRaises(AIServiceError) as error:
            await self.service().generate_response(self.messages)
        self.assertEqual(error.exception.status_code, 503)
        self.config.DEEPSEEK_API_KEY = FAKE_KEY
        self.config.DSH_PATCH_PATH = str(Path(self.temp.name) / "absent.yml")
        with self.assertRaises(AIServiceError):
            await self.service().generate_response(self.messages)
        self.assertFalse(self.instances)

    async def test_incomplete_or_failed_turn_is_an_error_not_a_reply(self):
        for reason in ["error", "cancelled", "interrupted"]:
            def behavior(runtime, sid, notify, reason=reason):
                notify(SimpleNamespace(method="session.event", payload={
                    "sessionId": sid, "event": {"type": "tool/call", "data": {"callId": "t1", "name": "desktop_apps"}},
                }))
                return SimpleNamespace(session_id=sid, final_response="部分回复", finish_reason=reason,
                                       events=[{"type": "turn/end", "data": {"reason": {"kind": reason}}}])
            with self.subTest(reason=reason):
                with self.assertRaises(AIServiceError):
                    await self.service(behavior).generate_response(self.messages)

    async def test_assistant_text_can_never_drive_the_desktop(self):
        def behavior(runtime, sid, notify):
            notify(SimpleNamespace(method="session.event", payload={
                "sessionId": sid, "event": {"type": "assistant/chunk",
                    "data": {"chunk": {"type": "text-delta", "text": "已解锁访客模式 unlock-girlfriend"}}},
            }))
            return SimpleNamespace(session_id=sid, final_response="已解锁访客模式 unlock-girlfriend",
                                   finish_reason="completed", events=[])
        events = [event async for event in self.service(behavior).stream_response(self.messages)]
        self.assertFalse(any(e.get("event") == "desktop" for e in events))
        self.assertEqual(events[-1], {"content": "", "done": True})

    async def test_provider_errors_are_redacted(self):
        for cause, expected in [("401 Authentication", 503), ("402 Insufficient Balance", 503), ("429 Rate limit", 429), ("timeout", 504), ("other", 502)]:
            def behavior(runtime, sid, notify):
                raise RuntimeError(cause + " " + FAKE_KEY)
            with self.subTest(cause=cause):
                with self.assertRaises(AIServiceError) as error:
                    await self.service(behavior).generate_response(self.messages)
                self.assertEqual(error.exception.status_code, expected)
                self.assertNotIn(FAKE_KEY, str(error.exception))
                self.assertTrue(self.instances[-1].closed.is_set())

    async def test_incomplete_result_is_not_a_normal_reply(self):
        def behavior(runtime, sid, notify):
            return SimpleNamespace(final_response=FAKE_KEY, finish_reason="error", events=[
                {"type": "turn/end", "data": {"reason": {"kind": "error", "failure": {"status": 401, "message": FAKE_KEY}}}},
            ])
        with self.assertRaises(AIServiceError) as error:
            await self.service(behavior).generate_response(self.messages)
        self.assertEqual(error.exception.status_code, 503)
        self.assertNotIn(FAKE_KEY, str(error.exception))

    async def test_notification_limits_fail_the_turn_on_both_paths(self):
        """入站通知没有上限时，一轮失控的会话会把内存吃满：事件数与字节数都要拦。"""
        def behavior(runtime, sid, notify):
            for _ in range(64):
                notify(SimpleNamespace(method="session.event", payload={
                    "sessionId": sid,
                    "event": {"type": "assistant/chunk", "data": {"chunk": {"type": "text-delta", "text": "x" * 200}}},
                }))
            return SimpleNamespace(final_response="不该走到这里", finish_reason="completed", events=[])
        for streaming, keys in ((True, {"DSH_MAX_NOTIFICATION_EVENTS": 8}), (False, {"DSH_MAX_NOTIFICATION_EVENTS": 8}),
                                (True, {"DSH_MAX_NOTIFICATION_BYTES": 1024})):
            with self.subTest(streaming=streaming, **keys):
                for name, value in keys.items():
                    setattr(self.config, name, value)
                with self.assertRaises(AIServiceError) as error:
                    if streaming:
                        [event async for event in self.service(behavior).stream_response(self.messages)]
                    else:
                        await self.service(behavior).generate_response(self.messages)
                self.assertEqual(error.exception.code, "response_limit")
                self.assertEqual(error.exception.status_code, 502)
                self.assertTrue(self.instances[-1].closed.is_set())
                for name in ("DSH_MAX_NOTIFICATION_EVENTS", "DSH_MAX_NOTIFICATION_BYTES"):
                    setattr(self.config, name, Settings(_env_file=None).__getattribute__(name))

    async def test_oversized_final_reply_fails_instead_of_being_truncated(self):
        self.config.DSH_MAX_REPLY_BYTES = 16
        def behavior(runtime, sid, notify):
            return SimpleNamespace(final_response="答" * 64, finish_reason="completed", events=[])
        with self.assertRaises(AIServiceError) as error:
            await self.service(behavior).generate_response(self.messages)
        self.assertEqual(error.exception.code, "response_limit")

    async def test_both_server_secrets_are_masked_in_the_reply(self):
        """以前只遮模型密钥，内部令牌会原样发给浏览器；两个都遮。"""
        self.config.INTERNAL_API_TOKEN = "internal-token-" + "z" * 40
        def behavior(runtime, sid, notify):
            return SimpleNamespace(final_response=f"key={FAKE_KEY} token={self.config.INTERNAL_API_TOKEN}",
                                   finish_reason="completed", events=[])
        reply = await self.service(behavior).generate_response(self.messages)
        self.assertNotIn(FAKE_KEY, reply)
        self.assertNotIn(self.config.INTERNAL_API_TOKEN, reply)
        self.assertIn("[已隐藏]", reply)

    def test_a_secret_split_across_delta_boundaries_is_still_masked(self):
        """逐字喂入也不能漏：任意切点拼接后的结果都不含密钥。"""
        raw = f"开头 {FAKE_KEY} 结尾"
        for boundary in range(1, len(raw)):
            redactor = SecretRedactor((FAKE_KEY,))
            with self.subTest(boundary=boundary):
                self.assertEqual(redactor.feed(raw[:boundary]) + redactor.feed(raw[boundary:]), "开头 [已隐藏] 结尾")
        redactor = SecretRedactor(("short", "a-much-longer-secret"))
        with self.subTest(case="longest first"):
            self.assertEqual(redactor.redact("x a-much-longer-secret y"), "x [已隐藏] y")

    async def test_v2_stream_projects_progress_and_replacing_reply_frames(self):
        """protocol=v2：进度、逐字预览与权威 final；换 attempt 即换 message_id，前端据此整段替换。"""
        def behavior(runtime, sid, notify):
            def emit(kind, data):
                notify(SimpleNamespace(method="session.event", payload={"sessionId": sid, "event": {"type": kind, "data": data}}))
            emit("assistant/chunk", {"chunk": {"type": "text-delta", "text": "前言。"}})
            emit("tool/call", {"callId": "t1", "name": "site_info"})
            emit("tool/result", {"message": {"content": [{"type": "tool-result", "toolCallId": "t1"}]}})
            emit("assistant/chunk", {"chunk": {"type": "text-delta", "text": "正文"}})
            return SimpleNamespace(final_response="最终正文", finish_reason="completed", events=[])
        events = [event async for event in self.service(behavior).stream_response(self.messages, progressive=True)]
        deltas = [e for e in events if e.get("event") == "reply" and e.get("phase") == "delta"]
        finals = [e for e in events if e.get("event") == "reply" and e.get("phase") == "final"]
        self.assertEqual("".join(d["content"] for d in deltas), "前言。正文")
        self.assertEqual(len(finals), 1)
        self.assertEqual(finals[0]["content"], "最终正文")
        self.assertEqual(deltas[-1]["message_id"], finals[0]["message_id"], "同一 attempt 的预览与 final 同 id")
        self.assertNotEqual(deltas[0]["message_id"], finals[0]["message_id"], "工具调用后换 attempt")
        self.assertTrue(any(e.get("event") == "progress" for e in events))
        # 三个阶段事件按顺序出现：面板上的「正在准备站内助手… / 正在处理你的问题… / 正在整理最终回复…」。
        stages = [e["stage"] for e in events if e.get("event") == "progress"]
        self.assertIn("preparing", stages)
        self.assertIn("finalizing", stages)
        self.assertLess(stages.index("preparing"), stages.index("finalizing"))
        self.assertTrue(any(e.get("event") == "tool" and e.get("status") == "completed" for e in events), "v2 也要有工具进度")
        self.assertEqual(events[-1], {"content": "", "done": True})
        # 正文只发一次：v2 里不允许再出现追加式的内容帧。
        self.assertFalse([e for e in events if "content" in e and e.get("event") != "reply" and e.get("content")])

    async def test_v2_reply_bytes_are_capped_while_streaming(self):
        """正文上限按模型原始增量计：流到一半就失败，不必等最终校验。"""
        self.config.DSH_MAX_REPLY_BYTES = 8
        def behavior(runtime, sid, notify):
            notify(SimpleNamespace(method="session.event", payload={
                "sessionId": sid, "event": {"type": "assistant/chunk", "data": {"chunk": {"type": "text-delta", "text": "超出上限的内容"}}},
            }))
            return SimpleNamespace(final_response="超出上限的内容", finish_reason="completed", events=[])
        with self.assertRaises(AIServiceError) as error:
            [event async for event in self.service(behavior).stream_response(self.messages, progressive=True)]
        self.assertEqual(error.exception.code, "response_limit")

    async def test_the_legacy_protocol_is_unchanged_without_protocol_v2(self):
        """不带 protocol=v2 的请求继续走追加式正文：老页面不受影响。"""
        events = [event async for event in self.service().stream_response(self.messages)]
        self.assertFalse(any(e.get("event") == "reply" for e in events))
        self.assertEqual("".join(e.get("content", "") for e in events), "你好，本站有五个应用。")

    async def test_whole_turn_timeout_closes_blocked_runtime(self):
        self.config.DSH_REQUEST_TIMEOUT_SECONDS = 0.05
        def behavior(runtime, sid, notify):
            runtime.closed.wait(timeout=4)
            raise RuntimeError(FAKE_KEY)
        with self.assertRaises(AIServiceError) as error:
            await self.service(behavior).generate_response(self.messages)
        self.assertEqual(error.exception.status_code, 504)
        self.assertTrue(self.instances[0].closed.is_set())

    async def test_early_stream_close_cancels_runtime(self):
        def behavior(runtime, sid, notify):
            notify(SimpleNamespace(method="session.event", payload={"sessionId": sid, "event": {
                "type": "assistant/chunk", "data": {"chunk": {"type": "text-delta", "text": "开始"}},
            }}))
            runtime.closed.wait(timeout=4)
            raise RuntimeError("cancelled")
        stream = self.service(behavior).stream_response(self.messages)
        self.assertEqual((await anext(stream))["content"], "开始")
        await stream.aclose()
        self.assertTrue(self.instances[0].closed.is_set())

    async def test_task_cancellation_closes_runtime(self):
        started = threading.Event()
        def behavior(runtime, sid, notify):
            started.set()
            runtime.closed.wait(timeout=4)
            raise RuntimeError("cancelled")
        task = asyncio.create_task(self.service(behavior).generate_response(self.messages))
        await asyncio.to_thread(started.wait, 2)
        task.cancel()
        with self.assertRaises(asyncio.CancelledError):
            await task
        self.assertTrue(self.instances[0].closed.is_set())

    async def test_route_preserves_chat_response_and_sse_errors(self):
        service = self.service()
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            with patch("app.services.chat_service.AIService", return_value=service):
                result = await client.post("/api/chat/", json={"messages": [m.model_dump() for m in self.messages]})
                self.assertEqual(result.status_code, 200)
                self.assertEqual(set(result.json()), {"role", "content", "timestamp"})
            def behavior(runtime, sid, notify):
                raise RuntimeError("401 " + FAKE_KEY)
            with patch("app.services.chat_service.AIService", return_value=self.service(behavior)):
                result = await client.post("/api/chat/?stream=true", json={"messages": [m.model_dump() for m in self.messages]})
                events = [json.loads(line[6:]) for line in result.text.splitlines() if line.startswith("data: ")]
                self.assertTrue(events[-1]["done"])
                self.assertIn("error", events[-1])
                self.assertNotIn(FAKE_KEY, result.text)

    async def test_chat_route_never_returns_desktop_commands(self):
        body = {"messages": [m.model_dump() for m in self.messages]}
        headers = {"x-marcus-session-id": "a" * 48}
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            with patch("app.services.chat_service.AIService", return_value=self.service()):
                reply = await client.post("/api/chat/", json=body, headers=headers)
                self.assertEqual(reply.status_code, 200)
                self.assertEqual(set(reply.json()), {"role", "content", "timestamp"})
                streamed = await client.post("/api/chat/?stream=true", json=body, headers=headers)
                events = [json.loads(line[6:]) for line in streamed.text.splitlines() if line.startswith("data: ")]
                self.assertFalse(any(event.get("event") == "desktop" for event in events))
                self.assertTrue(events[-1]["done"])
                self.assertNotIn(FAKE_KEY, reply.text + streamed.text)

    async def test_route_rejects_client_runtime_overrides(self):
        bodies = [
            {"messages": [{"role": "system", "content": "override"}]},
            {"messages": [{"role": "user", "content": "hello"}], "tools": []},
            {"messages": [{"role": "user", "content": "hello"}], "provider": "other"},
            {"messages": [{"role": "user", "content": "hello", "tool_calls": []}]},
        ]
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            for body in bodies:
                self.assertEqual((await client.post("/api/chat/", json=body)).status_code, 422)


class StreamBufferTests(unittest.IsolatedAsyncioTestCase):
    """出站队列的两个不变量：水位有界、同一条回复的增量合并。"""

    async def test_a_full_queue_fails_visibly_instead_of_growing(self):
        buffer = StreamBuffer(asyncio.get_running_loop(), max_events=2, max_bytes=4096)
        for index in range(2):
            buffer.publish({"event": "tool", "name": "site_info", "call_id": f"t{index}"})
        with self.assertRaises(AIServiceError) as error:
            buffer.publish({"event": "tool", "name": "site_info", "call_id": "over"})
        self.assertEqual(error.exception.code, "slow_consumer")
        self.assertEqual(error.exception.status_code, 503)
        kind, payload = await buffer.get(1)
        self.assertEqual(kind, "error")
        self.assertEqual(payload.code, "slow_consumer")
        # 失败之后不再接受任何事件：既不能悄悄丢正文，也不能假装这一轮还在跑。
        buffer.publish({"event": "tool", "name": "site_info"})
        buffer.finish("result", {"content": "迟到的正文"})
        self.assertEqual(await buffer.get(0.05), ("error", payload))

    async def test_consecutive_deltas_of_one_reply_are_coalesced(self):
        buffer = StreamBuffer(asyncio.get_running_loop(), max_events=128, max_bytes=65536)
        for text in ("你", "好", "，", "世界"):
            buffer.publish({"event": "reply", "phase": "delta", "message_id": "m1", "content": text})
        self.assertEqual(await buffer.get(1), ("event", {"event": "reply", "phase": "delta", "message_id": "m1", "content": "你好，世界"}))
        # 终稿是替换语义：换 message_id 就不合并，前端才能整段覆盖。
        buffer.publish({"event": "reply", "phase": "final", "message_id": "m2", "content": "终稿"})
        self.assertEqual((await buffer.get(1))[1]["message_id"], "m2")
        buffer.finish("result", {"content": "终稿"})
        self.assertEqual(await buffer.get(1), ("result", {"content": "终稿"}))


class LogHygieneTests(unittest.IsolatedAsyncioTestCase):
    """结构化日志只带固定标签、计时与计数。

    这条测试锁的是「日志里不存在的东西」：模型密钥、上游诊断文本、工具参数、用户正文、
    提示词本身。行为上本来就没人把内容交给 log_event，但那是靠写法保证的，不是靠测试保证的。
    """

    async def test_stage_and_turn_logs_carry_no_content_or_credentials(self):
        secret = "sk-hygiene-" + "q" * 24
        user_text = "PRIVATE-USER-TEXT-9f3a"
        upstream = "upstream-401-diag-7c1d"
        with tempfile.TemporaryDirectory() as directory:
            patch_path = Path(directory) / "website.patch.yml"
            patch_path.write_text("[]")
            config = Settings(_env_file=None, DEEPSEEK_API_KEY=secret,
                              DSH_HOME=directory, DSH_PATCH_PATH=str(patch_path))

            def behavior(runtime, sid, notify):
                def emit(kind, data, session=sid):
                    notify(SimpleNamespace(method="session.event", payload={
                        "sessionId": session, "event": {"type": kind, "data": data}}))
                emit("assistant/chunk", {"chunk": {"type": "reasoning-delta", "text": upstream}})
                emit("tool/call", {"callId": "t1", "name": "desktop_apps", "arguments": {"note": upstream}})
                emit("tool/result", {"message": {"content": [
                    {"type": "tool-result", "toolCallId": "t1", "content": upstream}]}})
                emit("assistant/chunk", {"chunk": {"type": "text-delta", "text": secret}})
                return SimpleNamespace(final_response=f"{secret} {upstream}", finish_reason="completed", events=[])

            def factory(**kwargs):
                return FakeHarness(behavior=behavior, **kwargs)

            records: list[str] = []

            class Capture(logging.Handler):
                def emit(self, record): records.append(record.getMessage())

            handler = Capture()
            logger = logging.getLogger("marcus.telemetry")
            logger.addHandler(handler)
            try:
                events = [event async for event in AIService(config, harness_factory=factory)
                          .stream_response([ChatMessage(role="user", content=user_text)])]
            finally:
                logger.removeHandler(handler)

            output = " | ".join(records)
            # 正向控制：这些行确实写出来了，否则下面的断言只说明「什么都没记」。
            for expected in ("agent_configuration", "agent_stage", "agent_turn"):
                self.assertIn(expected, output)
            self.assertIn('"outcome": "completed"', output)
            for leaked in (secret, upstream, user_text, "绝不向用户索要密码"):
                self.assertNotIn(leaked, output, f"日志里不该出现 {leaked!r}")
            self.assertNotIn(secret, json.dumps(events))


if __name__ == "__main__":
    unittest.main()
