"""访客应用：目录式注册表校验、按账号授权、界面 / 素材 / 数据 / 文件接口。"""
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import httpx

from app.config import settings
from app.main import app
from app.services import visitor_apps
from app.services.visitor_accounts import hash_password
from app.services.visitor_apps import VisitorAppsUnavailable, app_asset, load_apps, parse_app

TOKEN = "test-internal-token-" + "x" * 40
PASSWORD = "correct horse battery staple"
WALLPAPER_BYTES = b"RIFF-fake-webp"
ICON_BYTES = b'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 3h18v18H3z" /></svg>'
HTML = b"<!doctype html><meta charset='utf-8'><h1>Studio</h1><script src='app.js'></script>"


def app_entry(**overrides):
    entry = {
        "apiVersion": 1,
        "id": "studio",
        "title": "Studio",
        "subtitle": "真实应用",
        "icon": "icon.svg",
        "wallpaper": "wall.svg",
        "watermark": "PRIVATE DESKTOP",
        "entry": "index.html",
        "embeds": ["https://example.com"],
        "permissions": ["files", "data"],
    }
    entry.update(overrides)
    return entry


def write_app(directory: Path, manifest: dict, *, assets: dict[str, bytes] | None = None,
              files: dict[str, bytes] | None = None) -> None:
    app_dir = directory / manifest["id"]
    app_dir.mkdir(parents=True, exist_ok=True)
    (app_dir / "app.json").write_text(json.dumps(manifest, ensure_ascii=False), encoding="utf-8")
    if assets:
        (app_dir / "assets").mkdir(exist_ok=True)
        for name, payload in assets.items():
            (app_dir / "assets" / name).write_bytes(payload)
    for name, payload in (files or {}).items():
        target = app_dir / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(payload)


class RegistryTests(unittest.TestCase):
    def test_parsing_keeps_metadata_window_and_capabilities(self):
        application = parse_app(app_entry())
        self.assertEqual(application.id, "studio")
        self.assertEqual(application.entry, "index.html")
        self.assertEqual(application.embeds, ("https://example.com",))
        self.assertEqual(application.permissions, frozenset({"files", "data"}))
        self.assertEqual(application.metadata(), {
            "id": "studio", "title": "Studio", "subtitle": "真实应用", "watermark": "PRIVATE DESKTOP",
            "hasIcon": True, "hasWallpaper": True, "window": {"width": 560, "height": 580},
        })

    def test_optional_fields_default(self):
        application = parse_app({"apiVersion": 1, "id": "studio", "title": "Studio", "entry": "index.html"})
        self.assertEqual(application.subtitle, "")
        self.assertIsNone(application.icon)
        self.assertEqual(application.embeds, ())
        self.assertEqual(application.permissions, frozenset())
        self.assertEqual(application.metadata()["window"], {"width": 560, "height": 580})

    def test_a_manifest_may_carry_its_own_window_size(self):
        application = parse_app(app_entry(window={"width": 720, "height": 640}))
        self.assertEqual(application.metadata()["window"], {"width": 720, "height": 640})
        for bad in [{"width": "560", "height": 580}, {"width": 100, "height": 580}, {"width": 560},
                    {"width": 9999, "height": 580}, {"width": True, "height": 580}, {"width": 560, "height": 580, "z": 1}]:
            with self.subTest(window=bad):
                with self.assertRaises(VisitorAppsUnavailable):
                    parse_app(app_entry(window=bad))

    def test_the_folder_name_must_match_the_app_id(self):
        with self.assertRaises(VisitorAppsUnavailable):
            parse_app(app_entry(), folder="somewhere-else")

    def test_malformed_manifests_close_the_gate(self):
        broken = [
            {}, {"apiVersion": 2, "id": "x", "title": "x", "entry": "index.html"},
            app_entry(id="Our Space"), app_entry(id="../admin"),
            app_entry(entry=None), app_entry(entry="index.js"), app_entry(entry="../index.html"),
            app_entry(entry="sub/index.html"),
            # 区块协议已删除：`view` 现在是未知字段，必须被拒绝。
            app_entry(view=[]), app_entry(view=[{"type": "notice", "text": "hi"}]),
            app_entry(embeds=["http://example.com"]), app_entry(embeds=["https://ok.test", 1]),
            app_entry(permissions=["shell"]), app_entry(permissions="files"),
            app_entry(name="x"),
        ]
        for entry in broken:
            with self.subTest(entry=str(entry)[:60]):
                with self.assertRaises(VisitorAppsUnavailable):
                    parse_app(entry)


