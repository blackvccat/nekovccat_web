"""访客应用：注册表校验、按账号授权、视图与私有素材接口。"""
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
from app.services.visitor_apps import VisitorAppsUnavailable, app_asset, parse_apps

TOKEN = "test-internal-token-" + "x" * 40
PASSWORD = "correct horse battery staple"
WALLPAPER_BYTES = b"RIFF-fake-webp"
ICON_BYTES = b'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 3h18v18H3z" /></svg>'


def app_entry(**overrides):
    entry = {
        "id": "our-space",
        "title": "我们的小屋",
        "subtitle": "只属于受邀访客的空间",
        "icon": "our-room.svg",
        "wallpaper": "couple-wallpaper.webp",
        "watermark": "MARCUS PRIVATE DESKTOP",
        "view": [
            {"type": "heading", "eyebrow": "OUR SPACE", "title": "我们的小屋", "action": {"label": "看猫咪 ↗", "kind": "wallpaper"}},
            {"type": "checklist", "title": "清单", "intro": "介绍", "defaults": ["一"], "addPlaceholder": "…", "addLabel": "＋",
             "storageKey": "visitor-app-list-our-space", "maxItems": 10, "maxLength": 20},
            {"type": "link", "action": {"label": "前往主站 ↗", "kind": "link", "href": "https://example.com/"}},
        ],
    }
    entry.update(overrides)
    return entry


