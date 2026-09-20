"""后端持有的访客应用：**一个应用一个文件夹**，界面与素材都由服务器在登录后下发。

目录约定（与桌面端 `frontend/apps/` 对齐，方便一包一包地移植）：

    VISITOR_APPS_DIR/
    └── <id>/
        ├── app.json     { apiVersion, id, title, subtitle?, watermark?, icon?, wallpaper?, window?,
        │                   entry, embeds?, permissions? }
        ├── entry 指向的 HTML（以及它引用的 js/css/图片）
        └── assets/      应用私有素材（icon / wallpaper 引用的文件）

移植一个应用 = 复制这个文件夹到对方的 `VISITOR_APPS_DIR`，再给对方访客账号授权这个 id：
不用改代码、不用重新编译、前端一个文件都不用动。

前端登录前只知道「有哪些应用可以打开」；界面、素材、数据与文件都要先经授权校验（`X-Marcus-Visitor`）才会返回。
"""
from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass
from pathlib import Path

from app.config import settings

# 与桌面应用契约各算各的版本：访客应用是服务器下发的应用，桌面应用是编译进前端的插件。
APP_API_VERSION = 1
MANIFEST_FILE = "app.json"
ASSETS_DIRNAME = "assets"
MAX_APPS = 32
APP_ID = re.compile(r"^[a-z0-9][a-z0-9-]{0,31}$")
ASSET_FILE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$")
ASSET_KINDS = ("wallpaper", "icon")
# 应用可申请的能力白名单，以及允许内嵌的第三方源。
APP_PERMISSIONS = ("files", "data")
EMBED_ORIGIN = re.compile(r"^https://[A-Za-z0-9.-]{1,253}$")
MAX_EMBEDS = 12
MAX_TEXT = 4000

DEFAULT_WINDOW = (560, 580)
MIN_WINDOW = (320, 320)
MAX_WINDOW = (1600, 1200)
APPLICATION_KEYS = {"apiVersion", "id", "title", "subtitle", "icon", "wallpaper", "watermark",
                    "window", "entry", "embeds", "permissions"}

logger = logging.getLogger(__name__)


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
    width: int
    height: int
    entry: str
    embeds: tuple[str, ...] = ()
    permissions: frozenset[str] = frozenset()

    def metadata(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "subtitle": self.subtitle,
            "watermark": self.watermark or "",
            "hasIcon": bool(self.icon),
            "hasWallpaper": bool(self.wallpaper),
            "window": {"width": self.width, "height": self.height},
        }


def _text(value: object, *, limit: int = MAX_TEXT, required: bool = True) -> str | None:
    if value is None and not required:
        return None
    if not isinstance(value, str) or (required and not value.strip()) or len(value) > limit:
        raise VisitorAppsUnavailable("访客应用配置无效，请联系站点管理员。")
    return value


def _window(value: object) -> tuple[int, int]:
    """窗口尺寸可选；不写就用默认值。桌面按它开窗，尺寸也属于「登录后下发」的数据。"""
    if value is None:
        return DEFAULT_WINDOW
    if not isinstance(value, dict) or set(value) - {"width", "height"}:
        raise VisitorAppsUnavailable("访客应用配置无效，请联系站点管理员。")
    width, height = value.get("width"), value.get("height")
    for size in (width, height):
        if not isinstance(size, int) or isinstance(size, bool):
            raise VisitorAppsUnavailable("访客应用配置无效，请联系站点管理员。")
    if not (MIN_WINDOW[0] <= width <= MAX_WINDOW[0] and MIN_WINDOW[1] <= height <= MAX_WINDOW[1]):
        raise VisitorAppsUnavailable("访客应用配置无效，请联系站点管理员。")
    return width, height


def _entry(value: object) -> str:
    """`entry` 指向应用文件夹里的 HTML 入口——访客应用都是「真实应用」。"""
    if not isinstance(value, str) or not ASSET_FILE.fullmatch(value) or not value.lower().endswith(".html"):
        raise VisitorAppsUnavailable("访客应用配置无效，请联系站点管理员。")
    return value


def _embeds(value: object) -> tuple[str, ...]:
    """允许这个应用内嵌的第三方源（https origin），用于 shell 的 frame-src。"""
    if value is None:
        return ()
    if not isinstance(value, list) or len(value) > MAX_EMBEDS:
        raise VisitorAppsUnavailable("访客应用配置无效，请联系站点管理员。")
    origins: list[str] = []
    for item in value:
        if not isinstance(item, str) or not EMBED_ORIGIN.fullmatch(item):
            raise VisitorAppsUnavailable("访客应用配置无效，请联系站点管理员。")
        if item not in origins:
            origins.append(item)
    return tuple(origins)


def _permissions(value: object) -> frozenset[str]:
    """应用可以申请的能力：上传文件（files）、键值数据（data）。不写就都没有。"""
    if value is None:
        return frozenset()
    if not isinstance(value, list) or any(item not in APP_PERMISSIONS for item in value):
        raise VisitorAppsUnavailable("访客应用配置无效，请联系站点管理员。")
    return frozenset(value)


