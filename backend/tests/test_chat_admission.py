"""Bounded admission, real ASGI disconnect races, and persistent rolling quotas."""
import asyncio
import json
import sqlite3
import tempfile
import time
import unittest

import httpx
from fastapi import FastAPI
from starlette.responses import JSONResponse

from app.config import Settings
from app.security import ChatProtectionMiddleware
from app.services.attempt_guard import AttemptGuard
from app.services.quota_store import QuotaStore

TOKEN = 'fixture-token-' + 'x' * 40
BODY = {'messages': [{'role': 'user', 'content': 'fixture question'}]}


class RecordingQuota:
    def __init__(self):
        self.charged = []

    def blocked(self, identity):
        return None

    async def consume(self, identity):
        self.charged.append(identity)
        return None


class WireRequest:
    def __init__(self, app, identity, body=BODY, path='/api/chat/', content_type='application/json'):
        self.incoming = asyncio.Queue()
        self.incoming.put_nowait({'type': 'http.request', 'body': json.dumps(body).encode(), 'more_body': False})
        self.outgoing = []
        scope = {'type': 'http', 'asgi': {'version': '3.0'}, 'http_version': '1.1', 'method': 'POST',
                 'scheme': 'http', 'path': path, 'raw_path': path.encode(), 'query_string': b'',
                 'root_path': '', 'server': ('test', 80), 'client': ('127.0.0.1', 1),
                 'headers': [(b'x-neko-internal-token', TOKEN.encode()),
                             (b'x-neko-client-ip', identity.encode()), (b'content-type', content_type.encode())]}
        async def send(event):
            self.outgoing.append(event)
        self.task = asyncio.create_task(app(scope, self.incoming.get, send))

    async def response(self):
        await asyncio.wait_for(self.task, 2)
        start = next(event for event in self.outgoing if event['type'] == 'http.response.start')
        body = b''.join(event.get('body', b'') for event in self.outgoing if event['type'] == 'http.response.body')
        return start['status'], json.loads(body)

    def disconnect(self):
        self.incoming.put_nowait({'type': 'http.disconnect'})


