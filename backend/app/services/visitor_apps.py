"""后端持有的访客应用：元数据、视图数据与私有素材。

前端只知道「有哪些应用可以打开」和应用返回的视图块，看不到任何应用素材；
每份内容都要先用 X-Marcus-Visitor 里的访客名通过授权校验才会返回。
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path

from app.config import settings

MAX_APPS = 32
MAX_BLOCKS = 40
MAX_TEXT = 4000
MAX_LINES = 200
APP_ID = re.compile(r"^[a-z0-9][a-z0-9-]{0,31}$")
ASSET_FILE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$")
ASSET_KINDS = ("wallpaper", "icon")
BLOCK_TYPES = ("heading", "text", "letter", "counter", "checklist", "footer", "link", "image", "files", "notice")
MAX_FILES = 60
ACTION_KINDS = ("wallpaper", "link", "logout")
DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


class VisitorAppsUnavailable(Exception):
    """The application registry is missing or malformed: fail closed."""

    def __init__(self, message: str = "访客应用尚未配置，请联系站点管理员。"):
        super().__init__(message)


@dataclass(frozen=True)
class VisitorApp:
    id: str
    title: str
    subtitle: str
    icon: str | None
    wallpaper: str | None
    watermark: str | None
    view: tuple[dict, ...]

    def metadata(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "subtitle": self.subtitle,
            "watermark": self.watermark or "",
            "hasIcon": bool(self.icon),
            "hasWallpaper": bool(self.wallpaper),
        }


def _text(value: object, *, limit: int = MAX_TEXT, required: bool = True) -> str | None:
    if value is None and not required:
        return None
    if not isinstance(value, str) or (required and not value.strip()) or len(value) > limit:
        raise VisitorAppsUnavailable("访客应用配置无效，请联系站点管理员。")
    return value


def _strings(value: object, *, limit: int = MAX_LINES, length: int = 400) -> tuple[str, ...]:
    if not isinstance(value, list) or len(value) > limit:
        raise VisitorAppsUnavailable("访客应用配置无效，请联系站点管理员。")
    return tuple(_text(item, limit=length) for item in value)


def _action(value: object) -> dict | None:
    if value is None:
        return None
    if not isinstance(value, dict) or set(value) - {"label", "kind", "href"}:
        raise VisitorAppsUnavailable("访客应用配置无效，请联系站点管理员。")
    kind = value.get("kind")
    if kind not in ACTION_KINDS:
        raise VisitorAppsUnavailable("访客应用配置无效，请联系站点管理员。")
    action = {"label": _text(value.get("label"), limit=80), "kind": kind}
    if kind == "link":
        href = value.get("href")
        if not isinstance(href, str) or not href.startswith(("https://", "/")) or len(href) > 500:
            raise VisitorAppsUnavailable("访客应用配置无效，请联系站点管理员。")
        action["href"] = href
    return action


def _files(value: object) -> tuple[dict, ...]:
    """下载列表：每项都必须指向 https 或站内路径，其它协议（javascript:、data:、file: …）一律拒绝。"""
    if not isinstance(value, list) or not value or len(value) > MAX_FILES:
        raise VisitorAppsUnavailable("访客应用配置无效，请联系站点管理员。")
    items = []
    for item in value:
        if not isinstance(item, dict) or set(item) - {"name", "note", "size", "href"}:
            raise VisitorAppsUnavailable("访客应用配置无效，请联系站点管理员。")
        href = item.get("href")
        if not isinstance(href, str) or not href.startswith(("https://", "/")) or len(href) > 500:
            raise VisitorAppsUnavailable("访客应用配置无效，请联系站点管理员。")
        items.append({
            "name": _text(item.get("name"), limit=120),
            "note": _text(item.get("note"), limit=160, required=False),
            "size": _text(item.get("size"), limit=20, required=False),
            "href": href,
        })
    return tuple(items)


def _block(value: object) -> dict:
    if not isinstance(value, dict) or value.get("type") not in BLOCK_TYPES:
        raise VisitorAppsUnavailable("访客应用配置无效，请联系站点管理员。")
    kind = value["type"]
    block: dict[str, object] = {"type": kind}
    if kind == "heading":
        block.update(eyebrow=_text(value.get("eyebrow"), limit=80, required=False),
                     title=_text(value.get("title"), limit=120), action=_action(value.get("action")))
    elif kind == "text":
        block.update(title=_text(value.get("title"), limit=120, required=False),
                     lines=_strings(value.get("lines")))
    elif kind == "letter":
        block.update(buttonLabel=_text(value.get("buttonLabel"), limit=80), title=_text(value.get("title"), limit=120),
                     summary=_text(value.get("summary"), limit=200, required=False), toolbar=_text(value.get("toolbar"), limit=120, required=False),
                     paragraphs=_strings(value.get("paragraphs")))
    elif kind == "counter":
        since = value.get("since")
        if not isinstance(since, str) or not DATE.fullmatch(since):
            raise VisitorAppsUnavailable("访客应用配置无效，请联系站点管理员。")
        block.update(since=since, title=_text(value.get("title"), limit=80), dayUnit=_text(value.get("dayUnit"), limit=20),
                     sinceLabel=_text(value.get("sinceLabel"), limit=20, required=False),
                     anniversaryLabel=_text(value.get("anniversaryLabel"), limit=80, required=False),
                     anniversaryToday=_text(value.get("anniversaryToday"), limit=80, required=False),
                     anniversaryRemaining=_text(value.get("anniversaryRemaining"), limit=20, required=False),
                     anniversaryUnit=_text(value.get("anniversaryUnit"), limit=20, required=False),
                     monthUnit=_text(value.get("monthUnit"), limit=20, required=False),
                     yearUnit=_text(value.get("yearUnit"), limit=20, required=False))
    elif kind == "checklist":
        block.update(title=_text(value.get("title"), limit=120), intro=_text(value.get("intro"), limit=200, required=False),
                     defaults=_strings(value.get("defaults")), addPlaceholder=_text(value.get("addPlaceholder"), limit=80, required=False),
                     addLabel=_text(value.get("addLabel"), limit=40, required=False),
                     storageKey=_text(value.get("storageKey"), limit=64))
        block["maxItems"] = int(value.get("maxItems", 100)) if str(value.get("maxItems", 100)).isdigit() else 100
        block["maxLength"] = int(value.get("maxLength", 120)) if str(value.get("maxLength", 120)).isdigit() else 120
        if not 1 <= block["maxItems"] <= 500 or not 1 <= block["maxLength"] <= 500:
            raise VisitorAppsUnavailable("访客应用配置无效，请联系站点管理员。")
    elif kind == "footer":
        block.update(text=_text(value.get("text"), limit=300), action=_action(value.get("action")))
    elif kind == "link":
        # A link block is one action; `action` carries kind "link" and an https/relative href.
        action = _action(value.get("action"))
        if action is None or action["kind"] != "link":
            raise VisitorAppsUnavailable("访客应用配置无效，请联系站点管理员。")
        block["action"] = action
    elif kind == "image":
        block.update(src=_text(value.get("src"), limit=200), caption=_text(value.get("caption"), limit=200, required=False))
    elif kind == "files":
        # 只读的下载列表：这里的链接由站内配置决定，前端只负责渲染成可下载的条目。
        block.update(title=_text(value.get("title"), limit=120),
                     intro=_text(value.get("intro"), limit=200, required=False),
                     items=_files(value.get("items")),
                     note=_text(value.get("note"), limit=300, required=False))
    elif kind == "notice":
        # 占位区块：窗口还空着时在正中间放一句话（例如「功能开发中」）。
        block.update(text=_text(value.get("text"), limit=40),
                     note=_text(value.get("note"), limit=200, required=False))
    return block


def _app(value: object) -> VisitorApp:
    if not isinstance(value, dict):
        raise VisitorAppsUnavailable("访客应用配置无效，请联系站点管理员。")
    if set(value) - {"id", "title", "subtitle", "icon", "wallpaper", "watermark", "view"}:
        raise VisitorAppsUnavailable("访客应用配置无效，请联系站点管理员。")
    app_id = value.get("id")
    if not isinstance(app_id, str) or not APP_ID.fullmatch(app_id):
        raise VisitorAppsUnavailable("访客应用配置无效，请联系站点管理员。")
    view = value.get("view")
    # 空的 view 也合法：应用可以先开一个空窗口，内容以后再补。
    if not isinstance(view, list) or len(view) > MAX_BLOCKS:
        raise VisitorAppsUnavailable("访客应用配置无效，请联系站点管理员。")
    icon, wallpaper = value.get("icon"), value.get("wallpaper")
    for name in (icon, wallpaper):
        if name is not None and (not isinstance(name, str) or not ASSET_FILE.fullmatch(name)):
            raise VisitorAppsUnavailable("访客应用配置无效，请联系站点管理员。")
    return VisitorApp(
        id=app_id,
        title=_text(value.get("title"), limit=120),
        subtitle=_text(value.get("subtitle"), limit=200, required=False) or "",
        icon=icon,
        wallpaper=wallpaper,
        watermark=_text(value.get("watermark"), limit=120, required=False),
        view=tuple(_block(block) for block in view),
    )


def parse_apps(raw: object) -> dict[str, VisitorApp]:
    """Validate the whole registry: one malformed app closes visitor apps entirely."""
    if not isinstance(raw, dict) or not isinstance(raw.get("apps"), list) or len(raw["apps"]) > MAX_APPS:
        raise VisitorAppsUnavailable("访客应用配置无效，请联系站点管理员。")
    apps: dict[str, VisitorApp] = {}
    for entry in raw["apps"]:
        app = _app(entry)
        if app.id in apps:
            raise VisitorAppsUnavailable("访客应用存在重复 id，请联系站点管理员。")
        apps[app.id] = app
    return apps


def load_apps() -> dict[str, VisitorApp]:
    try:
        raw = json.loads(Path(settings.VISITOR_APPS_PATH).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        raise VisitorAppsUnavailable("访客应用尚未配置，请联系站点管理员。") from None
    return parse_apps(raw)


def app_asset(app: VisitorApp, kind: str) -> Path | None:
    """Resolve one private asset; the registry may only name files inside VISITOR_ASSETS_DIR."""
    if kind not in ASSET_KINDS:
        return None
    name = app.wallpaper if kind == "wallpaper" else app.icon
    if not name or not ASSET_FILE.fullmatch(name):
        return None
    directory = Path(settings.VISITOR_ASSETS_DIR).resolve()
    candidate = (directory / name).resolve()
    if candidate.parent != directory or not candidate.is_file():
        return None
    return candidate


def entitled(apps: tuple[str, ...], app_id: str) -> bool:
    return app_id in apps
