"""Bounded thread-to-async stream handoff with coalesced text and wakeups."""
import asyncio
from collections import deque
import json
import threading

from app.services.ai_errors import AIServiceError


class StreamBuffer:
    """The one place where the SDK worker thread hands results to the event loop.

    Two jobs the plain queue this replaced could not do:

    - 水位有界。原来是无界 `asyncio.Queue`：浏览器读得慢，整轮事件就堆在后端内存里，
      而同一台机器上还跑着同进程的其它请求。现在到 `max_events` / `max_bytes` 就整轮失败。
    - 逐帧合并。连续的同一条回复的正文增量并成一个事件（单块上限 4KB），
      SSE 帧因此少两个数量级，前端每帧的工作量也跟着降。

    失败是可见的：`slow_consumer` 挂在流上，而不是悄悄丢正文或假装这一轮成功。
    """

    def __init__(self, loop, max_events: int, max_bytes: int):
        self.loop = loop
        self.max_events, self.max_bytes = max_events, max_bytes
        self._lock = threading.Lock()
        self._items: deque[tuple[dict, int]] = deque()
        self._bytes = 0
        self.peak_bytes = 0
        self._terminal = None
        self._stopped = False
        self._notified = False
        self._ready = asyncio.Event()

    def _wake(self):
        if not self._notified:
            self._notified = True
            try:
                self.loop.call_soon_threadsafe(self._ready.set)
            except RuntimeError:
                self._stopped = True

    def publish(self, event: dict):
        with self._lock:
            if self._stopped:
                return
            size = len(json.dumps(event, ensure_ascii=False).encode("utf-8"))
            if self._items and event.get("content"):
                previous, previous_size = self._items[-1]
                same_reply = (event.get('event') == previous.get('event') and event.get('phase') == previous.get('phase')
                              and event.get('message_id') == previous.get('message_id')
                              and event.get('phase') != 'final')
                if same_reply and previous.get("content") and previous_size + size <= 4096 and self._bytes + size <= self.max_bytes:
                    self._items[-1] = ({**previous, "content": previous["content"] + event["content"]}, previous_size + size)
                    self._bytes += size
                    self.peak_bytes = max(self.peak_bytes, self._bytes)
                    return
            if len(self._items) >= self.max_events or self._bytes + size > self.max_bytes:
                error = AIServiceError("连接接收较慢，请重新发送消息。", 503, "slow_consumer")
                # Fail visibly and cancel the owned run. Never drop text or a done
                # frame and pretend the answer/desktop authorization succeeded.
                self._terminal = ("error", error)
                self._items.clear()
                self._bytes = 0
                self._stopped = True
                self._wake()
                raise error
            self._items.append((event, size))
            self._bytes += size
            self.peak_bytes = max(self.peak_bytes, self._bytes)
            self._wake()

    def finish(self, kind: str, payload):
        with self._lock:
            if self._terminal is not None or self._stopped:
                return
            self._terminal = (kind, payload)
            if kind == "error":
                self._items.clear()
                self._bytes = 0
            self._wake()

    async def get(self, timeout: float):
        async with asyncio.timeout(timeout):
            while True:
                with self._lock:
                    if self._items:
                        event, size = self._items.popleft()
                        self._bytes -= size
                        return "event", event
                    if self._terminal is not None:
                        return self._terminal
                    self._notified = False
                    self._ready.clear()
                await self._ready.wait()

    def stop(self):
        with self._lock:
            self._stopped = True
            self._items.clear()
            self._bytes = 0