class AdmissionTests(unittest.IsolatedAsyncioTestCase):
    def setup_middleware(self, **extra):
        self.started = asyncio.Queue()
        self.release = {}
        self.running = 0
        self.peak_running = 0
        self.quota = RecordingQuota()
        async def work(scope, receive, send):
            # Body buffering must replay exactly the validated request.
            self.assertEqual(json.loads((await receive())['body']), BODY)
            identity = dict(scope['headers'])[b'x-neko-client-ip'].decode()
            self.running += 1
            self.peak_running = max(self.peak_running, self.running)
            event = self.release.setdefault(identity, asyncio.Event())
            self.started.put_nowait(identity)
            try:
                await event.wait()
                await JSONResponse({'ok': True})(scope, receive, send)
            finally:
                self.running -= 1
        config = Settings(_env_file=None, ENVIRONMENT='production', INTERNAL_API_TOKEN=TOKEN,
                          CHAT_MAX_CONCURRENT=1, CHAT_QUEUE_MAX_SIZE=2, **extra)
        self.middleware = ChatProtectionMiddleware(work, config, self.quota)
        self.requests = []
        return self.middleware

    def request(self, identity, **extra):
        request = WireRequest(self.middleware, identity, **extra)
        self.requests.append(request)
        return request

    async def queued(self, count):
        async with asyncio.timeout(1):
            while len(self.middleware.limiter.waiting) != count:
                await asyncio.sleep(0)

    async def asyncTearDown(self):
        requests = getattr(self, 'requests', [])
        for request in requests:
            if not request.task.done():
                request.task.cancel()
        await asyncio.gather(*(request.task for request in requests), return_exceptions=True)

    async def test_fifo_surge_bounds_queue_and_duplicate_abuse(self):
        self.setup_middleware()
        first = self.request('10.0.0.1')
        self.assertEqual(await self.started.get(), '10.0.0.1')
        second = self.request('10.0.0.2')
        await self.queued(1)
        third = self.request('10.0.0.3')
        await self.queued(2)
        overflow = self.request('10.0.0.4')
        self.assertEqual((await overflow.response())[1]['code'], 'queue_full')
        for _ in range(5):
            duplicate = self.request('10.0.0.2')
            status, body = await duplicate.response()
            self.assertEqual(status, 429)
            self.assertIn(body['code'], {'concurrency', 'burst_limit'})
            self.assertEqual(len(self.middleware.limiter.waiting), 2)
        self.release['10.0.0.1'].set()
        self.assertEqual(await self.started.get(), '10.0.0.2')
        self.release['10.0.0.2'].set()
        self.assertEqual(await self.started.get(), '10.0.0.3')
        self.release['10.0.0.3'].set()
        self.assertEqual([reply[0] for reply in await asyncio.gather(first.response(), second.response(), third.response())], [200, 200, 200])
        self.assertEqual(self.peak_running, 1)
        self.assertEqual(len(self.quota.charged), 3)
        self.assertEqual(self.middleware.active, {})
        self.assertEqual(len(self.middleware.limiter.waiting), 0)

    async def test_wait_timeout_cancellation_and_disconnect_never_charge(self):
        self.setup_middleware(CHAT_QUEUE_WAIT_SECONDS=0.06)
        first = self.request('10.0.0.1')
        await self.started.get()
        timed_out = self.request('10.0.0.2')
        self.assertEqual((await timed_out.response())[1]['code'], 'queue_timeout')
        cancelled = self.request('10.0.0.3')
        await self.queued(1)
        cancelled.task.cancel()
        with self.assertRaises(asyncio.CancelledError):
            await cancelled.task
        self.assertEqual(len(self.middleware.limiter.waiting), 0)
        disconnected = self.request('10.0.0.4')
        await self.queued(1)
        disconnected.disconnect()
        self.assertEqual((await disconnected.response())[0], 499)
        self.assertEqual(len(self.middleware.limiter.waiting), 0)
        self.assertEqual(len(self.quota.charged), 1)
        self.release['10.0.0.1'].set()
        await first.response()
        self.assertEqual(self.middleware.active, {})

    async def test_disconnect_racing_with_slot_release_does_not_start_or_charge(self):
        self.setup_middleware()
        first = self.request('10.0.0.1')
        await self.started.get()
        disconnected = self.request('10.0.0.2')
        await self.queued(1)
        # Deliver both events without yielding to exercise the grant race.
        self.release['10.0.0.1'].set()
        disconnected.disconnect()
        await first.response()
        self.assertEqual((await disconnected.response())[0], 499)
        self.assertEqual(len(self.quota.charged), 1)
        self.assertEqual(self.middleware.active, {})
        self.assertTrue(self.started.empty())

    async def test_invalid_body_never_charges_or_leaks_admission(self):
        self.setup_middleware()
        for index, body in enumerate(({}, {'messages': [{'role': 'user', 'content': '   '}]},
                                      {'messages': [{'role': 'assistant', 'content': 'answer'}]},
                                      {'messages': [{'role': 'user', 'content': 'x' * 70000}]})):
            response = self.request(f'10.0.0.{index + 1}', body=body)
            self.assertIn((await response.response())[0], {413, 422})
            self.assertEqual(self.middleware.active, {})
            self.assertFalse(self.middleware.limiter.waiting)
        self.assertEqual(self.quota.charged, [])

    async def test_ipv6_rotation_within_subnet_and_mapped_ipv4_share_slot(self):
        self.setup_middleware()
        first = self.request('2001:db8::1')
        await self.started.get()
        duplicate = self.request('2001:db8::abcd')
        self.assertEqual((await duplicate.response())[1]['code'], 'concurrency')
        self.release['2001:db8::1'].set()
        await first.response()
        mapped = self.request('::ffff:10.0.0.1')
        await self.started.get()
        duplicate = self.request('10.0.0.1')
        self.assertEqual((await duplicate.response())[1]['code'], 'concurrency')

    async def test_trusted_local_sentinel_shares_one_slot_without_external_ip_provider(self):
        self.setup_middleware()
        first = self.request('local')
        await self.started.get()
        duplicate = self.request('local')
        self.assertEqual((await duplicate.response())[1]['code'], 'concurrency')
        self.release['local'].set()
        self.assertEqual((await first.response())[0], 200)
        malformed = self.request('untrusted-arbitrary-header')
        self.assertEqual((await malformed.response())[0], 403)

    async def test_non_slash_route_executes_once_without_charged_redirect(self):
        quota = RecordingQuota()
        inner = FastAPI()
        @inner.post('/api/chat/')
        async def route():
            return {'ok': True}
        app = ChatProtectionMiddleware(inner, Settings(_env_file=None, ENVIRONMENT='production', INTERNAL_API_TOKEN=TOKEN), quota)
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://test', follow_redirects=True) as client:
            response = await client.post('/api/chat', headers={'x-neko-internal-token': TOKEN, 'x-neko-client-ip': '10.0.0.1'}, json=BODY)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.history, [])
        self.assertEqual(len(quota.charged), 1)

    async def test_slow_body_timeout_releases_reserved_slot_without_charge(self):
        self.setup_middleware(CHAT_BODY_TIMEOUT_SECONDS=0.025)
        request = self.request('10.0.0.1')
        request.incoming.get_nowait()
        request.incoming.put_nowait({'type': 'http.request', 'body': b'{', 'more_body': True})
        self.assertEqual((await request.response())[1]['code'], 'body_timeout')
        self.assertEqual(self.quota.charged, [])
        self.assertEqual(self.middleware.active, {})
        self.assertFalse(self.middleware.limiter.waiting)

    async def test_repeated_cancellation_cannot_free_inflight_sqlite_slot_early(self):
        self.setup_middleware()
        database_entered, database_release = asyncio.Event(), asyncio.Event()
        pending_storage = []
        async def delayed_consume(identity):
            pending_storage.append(asyncio.current_task())
            database_entered.set()
            await database_release.wait()
            return None
        self.quota.consume = delayed_consume
        active = self.request('10.0.0.1')
        await database_entered.wait()
        active.task.cancel()
        await asyncio.sleep(0)
        self.assertEqual(len(self.middleware.active), 1)
        active.task.cancel()  # Exercise deferred callback under repeated cancellation.
        with self.assertRaises(asyncio.CancelledError):
            await active.task
        self.assertEqual(len(self.middleware.active), 1)
        queued = self.request('10.0.0.2')
        await self.queued(1)
        self.assertEqual(len(pending_storage), 1)
        queued.disconnect()
        self.assertEqual((await queued.response())[0], 499)
        database_release.set()
        await asyncio.gather(*pending_storage)
        await asyncio.sleep(0)
        self.assertEqual(self.middleware.active, {})
        self.assertFalse(self.middleware.limiter.waiting)
        self.assertTrue(self.started.empty())


