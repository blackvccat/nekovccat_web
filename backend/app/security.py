"""Limits the paid endpoints (chat and visitor login); trusts client identity only from our proxy."""
import asyncio
import hashlib
import hmac
import ipaddress
import sqlite3
import threading
import time
from pathlib import Path

from pydantic import ValidationError
from starlette.responses import JSONResponse

from app.config import settings
from app.observability import log_event
from app.schemas.chat import ChatRequest
from app.services import visitor_accounts
from app.services.attempt_guard import AttemptGuard

CHAT_PREFIX = '/api/chat'
VISITOR_PREFIX = '/api/visitor'
VISITOR_LOGIN_PATH = '/api/visitor/login'
MUSIC_PREFIX = '/api/music'
PROTECTED_PREFIXES = (CHAT_PREFIX, VISITOR_PREFIX, MUSIC_PREFIX)

# 突发限制对两档都生效：12 小时的额度管得住总量、管不住突发，
# 一个账号几分钟就能把几百条连发完，每条都是一次完整的生成。
BURST_PER_MINUTE = 12
BURST_PER_HOUR = 60


class Disconnected(Exception):
    """浏览器在读完 body 之前就断了：映射 499，不当作服务端错误。"""


class InvalidBody(Exception):
    """中间件前置校验的失败：status 就是回给客户端的码（400/413/415/422）。"""

    def __init__(self, status):
        self.status = status


