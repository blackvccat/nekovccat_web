import asyncio
from collections import Counter
import sqlite3
import tempfile
import time
import threading
import unittest
from unittest.mock import patch

import httpx
from fastapi import FastAPI

from app.config import Settings
from app.schemas.chat import ChatRequest
from app.security import ChatProtectionMiddleware
from app.services import visitor_accounts

TOKEN = 'test-internal-token-' + 'x' * 40

# 合法的请求体：中间件现在会把畸形/超长 body 挡在配额与 sqlite 之前，所以这些用例要送一份真能过的。
BODY = {'messages': [{'role': 'user', 'content': '有哪些页面？'}]}


def write_legacy_database(path: str, rows: int = 2) -> None:
    """Reproduce exactly what the previous release left on disk, indexes included.

    Both indexes matter: after the rename they keep their names, so the second one still owns
    `requests_ip_ts` and the rebuilt table cannot claim that name until the old table is gone.
    """
    db = sqlite3.connect(path)
    db.execute('CREATE TABLE requests (ip TEXT NOT NULL, ts REAL NOT NULL)')
    db.execute('CREATE INDEX requests_ts ON requests(ts)')
    db.execute('CREATE INDEX requests_ip_ts ON requests(ip, ts)')
    now = time.time()
    db.executemany('INSERT INTO requests(ip, ts) VALUES (?, ?)', [('legacy-hash', now - 10 - i) for i in range(rows)])
    db.commit()
    db.close()

