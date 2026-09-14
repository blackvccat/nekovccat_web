"""Atomic rolling quotas in SQLite; every database operation runs off the event loop."""
import asyncio
from collections import OrderedDict
from contextlib import closing
from dataclasses import dataclass
import math
from pathlib import Path
import sqlite3
import threading
import time

from app.config import Settings


@dataclass(frozen=True)
class QuotaRejection:
    message: str
    retry_after: int
    code: str


class QuotaStore:
    def __init__(self, config: Settings):
        self.config = config
        self.path = Path(config.CHAT_LIMIT_DB).resolve()
        self._init_lock = threading.Lock()
        self._initialized = False
        self._last_cleanup = 0.0
        # Admission hints only; SQLite remains the atomic source of truth.
        self._blocked_ips: OrderedDict[str, tuple[float, QuotaRejection]] = OrderedDict()
        self._blocked_global: tuple[float, QuotaRejection] | None = None

    def _connect(self):
        return sqlite3.connect(self.path, timeout=self.config.CHAT_SQLITE_TIMEOUT_SECONDS)

    def _initialize(self):
        with self._init_lock:
            if self._initialized:
                return
            self.path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
            deadline = time.monotonic() + self.config.CHAT_SQLITE_TIMEOUT_SECONDS
            while True:
                try:
                    with closing(self._connect()) as db, db:
                        db.execute("PRAGMA journal_mode=WAL")
                        db.execute("CREATE TABLE IF NOT EXISTS requests (ip TEXT NOT NULL, ts REAL NOT NULL)")
                        db.execute("CREATE INDEX IF NOT EXISTS requests_ts ON requests(ts)")
                        db.execute("CREATE INDEX IF NOT EXISTS requests_ip_ts ON requests(ip, ts)")
                    self._initialized = True
                    return
                except sqlite3.OperationalError as exc:
                    # journal_mode can report BUSY immediately during another
                    # process's startup, even with SQLite's busy_timeout set.
                    remaining = deadline - time.monotonic()
                    if getattr(exc, "sqlite_errorcode", None) not in {sqlite3.SQLITE_BUSY, sqlite3.SQLITE_LOCKED} or remaining <= 0:
                        raise
                    time.sleep(min(0.025, remaining))  # This is a worker thread.

    async def initialize(self):
        await asyncio.to_thread(self._initialize)

    def _window_blocks(self, db, identity, now, counts):
        windows = (
            (None, 86400, self.config.CHAT_DAILY_LIMIT, counts[0], "daily_quota",
             "全站最近 24 小时的 Agent 使用额度已达上限，额度会随旧请求到期逐步恢复。"),
            (identity, 60, self.config.CHAT_IP_MINUTE_LIMIT, counts[1], "frequency_quota",
             "当前网络最近 1 分钟的消息有些频繁，请稍后再试。"),
            (identity, 3600, self.config.CHAT_IP_HOUR_LIMIT, counts[2], "frequency_quota",
             "当前网络最近 1 小时的 Agent 使用次数已达上限，请稍后再试。"),
            (identity, 86400, self.config.CHAT_IP_DAILY_LIMIT, counts[3], "frequency_quota",
             "当前网络最近 24 小时的 Agent 使用次数已达上限，额度会逐步恢复。"),
        )
        blocks = []
        for key, period, limit, count, code, message in windows:
            if count < limit:
                continue
            # If an operator lowers a limit, enough old rows must expire to
            # leave room for one new request, not merely the very oldest row.
            where = "ts > ?" if key is None else "ip = ? AND ts > ?"
            params = (now - period,) if key is None else (key, now - period)
            timestamp = db.execute(f"SELECT ts FROM requests WHERE {where} ORDER BY ts LIMIT 1 OFFSET ?",
                                   (*params, count - limit)).fetchone()[0]
            retry_at = timestamp + period
            retry = max(1, math.ceil(retry_at - now))
            blocks.append((key, retry_at, QuotaRejection(message, retry, code)))
        return blocks

    def _consume(self, identity: str, now: float):
        self._initialize()  # Normally already initialized by lifespan; also safe in isolated tests.
        with closing(self._connect()) as db, db:
            db.execute("BEGIN IMMEDIATE")
            monotonic_now = time.monotonic()
            if monotonic_now - self._last_cleanup >= self.config.CHAT_QUOTA_CLEANUP_SECONDS:
                db.execute("DELETE FROM requests WHERE ts <= ?", (now - 86400,))
                self._last_cleanup = monotonic_now
            day = db.execute("SELECT count(*) FROM requests WHERE ts > ?", (now - 86400,)).fetchone()[0]
            minute, hour, ip_day = db.execute(
                "SELECT coalesce(sum(ts > ?), 0), coalesce(sum(ts > ?), 0), count(*) "
                "FROM requests WHERE ip = ? AND ts > ?",
                (now - 60, now - 3600, identity, now - 86400),
            ).fetchone()
            counts = (day, minute, hour, ip_day)
            blocks = self._window_blocks(db, identity, now, counts)
            if blocks:
                return max(blocks, key=lambda block: block[1])[2], blocks
            db.execute("INSERT INTO requests(ip, ts) VALUES (?, ?)", (identity, now))
            # Remember limits reached by this accepted request so the next
            # attempt can be rejected before occupying a queue or SQLite task.
            blocks = self._window_blocks(db, identity, now, tuple(count + 1 for count in counts))
        return None, blocks

    async def consume(self, identity: str, now: float | None = None) -> QuotaRejection | None:
        rejection, blocks = await asyncio.to_thread(self._consume, identity, time.time() if now is None else now)
        for key, retry_at, block in blocks:
            if key is None:
                if self._blocked_global is None or retry_at > self._blocked_global[0]:
                    self._blocked_global = (retry_at, block)
            else:
                previous = self._blocked_ips.get(key)
                if previous is None or retry_at > previous[0]:
                    self._blocked_ips[key] = (retry_at, block)
                self._blocked_ips.move_to_end(key)
                while len(self._blocked_ips) > self.config.CHAT_ATTEMPT_CACHE_SIZE:
                    self._blocked_ips.popitem(last=False)
        return rejection

    def blocked(self, identity: str, now: float | None = None) -> QuotaRejection | None:
        """Bounded, read-only cache check; never starts a database operation."""
        now = time.time() if now is None else now
        blocks = [block for block in (self._blocked_global, self._blocked_ips.get(identity))
                  if block is not None and block[0] > now]
        if not blocks:
            self._blocked_ips.pop(identity, None)
            return None
        retry_at, block = max(blocks, key=lambda item: item[0])
        return QuotaRejection(block.message, max(1, math.ceil(retry_at - now)), block.code)

    def _probe(self):
        if not self._initialized:
            return False
        try:
            # Do not recreate a deleted database during a readiness probe.
            with closing(sqlite3.connect(self.path.as_uri() + "?mode=rw", uri=True,
                                         timeout=self.config.CHAT_SQLITE_TIMEOUT_SECONDS)) as db:
                db.execute("SELECT 1 FROM requests LIMIT 1").fetchone()
            return True
        except (OSError, sqlite3.Error):
            return False

    async def ready(self) -> bool:
        return await asyncio.to_thread(self._probe)


