"""访客登录：密码哈希、文件/数据库两种来源、失败锁定与接口行为。"""
import argparse
import contextlib
import hashlib
import hmac
import io
import json
import re
import tempfile
import time
import unittest
from pathlib import Path
from unittest.mock import patch

import httpx

from app.config import settings
from app.main import app
from app.services import visitor_accounts
from app.services.visitor_accounts import (
    VisitorAccountsUnavailable,
    authenticate,
    hash_password,
    normalize_username,
    parse_app_ids,
    parse_accounts,
    verify_password,
)
from app.services.visitor_throttle import LoginFailureStore

TOKEN = "test-internal-token-" + "x" * 40
PASSWORD = "correct horse battery staple"
NONCE = "a" * 48
PROOF_PATTERN = r"^v1\.%s\.\d{10}\.[a-f0-9]{64}$" % NONCE


def document(**account):
    entry = {"username": "beibei", "name": "贝贝", "password_hash": hash_password(PASSWORD), "apps": ["our-space"]}
    entry.update(account)
    return {"visitors": [entry]}


class PasswordTests(unittest.TestCase):
    def test_hashes_are_salted_and_verified_in_constant_shape(self):
        first, second = hash_password(PASSWORD), hash_password(PASSWORD)
        self.assertNotEqual(first, second)
        self.assertTrue(verify_password(PASSWORD, first))
        self.assertTrue(verify_password(PASSWORD, second))
        self.assertFalse(verify_password(PASSWORD + " ", first))
        self.assertFalse(verify_password("", first))

    def test_malformed_stored_hashes_never_verify(self):
        for stored in ["", "plain", "pbkdf2_sha256$600000$no-base64$also-no", "md5$1$a$b",
                       "pbkdf2_sha256$10$YWJj$" + "A" * 44, None, 5, hash_password(PASSWORD)[:-1]]:
            self.assertFalse(verify_password(PASSWORD, stored), repr(stored))

    def test_grant_lists_are_validated_shapes(self):
        self.assertEqual(parse_app_ids(None), ())
        self.assertEqual(parse_app_ids("a,b"), ("a", "b"))
        self.assertEqual(parse_app_ids(["a", "b"]), ("a", "b"))
        for broken in [5, {}, ["a", 5], ["a b"], ["A"]]:
            with self.subTest(value=broken):
                with self.assertRaises(VisitorAccountsUnavailable):
                    parse_app_ids(broken)

    def test_usernames_normalise_width_case_and_whitespace(self):
        self.assertEqual(normalize_username("  Beibei  "), "beibei")
        self.assertEqual(normalize_username("Ｂｅｉｂｅｉ"), "beibei")


class StoreValidationTests(unittest.TestCase):
    def test_account_documents_are_fully_validated(self):
        self.assertEqual(list(parse_accounts(document())), ["beibei"])
        for broken in [
            {}, {"visitors": {}}, {"visitors": [None]},
            document(password_hash="plaintext"),
            document(username=""),
            document(username="x" * 65),
            document(name="   "),
            document(nickname="extra"),
            document(apps=5),
            document(apps={"our-space": True}),
            document(apps=["Our Space"]),
            document(apps=[f"app-{index}" for index in range(40)]),
            document(apps=["../etc/passwd"]),
            document(disabled="yes"),
            {"visitors": [dict(document()["visitors"][0], name="贝贝")] * 2},
            {"visitors": [document()["visitors"][0], dict(document()["visitors"][0], username="BEIBEI")]},
        ]:
            with self.subTest(document=broken):
                with self.assertRaises(VisitorAccountsUnavailable):
                    parse_accounts(broken)

    def test_grants_accept_json_lists_and_database_csv(self):
        # File entries may carry a list; the database column stores the same ids comma separated.
        self.assertEqual(parse_accounts(document())['beibei'].apps, ("our-space",))
        self.assertEqual(parse_accounts(document(apps="guest-book,our-space"))['beibei'].apps, ("guest-book", "our-space"))
        self.assertEqual(parse_accounts(document(apps="guest-book, guest-book"))['beibei'].apps, ("guest-book",))
        self.assertEqual(parse_accounts(document(apps=[]))['beibei'].apps, ())
        self.assertEqual(parse_accounts(document(apps=None))['beibei'].apps, ())

    def test_disabled_accounts_load_but_never_authenticate(self):
        parsed = parse_accounts(document(disabled=True))
        self.assertEqual(list(parsed), ["beibei"])
        self.assertTrue(parsed["beibei"].disabled)


class AuthenticationTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / "visitors.json"
        self.path.write_text(json.dumps(document()), encoding="utf-8")

    async def test_only_the_exact_password_authenticates(self):
        with patch.object(settings, "VISITOR_ACCOUNTS_PATH", str(self.path)):
            self.assertEqual((await authenticate("beibei", PASSWORD)).name, "贝贝")
            account = await authenticate("BEIBEI", PASSWORD)
            self.assertEqual(account.name, "贝贝")
            self.assertEqual(account.apps, ("our-space",))
            self.assertIsNone(await authenticate("nobody", PASSWORD))
            self.assertIsNone(await authenticate("beibei", ""))
            self.assertIsNone(await authenticate("beibei", PASSWORD + "x"))
            self.assertIsNone(await authenticate("nobody", PASSWORD))
            self.assertIsNone(await authenticate("beibei", ""))
            self.assertIsNone(await authenticate("x" * 65, PASSWORD))
            self.assertIsNone(await authenticate("beibei", "y" * 201))

    async def test_missing_or_disabled_only_files_fail_closed(self):
        with tempfile.TemporaryDirectory() as directory:
            disabled_only = Path(directory) / "empty.json"
            disabled_only.write_text(json.dumps({"visitors": [
                {"username": "a", "name": "A", "password_hash": hash_password(PASSWORD), "disabled": True},
            ]}), encoding="utf-8")
            for path in [Path(directory) / "absent.json", Path(directory) / "invalid.json", disabled_only]:
                if path.name == "invalid.json":
                    path.write_text("{not json", encoding="utf-8")
                with self.subTest(path=path.name), patch.object(settings, "VISITOR_ACCOUNTS_PATH", str(path)):
                    with self.assertRaises(VisitorAccountsUnavailable):
                        await authenticate("beibei", PASSWORD)

    async def test_database_outage_never_falls_back_to_the_file(self):
        async def unavailable():
            raise VisitorAccountsUnavailable("访客名单暂时不可用，请稍后再试。")

        with patch.object(settings, "VISITOR_ACCOUNTS_PATH", str(self.path)), \
             patch.object(settings, "DATABASE_ENABLED", True), \
             patch.object(visitor_accounts, "_database_accounts", unavailable):
            with self.assertRaises(VisitorAccountsUnavailable):
                await authenticate("beibei", PASSWORD)


class FailureStoreTests(unittest.TestCase):
    def test_lockout_counts_per_username_inside_the_window(self):
        with tempfile.TemporaryDirectory() as directory:
            store = LoginFailureStore(str(Path(directory) / "limits.sqlite"), max_failures=3, window_seconds=60)
            self.assertFalse(store.is_locked("beibei"))
            for _ in range(2):
                store.record_failure("beibei")
            self.assertFalse(store.is_locked("beibei"))
            self.assertEqual(store.retry_after("beibei"), 0)
            store.record_failure("beibei")
            self.assertTrue(store.is_locked("beibei"))
            self.assertGreater(store.retry_after("beibei"), 0)
            self.assertFalse(store.is_locked("other"))
            store.clear("beibei")
            self.assertFalse(store.is_locked("beibei"))