class ChatProtectionTests(unittest.IsolatedAsyncioTestCase):
    async def test_unauthenticated_requests_and_persistent_daily_budget(self):
        with tempfile.TemporaryDirectory() as directory:
            config = Settings(_env_file=None, ENVIRONMENT='production', INTERNAL_API_TOKEN=TOKEN, CHAT_LIMIT_DB=directory+'/limits.sqlite', CHAT_DAILY_LIMIT=2)
            async def request(app, headers):
                async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://test') as client:
                    return await client.post('/api/chat/', headers=headers, json=BODY)
            def app():
                inner = FastAPI()
                @inner.post('/api/chat/')
                async def chat(): return {'ok': True}
                return ChatProtectionMiddleware(inner, config)
            one = app()
            self.assertEqual((await request(one, {})).status_code, 403)
            headers = {'x-marcus-internal-token': TOKEN, 'x-marcus-client-ip': '1.2.3.4'}
            self.assertEqual((await request(one, headers)).status_code, 200)
            self.assertEqual((await request(one, headers)).status_code, 200)
            self.assertEqual((await request(app(), headers)).status_code, 429)
            self.assertEqual(one.active, {})

    async def test_production_fails_closed_without_proxy_secret(self):
        inner = FastAPI()
        middleware = ChatProtectionMiddleware(inner, Settings(_env_file=None, ENVIRONMENT='production', INTERNAL_API_TOKEN=None))
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=middleware), base_url='http://test') as client:
            self.assertEqual((await client.post('/api/chat/')).status_code, 503)
            self.assertEqual((await client.post('/api/visitor/login', json={})).status_code, 503)

    async def test_visitor_logins_need_the_proxy_secret_like_chat(self):
        inner = FastAPI()
        middleware = ChatProtectionMiddleware(inner, Settings(_env_file=None, ENVIRONMENT='production', INTERNAL_API_TOKEN=TOKEN))
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=middleware), base_url='http://test') as client:
            self.assertEqual((await client.post('/api/visitor/login', json={})).status_code, 403)
            self.assertEqual((await client.post('/api/visitor/login', json={}, headers={'x-marcus-internal-token': 'wrong'})).status_code, 403)

    async def test_visitor_logins_have_their_own_window_and_do_not_spend_chat_budget(self):
        with tempfile.TemporaryDirectory() as directory:
            config = Settings(_env_file=None, ENVIRONMENT='production', INTERNAL_API_TOKEN=TOKEN, CHAT_LIMIT_DB=directory+'/limits.sqlite',
                              CHAT_DAILY_LIMIT=2, VISITOR_LOGIN_PER_MINUTE=2, VISITOR_LOGIN_PER_HOUR=3)
            inner = FastAPI()
            @inner.post('/api/visitor/login')
            async def login(): return {'ok': True}
            @inner.post('/api/chat/')
            async def chat(): return {'ok': True}
            middleware = ChatProtectionMiddleware(inner, config)
            headers = {'x-marcus-internal-token': TOKEN, 'x-marcus-client-ip': '9.9.9.9'}
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=middleware), base_url='http://test') as client:
                self.assertEqual((await client.post('/api/visitor/login', headers=headers, json={})).status_code, 200)
                self.assertEqual((await client.post('/api/visitor/login', headers=headers, json={})).status_code, 200)
                throttled = await client.post('/api/visitor/login', headers=headers, json={})
                self.assertEqual(throttled.status_code, 429)
                self.assertIn('Retry-After', throttled.headers)
                # Failed logins never consume the paid chat budget.
                self.assertEqual((await client.post('/api/chat/', headers=headers, json=BODY)).status_code, 200)
            self.assertEqual(middleware.active, {})

    @staticmethod
    def _chat_app(config):
        inner = FastAPI()

        @inner.post('/api/chat/')
        async def chat(): return {'ok': True}

        return ChatProtectionMiddleware(inner, config)

    @staticmethod
    def _config(directory, **overrides):
        values = dict(ENVIRONMENT='production', INTERNAL_API_TOKEN=TOKEN, CHAT_LIMIT_DB=directory + '/limits.sqlite')
        values.update(overrides)
        return Settings(_env_file=None, **values)

    async def test_anonymous_quota_is_per_device_and_one_address_serves_many(self):
        """一个出口地址后面可以坐着好几个人，额度必须按设备分，不能互相吃。"""
        with tempfile.TemporaryDirectory() as directory:
            middleware = self._chat_app(self._config(
                directory, CHAT_ANON_DEVICE_LIMIT=2, CHAT_ANON_IP_LIMIT=100, CHAT_DAILY_LIMIT=100))
            def headers(device):
                return {'x-marcus-internal-token': TOKEN, 'x-marcus-client-ip': '203.0.113.7', 'x-marcus-device': device}
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=middleware), base_url='http://test') as client:
                for _ in range(2):
                    self.assertEqual((await client.post('/api/chat/', headers=headers('a' * 48), json=BODY)).status_code, 200)
                exhausted = await client.post('/api/chat/', headers=headers('a' * 48), json=BODY)
                self.assertEqual(exhausted.status_code, 429)
                self.assertIn('Retry-After', exhausted.headers)
                self.assertIn('登录访客模式', exhausted.json()['detail'])
                # 同一地址上的另一台设备照常用自己的份额。
                self.assertEqual((await client.post('/api/chat/', headers=headers('b' * 48), json=BODY)).status_code, 200)

    async def test_clearing_the_device_cookie_hits_the_address_ceiling(self):
        """清 cookie 能换到新桶，但地址上的聚合上限把总量摁住。"""
        with tempfile.TemporaryDirectory() as directory:
            middleware = self._chat_app(self._config(
                directory, CHAT_ANON_DEVICE_LIMIT=1, CHAT_ANON_IP_LIMIT=3, CHAT_DAILY_LIMIT=100))
            def headers(device):
                base = {'x-marcus-internal-token': TOKEN, 'x-marcus-client-ip': '198.51.100.9'}
                return {**base, 'x-marcus-device': device} if device else base
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=middleware), base_url='http://test') as client:
                for device in ('a' * 48, 'b' * 48, 'c' * 48):
                    self.assertEqual((await client.post('/api/chat/', headers=headers(device), json=BODY)).status_code, 200)
                blocked = await client.post('/api/chat/', headers=headers('d' * 48), json=BODY)
                self.assertEqual(blocked.status_code, 429)
                self.assertIn('这个网络', blocked.json()['detail'])
                # 没有设备头的旧客户端退回按地址分桶：更严，不会更松。
                self.assertEqual((await client.post('/api/chat/', headers=headers(None), json=BODY)).status_code, 429)

    async def test_logged_in_visitor_has_its_own_tier_and_leaves_the_device_bucket_alone(self):
        with tempfile.TemporaryDirectory() as directory:
            middleware = self._chat_app(self._config(
                directory, CHAT_ANON_DEVICE_LIMIT=1, CHAT_VISITOR_LIMIT=2, CHAT_DAILY_LIMIT=100))
            account = visitor_accounts.VisitorAccount(username='leo', name='Leo', password_hash='pbkdf2_sha256$1$AA==$AA==')
            async def find_account(username): return account if username == 'leo' else None
            def headers(visitor=None):
                base = {'x-marcus-internal-token': TOKEN, 'x-marcus-client-ip': '192.0.2.5', 'x-marcus-device': 'a' * 48}
                return {**base, 'x-marcus-visitor': visitor} if visitor else base
            with patch.object(visitor_accounts, 'find_account', find_account):
                async with httpx.AsyncClient(transport=httpx.ASGITransport(app=middleware), base_url='http://test') as client:
                    for _ in range(2):
                        self.assertEqual((await client.post('/api/chat/', headers=headers('leo'), json=BODY)).status_code, 200)
                    self.assertEqual((await client.post('/api/chat/', headers=headers('leo'), json=BODY)).status_code, 429)
                    # 登录用户的这两轮没有占用匿名桶：同一台设备仍有自己的一条。
                    self.assertEqual((await client.post('/api/chat/', headers=headers(), json=BODY)).status_code, 200)

    async def test_a_disabled_or_unknown_visitor_falls_back_to_the_anonymous_tier(self):
        """停用或对不上的访客名不能换来高额度，只按匿名算。"""
        with tempfile.TemporaryDirectory() as directory:
            middleware = self._chat_app(self._config(
                directory, CHAT_ANON_DEVICE_LIMIT=1, CHAT_VISITOR_LIMIT=100, CHAT_DAILY_LIMIT=100))
            disabled = visitor_accounts.VisitorAccount(username='leo', name='Leo', password_hash='pbkdf2_sha256$1$AA==$AA==', disabled=True)
            async def find_account(username): return disabled if username == 'leo' else None
            headers = {'x-marcus-internal-token': TOKEN, 'x-marcus-client-ip': '192.0.2.6',
                       'x-marcus-device': 'a' * 48, 'x-marcus-visitor': 'leo'}
            with patch.object(visitor_accounts, 'find_account', find_account):
                async with httpx.AsyncClient(transport=httpx.ASGITransport(app=middleware), base_url='http://test') as client:
                    self.assertEqual((await client.post('/api/chat/', headers=headers, json=BODY)).status_code, 200)
                    self.assertEqual((await client.post('/api/chat/', headers=headers, json=BODY)).status_code, 429)

    def test_only_canonical_addresses_become_identities(self):
        """解析不了的一律不给身份；IPv6 归到 /64，mapped IPv4 归回 IPv4。"""
        canonical = ChatProtectionMiddleware._canonical_address
        for bad in ('not-an-ip', '1.2.3.4, 5.6.7.8', 'fe80::1%eth0', '192.000.002.001', ''):
            self.assertIsNone(canonical(bad), bad)
        # 同一 /64 里换后缀 = 同一个人。
        self.assertEqual(canonical('2001:db8:abcd:1234::1'), '2001:db8:abcd:1234::')
        self.assertEqual(canonical('2001:DB8:ABCD:1234:0:0:0:9999'), '2001:db8:abcd:1234::')
        self.assertEqual(canonical('2001:db8:abcd:1234::ffff'), '2001:db8:abcd:1234::')
        # 别的 /64 是别人。
        self.assertEqual(canonical('2001:db8:abcd:9999::1'), '2001:db8:abcd:9999::')
        # ::ffff:a.b.c.d 与 a.b.c.d 共用一个桶。
        self.assertEqual(canonical('::ffff:203.0.113.5'), '203.0.113.5')
        self.assertEqual(canonical('::FFFF:c633:6409'), '198.51.100.9')
        self.assertEqual(canonical('203.0.113.5'), '203.0.113.5')

    async def test_one_ipv6_slash_64_shares_a_single_identity(self):
        """同一 /64 里换后缀不能换到新桶：运营商给的是整个 /64，后缀是客户端随便换的。"""
        with tempfile.TemporaryDirectory() as directory:
            middleware = self._chat_app(self._config(
                directory, CHAT_ANON_DEVICE_LIMIT=1, CHAT_ANON_IP_LIMIT=2,
                CHAT_ANON_IP_DAILY_LIMIT=100, CHAT_DAILY_LIMIT=100))
            def headers(device, ip):
                return {'x-marcus-internal-token': TOKEN, 'x-marcus-client-ip': ip, 'x-marcus-device': device}
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=middleware), base_url='http://test') as client:
                self.assertEqual((await client.post('/api/chat/', headers=headers('a' * 48, '2001:db8:abcd:1234::1'), json=BODY)).status_code, 200)
                self.assertEqual((await client.post('/api/chat/', headers=headers('b' * 48, '2001:db8:abcd:1234::9999'), json=BODY)).status_code, 200)
                rotated = await client.post('/api/chat/', headers=headers('c' * 48, '2001:db8:abcd:1234::ffff'), json=BODY)
                self.assertEqual(rotated.status_code, 429)
                self.assertIn('这个网络', rotated.json()['detail'])
                # 另一个 /64 是另一个人，不受影响。
                self.assertEqual((await client.post('/api/chat/', headers=headers('d' * 48, '2001:db8:abcd:9999::1'), json=BODY)).status_code, 200)

    async def test_mapped_ipv4_and_its_dotted_form_are_one_identity(self):
        """::ffff:a.b.c.d 与 a.b.c.d 必须是同一个桶，否则同一台机器有两套额度。"""
        with tempfile.TemporaryDirectory() as directory:
            middleware = self._chat_app(self._config(
                directory, CHAT_ANON_DEVICE_LIMIT=1, CHAT_ANON_IP_LIMIT=2,
                CHAT_ANON_IP_DAILY_LIMIT=100, CHAT_DAILY_LIMIT=100))
            def headers(device, ip):
                return {'x-marcus-internal-token': TOKEN, 'x-marcus-client-ip': ip, 'x-marcus-device': device}
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=middleware), base_url='http://test') as client:
                self.assertEqual((await client.post('/api/chat/', headers=headers('a' * 48, '198.51.100.9'), json=BODY)).status_code, 200)
                self.assertEqual((await client.post('/api/chat/', headers=headers('b' * 48, '::ffff:198.51.100.9'), json=BODY)).status_code, 200)
                self.assertEqual((await client.post('/api/chat/', headers=headers('c' * 48, '::FFFF:c633:6409'), json=BODY)).status_code, 429)

    async def test_a_malformed_client_address_fails_closed(self):
        """地址送来解析不了就不放行：当成新桶会更松，落进共享桶会连累别人，所以直接 403。"""
        with tempfile.TemporaryDirectory() as directory:
            middleware = self._chat_app(self._config(directory, CHAT_ANON_DEVICE_LIMIT=20))
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=middleware), base_url='http://test') as client:
                for bad in ('not-an-ip', '1.2.3.4, 5.6.7.8', 'fe80::1%eth0', '192.000.002.001'):
                    headers = {'x-marcus-internal-token': TOKEN, 'x-marcus-client-ip': bad, 'x-marcus-device': 'a' * 48}
                    response = await client.post('/api/chat/', headers=headers, json=BODY)
                    self.assertEqual(response.status_code, 403, bad)

    async def test_the_address_daily_cap_binds_across_two_windows(self):
        """12 小时那一档管不住「两段各刷满」：24 小时的总量必须另有硬顶。"""
        with tempfile.TemporaryDirectory() as directory:
            middleware = self._chat_app(self._config(
                directory, CHAT_ANON_DEVICE_LIMIT=1, CHAT_ANON_IP_LIMIT=100,
                CHAT_ANON_IP_DAILY_LIMIT=2, CHAT_DAILY_LIMIT=100))
            def headers(device):
                return {'x-marcus-internal-token': TOKEN, 'x-marcus-client-ip': '203.0.113.55', 'x-marcus-device': device}
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=middleware), base_url='http://test') as client:
                for device in ('a' * 48, 'b' * 48):
                    self.assertEqual((await client.post('/api/chat/', headers=headers(device), json=BODY)).status_code, 200)
                exhausted = await client.post('/api/chat/', headers=headers('c' * 48), json=BODY)
                self.assertEqual(exhausted.status_code, 429)
                self.assertIn('今天', exhausted.json()['detail'])
                self.assertIn('Retry-After', exhausted.headers)

    async def test_both_spellings_of_the_chat_path_cost_exactly_one_turn(self):
        """不带尾斜杠的 /api/chat 曾被算两次（307 重定向那一发 + 跟过去那一发）。"""
        with tempfile.TemporaryDirectory() as directory:
            path = directory + '/limits.sqlite'
            middleware = self._chat_app(self._config(directory, CHAT_ANON_DEVICE_LIMIT=5, CHAT_DAILY_LIMIT=100))
            headers = {'x-marcus-internal-token': TOKEN, 'x-marcus-client-ip': '203.0.113.60', 'x-marcus-device': 'a' * 48}
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=middleware), base_url='http://test') as client:
                self.assertEqual((await client.post('/api/chat', headers=headers, json=BODY)).status_code, 200)
                self.assertEqual((await client.post('/api/chat/', headers=headers, json=BODY)).status_code, 200)
            db = sqlite3.connect(path)
            try:
                rows = db.execute("SELECT count(*) FROM requests WHERE kind='dev'").fetchone()[0]
            finally:
                db.close()
            self.assertEqual(rows, 2, '两种写法各算一条，不能因为重定向多算')

    async def test_a_locked_limits_database_does_not_stall_the_event_loop(self):
        """配额库被别的连接锁住时，事件循环必须还能跑：判定在线程里等锁，不在循环里等。"""
        with tempfile.TemporaryDirectory() as directory:
            path = directory + '/limits.sqlite'
            middleware = self._chat_app(self._config(
                directory, CHAT_ANON_DEVICE_LIMIT=5, CHAT_SQLITE_TIMEOUT_SECONDS=0.6))
            # 先把表建好，再用另一个连接长期持有写锁。
            sqlite3.connect(path).close()
            holder = sqlite3.connect(path, timeout=0.1)
            holder.execute('CREATE TABLE IF NOT EXISTS requests (kind TEXT NOT NULL, bucket TEXT NOT NULL, ip_bucket TEXT, ts REAL NOT NULL)')
            holder.commit()
            holder.execute('BEGIN IMMEDIATE')
            ticks: list[int] = []

            async def ticker():
                for _ in range(5):
                    await asyncio.sleep(0.02)
                    ticks.append(1)

            headers = {'x-marcus-internal-token': TOKEN, 'x-marcus-client-ip': '203.0.113.70', 'x-marcus-device': 'a' * 48}
            try:
                async with httpx.AsyncClient(transport=httpx.ASGITransport(app=middleware), base_url='http://test') as client:
                    request = asyncio.create_task(client.post('/api/chat/', headers=headers, json=BODY))
                    ticker_task = asyncio.create_task(ticker())
                    # 5 次 20ms 的睡眠。如果裁定占着事件循环（改前就是），这两个 await 都只能等到
                    # 拿锁超时之后才完成，request.done() 那时候已经是 True。
                    await asyncio.wait_for(ticker_task, timeout=0.5)
                    self.assertEqual(len(ticks), 5, '等锁期间事件循环仍要推进')
                    self.assertFalse(request.done(), '此刻请求应当还在线程里等锁')
                    response = await request
                self.assertEqual(response.status_code, 503, '拿不到配额库写锁要 fail-closed')
            finally:
                # Windows 上没关掉的连接会让临时目录删不掉，也会掩盖真正的断言失败。
                holder.rollback()
                holder.close()

    async def test_the_old_one_column_table_is_rebuilt_without_losing_the_running_counts(self):
        """线上那个 limits.sqlite 是 requests(ip, ts) 加两条索引：升级时要原地重建，旧计数继续算进全站硬顶。"""
        with tempfile.TemporaryDirectory() as directory:
            path = directory + '/limits.sqlite'
            write_legacy_database(path, rows=2)
            middleware = self._chat_app(self._config(directory, CHAT_DAILY_LIMIT=3, CHAT_ANON_DEVICE_LIMIT=20))
            headers = {'x-marcus-internal-token': TOKEN, 'x-marcus-client-ip': '203.0.113.30'}
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=middleware), base_url='http://test') as client:
                # 旧的两条还在计数里，所以这一次之后全站硬顶就到了。
                self.assertEqual((await client.post('/api/chat/', headers=headers, json=BODY)).status_code, 200)
                self.assertEqual((await client.post('/api/chat/', headers=headers, json=BODY)).status_code, 429)
            db = sqlite3.connect(path)
            try:
                kinds = db.execute('SELECT kind, count(*) FROM requests GROUP BY kind ORDER BY kind').fetchall()
                leftover = db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='requests_legacy'").fetchone()
                indexes = sorted(row[0] for row in db.execute(
                    "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='requests' AND name NOT LIKE 'sqlite_%'"))
            finally:
                db.close()
            self.assertEqual(kinds, [('dev', 1), ('legacy', 2)])
            self.assertIsNone(leftover, '旧表应被接手后删除')
            self.assertEqual(indexes, ['requests_ip_ts', 'requests_kind_bucket_ts'])

    async def test_a_half_finished_migration_is_completed_instead_of_left_behind(self):
        """建表的 DDL 会立刻落盘、不跟事务回滚：中断后留下的旧表必须被接手，不能放着新表空转。"""
        with tempfile.TemporaryDirectory() as directory:
            path = directory + '/limits.sqlite'
            db = sqlite3.connect(path)
            # 上一次迁移跑到一半的样子：新表已建好（空的），旧表连同它的索引还在旁边。
            db.execute('CREATE TABLE requests (kind TEXT NOT NULL, bucket TEXT NOT NULL, ip_bucket TEXT, ts REAL NOT NULL)')
            db.execute('CREATE INDEX requests_kind_bucket_ts ON requests(kind, bucket, ts)')
            db.execute('CREATE TABLE requests_legacy (ip TEXT NOT NULL, ts REAL NOT NULL)')
            db.execute('CREATE INDEX requests_ts ON requests_legacy(ts)')
            db.execute('CREATE INDEX requests_ip_ts ON requests_legacy(ip, ts)')
            now = time.time()
            db.executemany('INSERT INTO requests_legacy(ip, ts) VALUES (?, ?)', [('legacy-hash', now - 10 - i) for i in range(2)])
            db.commit()
            db.close()
            middleware = self._chat_app(self._config(directory, CHAT_DAILY_LIMIT=3, CHAT_ANON_DEVICE_LIMIT=20))
            headers = {'x-marcus-internal-token': TOKEN, 'x-marcus-client-ip': '203.0.113.31'}
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=middleware), base_url='http://test') as client:
                self.assertEqual((await client.post('/api/chat/', headers=headers, json=BODY)).status_code, 200)
                self.assertEqual((await client.post('/api/chat/', headers=headers, json=BODY)).status_code, 429)
            db = sqlite3.connect(path)
            try:
                kinds = db.execute('SELECT kind, count(*) FROM requests GROUP BY kind ORDER BY kind').fetchall()
                leftover = db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='requests_legacy'").fetchone()
            finally:
                db.close()
            self.assertEqual(kinds, [('dev', 1), ('legacy', 2)], '旧行要被接手，不能留在旧表里')
            self.assertIsNone(leftover)

    async def test_rejected_attempts_are_counted_and_cool_down_grows(self):
        """被拒的尝试也要计入：否则「一直被拒还一直打」的人永远不受惩罚。

        这是本项目原来唯一缺的一层：`requests` 表只在放行后 INSERT，所以额度用完后
        再怎么打都不涨计数。现在连续用尽令牌会进冷却，且冷却按次数翻倍。
        """
        with tempfile.TemporaryDirectory() as directory:
            middleware = self._chat_app(self._config(
                directory, CHAT_ANON_DEVICE_LIMIT=100, CHAT_DAILY_LIMIT=100,
                CHAT_ATTEMPT_BURST=2, CHAT_ATTEMPT_REFILL_SECONDS=600.0, CHAT_ABUSE_COOLDOWN_SECONDS=30.0))
            headers = {'x-marcus-internal-token': TOKEN, 'x-marcus-client-ip': '203.0.113.77', 'x-marcus-device': 'a' * 48}
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=middleware), base_url='http://test') as client:
                for _ in range(2):
                    self.assertEqual((await client.post('/api/chat/', headers=headers, json=BODY)).status_code, 200)
                blocked = await client.post('/api/chat/', headers=headers, json=BODY)
                self.assertEqual(blocked.status_code, 429)
                self.assertIn('冷却', blocked.json()['detail'])
                # 冷却期内即使额度还有，也一样被拒：惩罚落在打的人身上，而不是等额度耗尽才生效。
                self.assertEqual((await client.post('/api/chat/', headers=headers, json=BODY)).status_code, 429)
                # 另一个人不受影响：闸门是按身份算的。
                other = {**headers, 'x-marcus-client-ip': '203.0.113.78'}
                self.assertEqual((await client.post('/api/chat/', headers=other, json=BODY)).status_code, 200)
            db = sqlite3.connect(directory + '/limits.sqlite')
            try:
                self.assertEqual(db.execute('SELECT count(*) FROM requests').fetchone()[0], 3, '被拒的尝试不写库')
            finally:
                db.close()

    async def test_the_global_bucket_sheds_a_flood_of_rotating_identities(self):
        """换身份（换 IP）的洪水由全站桶接住：单身份桶对它无能为力。"""
        with tempfile.TemporaryDirectory() as directory:
            middleware = self._chat_app(self._config(
                directory, CHAT_ANON_DEVICE_LIMIT=100, CHAT_DAILY_LIMIT=100,
                CHAT_GLOBAL_ATTEMPT_BURST=3, CHAT_GLOBAL_ATTEMPTS_PER_SECOND=0.001))
            def headers(index):
                return {'x-marcus-internal-token': TOKEN, 'x-marcus-client-ip': f'198.51.100.{index}', 'x-marcus-device': 'a' * 48}
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=middleware), base_url='http://test') as client:
                for index in range(1, 4):
                    self.assertEqual((await client.post('/api/chat/', headers=headers(index), json=BODY)).status_code, 200)
                shed = await client.post('/api/chat/', headers=headers(4), json=BODY)
                self.assertEqual(shed.status_code, 429)
                self.assertEqual(shed.json()['detail'], 'Agent 当前请求较多，请稍后再试。')

    async def test_malformed_bodies_are_rejected_before_any_quota_is_spent(self):
        """415 / 413 / 422 前置：畸形请求不白扣用户额度，也不产生任何库写入。"""
        with tempfile.TemporaryDirectory() as directory:
            # 试次闸门放宽：这一条量的是「body 校验与配额的前后关系」，不是闸门本身。
            middleware = self._chat_app(self._config(
                directory, CHAT_DAILY_LIMIT=1, CHAT_ANON_DEVICE_LIMIT=5, CHAT_ATTEMPT_BURST=20))
            headers = {'x-marcus-internal-token': TOKEN, 'x-marcus-client-ip': '203.0.113.44', 'x-marcus-device': 'a' * 48}
            json_headers = {**headers, 'content-type': 'application/json'}
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=middleware), base_url='http://test') as client:
                self.assertEqual((await client.post('/api/chat/', headers=headers, content=b'hello')).status_code, 415)
                self.assertEqual((await client.post('/api/chat/', headers=json_headers, content=b'x' * 65537)).status_code, 413)
                self.assertEqual((await client.post('/api/chat/', headers=json_headers, content=b'{"messages":[]}')).status_code, 422)
                self.assertEqual((await client.post('/api/chat/', headers=headers,
                                                    json={'messages': [{'role': 'user', 'content': '   '}]})).status_code, 422)
                self.assertEqual((await client.post('/api/chat/', headers=headers,
                                                    json={'messages': [{'role': 'user', 'content': '字' * 6001}]})).status_code, 422)
                # 全站硬顶是 1：如果上面那些畸形请求扣过额度，这一发就不会是 200。
                self.assertEqual((await client.post('/api/chat/', headers=headers, json=BODY)).status_code, 200)
                self.assertEqual((await client.post('/api/chat/', headers=headers, json=BODY)).status_code, 429)
            db = sqlite3.connect(directory + '/limits.sqlite')
            try:
                self.assertEqual(db.execute('SELECT count(*) FROM requests').fetchone()[0], 1, '畸形请求不该写库')
            finally:
                db.close()

    async def test_the_validated_body_is_replayed_to_the_route_that_parses_it(self):
        """中间件读完 body 必须原样交回路由：否则路由会去等一个永远不来的请求。

        用真实会解析 pydantic 的路由，而不是返回常量的桩：这条测的是请求体流转本身。
        """
        with tempfile.TemporaryDirectory() as directory:
            inner = FastAPI()
            seen = []

            @inner.post('/api/chat/')
            async def chat(request: ChatRequest):
                seen.append(request.messages[-1].content)
                return {'content': request.messages[-1].content, 'count': len(request.messages)}

            middleware = ChatProtectionMiddleware(inner, self._config(directory, CHAT_ANON_DEVICE_LIMIT=10))
            headers = {'x-marcus-internal-token': TOKEN, 'x-marcus-client-ip': '203.0.113.90', 'x-marcus-device': 'a' * 48}
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=middleware), base_url='http://test') as client:
                response = await client.post('/api/chat/', headers=headers, json={'messages': [
                    {'role': 'user', 'content': '第一问'}, {'role': 'assistant', 'content': '第一答'},
                    {'role': 'user', 'content': '第二问'},
                ]})
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json(), {'content': '第二问', 'count': 3})
                self.assertEqual(seen, ['第二问'])
                # 畸形 body 在中间件就结束了：路由一次都不该被调用，也就不会白扣额度。
                self.assertEqual((await client.post('/api/chat/', headers=headers,
                                                    json={'messages': [{'role': 'user', 'content': ''}]})).status_code, 422)
                self.assertEqual(seen, ['第二问'])

    async def test_cancelling_during_the_quota_decision_cannot_leak_the_slot(self):
        """取消不能让并发槽位永久漏在表里。

        判定跑在线程里，取消对它无效：如果取消那一刻就把 `active[key]` 摘掉，线程稍后写回的
        `active[key] = 1` 就再也没人摘——每一个这样的请求会永久占住一个名额，
        几个之后整站都发不出消息。所以摘除必须等判定落地。
        """
        with tempfile.TemporaryDirectory() as directory:
            middleware = self._chat_app(self._config(directory, CHAT_ANON_DEVICE_LIMIT=5, CHAT_DAILY_LIMIT=50))
            entered, release, landed = threading.Event(), threading.Event(), threading.Event()
            original = middleware._decide_chat

            def slow_decision(*args, **kwargs):
                entered.set()
                release.wait(5)
                result = original(*args, **kwargs)
                landed.set()
                return result

            middleware._decide_chat = slow_decision
            headers = {'x-marcus-internal-token': TOKEN, 'x-marcus-client-ip': '203.0.113.61', 'x-marcus-device': 'a' * 48}
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=middleware), base_url='http://test') as client:
                request = asyncio.create_task(client.post('/api/chat/', headers=headers, json=BODY))
                self.assertTrue(await asyncio.to_thread(entered.wait, 5), '请求应当已经进入额度判定')
                request.cancel()
                with self.assertRaises(asyncio.CancelledError):
                    await request
                self.assertEqual(middleware.active, {}, '还没判定完就不该有占位')
                release.set()
                self.assertTrue(await asyncio.to_thread(landed.wait, 5), '判定应当已经落地')
                # 落地之后必须有人摘掉槽位：漏掉的话这里永远不会空。
                for _ in range(100):
                    if not middleware.active:
                        break
                    await asyncio.sleep(0.05)
            self.assertEqual(middleware.active, {}, '取消过的请求不能把并发名额留在表里')
            # 后续请求照常能用：名额没被卡死。
            middleware._decide_chat = original
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=middleware), base_url='http://test') as client:
                self.assertEqual((await client.post('/api/chat/', headers=headers, json=BODY)).status_code, 200)
            self.assertEqual(middleware.active, {})

    async def test_non_post_requests_never_touch_the_quota_store(self):
        """只有路由会接受的请求才该扣额度：非 POST 交给路由回 405，一行都不许写。

        不这么做的话，带合法 body 的 GET/PUT/DELETE 会先扣一行再吃 405，而它扣的是全站
        每日信封——足够把所有人当天的额度耗光，而请求本身什么也没做。
        """
        with tempfile.TemporaryDirectory() as directory:
            path = directory + '/limits.sqlite'
            middleware = self._chat_app(self._config(directory, CHAT_DAILY_LIMIT=5, CHAT_ANON_DEVICE_LIMIT=5))
            headers = {'x-marcus-internal-token': TOKEN, 'x-marcus-client-ip': '203.0.113.70',
                       'x-marcus-device': 'a' * 48, 'content-type': 'application/json'}
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=middleware), base_url='http://test') as client:
                for method in ('GET', 'PUT', 'DELETE', 'PATCH'):
                    response = await client.request(method, '/api/chat/', headers=headers, json=BODY)
                    self.assertEqual(response.status_code, 405, method)
                # 没有 POST 过，配额库连表都不该建出来。
                db = sqlite3.connect(path)
                try:
                    created = db.execute(
                        "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='requests'").fetchone()[0]
                finally:
                    db.close()
                self.assertEqual(created, 0, '非 POST 请求不该让配额库建表')
                # 正向控制：POST 照常扣一行，表也随之出现。
                self.assertEqual((await client.post('/api/chat/', headers=headers, json=BODY)).status_code, 200)
            db = sqlite3.connect(path)
            try:
                self.assertEqual(db.execute('SELECT count(*) FROM requests').fetchone()[0], 1)
            finally:
                db.close()

    @staticmethod
    def _held_app(hold: float):
        """一个会真的占住并发槽位的路由：瞬间返回的路由量不出并发上限。"""
        inner = FastAPI()
        state = {'now': 0, 'peak': 0}

        @inner.post('/api/chat/')
        async def chat():
            state['now'] += 1
            state['peak'] = max(state['peak'], state['now'])
            try:
                await asyncio.sleep(hold)
                return {'ok': True}
            finally:
                state['now'] -= 1

        return inner, state

    async def test_a_burst_of_ten_from_one_device_becomes_exactly_one_paid_turn(self):
        """同一台设备瞬间打 10 条：只放 1 发、只扣 1 行，其余在扣额度之前就结束。

        数字是算得出来的：试次闸门突发 4 → 4 发过闸、6 发直接进冷却；
        过闸的 4 发里只有 1 发拿到这一身份的名额，另 3 发 busy。所以是 1 / 3 / 6。
        """
        with tempfile.TemporaryDirectory() as directory:
            inner, state = self._held_app(0.2)
            middleware = ChatProtectionMiddleware(inner, self._config(
                directory, CHAT_ANON_DEVICE_LIMIT=20, CHAT_DAILY_LIMIT=800))
            headers = {'x-marcus-internal-token': TOKEN, 'x-marcus-client-ip': '203.0.113.80',
                       'x-marcus-device': 'a' * 48}
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=middleware), base_url='http://test') as client:
                responses = await asyncio.gather(*[
                    client.post('/api/chat/', headers=headers, json=BODY) for _ in range(10)])
            codes = Counter(response.status_code for response in responses)
            self.assertEqual(codes[200], 1, '一个身份同一时刻只能有一发在飞')
            self.assertEqual(codes[429], 9)
            self.assertEqual(state['peak'], 1)
            reasons = Counter(response.json()['detail'] for response in responses if response.status_code == 429)
            self.assertEqual(reasons['当前网络短时间请求过多，已暂时冷却，请等待后再试。'], 6)
            self.assertEqual(reasons['Agent 正在回复，请稍后再发消息。'], 3)
            db = sqlite3.connect(directory + '/limits.sqlite')
            try:
                self.assertEqual(db.execute('SELECT count(*) FROM requests').fetchone()[0], 1, '只该扣放行的那一行')
            finally:
                db.close()
            self.assertEqual(middleware.active, {})

    async def test_a_distributed_burst_is_capped_by_concurrency_without_extra_writes(self):
        """十个不同出口同时打：并发峰值抬不过 3，被拒的 7 发一行都不写。

        这是全站信封真正的护栏：洪水可以来自很多个 IP，但同一时刻只有 3 轮在烧钱。
        """
        with tempfile.TemporaryDirectory() as directory:
            inner, state = self._held_app(0.3)
            middleware = ChatProtectionMiddleware(inner, self._config(
                directory, CHAT_ANON_DEVICE_LIMIT=20, CHAT_DAILY_LIMIT=800))
            def headers(index):
                return {'x-marcus-internal-token': TOKEN, 'x-marcus-client-ip': f'198.51.100.{index}',
                        'x-marcus-device': f'{index:048d}'}
            ticks = 0
            async def ticker():
                nonlocal ticks
                while True:
                    ticks += 1
                    await asyncio.sleep(0.01)
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=middleware), base_url='http://test') as client:
                beat = asyncio.create_task(ticker())
                try:
                    responses = await asyncio.gather(*[
                        client.post('/api/chat/', headers=headers(index), json=BODY) for index in range(10)])
                finally:
                    beat.cancel()
            self.assertEqual(state['peak'], 3, '同时占槽不许超过 CHAT_MAX_CONCURRENT')
            self.assertEqual(Counter(response.status_code for response in responses)[200], 3)
            self.assertTrue(ticks > 5, f'洪水期间事件循环必须还在推进，实际跳了 {ticks} 次')
            db = sqlite3.connect(directory + '/limits.sqlite')
            try:
                self.assertEqual(db.execute('SELECT count(*) FROM requests').fetchone()[0], 3)
            finally:
                db.close()
            self.assertEqual(middleware.active, {})
