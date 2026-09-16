"""Per-username failure lockout for visitor logins, kept beside the chat limits."""
import sqlite3
import threading
import time
from pathlib import Path

_LOCK = threading.Lock()


class LoginFailureStore:
    """Counts failed logins per account name inside a rolling window.

    The window is per username, so rotating client addresses cannot bypass it,
    and a wrong password stops being free after a handful of attempts.
    """

    def __init__(self, path: str, max_failures: int, window_seconds: int):
        self.path = path
        self.max_failures = max(1, max_failures)
        self.window_seconds = max(1, window_seconds)

    def _connect(self) -> sqlite3.Connection:
        path = Path(self.path)
        path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        db = sqlite3.connect(path, timeout=3)
        db.execute("CREATE TABLE IF NOT EXISTS login_failures (username TEXT NOT NULL, ts REAL NOT NULL)")
        db.execute("CREATE INDEX IF NOT EXISTS login_failures_username_ts ON login_failures (username, ts)")
        return db

    def _recent(self, db: sqlite3.Connection, username: str) -> list[float]:
        rows = db.execute(
            "SELECT ts FROM login_failures WHERE username=? AND ts>? ORDER BY ts",
            (username, time.time() - self.window_seconds),
        ).fetchall()
        return [row[0] for row in rows]

    def is_locked(self, username: str) -> bool:
        db = self._connect()
        try:
            return len(self._recent(db, username)) >= self.max_failures
        finally:
            db.close()

    def retry_after(self, username: str) -> int:
        """Seconds until this username has room for another attempt."""
        db = self._connect()
        try:
            recent = self._recent(db, username)
        finally:
            db.close()
        if len(recent) < self.max_failures:
            return 0
        oldest = recent[len(recent) - self.max_failures]
        return max(1, int(oldest + self.window_seconds - time.time()) + 1)

    def record_failure(self, username: str) -> None:
        now = time.time()
        db = self._connect()
        try:
            db.execute("DELETE FROM login_failures WHERE ts < ?", (now - self.window_seconds,))
            db.execute("INSERT INTO login_failures (username, ts) VALUES (?, ?)", (username, now))
            db.commit()
        finally:
            db.close()

    def clear(self, username: str) -> None:
        db = self._connect()
        try:
            db.execute("DELETE FROM login_failures WHERE username=?", (username,))
            db.commit()
        finally:
            db.close()