def parse_app(value: object, *, folder: str | None = None) -> VisitorApp:
    """Validate one `app.json`. `folder` is the directory name, which must equal the app id."""
    if not isinstance(value, dict):
        raise VisitorAppsUnavailable("访客应用配置无效，请联系站点管理员。")
    if set(value) - APPLICATION_KEYS:
        raise VisitorAppsUnavailable("访客应用配置无效，请联系站点管理员。")
    if value.get("apiVersion") != APP_API_VERSION:
        raise VisitorAppsUnavailable("访客应用配置无效，请联系站点管理员。")
    app_id = value.get("id")
    if not isinstance(app_id, str) or not APP_ID.fullmatch(app_id):
        raise VisitorAppsUnavailable("访客应用配置无效，请联系站点管理员。")
    if folder is not None and app_id != folder:
        raise VisitorAppsUnavailable("访客应用配置无效，请联系站点管理员。")
    icon, wallpaper = value.get("icon"), value.get("wallpaper")
    for name in (icon, wallpaper):
        if name is not None and (not isinstance(name, str) or not ASSET_FILE.fullmatch(name)):
            raise VisitorAppsUnavailable("访客应用配置无效，请联系站点管理员。")
    width, height = _window(value.get("window"))
    return VisitorApp(
        id=app_id,
        title=_text(value.get("title"), limit=120),
        subtitle=_text(value.get("subtitle"), limit=200, required=False) or "",
        icon=icon,
        wallpaper=wallpaper,
        watermark=_text(value.get("watermark"), limit=120, required=False),
        width=width,
        height=height,
        entry=_entry(value.get("entry")),
        embeds=_embeds(value.get("embeds")),
        permissions=_permissions(value.get("permissions")),
    )


def load_apps() -> dict[str, VisitorApp]:
    """Scan `VISITOR_APPS_DIR`: one subdirectory per app, each with an `app.json`.

    一个应用坏掉就整份失败（fail closed），但**契约版本对不上的应用只跳过并记日志**——
    这样把一个新版本应用复制到旧站点，不会连带把其它访客应用一起打死。
    """
    directory = Path(settings.VISITOR_APPS_DIR)
    if not directory.is_dir():
        raise VisitorAppsUnavailable("访客应用尚未配置，请联系站点管理员。")
    apps: dict[str, VisitorApp] = {}
    for child in sorted(directory.iterdir(), key=lambda item: item.name):
        if not child.is_dir() or child.name.startswith((".", "_")):
            continue
        manifest = child / MANIFEST_FILE
        if not manifest.is_file():
            raise VisitorAppsUnavailable("访客应用配置无效，请联系站点管理员。")
        try:
            raw = json.loads(manifest.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            raise VisitorAppsUnavailable("访客应用配置无效，请联系站点管理员。") from None
        version = raw.get("apiVersion") if isinstance(raw, dict) else None
        if version != APP_API_VERSION:
            logger.warning("跳过访客应用 %s：apiVersion=%r，宿主支持 %d", child.name, version, APP_API_VERSION)
            continue
        app = parse_app(raw, folder=child.name)
        if app.id in apps:
            raise VisitorAppsUnavailable("访客应用存在重复 id，请联系站点管理员。")
        apps[app.id] = app
        if len(apps) > MAX_APPS:
            raise VisitorAppsUnavailable("访客应用过多，请联系站点管理员。")
    return apps


def _app_dir(app: VisitorApp) -> Path:
    return (Path(settings.VISITOR_APPS_DIR) / app.id).resolve()


def entry_file(app: VisitorApp) -> Path | None:
    """应用的 HTML 入口，只在应用自己的文件夹里解析。"""
    directory = _app_dir(app)
    candidate = (directory / app.entry).resolve()
    if candidate.parent != directory or not candidate.is_file():
        return None
    return candidate


def static_file(app: VisitorApp, relative: str) -> Path | None:
    """应用自带的静态文件（js/css/图片…），限定在该应用文件夹内，且不暴露 app.json。"""
    parts = [part for part in relative.split("/") if part not in ("", ".")]
    if not parts or any(part == ".." for part in parts):
        return None
    directory = _app_dir(app)
    candidate = directory.joinpath(*parts).resolve()
    if candidate == directory or directory not in candidate.parents:
        return None
    if candidate.name == MANIFEST_FILE or not candidate.is_file():
        return None
    return candidate


def app_asset(app: VisitorApp, kind: str) -> Path | None:
    """Resolve one private asset inside **its own** `assets/` directory; nothing else is reachable."""
    if kind not in ASSET_KINDS:
        return None
    name = app.wallpaper if kind == "wallpaper" else app.icon
    if not name or not ASSET_FILE.fullmatch(name):
        return None
    directory = (_app_dir(app) / ASSETS_DIRNAME)
    candidate = (directory / name).resolve()
    if candidate.parent != directory or not candidate.is_file():
        return None
    return candidate


def entitled(apps: tuple[str, ...], app_id: str) -> bool:
    return app_id in apps
