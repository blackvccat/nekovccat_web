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
                    return await client.post('/api/chat/', headers=headers, json={})
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
