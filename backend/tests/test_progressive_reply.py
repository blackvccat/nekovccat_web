"""Protocol v2 uses real transient text, safe progress and a canonical final frame."""
import asyncio
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import tempfile
import threading
from types import SimpleNamespace
import unittest
from unittest.mock import patch
import httpx

from app.schemas.chat import ChatMessage
from app.services.ai_service import AIService, AIServiceError
from app.services.progressive_reply import ProgressiveReply, SecretRedactor
from app.services.runtime_manager import AgentRuntimeManager
from app.services.stream_buffer import StreamBuffer
from app.main import app
from test_ai_service import FakeHarness, FAKE_KEY, girlfriend_run
from test_runtime_reliability import configuration


def frame(kind, attempt='attempt-1', **fields):
    return SimpleNamespace(method='site.assistant', payload={'sessionId': 'owned', 'frame': {
        'type': kind, 'attemptId': attempt, **fields,
    }})


class ProgressiveProjectionTests(unittest.TestCase):
    def test_real_attempt_ids_change_drafts_and_final_replaces_all_intermediate_text(self):
        projection = ProgressiveReply('owned', [FAKE_KEY], 65536)
        projection.feed(frame('start', turn=1, step=1))
        first = projection.feed(frame('text', index=0, text='让我先查询。'))[-1]
        projection.feed(frame('end'))
        projection.feed(frame('start', attempt='attempt-2', turn=1, step=2))
        second = projection.feed(frame('text', attempt='attempt-2', index=0, text='部分答案'))[-1]
        final = projection.final('完全不同的最终答案')
        self.assertNotEqual(first['message_id'], second['message_id'])
        self.assertEqual(final['message_id'], second['message_id'])
        self.assertEqual(final['phase'], 'final')
        self.assertEqual(final['content'], '完全不同的最终答案')

    def test_reasoning_is_a_fixed_status_and_foreign_or_repeated_chunks_are_ignored(self):
        projection = ProgressiveReply('owned', [FAKE_KEY], 65536)
        projection.feed(frame('start'))
        thinking = projection.feed(frame('analyzing', index=0, text='PRIVATE_REASONING'))
        self.assertEqual(thinking, [{'event': 'progress', 'stage': 'analyzing', 'message': '正在分析问题…'}])
        self.assertEqual(projection.feed(frame('text', index=0, text='duplicate')), [])
        foreign = frame('text', index=1, text='FOREIGN_CONTENT')
        foreign.payload['sessionId'] = 'foreign'
        self.assertEqual(projection.feed(foreign), [])
        projection.feed(frame('end'))
        self.assertEqual(projection.feed(frame('text', index=1, text='late')), [])

    def test_secrets_split_at_every_character_boundary_never_leak_in_delta_concatenation(self):
        key = 'fictional-api-key-12345'
        raw = 'before ' + key + ' after'
        for boundary in range(1, len(raw)):
            with self.subTest(boundary=boundary):
                redactor = SecretRedactor([key, 'another-secret'])
                output = redactor.feed(raw[:boundary]) + redactor.feed(raw[boundary:])
                self.assertEqual(output, 'before [已隐藏] after')
                self.assertNotIn(key, output)
        redactor = SecretRedactor([key])
        self.assertEqual(''.join(redactor.feed(char) for char in raw), 'before [已隐藏] after')

    def test_retry_discards_withheld_secret_prefix_and_does_not_join_it_to_next_message(self):
        projection = ProgressiveReply('owned', ['secret-value'], 65536)
        projection.feed(frame('start'))
        first = projection.feed(frame('text', index=0, text='hello secret-'))[-1]
        self.assertEqual(first['content'], 'hello ')
        projection.feed(frame('start', attempt='retry', turn=1, step=1))
        second = projection.feed(frame('text', attempt='retry', index=0, text='new answer'))[-1]
        self.assertEqual(second['content'], 'new answer')
        self.assertNotEqual(first['message_id'], second['message_id'])

    def test_incremental_text_limit_fails_before_oversized_delta_reaches_browser(self):
        projection = ProgressiveReply('owned', [], 5)
        projection.feed(frame('start'))
        with self.assertRaises(AIServiceError) as error:
            projection.feed(frame('text', index=0, text='超限'))
        self.assertEqual(error.exception.code, 'response_limit')