class VisitorRouteTests(unittest.IsolatedAsyncioTestCase):
    async def post(self, client, payload, nonce=NONCE):
        headers = {"x-marcus-session-id": nonce} if nonce is not None else {}
        return await client.post("/api/visitor/login", json=payload, headers=headers)

    async def test_login_returns_only_a_name_and_a_short_lived_proof(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "visitors.json"
            path.write_text(json.dumps(document()), encoding="utf-8")
            with patch.object(settings, "VISITOR_ACCOUNTS_PATH", str(path)), \
                 patch.object(settings, "CHAT_LIMIT_DB", str(Path(directory) / "limits.sqlite")), \
                 patch.object(settings, "INTERNAL_API_TOKEN", TOKEN):
                async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
                    reply = await self.post(client, {"username": "beibei", "password": PASSWORD})
                    self.assertEqual(reply.status_code, 200)
                    body = reply.json()
                    self.assertEqual(set(body), {"ok", "name", "username", "apps", "proof"})
                    self.assertEqual(body["ok"], True)
                    self.assertEqual(body["name"], "贝贝")
                    self.assertEqual(body["username"], "beibei")
                    self.assertEqual(body["apps"], ["our-space"])
                    self.assertNotIn(PASSWORD, reply.text)
                    match = re.fullmatch(PROOF_PATTERN, body["proof"])
                    self.assertIsNotNone(match)
                    expires = int(body["proof"].split(".")[2])
                    self.assertLessEqual(abs(expires - int(time.time())), 120)
                    signature = hmac.new(TOKEN.encode(), f"visitor-unlock:v1.{NONCE}.{expires}".encode(), hashlib.sha256).hexdigest()
                    self.assertEqual(body["proof"], f"v1.{NONCE}.{expires}.{signature}")

    async def test_wrong_credentials_are_generic_and_lockout_follows(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "visitors.json"
            path.write_text(json.dumps(document()), encoding="utf-8")
            with patch.object(settings, "VISITOR_ACCOUNTS_PATH", str(path)), \
                 patch.object(settings, "CHAT_LIMIT_DB", str(Path(directory) / "limits.sqlite")), \
                 patch.object(settings, "INTERNAL_API_TOKEN", TOKEN), \
                 patch.object(settings, "VISITOR_MAX_FAILURES", 3), \
                 patch.object(settings, "VISITOR_FAILURE_WINDOW_SECONDS", 900):
                async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
                    for password in ["wrong", "still-wrong", "wrong-again"]:
                        reply = await self.post(client, {"username": "beibei", "password": password})
                        self.assertEqual(reply.status_code, 401)
                        self.assertEqual(reply.json()["detail"], "访客名或密码不正确。")
                    # 未知账号的失败不牵连其它账号；被锁的账号即使密码正确也会被拒。
                    self.assertEqual((await self.post(client, {"username": "nobody", "password": PASSWORD})).status_code, 401)
                    locked = await self.post(client, {"username": "beibei", "password": PASSWORD})
                    self.assertEqual(locked.status_code, 429)
                    self.assertIn("Retry-After", locked.headers)
                    self.assertNotIn("访客名或密码不正确", locked.json()["detail"])

    async def test_unconfigured_store_and_missing_session_fail_closed(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(settings, "VISITOR_ACCOUNTS_PATH", str(Path(directory) / "absent.json")), \
                 patch.object(settings, "CHAT_LIMIT_DB", str(Path(directory) / "limits.sqlite")), \
                 patch.object(settings, "INTERNAL_API_TOKEN", TOKEN):
                async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
                    reply = await self.post(client, {"username": "beibei", "password": PASSWORD})
                    self.assertEqual(reply.status_code, 503)
            path = Path(directory) / "visitors.json"
            path.write_text(json.dumps(document()), encoding="utf-8")
            with patch.object(settings, "VISITOR_ACCOUNTS_PATH", str(path)), \
                 patch.object(settings, "CHAT_LIMIT_DB", str(Path(directory) / "second-limits.sqlite")), \
                 patch.object(settings, "INTERNAL_API_TOKEN", TOKEN):
                async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
                    # Without a valid session nonce no browser-bound proof can be minted.
                    self.assertEqual((await self.post(client, {"username": "beibei", "password": PASSWORD}, nonce=None)).status_code, 503)
                    self.assertEqual((await self.post(client, {"username": "beibei", "password": PASSWORD}, nonce="short")).status_code, 503)

    async def test_short_secrets_and_extra_fields_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "visitors.json"
            path.write_text(json.dumps(document()), encoding="utf-8")
            with patch.object(settings, "VISITOR_ACCOUNTS_PATH", str(path)), \
                 patch.object(settings, "CHAT_LIMIT_DB", str(Path(directory) / "limits.sqlite")), \
                 patch.object(settings, "INTERNAL_API_TOKEN", "too-short"):
                async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
                    self.assertEqual((await self.post(client, {"username": "beibei", "password": PASSWORD})).status_code, 503)
            with patch.object(settings, "VISITOR_ACCOUNTS_PATH", str(path)), \
                 patch.object(settings, "CHAT_LIMIT_DB", str(Path(directory) / "second-limits.sqlite")), \
                 patch.object(settings, "INTERNAL_API_TOKEN", TOKEN):
                async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
                    for payload in [{"username": "beibei", "password": PASSWORD, "name": "贝贝"},
                                    {"username": "beibei", "password": PASSWORD, "admin": True},
                                    {"password": PASSWORD}, {"username": "beibei"},
                                    {"username": "beibei", "password": "p" * 201},
                                    {"username": "u" * 65, "password": PASSWORD}]:
                        with self.subTest(payload=payload):
                            self.assertEqual((await self.post(client, payload)).status_code, 422)


class DatabaseUrlTests(unittest.TestCase):
    def test_sync_urls_map_to_their_async_drivers(self):
        from app.database import normalize_database_url

        for url, expected in [
            ("mysql://user:pw@host/db", "mysql+aiomysql://user:pw@host/db"),
            ("mysql+pymysql://user:pw@host/db", "mysql+aiomysql://user:pw@host/db"),
            ("postgresql://user:pw@host/db", "postgresql+asyncpg://user:pw@host/db"),
            ("postgres://user:pw@host/db", "postgresql+asyncpg://user:pw@host/db"),
            ("mysql+aiomysql://user:pw@host/db", "mysql+aiomysql://user:pw@host/db"),
            ("sqlite+aiosqlite:///tmp/x.db", "sqlite+aiosqlite:///tmp/x.db"),
        ]:
            with self.subTest(url=url):
                self.assertEqual(normalize_database_url(url), expected)


class FakeAccountRows:
    """SQLAlchemy 会话的替身：不用真数据库就能走完名单读取。"""

    class Row:
        def __init__(self, **values):
            self.__dict__.update(values)

    class Result:
        def __init__(self, rows): self.rows = rows

        def scalars(self): return self

        def all(self): return self.rows

    class Session:
        def __init__(self, rows): self.rows = rows

        async def __aenter__(self): return self

        async def __aexit__(self, *exception): return False

        async def execute(self, statement): return FakeAccountRows.Result(self.rows)

    @staticmethod
    def sessionmaker(rows):
        return lambda: FakeAccountRows.Session(rows)


class DatabaseStoreTests(unittest.IsolatedAsyncioTestCase):
    """数据库名单：只开 DATABASE_ENABLED、没有本地文件时，名单只来自数据库。"""

    def setUp(self):
        # 别让开发机上那份真实 JSON 混进来：文件与数据库的合并另由 MergedStoreTests 覆盖。
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        patcher = patch.object(settings, "VISITOR_ACCOUNTS_PATH", str(Path(self.temp.name) / "absent.json"))
        patcher.start()
        self.addCleanup(patcher.stop)

    async def test_rows_authenticate_and_disabled_or_broken_rows_do_not(self):
        rows = [
            FakeAccountRows.Row(username="Beibei", display_name="贝贝", password_hash=hash_password(PASSWORD), apps="our-space,guest-book", disabled=False),
            FakeAccountRows.Row(username="stopped", display_name="停用", password_hash=hash_password(PASSWORD), apps="", disabled=True),
            FakeAccountRows.Row(username="broken", display_name="坏哈希", password_hash="plaintext", apps="", disabled=False),
            FakeAccountRows.Row(username="legacy", display_name="旧表", password_hash=hash_password(PASSWORD), disabled=False),
        ]
        with patch.object(settings, "DATABASE_ENABLED", True), \
             patch("app.database.get_sessionmaker", lambda: FakeAccountRows.sessionmaker(rows)):
            account = await authenticate("BEIBEI", PASSWORD)
            self.assertEqual(account.name, "贝贝")
            self.assertEqual(account.apps, ("our-space", "guest-book"))
            # 旧表没有 apps 列时按「没有可用应用」处理，不会因此拒绝登录。
            self.assertEqual((await authenticate("legacy", PASSWORD)).apps, ())
            self.assertIsNone(await authenticate("beibei", PASSWORD + "x"))
            self.assertIsNone(await authenticate("stopped", PASSWORD))
            self.assertIsNone(await authenticate("broken", PASSWORD))
            self.assertIsNone(await authenticate("missing", PASSWORD))

    async def test_database_errors_close_the_gate_instead_of_falling_back(self):
        def broken_sessionmaker():
            raise RuntimeError("connection refused")

        with patch.object(settings, "DATABASE_ENABLED", True), \
             patch("app.database.get_sessionmaker", broken_sessionmaker):
            with self.assertRaises(VisitorAccountsUnavailable):
                await authenticate("beibei", PASSWORD)


class MergedStoreTests(unittest.IsolatedAsyncioTestCase):
    """文件与数据库同时存在时两份都生效；同名则拒绝，而不是悄悄取其一。"""

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / "visitors.json"
        self.rows = []
        for patcher in (
            patch.object(settings, "VISITOR_ACCOUNTS_PATH", str(self.path)),
            patch.object(settings, "DATABASE_ENABLED", True),
            patch("app.database.get_sessionmaker", lambda: FakeAccountRows.sessionmaker(self.rows)),
        ):
            patcher.start()
            self.addCleanup(patcher.stop)

    def write_file(self, **account):
        self.path.write_text(json.dumps(document(**account)), encoding="utf-8")

    async def test_accounts_from_the_file_and_the_database_both_work(self):
        self.write_file(username="fromfile", name="文件")
        self.rows = [FakeAccountRows.Row(username="fromdb", display_name="数据库", password_hash=hash_password(PASSWORD), apps="guest-book", disabled=False)]
        # 原来 JSON 里的账户照常可用……
        self.assertEqual((await authenticate("fromfile", PASSWORD)).name, "文件")
        # ……数据库里的新账户同时生效，且拿得到自己被授权的应用。
        account = await authenticate("FROMDB", PASSWORD)
        self.assertEqual(account.name, "数据库")
        self.assertEqual(account.apps, ("guest-book",))

    async def test_a_name_in_both_sources_is_refused_rather_than_resolved(self):
        """两份里出现同一个名字时，用哪一份的密码是必须拒绝回答的问题。"""
        self.write_file(username="Beibei")
        self.rows = [FakeAccountRows.Row(username="BEIBEI", display_name="数据库版", password_hash=hash_password(PASSWORD), apps="", disabled=False)]
        with self.assertRaises(VisitorAccountsUnavailable):
            await authenticate("beibei", PASSWORD)

    async def test_a_disabled_row_does_not_touch_the_file_account_of_another_name(self):
        self.write_file(username="fromfile", name="文件")
        self.rows = [FakeAccountRows.Row(username="stopped", display_name="停用", password_hash=hash_password(PASSWORD), apps="", disabled=True)]
        self.assertEqual((await authenticate("fromfile", PASSWORD)).name, "文件")
        self.assertIsNone(await authenticate("stopped", PASSWORD))

    async def test_an_absent_file_means_database_only(self):
        self.rows = [FakeAccountRows.Row(username="fromdb", display_name="数据库", password_hash=hash_password(PASSWORD), apps="", disabled=False)]
        self.assertEqual((await authenticate("fromdb", PASSWORD)).name, "数据库")
        self.assertIsNone(await authenticate("beibei", PASSWORD))


class AccountScriptTests(unittest.TestCase):
    """scripts/add-visitor.py 与后端必须用同一套哈希与规范化。"""

    @staticmethod
    def script():
        import importlib.util

        path = Path(__file__).resolve().parents[2] / "scripts" / "add-visitor.py"
        spec = importlib.util.spec_from_file_location("add_visitor_script", path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module

    def test_script_hashes_verify_with_the_backend_and_normalise_identically(self):
        module = self.script()
        self.assertEqual(module.PBKDF2_ITERATIONS, visitor_accounts.PBKDF2_ITERATIONS)
        self.assertEqual(module.PBKDF2_SCHEME, visitor_accounts.PBKDF2_SCHEME)
        for username in ["  Beibei ", "Ｂｅｉｂｅｉ", "MARCUS", "贝贝"]:
            self.assertEqual(module.normalize_username(username), normalize_username(username))
        stored = module.hash_password(PASSWORD)
        self.assertTrue(verify_password(PASSWORD, stored))
        self.assertFalse(verify_password("other", stored))

    def test_script_output_is_readable_by_the_backend(self):
        import contextlib
        import io

        module = self.script()
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "visitors.json"
            data = module.load(path)
            data["visitors"].append({
                "username": module.normalize_username("Beibei"),
                "name": "贝贝",
                "password_hash": module.hash_password(PASSWORD),
            })
            with contextlib.redirect_stdout(io.StringIO()):
                module.save(path, data)
            accounts = visitor_accounts.load_file_accounts(str(path))
            self.assertEqual(list(accounts), ["beibei"])
            self.assertEqual(accounts["beibei"].name, "贝贝")
            self.assertTrue(verify_password(PASSWORD, accounts["beibei"].password_hash))

    def test_database_mode_parses_urls_and_builds_the_right_upsert(self):
        """--db 直接把账号写进数据库：连接串解析与两种方言的 upsert 都要对。"""
        module = self.script()
        for url, expected in (
            ("mysql://Terminal:pw@127.0.0.1:3306/terminal", ("mysql", "127.0.0.1", 3306, "terminal", "pw")),
            ("mysql+pymysql://u:p%40ss@db.example:3307/marcus_app", ("mysql", "db.example", 3307, "marcus_app", "p@ss")),
            ("postgresql://postgres:pw@localhost:5432/marcus_app", ("postgres", "localhost", 5432, "marcus_app", "pw")),
        ):
            with self.subTest(url=url):
                target = module.parse_db_url(url)
                self.assertEqual(
                    (target["kind"], target["host"], target["port"], target["database"], target["password"]), expected)
        for url in ("sqlite:///tmp/x.db", "mysql://user:pw@/nodb", "mysql+pymysql:///db"):
            with self.subTest(url=url), self.assertRaises(SystemExit):
                module.parse_db_url(url)
        # 两种方言都得走密码哈希列，数据库里没有、也不能有明文列。
        self.assertIn("ON DUPLICATE KEY UPDATE", module.upsert_sql("mysql"))
        self.assertIn("ON CONFLICT (username) DO UPDATE", module.upsert_sql("postgres"))
        for kind in ("mysql", "postgres"):
            statement = module.upsert_sql(kind)
            self.assertIn("password_hash", statement)
            self.assertIn("username", statement)
            self.assertNotIn(" (password,", statement)

    def test_env_reader_ignores_comments_and_missing_files(self):
        module = self.script()
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "backend.env"
            path.write_text(
                "# DATABASE_URL=被注释掉的\nDATABASE_ENABLED=true\nDATABASE_URL=mysql://u@h/db\n",
                encoding="utf-8")
            self.assertEqual(module.read_env_value(path, "DATABASE_URL"), "mysql://u@h/db")
            self.assertEqual(module.read_env_value(path, "DATABASE_ENABLED"), "true")
            self.assertIsNone(module.read_env_value(path, "CHAT_LIMIT_DB"))
            self.assertIsNone(module.read_env_value(Path(directory) / "absent.env", "DATABASE_URL"))

    def test_db_mode_takes_a_typed_password_and_creates_the_account_when_missing(self):
        """不带 --password/--generate 就是交互输入自定义密码；账号还不存在时要顺带建出来。"""
        module = self.script()
        executed: list[tuple[str, tuple]] = []

        class FakeCursor:
            rowcount = 0  # UPDATE 没命中任何行
            row = None  # 账号还不存在

            def execute(self, sql, params=None):
                executed.append((" ".join(sql.split()), params))
                return self

            def fetchone(self): return self.row

            def close(self): pass

        class FakeConnection:
            def cursor(self): return FakeCursor()

            def close(self): pass

        args = argparse.Namespace(
            list=False, remove=False, disable=False, enable=False, name="Leo", apps="our-space",
            username="Leo", password=None, generate=False, ask_password=False,
            db_url="mysql://u:p@h/db", db_env=None)
        output = io.StringIO()
        with patch.object(module, "db_connect", lambda target: FakeConnection()), \
             patch.object(module.getpass, "getpass", lambda prompt="": "my-custom-pw"), \
             contextlib.redirect_stdout(output):
            self.assertEqual(module.run_database(args, "leo"), 0)

        self.assertIn("输入密码即可创建", output.getvalue())
        self.assertEqual([sql.split()[0].upper() for sql, _ in executed][:2], ["SELECT", "INSERT"],
                         "先查现有授权，账号不存在就转入交互式创建")
        insert_sql, insert_params = executed[1]
        self.assertIn("INSERT INTO visitor_accounts", insert_sql)
        self.assertIn("ON DUPLICATE KEY UPDATE", insert_sql)
        self.assertEqual(insert_params[0], "leo")
        self.assertEqual(insert_params[1], "Leo")
        self.assertEqual(insert_params[3], "our-space")
        # 关键在于：落库的是「你刚才输入的那个密码」的哈希，不是明文。
        self.assertTrue(verify_password("my-custom-pw", insert_params[2]))
        self.assertNotIn("my-custom-pw", insert_params[2])

    def test_changing_the_password_keeps_the_name_grants_and_disabled_state(self):
        """改密码只该改密码：显示名、授权、停用状态都要保留（这是文件模式既有的语义）。"""
        module = self.script()
        for row, expected_disabled in ((("Leo", "our-space,files", 0), 0), (("停用的人", "files", 1), 1)):
            with self.subTest(display_name=row[0]):
                executed: list[tuple[str, tuple]] = []

                class FakeCursor:
                    rowcount = 1

                    def execute(self, sql, params=None):
                        executed.append((" ".join(sql.split()), params))
                        return self

                    def fetchone(self): return row

                    def close(self): pass

                class FakeConnection:
                    def cursor(self): return FakeCursor()

                    def close(self): pass

                args = argparse.Namespace(
                    list=False, remove=False, disable=False, enable=False, name=None, apps=None,
                    username="leo", password="brand-new-pw", generate=False, ask_password=False,
                    db_url="mysql://u:p@h/db", db_env=None)
                with patch.object(module, "db_connect", lambda target: FakeConnection()), \
                     contextlib.redirect_stdout(io.StringIO()):
                    self.assertEqual(module.run_database(args, "leo"), 0)

                statement, params = executed[-1]
                self.assertIn("INSERT INTO visitor_accounts", statement)
                self.assertEqual(params[1], row[0], "显示名要保留，不能被用户名顶掉")
                self.assertEqual(params[3], row[1], "原有授权要原样带过去")
                self.assertEqual(params[4], expected_disabled, "停用状态不能被改密码悄悄改掉")
                self.assertTrue(verify_password("brand-new-pw", params[2]))

    def test_ask_password_sets_the_password_and_the_grants_in_one_command(self):
        """账号已存在时，--ask-password 配 --apps 要能一次做完；只给 --apps 则只改授权。"""
        module = self.script()

        def run(**overrides):
            executed: list[tuple[str, tuple]] = []

            class FakeCursor:
                rowcount = 1
                row = ("Leo", "our-space", 0)

                def execute(self, sql, params=None):
                    executed.append((" ".join(sql.split()), params))
                    return self

                def fetchone(self): return self.row

                def close(self): pass

            class FakeConnection:
                def cursor(self): return FakeCursor()

                def close(self): pass

            base = dict(list=False, remove=False, disable=False, enable=False, name="Leo",
                        apps="our-space,files", username="Leo", password=None, generate=False,
                        ask_password=False, db_url="mysql://u:p@h/db", db_env=None)
            base.update(overrides)
            output = io.StringIO()
            with patch.object(module, "db_connect", lambda target: FakeConnection()), \
                 patch.object(module.getpass, "getpass", lambda prompt="": "typed-in-pw"), \
                 contextlib.redirect_stdout(output):
                self.assertEqual(module.run_database(argparse.Namespace(**base), "leo"), 0)
            return executed, output.getvalue()

        # 只给 --apps：只改授权，密码一个字都不碰。
        executed, output = run()
        self.assertEqual([sql.split()[0].upper() for sql, _ in executed], ["SELECT", "UPDATE"])
        self.assertIn("密码没动", output)

        # 加上 --ask-password：交互输入的密码与授权一起写进去。
        executed, output = run(ask_password=True)
        statement, params = executed[-1]
        self.assertIn("INSERT INTO visitor_accounts", statement)
        self.assertEqual(params[1], "Leo")
        self.assertEqual(params[3], "our-space,files")
        self.assertTrue(verify_password("typed-in-pw", params[2]))
        self.assertNotIn("typed-in-pw", output, "交互输入的密码不该回显")


if __name__ == "__main__":
    unittest.main()
