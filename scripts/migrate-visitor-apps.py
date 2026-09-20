#!/usr/bin/env python3
"""把旧的单一 `visitor-apps.json` + 共用素材，迁移成「一个应用一个文件夹」。

迁移后的目录（与桌面端 `frontend/apps/` 同构）：

    work/visitor-apps/<id>/app.json
    work/visitor-apps/<id>/assets/<icon|wallpaper>

之后加/搬应用 = 复制这个文件夹到对方的 `VISITOR_APPS_DIR`，再给对方账号授权该 id；
旧文件默认保留，加 `--archive` 会在成功后改名为 `*.migrated-<时间戳>`。

用法：
    python scripts/migrate-visitor-apps.py --dry-run     # 先看会做什么
    python scripts/migrate-visitor-apps.py --archive     # 真正迁移并归档旧文件
"""
from __future__ import annotations

import argparse
import datetime
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
API_VERSION = 1
# 与 backend/app/services/visitor_apps.py 的 APPLICATION_KEYS 一致；区块协议已删除，这里只搬元数据。
ALLOWED = ("id", "title", "subtitle", "icon", "wallpaper", "watermark", "window", "entry", "embeds", "permissions")


def main() -> int:
    parser = argparse.ArgumentParser(description="迁移访客应用到「一个应用一个文件夹」")
    parser.add_argument("--legacy", default=str(ROOT / "work" / "visitor-apps.json"))
    parser.add_argument("--assets", default=str(ROOT / "work" / "visitor-assets"))
    parser.add_argument("--apps-dir", default=str(ROOT / "work" / "visitor-apps"))
    parser.add_argument("--archive", action="store_true", help="迁移成功后把旧 JSON 改名为 *.migrated-<时间戳>")
    parser.add_argument("--dry-run", action="store_true", help="只打印会做什么，不写任何文件")
    args = parser.parse_args()

    legacy, assets, apps_dir = Path(args.legacy), Path(args.assets), Path(args.apps_dir)
    if not legacy.is_file():
        print(f"旧文件不存在，无需迁移：{legacy}")
        return 0
    try:
        raw = json.loads(legacy.read_text(encoding="utf-8"))
    except ValueError as exc:
        print(f"旧文件不是合法 JSON：{exc}")
        return 1
    apps = raw.get("apps") if isinstance(raw, dict) else None
    if not isinstance(apps, list):
        print("旧文件格式不对：缺少 apps 数组")
        return 1

    print(f"迁移 {len(apps)} 个应用 -> {apps_dir}{'（dry-run）' if args.dry_run else ''}")
    missing: list[str] = []
    for app in apps:
        if not isinstance(app, dict) or not isinstance(app.get("id"), str):
            print("  错误：有条目缺少字符串 id，已中止（没有写任何文件）")
            return 1
        app_id = app["id"]
        entry: dict = {"apiVersion": API_VERSION}
        for key in ALLOWED:
            if key in app:
                entry[key] = app[key]
        if "entry" not in entry:
            print(f"  {app_id}：旧格式只有区块（view），区块协议已删除——请把它改成真实应用（app.json 写 entry + 一个 index.html），"
                  f"字段见 docs/visitor-app-example/README.md。已跳过。")
            continue
        print(f"  {app_id}")
        if args.dry_run:
            continue
        app_dir = apps_dir / app_id
        (app_dir / "assets").mkdir(parents=True, exist_ok=True)
        (app_dir / "app.json").write_text(json.dumps(entry, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        for key in ("icon", "wallpaper"):
            name = app.get(key)
            if not isinstance(name, str):
                continue
            source = assets / name
            if source.is_file():
                shutil.copy2(source, app_dir / "assets" / name)
            else:
                missing.append(f"{app_id}: {name}")

    if missing:
        print("警告：以下素材没找到，对应应用会少图标/壁纸：")
        for item in missing:
            print(f"  - {item}")
    if args.archive and not args.dry_run:
        stamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
        archived = legacy.with_name(f"{legacy.name}.migrated-{stamp}")
        legacy.rename(archived)
        print(f"旧文件已归档：{archived}")
    print("完成。" if not args.dry_run else "dry-run 结束，未改动任何文件。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
