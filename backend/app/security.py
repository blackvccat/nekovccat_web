"""Limits only the paid chat endpoint; trust client identity only from our authenticated proxy."""
import hashlib
import hmac
import sqlite3
import threading
import time
from pathlib import Path
from starlette.responses import JSONResponse
from app.config import settings


class ChatProtectionMiddleware:
    def __init__(self, app, config=None):
        self.app = app
        self.config = config or settings
        self.lock = threading.Lock()
        self.active = {}

    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http' or not scope['path'].startswith('/api/chat') or self.config.ENVIRONMENT != 'production':
            return await self.app(scope, receive, send)
        headers = dict(scope.get('headers', []))
        expected = self.config.INTERNAL_API_TOKEN or ''
        provided = headers.get(b'x-neko-internal-token', b'').decode('latin1')
        async def reject(message, status, retry=60):
            await JSONResponse({'detail': message}, status_code=status, headers={'Cache-Control': 'no-store', 'Retry-After': str(retry)})(scope, receive, send)
        if len(expected) < 32:
            return await reject('站内 Agent 正在维护。', 503)
        if not hmac.compare_digest(provided.encode(), expected.encode()):
            return await reject('请通过本站 Agent 访问。', 403)
        ip = headers.get(b'x-neko-client-ip', b'local')
        identity = hmac.new(expected.encode(), ip, hashlib.sha256).hexdigest()
        acquired = False
        try:
            with self.lock:
                if sum(self.active.values()) >= 3 or self.active.get(identity, 0) >= 1:
                    reason = ('Agent 正在回复，请稍后再发消息。', 429, 10)
                else:
                    path = Path(self.config.CHAT_LIMIT_DB)
                    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
                    with sqlite3.connect(path, timeout=3) as db:
                        db.execute('CREATE TABLE IF NOT EXISTS requests (ip TEXT NOT NULL, ts REAL NOT NULL)')
                        db.execute('CREATE INDEX IF NOT EXISTS requests_ts ON requests(ts)')
                        db.execute('CREATE INDEX IF NOT EXISTS requests_ip_ts ON requests(ip, ts)')
                        db.execute('BEGIN IMMEDIATE')
                        now = time.time()
                        db.execute('DELETE FROM requests WHERE ts < ?', (now - 86400,))
                        minute = db.execute('SELECT count(*) FROM requests WHERE ip=? AND ts>?', (identity, now - 60)).fetchone()[0]
                        hour = db.execute('SELECT count(*) FROM requests WHERE ip=? AND ts>?', (identity, now - 3600)).fetchone()[0]
                        day = db.execute('SELECT count(*) FROM requests').fetchone()[0]
                        if day >= self.config.CHAT_DAILY_LIMIT:
                            reason = ('今日 Agent 使用额度已用完，请明天再来。', 429, 3600)
                        elif minute >= 12 or hour >= 60:
                            reason = ('消息有些频繁，请休息一会儿再试。', 429, 60)
                        else:
                            db.execute('INSERT INTO requests(ip, ts) VALUES (?, ?)', (identity, now))
                            reason = None
                            self.active[identity] = 1
                            acquired = True
            if reason:
                return await reject(*reason)
            await self.app(scope, receive, send)
        except sqlite3.Error:
            return await reject('站内 Agent 正在维护，请稍后再试。', 503)
        finally:
            if acquired:
                with self.lock:
                    self.active.pop(identity, None)
