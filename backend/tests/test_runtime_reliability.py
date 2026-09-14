"""Resource, telemetry and streaming failure contracts using fictional fixtures."""
import asyncio
from contextlib import suppress
import json
from pathlib import Path
import tempfile
import threading
import unittest
from types import SimpleNamespace
from unittest.mock import patch

import httpx
from fastapi import FastAPI

from app.config import Settings, settings
from app.main import app
from app.observability import RequestTelemetryMiddleware
from app.services.ai_service import AIService, AIServiceError
from app.services.runtime_manager import AgentRuntimeManager
from app.services.stream_buffer import StreamBuffer
from test_ai_service import FakeHarness, FAKE_KEY, private_fixture


def configuration(directory, **extra):
    template = Path(directory) / 'template.yml'
    template.write_text('[]')
    return Settings(_env_file=None, DEEPSEEK_API_KEY=FAKE_KEY, DSH_HOME=directory,
                    DSH_PATCH_PATH=str(template), RELATIONSHIP_PRIVATE_PATH=private_fixture(directory), **extra)


class RuntimeReliabilityTests(unittest.IsolatedAsyncioTestCase):
    async def test_final_only_reply_records_first_text_once_without_stream_fabrication(self):
        from app.schemas.chat import ChatMessage
        with tempfile.TemporaryDirectory() as directory:
            config = configuration(directory)
            def factory(**kwargs):
                def behavior(runtime, sid, notify):
                    return SimpleNamespace(session_id=sid, final_response='fixture final', finish_reason='completed', events=[])
                return FakeHarness(behavior=behavior, **kwargs)
            with self.assertLogs('neko.telemetry', level='INFO') as captured:
                events = [event async for event in AIService(config, harness_factory=factory).stream_response(
                    [ChatMessage(role='user', content='fixture question')])]
            self.assertEqual(events, [{'content': 'fixture final', 'done': False}, {'content': '', 'done': True}])
            logs = '\n'.join(captured.output)
            self.assertEqual(logs.count('"stage": "first_text"'), 1)
            self.assertEqual(logs.count('"stage": "first_event"'), 1)

    async def test_cached_configuration_independent_sessions_and_shutdown(self):
        from app.schemas.chat import ChatMessage
        with tempfile.TemporaryDirectory() as directory:
            config = configuration(directory)
            runtimes = []
            def factory(**kwargs):
                runtime = FakeHarness(**kwargs)
                runtimes.append(runtime)
                return runtime
            manager = AgentRuntimeManager(config, factory)
            self.assertTrue(await manager.initialize())
            service = AIService(runtime_manager=manager)
            messages = [ChatMessage(role='user', content='fixture question')]
            await service.generate_reply(messages)
            # Restart is the deliberate refresh boundary for immutable config.
            Path(config.RELATIONSHIP_PRIVATE_PATH).write_text('invalid changed file')
            Path(config.DSH_PATCH_PATH).write_text('changed')
            await service.generate_reply(messages)
            self.assertEqual(len(runtimes), 2)
            self.assertNotEqual(runtimes[0].calls[0][1], runtimes[1].calls[0][1])
            self.assertEqual(runtimes[0].kwargs['patches'], runtimes[1].kwargs['patches'])
            self.assertEqual(runtimes[1].patch_text, '[]')
            self.assertEqual(manager.active_count, 0)
            self.assertTrue(all(runtime.closed.is_set() for runtime in runtimes))
            patch_path = Path(runtimes[0].kwargs['patches'][0])
            self.assertTrue(patch_path.exists())
            await manager.shutdown()
            self.assertFalse(patch_path.exists())
            self.assertFalse(manager.ready)
            refreshed = AgentRuntimeManager(config, factory)
            self.assertFalse(await refreshed.initialize())
            await refreshed.shutdown()

    async def test_slow_consumer_buffer_is_bounded_and_never_commits_success(self):
        buffer = StreamBuffer(asyncio.get_running_loop(), max_events=2, max_bytes=1024)
        buffer.publish({'event': 'tool', 'name': 'one'})
        buffer.publish({'event': 'tool', 'name': 'two'})
        with self.assertRaises(AIServiceError) as error:
            buffer.publish({'event': 'tool', 'name': 'three'})
        self.assertEqual(error.exception.code, 'slow_consumer')
        buffer.finish('result', {'action': 'unlock-girlfriend'})
        kind, failure = await buffer.get(1)
        self.assertEqual(kind, 'error')
        self.assertEqual(failure.code, 'slow_consumer')
        self.assertLessEqual(buffer.peak_bytes, 1024)

    async def test_coalescing_preserves_text_order_and_terminal_result(self):
        buffer = StreamBuffer(asyncio.get_running_loop(), max_events=2, max_bytes=8192)
        for text in ['你', '好', '！']:
            buffer.publish({'content': text, 'done': False})
        buffer.publish({'event': 'tool', 'status': 'completed'})
        buffer.finish('result', {'action': None})
        self.assertEqual(await buffer.get(1), ('event', {'content': '你好！', 'done': False}))
        self.assertEqual((await buffer.get(1))[1]['status'], 'completed')
        self.assertEqual(await buffer.get(1), ('result', {'action': None}))

    async def test_heartbeat_during_silent_model_and_close_reaps_runtime(self):
        from app.schemas.chat import ChatMessage
        with tempfile.TemporaryDirectory() as directory:
            config = configuration(directory, CHAT_HEARTBEAT_SECONDS=0.02)
            runtimes = []
            def behavior(runtime, sid, notify):
                runtime.closed.wait(2)
                raise RuntimeError('cancelled')
            def factory(**kwargs):
                runtime = FakeHarness(behavior=behavior, **kwargs)
                runtimes.append(runtime)
                return runtime
            service = AIService(config, harness_factory=factory)
            stream = service.stream_response([ChatMessage(role='user', content='fixture question')])
            self.assertEqual(await anext(stream), {'event': 'heartbeat'})
            await stream.aclose()
            self.assertTrue(runtimes[0].closed.is_set())

    async def test_cancel_during_start_never_calls_model_and_reaps_late_process(self):
        from app.schemas.chat import ChatMessage
        with tempfile.TemporaryDirectory() as directory:
            config = configuration(directory)
            starting, release_start = threading.Event(), threading.Event()
            runtimes = []
            class StartingHarness(FakeHarness):
                def start(self):
                    starting.set()
                    release_start.wait(2)
                    self.closed.clear()  # Model a subprocess appearing after close.
                def close(self):
                    super().close()
                    release_start.set()
            def factory(**kwargs):
                runtime = StartingHarness(**kwargs)
                runtimes.append(runtime)
                return runtime
            manager = AgentRuntimeManager(config, factory)
            service = AIService(runtime_manager=manager)
            request = asyncio.create_task(service.generate_reply([ChatMessage(role='user', content='fixture question')]))
            await asyncio.to_thread(starting.wait, 1)
            request.cancel()
            with self.assertRaises(asyncio.CancelledError):
                await request
            self.assertTrue(runtimes[0].closed.is_set())
            self.assertEqual(runtimes[0].calls, [])
            self.assertEqual(manager.active_count, 0)
            await manager.shutdown()

    async def test_cancel_before_sdk_implicit_restart_keeps_lease_until_final_close(self):
        from app.schemas.chat import ChatMessage
        with tempfile.TemporaryDirectory() as directory:
            config = configuration(directory)
            entered_run, resume_run, closed_once = threading.Event(), threading.Event(), threading.Event()
            runtimes = []
            class RestartingHarness(FakeHarness):
                def __init__(self, **kwargs):
                    super().__init__(**kwargs)
                    self.running = False
                    self.starts = 0
                    self.closes = 0
                def start(self):
                    self.starts += 1
                    self.running = True
                def run(self, prompt, *, session_id, on_notification):
                    entered_run.set()
                    resume_run.wait(2)
                    if not self.running:
                        self.start()  # SDK run -> start_session -> start.
                    return SimpleNamespace(session_id=session_id, final_response='late reply', finish_reason='completed', events=[])
                def close(self):
                    self.closes += 1
                    self.running = False
                    super().close()
                    closed_once.set()
            def factory(**kwargs):
                runtime = RestartingHarness(**kwargs)
                runtimes.append(runtime)
                return runtime
            manager = AgentRuntimeManager(config, factory)
            task = asyncio.create_task(AIService(runtime_manager=manager).generate_reply([ChatMessage(role='user', content='fixture')]))
            try:
                self.assertTrue(await asyncio.to_thread(entered_run.wait, 1))
                task.cancel()
                self.assertTrue(await asyncio.to_thread(closed_once.wait, 1))
                self.assertEqual(manager.active_count, 1)
                resume_run.set()
                with self.assertRaises(asyncio.CancelledError):
                    await task
                self.assertEqual(runtimes[0].starts, 2)
                self.assertGreaterEqual(runtimes[0].closes, 2)
                self.assertFalse(runtimes[0].running)
                self.assertEqual(manager.active_count, 0)
            finally:
                resume_run.set()
                await manager.shutdown()

    async def test_readiness_and_request_ids_distinguish_liveness_without_leaking_errors(self):
        with patch.object(app.state, 'runtime_manager', SimpleNamespace(ready=False)), \
             patch.object(settings, 'ENVIRONMENT', 'test'):
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://test') as client:
                live = await client.get('/health', headers={'x-request-id': 'not-a-trusted-request-id'})
                ready = await client.get('/api/ready')
            self.assertEqual(live.status_code, 200)
            self.assertEqual(ready.status_code, 503)
            self.assertFalse(ready.json()['checks']['agent_configuration'])
            self.assertRegex(live.headers['x-request-id'], r'^[a-f0-9-]{36}$')
            self.assertNotIn('not-a-trusted-request-id', live.text)

    async def test_database_is_not_initialized_when_disabled(self):
        from app import database
        with patch.object(settings, 'DATABASE_ENABLED', False), patch.object(database, 'create_async_engine') as factory:
            self.assertTrue(await database.init_db())
            factory.assert_not_called()
            self.assertIsNone(database.engine)


