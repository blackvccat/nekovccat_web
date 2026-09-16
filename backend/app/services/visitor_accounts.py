"""Visitor credentials for the desktop's hidden space.

Passwords are only ever stored as PBKDF2-SHA256 hashes. Accounts come from a
server-side JSON file and/or, when DATABASE_ENABLED is on, from the database:
both sources are read and merged, and a name present in both is refused rather
than resolved. The file is never a fallback for a failed database read, so a
database outage can never silently downgrade the gate.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import re
import secrets
import unicodedata
from dataclasses import dataclass
from pathlib import Path

from app.config import settings

PBKDF2_SCHEME = "pbkdf2_sha256"
PBKDF2_ITERATIONS = 600_000
MIN_ITERATIONS = 50_000
MAX_ITERATIONS = 2_000_000
MAX_USERNAME_LENGTH = 64
MAX_NAME_LENGTH = 64
MAX_PASSWORD_LENGTH = 200
MAX_APPS = 32
ACCOUNT_FIELDS = {"username", "name", "password_hash", "apps", "disabled"}
# Application ids granted to a visitor; the registry in visitor_apps.py decides what they mean.
APP_ID = re.compile(r"^[a-z0-9][a-z0-9-]{0,31}$")

# An unknown username still pays one PBKDF2 round, so response time does not
# reveal whether an account exists. This value protects nothing.
DUMMY_HASH = (
    "pbkdf2_sha256$600000$wG4oAT/sGNnMKm5QPi3xyw==$"
    "3WQG449xA2aGAlsD0g3GdKu8wkaohHxIZnKd17ACtt8="
)


class VisitorAccountsUnavailable(Exception):
    """The visitor store is missing, malformed or unreachable: fail closed."""

    def __init__(self, message: str = "访客名单暂时不可用，请稍后再试。"):
        super().__init__(message)


@dataclass(frozen=True)
class VisitorAccount:
    username: str  # normalised lookup key
    name: str  # display name shown to the visitor
    password_hash: str
    apps: tuple[str, ...] = ()  # applications this visitor may open; empty means none
    disabled: bool = False


def normalize_username(value: str) -> str:
    """Case, width and whitespace variants must not create separate accounts."""
    return unicodedata.normalize("NFKC", value).strip().casefold()


def _b64(value: bytes) -> str:
    return base64.b64encode(value).decode("ascii")


def _unb64(value: str) -> bytes | None:
    try:
        return base64.b64decode(value, validate=True)
    except (ValueError, TypeError):
        return None


def parse_hash(stored: object) -> tuple[int, bytes, bytes] | None:
    if not isinstance(stored, str):
        return None
    parts = stored.split("$")
    if len(parts) != 4 or parts[0] != PBKDF2_SCHEME:
        return None
    try:
        iterations = int(parts[1])
    except ValueError:
        return None
    salt, digest = _unb64(parts[2]), _unb64(parts[3])
    if not MIN_ITERATIONS <= iterations <= MAX_ITERATIONS or not salt or len(digest or b"") != 32:
        return None
    return iterations, salt, digest


def hash_password(password: str, *, iterations: int = PBKDF2_ITERATIONS, salt: bytes | None = None) -> str:
    if not password:
        raise ValueError("password must not be empty")
    salt = secrets.token_bytes(16) if salt is None else salt
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return f"{PBKDF2_SCHEME}${iterations}${_b64(salt)}${_b64(digest)}"


def verify_password(password: str, stored: object) -> bool:
    parsed = parse_hash(stored)
    if parsed is None:
        return False
    iterations, salt, expected = parsed
    candidate = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return hmac.compare_digest(candidate, expected)


def parse_app_ids(value: object) -> tuple[str, ...]:
    """Accept an app list from JSON or the database's comma-separated column."""
    if value is None:
        return ()
    if isinstance(value, str):
        items: list[object] = [item.strip() for item in value.split(",") if item.strip()]
    elif isinstance(value, (list, tuple)):
        items = list(value)
    else:
        raise VisitorAccountsUnavailable("访客名单配置无效，请联系站点管理员。")
    ids: list[str] = []
    for item in items:
        if not isinstance(item, str) or not APP_ID.fullmatch(item):
            raise VisitorAccountsUnavailable("访客名单配置无效，请联系站点管理员。")
        if item not in ids:
            ids.append(item)
    if len(ids) > MAX_APPS:
        raise VisitorAccountsUnavailable("访客名单配置无效，请联系站点管理员。")
    return tuple(ids)