class DirectoryTests(unittest.TestCase):
    def test_a_missing_directory_fails_closed(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(settings, "VISITOR_APPS_DIR", str(Path(directory) / "absent")):
                with self.assertRaises(VisitorAppsUnavailable):
                    load_apps()

    def test_each_folder_is_one_app_and_its_manifest_is_validated(self):
        with tempfile.TemporaryDirectory() as directory:
            apps_dir = Path(directory)
            write_app(apps_dir, app_entry())
            write_app(apps_dir, app_entry(id="guest-book", title="访客留言", icon=None, wallpaper=None,
                                          embeds=[], permissions=[]))
            # 非目录与以下划线/点开头的目录都忽略（README、归档目录不算应用）。
            (apps_dir / "README.md").write_text("说明", encoding="utf-8")
            (apps_dir / "_archived").mkdir()
            with patch.object(settings, "VISITOR_APPS_DIR", str(apps_dir)):
                registry = load_apps()
            self.assertEqual(sorted(registry), ["guest-book", "studio"])
            self.assertFalse(registry["guest-book"].metadata()["hasIcon"])

    def test_a_broken_manifest_closes_everything(self):
        with tempfile.TemporaryDirectory() as directory:
            apps_dir = Path(directory)
            write_app(apps_dir, app_entry())
            (apps_dir / "broken").mkdir()
            (apps_dir / "broken" / "app.json").write_text("{not json", encoding="utf-8")
            with patch.object(settings, "VISITOR_APPS_DIR", str(apps_dir)):
                with self.assertRaises(VisitorAppsUnavailable):
                    load_apps()

    def test_an_incompatible_api_version_is_skipped_not_fatal(self):
        """把一个新版本应用复制到旧站点时，只跳过它，不要连带打死其它访客应用。"""
        with tempfile.TemporaryDirectory() as directory:
            apps_dir = Path(directory)
            write_app(apps_dir, app_entry())
            write_app(apps_dir, app_entry(id="from-the-future", apiVersion=99, embeds=[], permissions=[]))
            with patch.object(settings, "VISITOR_APPS_DIR", str(apps_dir)):
                registry = load_apps()
            self.assertEqual(list(registry), ["studio"])

    def test_assets_resolve_only_inside_the_apps_own_assets_directory(self):
        with tempfile.TemporaryDirectory() as directory:
            apps_dir = Path(directory)
            write_app(apps_dir, app_entry(), assets={"wall.svg": WALLPAPER_BYTES, "icon.svg": ICON_BYTES})
            with patch.object(settings, "VISITOR_APPS_DIR", str(apps_dir)):
                application = parse_app(app_entry())
                self.assertEqual(app_asset(application, "wallpaper"), apps_dir / "studio" / "assets" / "wall.svg")
                self.assertEqual(app_asset(application, "icon"), apps_dir / "studio" / "assets" / "icon.svg")
                self.assertIsNone(app_asset(application, "exe"))
                missing = parse_app(app_entry(wallpaper="absent.webp"))
                self.assertIsNone(app_asset(missing, "wallpaper"))
                no_icon = parse_app(app_entry(icon=None))
                self.assertIsNone(app_asset(no_icon, "icon"))


class VisitorAppRouteTests(unittest.IsolatedAsyncioTestCase):
    """界面、静态文件、键值数据、上传 / 下载。"""

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        root = Path(self.temp.name)
        self.apps_dir = root / "visitor-apps"
        write_app(self.apps_dir, app_entry(), assets={"icon.svg": ICON_BYTES, "wall.svg": WALLPAPER_BYTES},
                  files={"index.html": HTML, "app.js": b"console.log('studio')"})
        # 一个没有申请任何能力的应用：用来验证权限门。
        write_app(self.apps_dir, {"apiVersion": 1, "id": "reader", "title": "Reader", "entry": "index.html"},
                  files={"index.html": b"<!doctype html><p>reader</p>"})
        self.accounts = root / "visitors.json"
        self.accounts.write_text(json.dumps({"visitors": [
            {"username": "kim", "name": "Kim", "password_hash": hash_password(PASSWORD), "apps": ["studio", "reader"]},
        ]}), encoding="utf-8")
        self.patches = [
            patch.object(settings, "VISITOR_ACCOUNTS_PATH", str(self.accounts)),
            patch.object(settings, "VISITOR_APPS_DIR", str(self.apps_dir)),
            patch.object(settings, "VISITOR_APP_FILES_DIR", str(root / "app-files")),
            patch.object(settings, "VISITOR_APP_DATA_DB", str(root / "app-data.sqlite")),
            patch.object(settings, "CHAT_LIMIT_DB", str(root / "limits.sqlite")),
            patch.object(settings, "INTERNAL_API_TOKEN", TOKEN),
        ]
        for item in self.patches:
            item.start()
            self.addCleanup(item.stop)

    async def fetch(self, path, visitor=None, method="GET", content=None):
        headers = {"X-Marcus-Internal-Token": TOKEN}
        if visitor:
            headers["X-Marcus-Visitor"] = visitor
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            return await client.request(method, path, headers=headers, content=content)

    async def test_shell_and_static_only_for_a_granted_visitor(self):
        shell = await self.fetch("/api/visitor/apps/studio/shell", "kim")
        self.assertEqual(shell.status_code, 200)
        self.assertTrue(shell.headers["content-type"].startswith("text/html"))
        self.assertIn("Studio", shell.text)
        self.assertEqual(shell.headers["cache-control"], "private, no-store")
        # 按应用收口的第三方内嵌：CSP 只放行 app.json 的 embeds。
        self.assertEqual(shell.headers["content-security-policy"], "frame-src 'self' https://example.com; frame-ancestors 'self'")
        script = await self.fetch("/api/visitor/apps/studio/app.js", "kim")
        self.assertTrue(script.headers["content-type"].startswith("text/javascript"))
        self.assertEqual(script.content, b"console.log('studio')")
        self.assertEqual((await self.fetch("/api/visitor/apps/studio/assets/icon", "kim")).status_code, 200)
        # app.json 不对外；未登录 / 未授权都拿不到。
        self.assertEqual((await self.fetch("/api/visitor/apps/studio/app.json", "kim")).status_code, 404)
        self.assertEqual((await self.fetch("/api/visitor/apps/studio/shell")).status_code, 401)
        self.assertEqual((await self.fetch("/api/visitor/apps/studio/shell", "stranger")).status_code, 401)

    async def test_data_is_isolated_and_requires_the_permission(self):
        self.assertEqual((await self.fetch("/api/visitor/apps/studio/data", "kim")).json(), {"data": {}})
        put = await self.fetch("/api/visitor/apps/studio/data/mood", "kim", method="PUT", content=b'{"today":"calm"}')
        self.assertEqual(put.status_code, 200)
        self.assertEqual((await self.fetch("/api/visitor/apps/studio/data", "kim")).json(),
                         {"data": {"mood": {"today": "calm"}}})
        self.assertEqual((await self.fetch("/api/visitor/apps/studio/data/mood", "kim", method="DELETE")).status_code, 200)
        self.assertEqual((await self.fetch("/api/visitor/apps/studio/data/mood", "kim", method="DELETE")).status_code, 404)
        # 没有申请 data 的应用访问不了。
        self.assertEqual((await self.fetch("/api/visitor/apps/reader/data", "kim")).status_code, 403)

    async def test_uploads_round_trip_and_are_bounded(self):
        self.assertEqual((await self.fetch("/api/visitor/apps/studio/files", "kim")).json(), {"files": []})
        created = await self.fetch("/api/visitor/apps/studio/files/notes.txt", "kim", method="PUT", content=b"hello")
        self.assertEqual(created.status_code, 201)
        listed = (await self.fetch("/api/visitor/apps/studio/files", "kim")).json()["files"]
        self.assertEqual([item["name"] for item in listed], ["notes.txt"])
        # 默认下载（attachment）；`?inline=1` 时不写 Content-Disposition，交给浏览器内联显示。
        download = await self.fetch("/api/visitor/apps/studio/files/notes.txt", "kim")
        self.assertEqual(download.content, b"hello")
        self.assertIn("attachment", download.headers.get("content-disposition", ""))
        inline = await self.fetch("/api/visitor/apps/studio/files/notes.txt?inline=1", "kim")
        self.assertEqual(inline.status_code, 200)
        self.assertIsNone(inline.headers.get("content-disposition"))
        self.assertEqual((await self.fetch("/api/visitor/apps/studio/files/notes.txt", "kim", method="DELETE")).status_code, 200)
        self.assertEqual((await self.fetch("/api/visitor/apps/studio/files/notes.txt", "kim")).status_code, 404)
        # 体积上限、没有申请 files 的应用。
        too_big = await self.fetch("/api/visitor/apps/studio/files/big.bin", "kim", method="PUT",
                                   content=b"x" * (8 * 1024 * 1024 + 1))
        self.assertEqual(too_big.status_code, 413)
        self.assertEqual((await self.fetch("/api/visitor/apps/reader/files", "kim")).status_code, 403)


if __name__ == "__main__":
    unittest.main()