class ChatProtectionMiddleware:
    def __init__(self, app, config=None, attempt_guard=None):
        self.app = app
        self.config = config or settings
        self.lock = threading.Lock()
        self.active = {}
        self.migrated = False
        # 廉价试次闸门：纯内存、无 I/O，必须在读 body 与 sqlite 之前。
        self.attempt_guard = attempt_guard or AttemptGuard(self.config)

    async def __call__(self, scope, receive, send):
        if (scope['type'] != 'http' or not scope['path'].startswith(PROTECTED_PREFIXES)
                or self.config.ENVIRONMENT != 'production'):
            return await self.app(scope, receive, send)
        headers = dict(scope.get('headers', []))
        expected = self.config.INTERNAL_API_TOKEN or ''
        provided = headers.get(b'x-marcus-internal-token', b'').decode('latin1')

        async def reject(message, status, retry=60, code='rejected'):
            # 结构化记账：被拒的原因、状态码与当时的并发数，日志里不含地址、正文与凭据。
            log_event('chat_rejected', code=code, status=status, active=len(self.active))
            await JSONResponse({'detail': message}, status_code=status, headers={'Cache-Control': 'no-store', 'Retry-After': str(retry)})(scope, receive, send)

        if len(expected) < 32:
            return await reject('站内 Agent 正在维护。', 503, code='configuration')
        if not hmac.compare_digest(provided.encode(), expected.encode()):
            return await reject('请通过本站 Agent 访问。', 403, code='unauthorized')
        # Login identities are hashed with the shared secret, so a forged header cannot
        # create a fresh bucket and the real address never lands in the limits database.
        # 地址先规范化（见 _canonical_address）：同一 IPv6 /64 里换后缀、或把 IPv4 写成
        # IPv4-mapped IPv6，都必须落进同一个桶，否则限额一换地址就重置。解析不了就不放行。
        raw_ip = headers.get(b'x-marcus-client-ip', b'local').decode('latin1')
        ip = 'local' if raw_ip == 'local' else self._canonical_address(raw_ip)
        if ip is None:
            return await reject('请从本站公网入口访问 Agent。', 403, code='invalid_address')
        identity = self._hash(ip.encode())
        path = scope['path']
        if path == CHAT_PREFIX:
            # Starlette 会用 307 把不带尾斜杠的 /api/chat 转到 /api/chat/，而额度在这里就扣了：
            # 不归一的话同一条消息会被算两次（重定向那一发 + 浏览器跟过去那一发）。
            path = CHAT_PREFIX + '/'
            scope = {**scope, 'path': path, 'raw_path': scope.get('raw_path', b'/api/chat') + b'/'}
        # 两个付费入口都只接受 POST：别的方交给路由去回 405，中间件不扣额度。
        # 不这么做的话，一个明明会被 405 打回的请求会白吃一行配额——而它扣的是全站每日信封，
        # 也就是能让所有人当天都聊不了。令牌校验在它之前，受保护路径一律要令牌。
        if scope.get('method') != 'POST':
            return await self.app(scope, receive, send)
        if path == VISITOR_LOGIN_PATH:
            return await self._visitor(scope, receive, send, identity, reject)
        if path.startswith(CHAT_PREFIX):
            return await self._chat(scope, receive, send, identity, headers, reject)
        # Other visitor endpoints (app list, views, assets) are content reads, not paid turns:
        # the shared token above is the only gate, so one page load cannot exhaust a login window.
        return await self.app(scope, receive, send)

    async def _visitor(self, scope, receive, send, identity, reject):
        """Login attempts get their own, much smaller, window than paid chat turns."""
        # 试次闸门按身份算，键加前缀是为了和聊天的桶分开：访客登录 6 次/分本来就比聊天严，
        # 共用一把桶会让「聊过几条再登录」直接进冷却。同一身份的连打仍然会累积并翻倍冷却。
        rejection = self.attempt_guard.check('login:' + identity)
        if rejection:
            return await reject(rejection.message, 429, rejection.retry_after, rejection.code)
        try:
            # 判定里有线程锁与 sqlite I/O，放进线程跑：事件循环在等锁时必须还能服务别的请求。
            reason = await asyncio.to_thread(self._decide_login, identity,
                                             self.config.VISITOR_LOGIN_PER_MINUTE, self.config.VISITOR_LOGIN_PER_HOUR)
            if reason:
                return await reject(*reason)
            await self.app(scope, receive, send)
        except sqlite3.Error:
            return await reject('站内 Agent 正在维护，请稍后再试。', 503, code='quota_storage')
        finally:
            # 单独一次 pop 在 GIL 下是原子的，不必再抢锁（否则又要等持有锁的 I/O）。
            self.active.pop('login:' + identity, None)

    async def _read_body(self, headers, receive) -> bytes:
        """读完并校验请求体，把 415 / 413 / 422 / 408 挡在配额与 sqlite 之前。

        原来畸形请求（超长、字段不合规）要先扣一发额度、再写一次 sqlite，最后才由路由
        的 pydantic 拒掉：用户白扣额度，攻击者还能拿畸形请求换取真实写库。校验前置之后
        这些请求在中间件就结束，也不产生任何库写入。
        """
        if not headers.get(b'content-type', b'').lower().startswith(b'application/json'):
            raise InvalidBody(415)
        try:
            length = int(headers.get(b'content-length', b'0'))
        except ValueError:
            raise InvalidBody(400) from None
        if length < 0 or length > self.config.CHAT_BODY_MAX_BYTES:
            raise InvalidBody(413)
        body = bytearray()
        async with asyncio.timeout(self.config.CHAT_BODY_TIMEOUT_SECONDS):
            while True:
                event = await receive()
                if event['type'] == 'http.disconnect':
                    raise Disconnected()
                if event['type'] != 'http.request':
                    raise InvalidBody(400)
                chunk = event.get('body', b'')
                if len(body) + len(chunk) > self.config.CHAT_BODY_MAX_BYTES:
                    raise InvalidBody(413)
                body.extend(chunk)
                if not event.get('more_body', False):
                    break
        try:
            request = ChatRequest.model_validate_json(body)
        except ValidationError:
            raise InvalidBody(422) from None
        if (request.messages[-1].role != 'user'
                or any(not message.content.strip() for message in request.messages)
                or sum(len(message.content) for message in request.messages) > 24000):
            raise InvalidBody(422)
        return bytes(body)

    def _decide_login(self, identity: str, minute_limit: int, hour_limit: int):
        """同步判定：同一身份同时只能有一次登录在飞，另加按分钟/小时的窗口。"""
        with self.lock:
            if self.active.get('login:' + identity, 0) >= 1:
                return ('正在验证上一次登录，请稍后再试。', 429, 5, 'login_busy')
            db = self._connect()
            try:
                db.execute('CREATE TABLE IF NOT EXISTS logins (ip TEXT NOT NULL, ts REAL NOT NULL)')
                db.execute('CREATE INDEX IF NOT EXISTS logins_ip_ts ON logins (ip, ts)')
                db.execute('BEGIN IMMEDIATE')
                now = time.time()
                db.execute('DELETE FROM logins WHERE ts < ?', (now - 3600,))
                minute = db.execute('SELECT count(*) FROM logins WHERE ip=? AND ts>?', (identity, now - 60)).fetchone()[0]
                hour = db.execute('SELECT count(*) FROM logins WHERE ip=? AND ts>?', (identity, now - 3600)).fetchone()[0]
                if minute >= minute_limit or hour >= hour_limit:
                    return ('尝试次数过多，请稍后再试。', 429, 300, 'login_window')
                db.execute('INSERT INTO logins(ip, ts) VALUES (?, ?)', (identity, now))
                db.commit()
                self.active['login:' + identity] = 1
                return None
            finally:
                db.close()

    async def _chat(self, scope, receive, send, ip_bucket, headers, reject):
        """Two paid tiers: anonymous (per device, with the address as an aggregate backstop) and
        logged-in (per account).

        The tier is resolved before the lock: looking an account up may await, and awaiting while
        holding a threading lock would block the event loop itself.
        """
        identity = ip_bucket
        visitor_bucket = await self._visitor_bucket(headers)
        device = headers.get(b'x-marcus-device', b'')
        if visitor_bucket:
            kind, bucket, quota, ip_bucket = 'vis', visitor_bucket, self.config.CHAT_VISITOR_LIMIT, None
        else:
            # No device cookie (older frontend, external chat endpoint) degrades to the IP bucket:
            # stricter than intended behind one shared address, never more permissive.
            kind, bucket, quota = 'dev', self._hash(device) if device else ip_bucket, self.config.CHAT_ANON_DEVICE_LIMIT
        key = f'{kind}:{bucket}'
        window = self.config.CHAT_WINDOW_SECONDS
        # 第一道闸按「网络身份」而不是分档桶算：清 cookie 换设备桶是免费的，
        # 按桶算等于给同一个人无限次试次。它早于读 body 与 sqlite，代价只有一次字典查找。
        rejection = self.attempt_guard.check(identity)
        if rejection:
            return await reject(rejection.message, 429, rejection.retry_after, rejection.code)
        try:
            body = await self._read_body(headers, receive)
        except InvalidBody as exc:
            return await reject('消息太长或格式无效，请缩短消息或开启新对话。', exc.status, 0, 'invalid_request')
        except TimeoutError:
            return await reject('读取消息超时，请稍后再试。', 408, 1, 'body_timeout')
        except Disconnected:
            return await reject('请求已取消。', 499, 0, 'cancelled')
        try:
            # 判定放在线程里：它要拿进程内的锁与 sqlite 的写锁。取消这件事对那个线程无效，
            # 所以槽位的摘除必须等它落地——否则线程稍后写回的 `active[key] = 1` 再也没人摘，
            # 会永久占住一个并发名额，几个之后整站都发不出消息。先记下这个任务，
            # 摘除放到 finally 里按「是否已落地」分两种走法。
            reservation = asyncio.create_task(
                asyncio.to_thread(self._decide_chat, key, kind, bucket, quota, ip_bucket, window))
            try:
                reason = await asyncio.shield(reservation)
            except sqlite3.Error:
                return await reject('站内 Agent 正在维护，请稍后再试。', 503, code='quota_storage')
            if reason:
                return await reject(*reason)
            # 校验时已经把 body 读完了，路由要读的是同一份字节，不能让它去等一个永远不来的请求。
            replayed = False

            async def replay_receive():
                nonlocal replayed
                if not replayed:
                    replayed = True
                    return {'type': 'http.request', 'body': body, 'more_body': False}
                return await receive()

            await self.app(scope, replay_receive, send)
        finally:
            if reservation.done():
                self.active.pop(key, None)
            else:
                def release_when_done(task):
                    if not task.cancelled():
                        # 取走迟到的存储错误，别让它变成 "exception was never retrieved"。
                        task.exception()
                    # 无条件摘除：判定失败或直接拒绝时本来就没占位，摘除是空操作。
                    self.active.pop(key, None)

                reservation.add_done_callback(release_when_done)

    def _decide_chat(self, key: str, kind: str, bucket: str, quota: int, ip_bucket: str | None, window: int):
        """同步判定：并发名额、全站硬顶、分档额度、地址兜底、突发。返回拒绝理由或 None。"""
        with self.lock:
            if sum(self.active.values()) >= self.config.CHAT_MAX_CONCURRENT or self.active.get(key, 0) >= 1:
                return ('Agent 正在回复，请稍后再发消息。', 429, 10, 'busy')
            db = self._connect()
            try:
                db.execute('BEGIN IMMEDIATE')
                now = time.time()
                db.execute('DELETE FROM requests WHERE ts < ?', (now - 86400,))
                # One row per paid request, so the global ceiling is an exact count.
                day = db.execute('SELECT count(*) FROM requests').fetchone()[0]
                recent = self._window(db, 'kind=? AND bucket=?', (kind, bucket), now, window)
                ip_recent = ([] if ip_bucket is None
                             else self._window(db, 'ip_bucket=?', (ip_bucket,), now, window))
                ip_today = ([] if ip_bucket is None
                            else self._window(db, 'ip_bucket=?', (ip_bucket,), now, 86400))
                used, minute, hour = len(recent), self._since(recent, now, 60), self._since(recent, now, 3600)
                if day >= self.config.CHAT_DAILY_LIMIT:
                    return ('今日 Agent 使用额度已用完，请明天再来。', 429, 3600, 'global_quota')
                if used >= quota:
                    message = ('这个账号的额度已用完，请稍后再试。' if kind == 'vis'
                               else '免费额度已用完，登录访客模式可以继续。')
                    return (message, 429, self._retry_after(recent, quota, window),
                            'visitor_quota' if kind == 'vis' else 'device_quota')
                if len(ip_recent) >= self.config.CHAT_ANON_IP_LIMIT:
                    return ('这个网络下的免费额度已用完，登录访客模式可以继续。', 429,
                            self._retry_after(ip_recent, self.config.CHAT_ANON_IP_LIMIT, window), 'address_quota')
                if len(ip_today) >= self.config.CHAT_ANON_IP_DAILY_LIMIT:
                    return ('这个网络今天的免费额度已用完，登录访客模式可以继续。', 429,
                            self._retry_after(ip_today, self.config.CHAT_ANON_IP_DAILY_LIMIT, 86400), 'address_daily_quota')
                if minute >= BURST_PER_MINUTE or hour >= BURST_PER_HOUR:
                    return ('消息有些频繁，请休息一会儿再试。', 429, 60, 'burst')
                db.execute('INSERT INTO requests(kind, bucket, ip_bucket, ts) VALUES (?, ?, ?, ?)',
                           (kind, bucket, ip_bucket, now))
                db.commit()
                self.active[key] = 1
                return None
            finally:
                db.close()

    async def _visitor_bucket(self, headers) -> str | None:
        """The higher tier needs a valid account: proof comes from the frontend, freshness from here.

        A disabled or vanished account silently drops back to anonymous instead of failing the
        request, so revoking access narrows the quota immediately without breaking the page.
        """
        raw = headers.get(b'x-marcus-visitor', b'').decode('latin1')
        if not raw:
            return None
        username = visitor_accounts.normalize_username(raw)
        if not username or len(username) > visitor_accounts.MAX_USERNAME_LENGTH:
            return None
        try:
            account = await visitor_accounts.find_account(username)
        except visitor_accounts.VisitorAccountsUnavailable:
            return None
        if account is None or account.disabled:
            return None
        return self._hash(username.encode())

    def _hash(self, value: bytes) -> str:
        return hmac.new((self.config.INTERNAL_API_TOKEN or '').encode(), value, hashlib.sha256).hexdigest()

    @staticmethod
    def _canonical_address(raw: str) -> str | None:
        """One identity per visitor network: an IPv6 address collapses to its /64.

        运营商给每个用户至少一整个 /64，而客户端会不停更换低 64 位（隐私扩展地址），
        所以按完整地址分桶等于给一个人无限多的桶。IPv4-mapped IPv6 归一回 IPv4，
        否则同一台机器会有两套额度。解析不了一律返回 None，上层直接 403：既不能当成
        新桶（更松），也不能落进共享桶（连累别人）。
        """
        if not raw or '%' in raw:
            return None
        try:
            address = ipaddress.ip_address(raw)
        except ValueError:
            return None
        if isinstance(address, ipaddress.IPv6Address):
            if address.ipv4_mapped is not None:
                return str(address.ipv4_mapped)
            return str(ipaddress.IPv6Network((address, 64), strict=False).network_address)
        return str(address)

    @staticmethod
    def _window(db, where: str, params: tuple, now: float, window: int) -> list[float]:
        rows = db.execute(f'SELECT ts FROM requests WHERE {where} AND ts>? ORDER BY ts', (*params, now - window))
        return [row[0] for row in rows]

    @staticmethod
    def _since(rows: list[float], now: float, seconds: int) -> int:
        return sum(1 for ts in rows if ts > now - seconds)

    @staticmethod
    def _retry_after(rows: list[float], quota: int, window: int) -> int:
        """Seconds until this bucket has room again; rows must be ascending."""
        if len(rows) < quota:
            return 0
        return max(1, int(rows[len(rows) - quota] + window - time.time()) + 1)

    def _connect(self) -> sqlite3.Connection:
        path = Path(self.config.CHAT_LIMIT_DB)
        path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        db = sqlite3.connect(str(path), timeout=self.config.CHAT_SQLITE_TIMEOUT_SECONDS)
        if not self.migrated:
            try:
                self._migrate(db)
            except sqlite3.Error:
                # 迁移被别的连接挡住（或磁盘出问题）时不能让这个连接悬着：
                # 它会把数据库文件一直占住，后面每次重试都失败。失败后 migrated 保持 False，下次再试。
                db.close()
                raise
            self.migrated = True
        return db

    @staticmethod
    def _migrate(db: sqlite3.Connection) -> None:
        """Rebuild the old one-column requests table so one request maps to one row per bucket set.

        DDL is written straight through (the module only wraps DML in a transaction), so a failure
        halfway leaves the new table sitting beside the old one. That leftover gets adopted on the
        next run rather than silently dropped, which is also why the adopt step comes before the
        indexes: the old table's indexes keep their names across a rename, so `requests_ip_ts`
        cannot be created until the old table (and its copy of that index) is gone.
        """
        columns = [row[1] for row in db.execute('PRAGMA table_info(requests)')]
        legacy = db.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='requests_legacy'").fetchone()
        if 'ip_bucket' not in columns:
            if columns:
                db.execute('ALTER TABLE requests RENAME TO requests_legacy')
                legacy = True
            db.execute('CREATE TABLE requests (kind TEXT NOT NULL, bucket TEXT NOT NULL, ip_bucket TEXT, ts REAL NOT NULL)')
        if legacy:
            # Old rows were keyed by address alone: keep them counting toward the global ceiling and
            # the IP backstop, and never let them stand in for a device bucket.
            db.execute("INSERT INTO requests(kind, bucket, ip_bucket, ts) SELECT 'legacy', ip, ip, ts FROM requests_legacy")
            db.execute('DROP TABLE requests_legacy')
        db.commit()
        db.execute('CREATE INDEX IF NOT EXISTS requests_kind_bucket_ts ON requests(kind, bucket, ts)')
        db.execute('CREATE INDEX IF NOT EXISTS requests_ip_ts ON requests(ip_bucket, ts)')
        db.commit()


def quota_storage_ready(config) -> bool:
    """就绪探针：配额库能打开、能建表（也就是迁移能跑）才算就绪。

    顺带验证迁移路径：真出事的时候（磁盘满、权限不对、旧表畸形）应该在发布检查里
    就暴露，而不是等第一个用户发消息时才发现扣不了额度。
    """
    try:
        path = Path(config.CHAT_LIMIT_DB)
        path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        db = sqlite3.connect(str(path), timeout=3)
        try:
            ChatProtectionMiddleware._migrate(db)
        finally:
            db.close()
        return True
    except (sqlite3.Error, OSError):
        return False