@dataclass
class AdmissionTicket:
    identity: str
    ready: asyncio.Future
    deadline: float
    queued: bool


class ConcurrencyLimiter:
    """Bounded FIFO on one ASGI event loop; deploy exactly one backend worker."""
    def __init__(self, maximum: int, queue_maximum: int = 12, wait_seconds: float = 8.0):
        self.maximum = maximum
        self.queue_maximum = queue_maximum
        self.wait_seconds = wait_seconds
        self.active: dict[str, AdmissionTicket] = {}
        self.waiting: OrderedDict[str, AdmissionTicket] = OrderedDict()

    def enter(self, identity: str) -> AdmissionTicket | QuotaRejection:
        # No await between checking and reserving the identity, including while
        # its body is being read. Duplicate requests cannot spawn more work.
        if identity in self.active or identity in self.waiting:
            return QuotaRejection("当前网络已有一条消息正在回复或排队，请等待完成。", 10, "concurrency")
        self._promote()
        queued = len(self.active) >= self.maximum or bool(self.waiting)
        if queued and len(self.waiting) >= self.queue_maximum:
            return QuotaRejection("Agent 当前排队人数较多，请稍后手动重试。", 10, "queue_full")
        ticket = AdmissionTicket(identity, asyncio.get_running_loop().create_future(),
                                 time.monotonic() + self.wait_seconds, queued)
        if queued:
            self.waiting[identity] = ticket
        else:
            self.active[identity] = ticket
            ticket.ready.set_result(None)
        return ticket

    @staticmethod
    def timeout_rejection():
        return QuotaRejection("Agent 暂时繁忙，排队等待已结束，请稍后手动重试。", 10, "queue_timeout")

    def _promote(self):
        now = time.monotonic()
        while self.waiting:
            identity, ticket = next(iter(self.waiting.items()))
            if ticket.ready.cancelled() or ticket.deadline <= now:
                self.waiting.pop(identity)
                if not ticket.ready.done():
                    ticket.ready.set_result(self.timeout_rejection())
                continue
            if len(self.active) >= self.maximum:
                break
            self.waiting.pop(identity)
            self.active[identity] = ticket
            ticket.ready.set_result(None)

    def release(self, ticket: AdmissionTicket):
        if self.active.get(ticket.identity) is ticket:
            self.active.pop(ticket.identity)
        if self.waiting.get(ticket.identity) is ticket:
            self.waiting.pop(ticket.identity)
        if not ticket.ready.done():
            ticket.ready.cancel()
        self._promote()