class AttemptGuardTests(unittest.TestCase):
    def test_rejected_attempts_trigger_escalating_real_cooldown(self):
        config = Settings(_env_file=None)
        guard = AttemptGuard(config)
        now = time.monotonic()
        for _ in range(4):
            self.assertIsNone(guard.check('one', now))
        self.assertEqual(guard.check('one', now).retry_after, 30)
        self.assertEqual(guard.check('one', now + 12).retry_after, 18)
        for _ in range(3):
            self.assertIsNone(guard.check('one', now + 30))
        self.assertEqual(guard.check('one', now + 30).retry_after, 60)

    def test_random_identity_flood_cannot_grow_state_or_evict_cooldown(self):
        guard = AttemptGuard(Settings(_env_file=None, CHAT_ATTEMPT_CACHE_SIZE=8,
                                      CHAT_GLOBAL_ATTEMPT_BURST=10000))
        now = time.monotonic()
        for _ in range(5):
            guard.check('blocked', now)
        for index in range(5000):
            guard.check(str(index), now)
        self.assertEqual(len(guard.identities), 8)
        self.assertEqual(guard.check('blocked', now).code, 'burst_limit')
        self.assertEqual(guard.check('new', now).code, 'protection_busy')
        self.assertIsNone(guard.check('new', now + 1801))
        self.assertEqual(len(guard.identities), 1)