class TransportCleanupTests(unittest.IsolatedAsyncioTestCase):
    async def test_asgi_disconnect_closes_silent_runtime(self):
        from app.api.routes.chat import ChatStreamingResponse
        from app.schemas.chat import ChatMessage
        with tempfile.TemporaryDirectory() as directory:
            config = configuration(directory, CHAT_HEARTBEAT_SECONDS=0.01)
            runtimes = []
            def factory(**kwargs):
                def behavior(runtime, sid, notify):
                    runtime.closed.wait(2)
                    raise RuntimeError('cancelled')
                runtime = FakeHarness(behavior=behavior, **kwargs)
                runtimes.append(runtime)
                return runtime
            service = AIService(config, harness_factory=factory)
            from contextlib import aclosing
            async def body():
                async with aclosing(service.stream_response([ChatMessage(role='user', content='fixture')])) as events:
                    async for _ in events:
                        yield ': keep-alive\n\n'
            first_write = asyncio.Event()
            async def receive():
                await first_write.wait()
                return {'type': 'http.disconnect'}
            async def send(message):
                if message['type'] == 'http.response.body':
                    first_write.set()
            response = ChatStreamingResponse(body(), media_type='text/event-stream')
            await response({'type': 'http'}, receive, send)
            self.assertTrue(await asyncio.to_thread(runtimes[0].closed.wait, 1))
            # Let generator cleanup finish before its temporary fixture is removed.
            for _ in range(100):
                if not list(Path(directory).glob('website-*.patch.yml')):
                    break
                await asyncio.sleep(0.005)
            self.assertFalse(list(Path(directory).glob('website-*.patch.yml')))

    async def test_stalled_asgi_send_closes_generator_and_does_not_emit_done(self):
        from app.api.routes.chat import ChatStreamingResponse
        closed = asyncio.Event()
        async def body():
            try:
                yield 'data: {"content":"partial","done":false}\n\n'
                yield 'data: {"content":"","done":true}\n\n'
            finally:
                closed.set()
        messages = []
        async def send(message):
            if message['type'] == 'http.response.body' and message.get('body'):
                await asyncio.Event().wait()
            messages.append(message)
        with patch.object(settings, 'CHAT_SEND_TIMEOUT_SECONDS', 0.02):
            await asyncio.wait_for(ChatStreamingResponse(body()).stream_response(send), timeout=1)
        self.assertTrue(closed.is_set())
        self.assertFalse(any(b'"done":true' in message.get('body', b'') for message in messages))

    async def test_stage_logs_do_not_contain_provider_diagnostics_or_private_content(self):
        from app.schemas.chat import ChatMessage
        with tempfile.TemporaryDirectory() as directory:
            config = configuration(directory)
            def factory(**kwargs):
                def behavior(runtime, sid, notify):
                    raise RuntimeError('401 private-provider-detail ' + FAKE_KEY)
                return FakeHarness(behavior=behavior, **kwargs)
            with self.assertLogs('neko.telemetry', level='INFO') as captured:
                with self.assertRaises(AIServiceError):
                    await AIService(config, harness_factory=factory).generate_reply([ChatMessage(role='user', content='private-user-text')])
            logs = '\n'.join(captured.output)
            for value in [FAKE_KEY, 'private-provider-detail', 'private-user-text', 'fixture-cat']:
                self.assertNotIn(value, logs)
            self.assertIn('authentication', logs)
