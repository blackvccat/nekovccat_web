import tempfile
import unittest
import httpx
from fastapi import FastAPI
from app.config import Settings
from app.security import ChatProtectionMiddleware

TOKEN = 'test-internal-token-' + 'x' * 40

class ChatProtectionTests(unittest.IsolatedAsyncioTestCase):
    async def test_unauthenticated_requests_and_persistent_daily_budget(self):
        with tempfile.TemporaryDirectory() as directory:
            config = Settings(_env_file=None, ENVIRONMENT='production', INTERNAL_API_TOKEN=TOKEN, CHAT_LIMIT_DB=directory+'/limits.sqlite', CHAT_DAILY_LIMIT=2)
            async def request(app, headers):
                async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://test') as client:
                    return await client.post('/api/chat/', headers=headers, json={'messages': [{'role': 'user', 'content': 'hello'}]})
            def app():
                inner = FastAPI()
                @inner.post('/api/chat/')
                async def chat(): return {'ok': True}
                return ChatProtectionMiddleware(inner, config)
            one = app()
            self.assertEqual((await request(one, {})).status_code, 403)
            headers = {'x-neko-internal-token': TOKEN, 'x-neko-client-ip': '1.2.3.4'}
            self.assertEqual((await request(one, headers)).status_code, 200)
            self.assertEqual((await request(one, headers)).status_code, 200)
            self.assertEqual((await request(app(), headers)).status_code, 429)
            self.assertEqual(one.active, {})

    async def test_production_fails_closed_without_proxy_secret(self):
        inner = FastAPI()
        middleware = ChatProtectionMiddleware(inner, Settings(_env_file=None, ENVIRONMENT='production', INTERNAL_API_TOKEN=None))
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=middleware), base_url='http://test') as client:
            self.assertEqual((await client.post('/api/chat/')).status_code, 503)


class QuotaConcurrencyTests(unittest.IsolatedAsyncioTestCase):
    async def test_atomic_budget_across_stores_and_expired_rows_between_cleanups(self):
        import asyncio
        import sqlite3
        import time
        from app.services.quota_store import QuotaStore
        with tempfile.TemporaryDirectory() as directory:
            config = Settings(_env_file=None, CHAT_LIMIT_DB=directory + '/quota.sqlite', CHAT_DAILY_LIMIT=5)
            stores = [QuotaStore(config), QuotaStore(config)]
            await asyncio.gather(*(store.initialize() for store in stores))
            replies = await asyncio.gather(*(stores[index % 2].consume(str(index), now=100000) for index in range(20)))
            self.assertEqual(sum(reply is None for reply in replies), 5)
            self.assertEqual(sum(reply is not None and reply.code == 'daily_quota' for reply in replies), 15)
            for store in stores:
                store._last_cleanup = time.monotonic()
            self.assertIsNone(await stores[0].consume('later', now=200000))
            with sqlite3.connect(config.CHAT_LIMIT_DB) as db:
                self.assertEqual(db.execute('SELECT count(*) FROM requests').fetchone()[0], 6)
            self.assertTrue(await stores[0].ready())

    async def test_sqlite_lock_does_not_block_event_loop(self):
        import asyncio
        import sqlite3
        from app.services.quota_store import QuotaStore
        with tempfile.TemporaryDirectory() as directory:
            config = Settings(_env_file=None, CHAT_LIMIT_DB=directory + '/quota.sqlite')
            store = QuotaStore(config)
            await store.initialize()
            db = sqlite3.connect(config.CHAT_LIMIT_DB)
            db.execute('BEGIN IMMEDIATE')
            waiting = asyncio.create_task(store.consume('visitor'))
            try:
                for _ in range(5):
                    await asyncio.sleep(0.02)
                    self.assertFalse(waiting.done())
            finally:
                db.rollback()
                db.close()
            self.assertIsNone(await waiting)

    async def test_active_slots_release_after_cancellation_and_rejections_do_not_charge(self):
        import asyncio
        from starlette.responses import JSONResponse
        with tempfile.TemporaryDirectory() as directory:
            config = Settings(_env_file=None, ENVIRONMENT='production', INTERNAL_API_TOKEN=TOKEN,
                              CHAT_LIMIT_DB=directory + '/quota.sqlite', CHAT_MAX_CONCURRENT=1)
            entered, unblock = asyncio.Event(), asyncio.Event()
            async def held(scope, receive, send):
                entered.set()
                await unblock.wait()
                await JSONResponse({'ok': True})(scope, receive, send)
            middleware = ChatProtectionMiddleware(held, config)
            headers = {'x-neko-internal-token': TOKEN, 'x-neko-client-ip': '1.2.3.4'}
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=middleware), base_url='http://test') as client:
                body = {'messages': [{'role': 'user', 'content': 'hello'}]}
                active = asyncio.create_task(client.post('/api/chat/', headers=headers, json=body))
                await asyncio.wait_for(entered.wait(), timeout=2)
                rejected = await client.post('/api/chat/', headers=headers, json=body)
                self.assertEqual(rejected.status_code, 429)
                self.assertEqual(rejected.headers['retry-after'], '10')
                active.cancel()
                with self.assertRaises(asyncio.CancelledError):
                    await active
                self.assertEqual(middleware.active, {})
                unblock.set()
                self.assertEqual((await client.post('/api/chat/', headers=headers, json=body)).status_code, 200)

    async def test_missing_quota_database_fails_readiness_without_recreating_file(self):
        from pathlib import Path
        from app.services.quota_store import QuotaStore
        with tempfile.TemporaryDirectory() as directory:
            store = QuotaStore(Settings(_env_file=None, CHAT_LIMIT_DB=directory + '/quota.sqlite'))
            await store.initialize()
            Path(store.path).unlink()
            self.assertFalse(await store.ready())
            self.assertFalse(store.path.exists())
