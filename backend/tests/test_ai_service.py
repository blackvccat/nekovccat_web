"""Adapter contracts and real SDK schema initialization; no paid model requests."""
import asyncio
import json
from pathlib import Path
import tempfile
import threading
from types import SimpleNamespace
import unittest
from unittest.mock import patch

import httpx

from app.config import Settings, settings
from app.main import app
from app.schemas.chat import ChatMessage
from app.services.ai_service import AIService, AIServiceError
from app.services.runtime_manager import AgentRuntimeManager

FAKE_KEY = "unit-test-placeholder-secret"


def private_fixture(directory):
    path = Path(directory) / "private-fixture.json"
    path.write_text(json.dumps({"quiz_answers": {
        "anime": ["fictional-character"], "birthday": ["01-02"], "cat_name": ["fixture-cat"],
        "mbti": ["xxxx"], "initials": ["zz"],
    }}))
    return str(path)


def girlfriend_run(*, unlocked=True, progress=5, finish_reason="completed", is_error=False,
                   tool_name="girlfriend_mode", matching_call=True, foreign_session=False):
    """Official SDK root-event layout, confirmed against a real tool transcript."""
    def behavior(runtime, sid, notify):
        events = [
            {"type": "tool/call", "data": {"callId": "egg-1", "name": tool_name,
                "arguments": {"answers": {"anime": FAKE_KEY}}}},
            {"type": "tool/result", "data": {"message": {"role": "tool", "content": [{
                "type": "tool-result", "toolCallId": "egg-1" if matching_call else "other",
                "content": [{"type": "text", "text": json.dumps({"unlocked": unlocked, "progress": progress, "next_question": None, "message": FAKE_KEY})}],
                "isError": is_error,
            }]}}},
            {"type": "turn/end", "data": {"reason": {"kind": finish_reason}}},
        ]
        for event in events:
            notify(SimpleNamespace(method="session.event", payload={
                "sessionId": "foreign" if foreign_session else sid, "event": event,
            }))
        return SimpleNamespace(session_id="foreign" if foreign_session else sid, events=events,
                               final_response="问答验证结束。", finish_reason=finish_reason)
    return behavior


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
            config = Settings(_env_file=None, DEEPSEEK_API_KEY=FAKE_KEY, DSH_HOME=directory,
                              RELATIONSHIP_PRIVATE_PATH=private_fixture(directory))
            manager = AgentRuntimeManager(config)
            lease = manager.acquire()
            pipes = []
            try:
                lease.start()
                process = lease.harness.client._proc
                pipes = [process.stdin, process.stdout, process.stderr]
            finally:
                manager.close()
            self.assertTrue(all(pipe.closed for pipe in pipes))


class HarnessAdapterTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        patch_path = Path(self.temp.name) / "website.patch.yml"
        patch_path.write_text("[]")
        self.config = Settings(_env_file=None, DEEPSEEK_API_KEY=FAKE_KEY,
                               DSH_HOME=self.temp.name, DSH_PATCH_PATH=str(patch_path),
                               RELATIONSHIP_PRIVATE_PATH=private_fixture(self.temp.name))
        self.messages = [ChatMessage(role="user", content="有哪些页面？"),
                         ChatMessage(role="assistant", content="首页和我的世界。"),
                         ChatMessage(role="user", content="后者有什么？")]
        self.instances = []

    def service(self, behavior=None):
        def factory(**kwargs):
            runtime = FakeHarness(behavior=behavior, **kwargs)
            self.instances.append(runtime)
            return runtime
        return AIService(self.config, harness_factory=factory)

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
        answers = json.loads(first.kwargs["env"]["GIRLFRIEND_QUIZ_ANSWERS"])
        self.assertEqual(set(answers), {"anime", "birthday", "cat_name", "mbti", "initials"})
        self.assertTrue(all(isinstance(choices, list) and choices for choices in answers.values()))
        for choices in answers.values():
            for answer in choices:
                self.assertNotIn(answer, first.kwargs["env"]["DSH_SYSTEM_PROMPT"])

    async def test_stream_maps_tool_events_and_canonical_reply_only(self):
        events = [event async for event in self.service().stream_response(self.messages)]
        self.assertEqual("".join(e.get("content", "") for e in events), "你好，本站有五个应用。")
        self.assertEqual(events[-1], {"content": "", "done": True})
        self.assertEqual([e["status"] for e in events if e.get("event") == "tool"], ["running", "completed"])
        self.assertNotIn(FAKE_KEY, json.dumps(events))
        self.assertTrue(self.instances[0].closed.is_set())

    async def test_intermediate_deltas_never_replace_duplicate_or_prefix_canonical_reply(self):
        canonical = "这是最终核实后的完整回答。"
        for deltas in [["让我先查询一下。"], ["这是最终"], ["完全不同的草稿。"], [canonical], ["分段", "但不完整"]]:
            def behavior(runtime, sid, notify):
                for delta in deltas:
                    notify(SimpleNamespace(method="session.event", payload={"sessionId": sid, "event": {
                        "type": "assistant/chunk", "data": {"chunk": {"type": "text-delta", "text": delta}},
                    }}))
                return SimpleNamespace(session_id=sid, final_response=canonical, finish_reason="completed", events=[])
            with self.subTest(deltas=deltas):
                events = [event async for event in self.service(behavior).stream_response(self.messages)]
                self.assertEqual(events, [{"content": canonical, "done": False}, {"content": "", "done": True}])
                self.assertTrue(self.instances[-1].closed.is_set())

    async def test_failure_after_text_delta_never_exposes_draft_as_success(self):
        def behavior(runtime, sid, notify):
            notify(SimpleNamespace(method="session.event", payload={"sessionId": sid, "event": {
                "type": "assistant/chunk", "data": {"chunk": {"type": "text-delta", "text": "未完成草稿"}},
            }}))
            return SimpleNamespace(session_id=sid, final_response="未完成草稿", finish_reason="error", events=[])
        events = []
        with self.assertRaises(AIServiceError):
            async for event in self.service(behavior).stream_response(self.messages):
                events.append(event)
        self.assertFalse(any("content" in event or event.get("done") for event in events))
        self.assertTrue(self.instances[-1].closed.is_set())

    async def test_notification_retention_limits_apply_to_json_and_sse_and_close_runtime(self):
        for limit in ["events", "bytes"]:
            self.config.DSH_MAX_NOTIFICATION_EVENTS = 2 if limit == "events" else 100
            self.config.DSH_MAX_NOTIFICATION_BYTES = 1024
            def behavior(runtime, sid, notify):
                for _ in range(3):
                    notify(SimpleNamespace(method="session.event", payload={"sessionId": sid, "event": {
                        "type": "assistant/chunk", "data": {"chunk": {
                            "type": "text-delta", "text": "x" if limit == "events" else "大" * 500,
                        }},
                    }}))
                return SimpleNamespace(session_id=sid, final_response="must not succeed", finish_reason="completed", events=[])
            for streaming in [False, True]:
                with self.subTest(limit=limit, streaming=streaming):
                    service = self.service(behavior)
                    with self.assertRaises(AIServiceError) as error:
                        if streaming:
                            _ = [event async for event in service.stream_response(self.messages)]
                        else:
                            await service.generate_reply(self.messages)
                    self.assertEqual(error.exception.code, "response_limit")
                    self.assertTrue(self.instances[-1].closed.is_set())

    async def test_oversized_final_reply_fails_without_done_or_unlock(self):
        self.config.DSH_MAX_REPLY_BYTES = 1024
        def behavior(runtime, sid, notify):
            return SimpleNamespace(session_id=sid, final_response="大" * 500, finish_reason="completed", events=[])
        with self.assertRaises(AIServiceError) as error:
            _ = [event async for event in self.service(behavior).stream_response(self.messages)]
        self.assertEqual(error.exception.code, "response_limit")
        self.assertTrue(self.instances[-1].closed.is_set())

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

    async def test_successful_tool_unlock_is_emitted_after_text_before_done(self):
        events = [event async for event in self.service(girlfriend_run()).stream_response(self.messages)]
        self.assertEqual(events[-3:], [
            {"content": "问答验证结束。", "done": False},
            {"event": "desktop", "action": "unlock-girlfriend"},
            {"content": "", "done": True},
        ])
        self.assertNotIn(FAKE_KEY, json.dumps(events))
        self.assertEqual([e["name"] for e in events if e.get("event") == "tool"],
                         ["girlfriend_mode", "girlfriend_mode"])
        self.assertTrue(self.instances[-1].closed.is_set())

    async def test_wrong_or_incomplete_answers_tool_errors_or_unmatched_results_never_unlock(self):
        for options in [dict(unlocked=False), dict(unlocked="true"), dict(progress=4), dict(is_error=True),
                        dict(tool_name="desktop_apps"), dict(tool_name="bash"),
                        dict(matching_call=False), dict(foreign_session=True)]:
            with self.subTest(options=options):
                events = [event async for event in self.service(girlfriend_run(**options)).stream_response(self.messages)]
                self.assertFalse(any(e.get("event") == "desktop" for e in events))
                self.assertNotIn(FAKE_KEY, json.dumps(events))

    async def test_assistant_claim_and_notification_without_completed_result_do_not_unlock(self):
        def behavior(runtime, sid, notify):
            girlfriend_run()(runtime, sid, notify)
            return SimpleNamespace(session_id=sid, events=[], finish_reason="completed",
                                   final_response="已开启女朋友模式 unlock-girlfriend")
        events = [event async for event in self.service(behavior).stream_response(self.messages)]
        self.assertFalse(any(e.get("event") == "desktop" for e in events))

    async def test_incomplete_or_failed_turn_does_not_commit_successful_tool(self):
        for reason in ["error", "cancelled", "interrupted"]:
            with self.subTest(reason=reason):
                events = []
                with self.assertRaises(AIServiceError):
                    async for event in self.service(girlfriend_run(finish_reason=reason)).stream_response(self.messages):
                        events.append(event)
                self.assertFalse(any(e.get("event") == "desktop" for e in events))

    async def test_stream_close_after_verification_does_not_commit_desktop(self):
        def behavior(runtime, sid, notify):
            result = girlfriend_run()(runtime, sid, notify)
            runtime.closed.wait(timeout=4)
            return result
        stream = self.service(behavior).stream_response(self.messages)
        self.assertEqual((await anext(stream))["event"], "tool")
        await stream.aclose()
        self.assertTrue(self.instances[-1].closed.is_set())

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
                "type": "tool/call", "data": {"name": "site_info", "callId": "early-tool"},
            }}))
            runtime.closed.wait(timeout=4)
            raise RuntimeError("cancelled")
        stream = self.service(behavior).stream_response(self.messages)
        self.assertEqual((await anext(stream))["event"], "tool")
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

    async def test_routes_add_desktop_action_only_for_verified_completed_result(self):
        body = {"messages": [m.model_dump() for m in self.messages]}
        headers = {"x-neko-session-id": "a" * 48}
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            with patch.object(settings, "INTERNAL_API_TOKEN", "test-token-" + "x" * 40), patch("app.services.chat_service.AIService", return_value=self.service(girlfriend_run())):
                reply = await client.post("/api/chat/", json=body, headers=headers)
                self.assertEqual(reply.status_code, 200)
                self.assertEqual(reply.json()["desktop_action"], "unlock-girlfriend")
                self.assertRegex(reply.json()["desktop_proof"], r"^v1\.[a-f0-9]{48}\.\d{10}\.[a-f0-9]{64}$")
                streamed = await client.post("/api/chat/?stream=true", json=body, headers=headers)
                events = [json.loads(line[6:]) for line in streamed.text.splitlines() if line.startswith("data: ")]
                self.assertEqual(events[-2]["event"], "desktop")
                self.assertEqual(events[-2]["action"], "unlock-girlfriend")
                self.assertRegex(events[-2]["proof"], r"^v1\.[a-f0-9]{48}\.\d{10}\.[a-f0-9]{64}$")
                self.assertTrue(events[-1]["done"])
                self.assertNotIn(FAKE_KEY, reply.text + streamed.text)
            with patch("app.services.chat_service.AIService", return_value=self.service(girlfriend_run(unlocked=False))):
                reply = await client.post("/api/chat/", json=body)
                self.assertNotIn("desktop_action", reply.json())

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


if __name__ == "__main__":
    unittest.main()
