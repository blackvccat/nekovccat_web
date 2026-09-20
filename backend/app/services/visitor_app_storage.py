"""访客应用的数据与上传文件：都只在服务器侧，按 (应用, 访客) 隔离。

- 键值数据：独立 SQLite（`VISITOR_APP_DATA_DB`），值是 JSON。
- 上传文件：`VISITOR_APP_FILES_DIR/<应用>/<访客>/`。

前端登录前完全没有这些内容；只有登录、且该访客被授权这个应用时，后端才读写。
真实应用（`app.json` 里有 `entry`）通过宿主代理直接调用这些接口，凭据只留在宿主 Cookie 里。
"""
from __future__ import annotations

import contextlib
import json
import re
import sqlite3
import time
from pathlib import Path

from app.config import settings

MAX_KEYS = 200
MAX_KEY_LENGTH = 64
MAX_VALUE_BYTES = 64 * 1024
MAX_FILES = 200
MAX_FILE_BYTES = 8 * 1024 * 1024
KEY_PATTERN = re.compile(r"^[A-Za-z0-9._:-]{1,64}$")
FILE_NAME = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._ -]{0,127}$")


class AppStorageError(Exception):
    """A storage rule was broken (too large, too many, bad name). The route turns it into a 4xx."""

    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


@contextlib.contextmanager
def _connection():
    """Open, migrate and always close — a leaked handle keeps the sqlite file locked on Windows."""
    connection = sqlite3.connect(settings.VISITOR_APP_DATA_DB, timeout=5)
    try:
        connection.execute(
            "CREATE TABLE IF NOT EXISTS visitor_app_data ("
            " app_id TEXT NOT NULL, username TEXT NOT NULL, key TEXT NOT NULL,"
            " value TEXT NOT NULL, updated_at INTEGER NOT NULL,"
            " PRIMARY KEY (app_id, username, key))"
        )
        with connection:
            yield connection
    finally:
        connection.close()


def _key(key: str) -> str:
    if not isinstance(key, str) or not KEY_PATTERN.fullmatch(key):
        raise AppStorageError("键名不合法。")
    return key


def data_all(app_id: str, username: str) -> dict:
    with _connection() as connection:
        rows = connection.execute(
            "SELECT key, value FROM visitor_app_data WHERE app_id=? AND username=?", (app_id, username),
        ).fetchall()
    data: dict = {}
    for name, raw in rows:
        try:
            data[name] = json.loads(raw)
        except ValueError:
            continue
    return data


def data_get(app_id: str, username: str, key: str):
    with _connection() as connection:
        row = connection.execute(
            "SELECT value FROM visitor_app_data WHERE app_id=? AND username=? AND key=?",
            (app_id, username, _key(key)),
        ).fetchone()
    if row is None:
        return None
    try:
        return json.loads(row[0])
    except ValueError:
        return None


def data_set(app_id: str, username: str, key: str, value) -> None:
    name = _key(key)
    try:
        payload = json.dumps(value, ensure_ascii=False)
    except (TypeError, ValueError):
        raise AppStorageError("值必须是可序列化的 JSON。") from None
    if len(payload.encode("utf-8")) > MAX_VALUE_BYTES:
        raise AppStorageError("这条数据太大了。", status=413)
    with _connection() as connection:
        exists = connection.execute(
            "SELECT 1 FROM visitor_app_data WHERE app_id=? AND username=? AND key=?", (app_id, username, name),
        ).fetchone()
        if exists is None:
            count = connection.execute(
                "SELECT COUNT(*) FROM visitor_app_data WHERE app_id=? AND username=?", (app_id, username),
            ).fetchone()[0]
            if count >= MAX_KEYS:
                raise AppStorageError("这个应用的数据条数已达上限。", status=409)
        connection.execute(
            "INSERT INTO visitor_app_data (app_id, username, key, value, updated_at) VALUES (?,?,?,?,?)"
            " ON CONFLICT (app_id, username, key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at",
            (app_id, username, name, payload, int(time.time())),
        )


def data_delete(app_id: str, username: str, key: str) -> bool:
    with _connection() as connection:
        cursor = connection.execute(
            "DELETE FROM visitor_app_data WHERE app_id=? AND username=? AND key=?", (app_id, username, _key(key)),
        )
        return cursor.rowcount > 0


def _files_dir(app_id: str, username: str) -> Path:
    directory = Path(settings.VISITOR_APP_FILES_DIR) / app_id / username
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def _file_name(name: str) -> str:
    if not isinstance(name, str) or not FILE_NAME.fullmatch(name) or name in (".", ".."):
        raise AppStorageError("文件名不合法。")
    return name


def list_files(app_id: str, username: str) -> list[dict]:
    directory = _files_dir(app_id, username)
    items = []
    for path in sorted(directory.iterdir()):
        if path.is_file():
            stat = path.stat()
            items.append({"name": path.name, "size": stat.st_size, "updatedAt": int(stat.st_mtime)})
    return items


def write_file(app_id: str, username: str, name: str, payload: bytes) -> dict:
    if len(payload) > MAX_FILE_BYTES:
        raise AppStorageError("文件太大。", status=413)
    directory = _files_dir(app_id, username)
    safe = _file_name(name)
    if not (directory / safe).exists() and len(list_files(app_id, username)) >= MAX_FILES:
        raise AppStorageError("这个应用的文件数已达上限。", status=409)
    (directory / safe).write_bytes(payload)
    return {"name": safe, "size": len(payload)}


def file_path(app_id: str, username: str, name: str) -> Path | None:
    directory = _files_dir(app_id, username)
    try:
        candidate = (directory / _file_name(name)).resolve()
    except AppStorageError:
        return None
    if candidate.parent != directory or not candidate.is_file():
        return None
    return candidate


def delete_file(app_id: str, username: str, name: str) -> bool:
    path = file_path(app_id, username, name)
    if path is None:
        return False
    path.unlink()
    return True