def parse_accounts(raw: object) -> dict[str, VisitorAccount]:
    """Validate the whole document: one malformed entry closes the gate."""
    if not isinstance(raw, dict) or not isinstance(raw.get("visitors"), list):
        raise VisitorAccountsUnavailable("访客名单配置无效，请联系站点管理员。")
    accounts: dict[str, VisitorAccount] = {}
    for entry in raw["visitors"]:
        if not isinstance(entry, dict) or set(entry) - ACCOUNT_FIELDS:
            raise VisitorAccountsUnavailable("访客名单配置无效，请联系站点管理员。")
        username, name, password_hash = entry.get("username"), entry.get("name"), entry.get("password_hash")
        apps, disabled = parse_app_ids(entry.get("apps")), entry.get("disabled", False)
        key = normalize_username(username) if isinstance(username, str) else ""
        if (not key or len(key) > MAX_USERNAME_LENGTH
                or not isinstance(name, str) or not name.strip() or len(name.strip()) > MAX_NAME_LENGTH
                or parse_hash(password_hash) is None or not isinstance(disabled, bool)):
            raise VisitorAccountsUnavailable("访客名单配置无效，请联系站点管理员。")
        if key in accounts:
            raise VisitorAccountsUnavailable("访客名单存在重复账号，请联系站点管理员。")
        accounts[key] = VisitorAccount(username=key, name=name.strip(), password_hash=password_hash, apps=apps, disabled=disabled)
    return accounts


def load_file_accounts(path: str) -> dict[str, VisitorAccount]:
    try:
        raw = json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        raise VisitorAccountsUnavailable("访客名单尚未配置，请联系站点管理员。") from None
    return parse_accounts(raw)


async def _database_accounts() -> dict[str, VisitorAccount]:
    from sqlalchemy import select

    from app.database import get_sessionmaker
    from app.models.visitor import VisitorAccountRecord

    try:
        async with get_sessionmaker()() as session:
            rows = (await session.execute(select(VisitorAccountRecord))).scalars().all()
    except VisitorAccountsUnavailable:
        raise
    except Exception:  # noqa: BLE001 - any driver or connectivity error must fail closed.
        raise VisitorAccountsUnavailable("访客名单暂时不可用，请稍后再试。") from None
    accounts: dict[str, VisitorAccount] = {}
    for row in rows:
        key = normalize_username(row.username or "")
        if key and key not in accounts:
            accounts[key] = VisitorAccount(
                username=key, name=(row.display_name or key), password_hash=row.password_hash or "",
                apps=parse_app_ids(getattr(row, "apps", None)), disabled=bool(row.disabled),
            )
    return accounts


async def _load_accounts() -> dict[str, VisitorAccount]:
    """Merge both sources when both are present: database rows first, then the local file.

    A name that appears in both is refused instead of silently resolved — which password would
    apply is exactly the kind of ambiguity a login gate must not guess at. An absent file means
    "database only", so a deployment that wants no JSON accounts just removes it.
    """
    accounts: dict[str, VisitorAccount] = {}
    if settings.DATABASE_ENABLED:
        accounts.update(await _database_accounts())
    if Path(settings.VISITOR_ACCOUNTS_PATH).is_file():
        for key, account in load_file_accounts(settings.VISITOR_ACCOUNTS_PATH).items():
            if key in accounts:
                raise VisitorAccountsUnavailable("访客名单存在重复账号，请联系站点管理员。")
            accounts[key] = account
    if not any(not account.disabled for account in accounts.values()):
        raise VisitorAccountsUnavailable("访客模式尚未配置，请联系站点管理员。")
    return accounts


async def find_account(username: str) -> VisitorAccount | None:
    if not isinstance(username, str) or not username.strip() or len(username) > MAX_USERNAME_LENGTH:
        return None
    return (await _load_accounts()).get(normalize_username(username))


async def authenticate(username: str, password: str) -> VisitorAccount | None:
    """Return the account only on an exact password match; raise when unavailable."""
    if (not isinstance(username, str) or not isinstance(password, str) or not password
            or len(username) > MAX_USERNAME_LENGTH or len(password) > MAX_PASSWORD_LENGTH):
        return None
    account = await find_account(username)
    matched = verify_password(password, DUMMY_HASH if account is None else account.password_hash)
    if account is None or account.disabled or not matched:
        return None
    return account