class ProgressiveAdapterTests(unittest.IsolatedAsyncioTestCase):
    async def test_route_v2_final_and_done_do_not_mix_legacy_content_protocol(self):
        with tempfile.TemporaryDirectory() as directory:
            config = configuration(directory)
            service = AIService(config, harness_factory=lambda **kwargs: FakeHarness(**kwargs))
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://test') as client:
                with patch('app.services.chat_service.AIService', return_value=service):
                    response = await client.post('/api/chat/?stream=true&protocol=v2', json={
                        'messages': [{'role': 'user', 'content': 'fixture'}],
                    })
            self.assertEqual(response.status_code, 200)
            events = [json.loads(line[6:]) for line in response.text.splitlines() if line.startswith('data: ')]
            self.assertEqual(events[-1], {'done': True})
            self.assertEqual(events[-2]['phase'], 'final')
            self.assertTrue(any(event.get('event') == 'reply' for event in events))
            self.assertFalse(any('content' in event and event.get('event') != 'reply' for event in events))

    async def test_v2_redacts_split_credentials_in_both_deltas_and_authoritative_final(self):
        with tempfile.TemporaryDirectory() as directory:
            config = configuration(directory, INTERNAL_API_TOKEN='fixture-internal-token')
            def factory(**kwargs):
                def behavior(runtime, sid, notify):
                    notify(SimpleNamespace(method='site.assistant', payload={'sessionId': sid, 'frame': {
                        'type': 'start', 'attemptId': 'secret-test',
                    }}))
                    text = 'before ' + FAKE_KEY + ' / ' + config.INTERNAL_API_TOKEN + ' after'
                    for index, char in enumerate(text):
                        notify(SimpleNamespace(method='site.assistant', payload={'sessionId': sid, 'frame': {
                            'type': 'text', 'attemptId': 'secret-test', 'index': index, 'text': char,
                        }}))
                    return SimpleNamespace(session_id=sid, final_response=text, finish_reason='completed', events=[])
                return FakeHarness(behavior=behavior, **kwargs)
            events = [event async for event in AIService(config, harness_factory=factory).stream_response(
                [ChatMessage(role='user', content='fixture')], progressive=True)]
            self.assertEqual(''.join(event['content'] for event in events if event.get('phase') == 'delta'),
                             'before [已隐藏] / [已隐藏] after')
            self.assertEqual(events[-2]['content'], 'before [已隐藏] / [已隐藏] after')
            self.assertNotIn(FAKE_KEY, json.dumps(events))
            self.assertNotIn(config.INTERNAL_API_TOKEN, json.dumps(events))

    async def test_failure_after_visible_delta_never_emits_final_desktop_or_done(self):
        with tempfile.TemporaryDirectory() as directory:
            config = configuration(directory)
            observed = threading.Event()
            runtimes = []
            def factory(**kwargs):
                def behavior(runtime, sid, notify):
                    for values in [{'type': 'start'}, {'type': 'text', 'index': 0, 'text': '尚未完成'}]:
                        notify(SimpleNamespace(method='site.assistant', payload={'sessionId': sid, 'frame': {
                            'attemptId': 'failed-attempt', **values,
                        }}))
                    observed.wait(2)
                    return SimpleNamespace(session_id=sid, final_response='尚未完成', finish_reason='error', events=[])
                runtime = FakeHarness(behavior=behavior, **kwargs)
                runtimes.append(runtime)
                return runtime
            events = []
            with self.assertRaises(AIServiceError):
                async for event in AIService(config, harness_factory=factory).stream_response(
                        [ChatMessage(role='user', content='fixture')], progressive=True):
                    events.append(event)
                    if event.get('phase') == 'delta':
                        observed.set()
            self.assertTrue(observed.is_set())
            self.assertFalse(any(event.get('phase') == 'final' or event.get('event') == 'desktop' or event.get('done') for event in events))
            self.assertTrue(runtimes[0].closed.is_set())

    async def test_cancelling_after_v2_delta_reaps_owned_runtime(self):
        with tempfile.TemporaryDirectory() as directory:
            config = configuration(directory)
            runtimes = []
            def factory(**kwargs):
                def behavior(runtime, sid, notify):
                    for values in [{'type': 'start'}, {'type': 'text', 'index': 0, 'text': '开始回复'}]:
                        notify(SimpleNamespace(method='site.assistant', payload={'sessionId': sid, 'frame': {
                            'attemptId': 'cancelled-attempt', **values,
                        }}))
                    runtime.closed.wait(2)
                    raise RuntimeError('cancelled')
                runtime = FakeHarness(behavior=behavior, **kwargs)
                runtimes.append(runtime)
                return runtime
            stream = AIService(config, harness_factory=factory).stream_response(
                [ChatMessage(role='user', content='fixture')], progressive=True)
            while (await anext(stream)).get('phase') != 'delta':
                pass
            await stream.aclose()
            self.assertTrue(runtimes[0].closed.is_set())

    async def test_v2_final_precedes_authorized_desktop_and_done_while_v1_stays_compatible(self):
        with tempfile.TemporaryDirectory() as directory:
            config = configuration(directory)
            def factory(**kwargs):
                def behavior(runtime, sid, notify):
                    def send(kind, **fields):
                        notify(SimpleNamespace(method='site.assistant', payload={'sessionId': sid, 'frame': {
                            'type': kind, 'attemptId': 'real-attempt', **fields,
                        }}))
                    send('start', turn=1, step=1)
                    send('analyzing', index=0)
                    send('text', index=1, text='工具前言。')
                    return girlfriend_run()(runtime, sid, notify)
                return FakeHarness(behavior=behavior, **kwargs)
            service = AIService(config, harness_factory=factory)
            messages = [ChatMessage(role='user', content='fixture')]
            legacy = [event async for event in service.stream_response(messages)]
            self.assertFalse(any(event.get('event') in {'reply', 'progress'} for event in legacy))
            self.assertEqual(''.join(event.get('content', '') for event in legacy), '问答验证结束。')
            progressive = [event async for event in service.stream_response(messages, progressive=True)]
            self.assertEqual(progressive[-3]['phase'], 'final')
            self.assertEqual(progressive[-3]['content'], '问答验证结束。')
            self.assertEqual(progressive[-2], {'event': 'desktop', 'action': 'unlock-girlfriend'})
            self.assertEqual(progressive[-1], {'done': True})
            self.assertTrue(any(event.get('phase') == 'delta' for event in progressive))
            self.assertNotIn(FAKE_KEY, json.dumps(progressive))

    async def test_buffer_never_merges_different_messages_or_final_into_deltas(self):
        buffer = StreamBuffer(asyncio.get_running_loop(), 10, 65536)
        first = {'event': 'reply', 'phase': 'delta', 'message_id': 'a', 'content': 'first'}
        second = {'event': 'reply', 'phase': 'delta', 'message_id': 'b', 'content': 'second'}
        final = {'event': 'reply', 'phase': 'final', 'message_id': 'b', 'content': 'canonical'}
        for item in [first, second, final]:
            buffer.publish(item)
        self.assertEqual([await buffer.get(1) for _ in range(3)], [('event', first), ('event', second), ('event', final)])

    async def test_real_sdk_bridge_delivers_text_before_local_fixture_model_completes(self):
        first_text_observed = threading.Event()
        model_finished = threading.Event()
        class FixtureProvider(BaseHTTPRequestHandler):
            def log_message(self, *args):
                pass
            def do_POST(self):
                self.rfile.read(int(self.headers.get('content-length', '0')))
                self.send_response(200)
                self.send_header('Content-Type', 'text/event-stream')
                self.send_header('Connection', 'close')
                self.end_headers()
                def emit(delta, reason=None):
                    payload = {'id': 'fixture', 'object': 'chat.completion.chunk', 'model': 'deepseek-v4-pro',
                               'choices': [{'index': 0, 'delta': delta, 'finish_reason': reason}]}
                    self.wfile.write(('data: ' + json.dumps(payload) + '\n\n').encode())
                    self.wfile.flush()
                emit({'role': 'assistant', 'reasoning_content': 'PRIVATE_FIXTURE_REASONING'})
                emit({'content': '真实'})
                first_text_observed.wait(2)
                emit({'content': '增量'})
                emit({}, 'stop')
                self.wfile.write(b'data: [DONE]\n\n')
                self.wfile.flush()
                model_finished.set()
        server = ThreadingHTTPServer(('127.0.0.1', 0), FixtureProvider)
        server.daemon_threads = True
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            with tempfile.TemporaryDirectory() as directory:
                config = configuration(directory, DEEPSEEK_BASE_URL=f'http://127.0.0.1:{server.server_port}',
                                       DSH_REQUEST_TIMEOUT_SECONDS=8)
                # The actual restricted site profile plus our opt-in bridge.
                config.DSH_PATCH_PATH = str(Path(__file__).resolve().parents[2] / 'agent/website.patch.yml')
                manager = AgentRuntimeManager(config)
                events = []
                before_completion = False
                try:
                    async for event in AIService(runtime_manager=manager).stream_response(
                            [ChatMessage(role='user', content='Return the fixture greeting.')], progressive=True):
                        events.append(event)
                        if event.get('event') == 'reply' and event.get('phase') == 'delta':
                            before_completion = before_completion or not model_finished.is_set()
                            first_text_observed.set()
                finally:
                    await manager.shutdown()
                self.assertTrue(before_completion, 'a real SDK delta must arrive while the provider is still producing output')
                self.assertEqual(''.join(event.get('content', '') for event in events if event.get('phase') == 'delta'), '真实增量')
                self.assertEqual(events[-2]['phase'], 'final')
                self.assertEqual(events[-2]['content'], '真实增量')
                self.assertTrue(any(event.get('stage') == 'analyzing' for event in events))
                self.assertNotIn('PRIVATE_FIXTURE_REASONING', json.dumps(events))
        finally:
            first_text_observed.set()
            await asyncio.to_thread(server.shutdown)
            server.server_close()
            await asyncio.to_thread(thread.join, timeout=1)