class PersistentQuotaTests(unittest.IsolatedAsyncioTestCase):
    async def test_reached_quota_cache_rejects_before_body_queue_or_sqlite(self):
        with tempfile.TemporaryDirectory() as directory:
            config = Settings(_env_file=None, ENVIRONMENT='production', INTERNAL_API_TOKEN=TOKEN,
                              CHAT_LIMIT_DB=directory + '/quota.sqlite', CHAT_IP_MINUTE_LIMIT=1)
            quota = QuotaStore(config)
            calls = 0
            async def work(scope, receive, send):
                nonlocal calls
                calls += 1
                await JSONResponse({'ok': True})(scope, receive, send)
            app = ChatProtectionMiddleware(work, config, quota)
            first = WireRequest(app, '10.0.0.1')
            self.assertEqual((await first.response())[0], 200)
            def fail_enter(identity):
                raise AssertionError('known exhausted identity entered queue')
            async def fail_consume(identity):
                raise AssertionError('known exhausted identity started SQLite')
            app.limiter.enter = fail_enter
            quota.consume = fail_consume
            second = WireRequest(app, '10.0.0.1')
            second.incoming.get_nowait()  # No body: a pre-body rejection must still complete.
            self.assertEqual((await second.response())[1]['code'], 'frequency_quota')
            self.assertEqual(calls, 1)

    async def test_precise_retry_after_lowered_limit_and_cache(self):
        with tempfile.TemporaryDirectory() as directory:
            path = directory + '/quota.sqlite'
            initial = QuotaStore(Settings(_env_file=None, CHAT_LIMIT_DB=path, CHAT_DAILY_LIMIT=10))
            for index, now in enumerate((100000, 100010, 100020)):
                self.assertIsNone(await initial.consume(str(index), now=now))
            lowered = QuotaStore(Settings(_env_file=None, CHAT_LIMIT_DB=path, CHAT_DAILY_LIMIT=2))
            rejection = await lowered.consume('next', now=100030)
            self.assertEqual(rejection.code, 'daily_quota')
            self.assertEqual(rejection.retry_after, 86380)
            self.assertNotIn('明天', rejection.message)
            self.assertEqual(lowered.blocked('another', now=100040).retry_after, 86370)
            self.assertIsNone(await lowered.consume('next', now=186410))

    async def test_persistent_ip_minute_hour_and_day_limits_leave_global_budget(self):
        cases = (
            ({'CHAT_IP_MINUTE_LIMIT': 2}, (100000, 100010), 100020, 40),
            ({'CHAT_IP_HOUR_LIMIT': 2}, (100000, 100100), 100200, 3400),
            ({'CHAT_IP_DAILY_LIMIT': 2}, (100000, 104000), 108000, 78400),
        )
        for limits, times, checked, retry in cases:
            with self.subTest(limits=limits), tempfile.TemporaryDirectory() as directory:
                config = Settings(_env_file=None, CHAT_LIMIT_DB=directory + '/quota.sqlite', **limits)
                first = QuotaStore(config)
                for now in times:
                    self.assertIsNone(await first.consume('same', now=now))
                self.assertEqual(first.blocked('same', now=checked).retry_after, retry)
                restarted = QuotaStore(config)
                rejection = await restarted.consume('same', now=checked)
                self.assertEqual((rejection.code, rejection.retry_after), ('frequency_quota', retry))
                self.assertIsNone(await restarted.consume('another', now=checked))
                with sqlite3.connect(config.CHAT_LIMIT_DB) as db:
                    self.assertEqual(db.execute('SELECT count(*) FROM requests').fetchone()[0], 3)