class RegistryTests(unittest.TestCase):
    def test_registry_parsing_keeps_only_known_blocks_and_flags_assets(self):
        registry = parse_apps({"apps": [app_entry()]})
        self.assertEqual(list(registry), ["our-space"])
        metadata = registry["our-space"].metadata()
        self.assertEqual(metadata, {"id": "our-space", "title": "我们的小屋", "subtitle": "只属于受邀访客的空间",
                                    "watermark": "MARCUS PRIVATE DESKTOP", "hasIcon": True, "hasWallpaper": True})
        self.assertEqual([block["type"] for block in registry["our-space"].view], ["heading", "checklist", "link"])
        self.assertEqual(registry["our-space"].view[2]["action"]["href"], "https://example.com/")
        # Optional fields are normalised to null instead of disappearing.
        self.assertIn("eyebrow", registry["our-space"].view[0])

    def test_an_app_may_open_with_an_empty_view(self):
        """空 view 是合法的：应用可以先开一个空窗口，内容以后再补。"""
        app = parse_apps({"apps": [app_entry(view=[])]})["our-space"]
        self.assertEqual(app.view, ())
        self.assertEqual(app.metadata()["hasIcon"], True)

    def test_malformed_registries_close_the_gate(self):
        broken = [
            {"apps": {}}, {"apps": {}}, {"apps": [None]}, {"apps": [app_entry(id="Our Space")]},
            {"apps": [app_entry(id="../admin")]}, {"apps": [app_entry(view="")]},
            {"apps": [app_entry(view=[{"type": "shell", "command": "id"}])]},
            {"apps": [app_entry(view=[{"type": "counter", "since": "2024-1-1", "title": "x", "dayUnit": "天"}])]},
            {"apps": [app_entry(view=[{"type": "link", "action": {"label": "x", "kind": "link", "href": "javascript:alert(1)"}}])]},
            {"apps": [app_entry(view=[{"type": "link", "action": {"label": "x", "kind": "open"}}])]},
            {"apps": [app_entry(wallpaper="../../etc/passwd")]},
            {"apps": [app_entry(), app_entry()]},
            {"apps": [app_entry(name="x")]},
        ]
        for registry in broken:
            with self.subTest(registry=str(registry)[:60]):
                with self.assertRaises(VisitorAppsUnavailable):
                    parse_apps(registry)

    def test_notice_block_keeps_only_its_text_and_optional_note(self):
        entry = app_entry(view=[{"type": "notice", "text": "功能开发中"}])
        block = parse_apps({"apps": [entry]})["our-space"].view[0]
        self.assertEqual(block, {"type": "notice", "text": "功能开发中", "note": None})
        with_note = app_entry(view=[{"type": "notice", "text": "维护中", "note": "稍后回来"}])
        self.assertEqual(parse_apps({"apps": [with_note]})["our-space"].view[0]["note"], "稍后回来")
        # 没有 text 的占位区块不算合法区块。
        with self.assertRaises(VisitorAppsUnavailable):
            parse_apps({"apps": [app_entry(view=[{"type": "notice"}])]})

    def test_files_block_is_read_only_and_only_takes_download_links(self):
        entry = app_entry(view=[{
            "type": "files", "title": "可下载的文件", "intro": "只读", "note": "列表来自服务器",
            "items": [{"name": "a.zip", "size": "1 MB", "href": "https://example.com/a.zip"},
                      {"name": "站内.txt", "href": "/images/note.txt"}],
        }])
        block = parse_apps({"apps": [entry]})["our-space"].view[0]
        self.assertEqual([block["title"], block["intro"], block["note"]], ["可下载的文件", "只读", "列表来自服务器"])
        self.assertEqual(block["items"][0], {"name": "a.zip", "note": None, "size": "1 MB", "href": "https://example.com/a.zip"})
        self.assertEqual(block["items"][1]["href"], "/images/note.txt")

        broken = [
            {"type": "files", "title": "x", "items": []},
            {"type": "files", "title": "x", "items": "a.zip"},
            {"type": "files", "title": "x", "items": [{"name": "a", "href": "javascript:alert(1)"}]},
            {"type": "files", "title": "x", "items": [{"name": "a", "href": "data:text/html,<script>alert(1)</script>"}]},
            {"type": "files", "title": "x", "items": [{"name": "a", "href": "http://example.com/a.zip"}]},
            {"type": "files", "title": "x", "items": [{"name": "a", "href": "https://example.com/a.zip", "上传": "是"}]},
            {"type": "files", "title": "x", "items": [{"href": "https://example.com/a.zip"}]},
            {"type": "files", "title": "x", "items": [{"name": "a", "href": "https://example.com/a.zip"}] * 61},
        ]
        for view in broken:
            with self.subTest(view=str(view)[:70]):
                with self.assertRaises(VisitorAppsUnavailable):
                    parse_apps({"apps": [app_entry(view=view)]})

    def test_missing_registry_and_assets_fail_closed(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(settings, "VISITOR_APPS_PATH", str(Path(directory) / "absent.json")):
                with self.assertRaises(VisitorAppsUnavailable):
                    visitor_apps.load_apps()
            broken = Path(directory) / "broken.json"
            broken.write_text("{not json", encoding="utf-8")
            with patch.object(settings, "VISITOR_APPS_PATH", str(broken)):
                with self.assertRaises(VisitorAppsUnavailable):
                    visitor_apps.load_apps()

    def test_assets_resolve_only_inside_the_assets_directory(self):
        with tempfile.TemporaryDirectory() as directory:
            assets = Path(directory)
            (assets / "couple-wallpaper.webp").write_bytes(WALLPAPER_BYTES)
            (assets / "our-room.svg").write_bytes(ICON_BYTES)
            with patch.object(settings, "VISITOR_ASSETS_DIR", str(assets)):
                app = parse_apps({"apps": [app_entry()]})["our-space"]
                resolved = app_asset(app, "wallpaper")
                self.assertEqual(resolved, assets / "couple-wallpaper.webp")
                self.assertEqual(app_asset(app, "icon"), assets / "our-room.svg")
                self.assertIsNone(app_asset(app, "exe"))
                missing = parse_apps({"apps": [app_entry(wallpaper="absent.webp")]})["our-space"]
                self.assertIsNone(app_asset(missing, "wallpaper"))
                no_icon = parse_apps({"apps": [app_entry(icon=None)]})["our-space"]
                self.assertIsNone(app_asset(no_icon, "icon"))


class VisitorAppRouteTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.directory = Path(self.temp.name)
        (self.directory / "visitor-assets").mkdir()
        (self.directory / "visitor-assets" / "couple-wallpaper.webp").write_bytes(WALLPAPER_BYTES)
        (self.directory / "visitor-assets" / "our-room.svg").write_bytes(ICON_BYTES)
        self.accounts = self.directory / "visitors.json"
        self.accounts.write_text(json.dumps({"visitors": [
            {"username": "beibei", "name": "贝贝", "password_hash": hash_password(PASSWORD), "apps": ["our-space"]},
            {"username": "guest", "name": "访客", "password_hash": hash_password(PASSWORD), "apps": ["guest-book"]},
            {"username": "nobody", "name": "无授权", "password_hash": hash_password(PASSWORD), "apps": []},
        ]}), encoding="utf-8")
        self.registry = self.directory / "apps.json"
        self.registry.write_text(json.dumps({"apps": [
            app_entry(),
            app_entry(id="guest-book", title="访客留言", wallpaper=None, view=[{"type": "text", "title": None, "lines": ["hi"]}]),
        ]}), encoding="utf-8")
        self.patches = [
            patch.object(settings, "VISITOR_ACCOUNTS_PATH", str(self.accounts)),
            patch.object(settings, "VISITOR_APPS_PATH", str(self.registry)),
            patch.object(settings, "VISITOR_ASSETS_DIR", str(self.directory / "visitor-assets")),
            patch.object(settings, "CHAT_LIMIT_DB", str(self.directory / "limits.sqlite")),
            patch.object(settings, "INTERNAL_API_TOKEN", TOKEN),
        ]
        for item in self.patches:
            item.start()
            self.addCleanup(item.stop)

    async def fetch(self, path, visitor=None, method="GET"):
        headers = {"X-Marcus-Internal-Token": TOKEN}
        if visitor:
            headers["X-Marcus-Visitor"] = visitor
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            return await client.request(method, path, headers=headers)

    async def test_app_lists_are_per_visitor(self):
        beibei = (await self.fetch("/api/visitor/apps", "beibei")).json()
        self.assertEqual(beibei["name"], "贝贝")
        self.assertEqual([item["id"] for item in beibei["apps"]], ["our-space"])
        guest = (await self.fetch("/api/visitor/apps", "guest")).json()
        self.assertEqual([item["id"] for item in guest["apps"]], ["guest-book"])
        nobody = (await self.fetch("/api/visitor/apps", "nobody")).json()
        self.assertEqual(nobody["apps"], [])
        # 未登录 / 已停用 / 未知访客都不返回任何内容。
        self.assertEqual((await self.fetch("/api/visitor/apps")).status_code, 401)
        self.assertEqual((await self.fetch("/api/visitor/apps", "stranger")).status_code, 401)
        self.assertEqual((await self.fetch("/api/visitor/apps", "beibei")).headers["cache-control"], "no-store")

    async def test_app_views_require_the_grant(self):
        allowed = await self.fetch("/api/visitor/apps/our-space", "beibei")
        self.assertEqual(allowed.status_code, 200)
        body = allowed.json()
        self.assertEqual(body["app"]["id"], "our-space")
        self.assertEqual([block["type"] for block in body["view"]], ["heading", "checklist", "link"])
        self.assertNotIn(PASSWORD, allowed.text)
        self.assertEqual((await self.fetch("/api/visitor/apps/guest-book", "beibei")).status_code, 403)
        self.assertEqual((await self.fetch("/api/visitor/apps/our-space", "guest")).status_code, 403)
        self.assertEqual((await self.fetch("/api/visitor/apps/our-space", "nobody")).status_code, 403)
        self.assertEqual((await self.fetch("/api/visitor/apps/not-registered", "beibei")).status_code, 403)
        self.assertEqual((await self.fetch("/api/visitor/apps/our-space")).status_code, 401)

    async def test_private_assets_are_streamed_only_with_a_grant(self):
        asset = await self.fetch("/api/visitor/apps/our-space/assets/wallpaper", "beibei")
        self.assertEqual(asset.status_code, 200)
        self.assertEqual(asset.content, WALLPAPER_BYTES)
        self.assertEqual(asset.headers["cache-control"], "private, no-store")
        self.assertEqual((await self.fetch("/api/visitor/apps/our-space/assets/exe", "beibei")).status_code, 404)
        self.assertEqual((await self.fetch("/api/visitor/apps/our-space/assets/wallpaper", "guest")).status_code, 403)
        self.assertEqual((await self.fetch("/api/visitor/apps/our-space/assets/wallpaper")).status_code, 401)

    async def test_app_icon_is_served_as_an_image_only_with_a_grant(self):
        icon = await self.fetch("/api/visitor/apps/our-space/assets/icon", "beibei")
        self.assertEqual(icon.status_code, 200)
        self.assertEqual(icon.content, ICON_BYTES)
        # <img> 不猜扩展名：类型必须写对，否则 nosniff 下浏览器会拒绝显示。
        self.assertEqual(icon.headers["content-type"], "image/svg+xml")
        self.assertEqual(icon.headers["cache-control"], "private, no-store")
        listing = (await self.fetch("/api/visitor/apps", "beibei")).json()
        self.assertTrue(listing["apps"][0]["hasIcon"])
        self.assertEqual((await self.fetch("/api/visitor/apps/our-space/assets/icon", "guest")).status_code, 403)
        self.assertEqual((await self.fetch("/api/visitor/apps/guest-book/assets/icon", "beibei")).status_code, 403)
        self.assertEqual((await self.fetch("/api/visitor/apps/our-space/assets/icon")).status_code, 401)

    async def test_disabled_or_broken_configuration_fails_closed(self):
        # 只有停用账号 = 没配置可用访客；有人可用但这一个被停用 = 未登录。
        self.accounts.write_text(json.dumps({"visitors": [
            {"username": "beibei", "name": "贝贝", "password_hash": hash_password(PASSWORD), "apps": ["our-space"], "disabled": True},
        ]}), encoding="utf-8")
        self.assertEqual((await self.fetch("/api/visitor/apps", "beibei")).status_code, 503)
        self.accounts.write_text(json.dumps({"visitors": [
            {"username": "beibei", "name": "贝贝", "password_hash": hash_password(PASSWORD), "apps": ["our-space"], "disabled": True},
            {"username": "guest", "name": "访客", "password_hash": hash_password(PASSWORD), "apps": ["guest-book"]},
        ]}), encoding="utf-8")
        self.assertEqual((await self.fetch("/api/visitor/apps", "beibei")).status_code, 401)
        self.accounts.write_text("{not json", encoding="utf-8")
        self.assertEqual((await self.fetch("/api/visitor/apps", "beibei")).status_code, 503)
        self.accounts.write_text(json.dumps({"visitors": [
            {"username": "beibei", "name": "贝贝", "password_hash": hash_password(PASSWORD), "apps": ["our-space"]},
        ]}), encoding="utf-8")
        self.registry.write_text("{not json", encoding="utf-8")
        self.assertEqual((await self.fetch("/api/visitor/apps", "beibei")).status_code, 503)
        self.assertEqual((await self.fetch("/api/visitor/apps/our-space", "beibei")).status_code, 503)


if __name__ == "__main__":
    unittest.main()
