"""Authenticate, shed abusive attempts, and queue bounded normal chat traffic."""
import asyncio
import hashlib
import hmac
import ipaddress
import sqlite3
import time
from pydantic import ValidationError
from starlette.responses import JSONResponse

from app.config import settings
from app.observability import log_event
from app.schemas.chat import ChatRequest
from app.services.attempt_guard import AttemptGuard
from app.services.quota_store import ConcurrencyLimiter, QuotaRejection, QuotaStore


class Disconnected(Exception):
    pass


class InvalidBody(Exception):
    def __init__(self, status):
        self.status = status


class ChatProtectionMiddleware:
    def __init__(self, app, config=None, quota_store=None, limiter=None, attempt_guard=None):
        self.app = app
        self.config = config or settings
        self.quota_store = quota_store or QuotaStore(self.config)
        self.limiter = limiter or ConcurrencyLimiter(self.config.CHAT_MAX_CONCURRENT,
                                                    self.config.CHAT_QUEUE_MAX_SIZE,
                                                    self.config.CHAT_QUEUE_WAIT_SECONDS)
        self.attempt_guard = attempt_guard or AttemptGuard(self.config)
        self.active = self.limiter.active

    async def _read_body(self, headers, receive):
        if not headers.get(b"content-type", b"").lower().startswith(b"application/json"):
            raise InvalidBody(415)
        try:
            length = int(headers.get(b"content-length", b"0"))
        except ValueError:
            raise InvalidBody(400) from None
        if length < 0 or length > self.config.CHAT_BODY_MAX_BYTES:
            raise InvalidBody(413)
        body = bytearray()
        async with asyncio.timeout(self.config.CHAT_BODY_TIMEOUT_SECONDS):
            while True:
                event = await receive()
                if event["type"] == "http.disconnect":
                    raise Disconnected()
                if event["type"] != "http.request":
                    raise InvalidBody(400)
                chunk = event.get("body", b"")
                if len(body) + len(chunk) > self.config.CHAT_BODY_MAX_BYTES:
                    raise InvalidBody(413)
                body.extend(chunk)
                if not event.get("more_body", False):
                    break
        try:
            request = ChatRequest.model_validate_json(body)
        except ValidationError:
            raise InvalidBody(422) from None
        if (request.messages[-1].role != "user"
                or any(not message.content.strip() for message in request.messages)
                or sum(len(message.content) for message in request.messages) > 24000):
            raise InvalidBody(422)
        return bytes(body)

    async def _wait_for_slot(self, ticket, receive):
        if not ticket.queued:
            return ticket.ready.result()

        async def watch_disconnect():
            while True:
                if (await receive())["type"] == "http.disconnect":
                    return

        disconnect = asyncio.create_task(watch_disconnect())
        try:
            completed, _ = await asyncio.wait((ticket.ready, disconnect),
                                               timeout=max(0, ticket.deadline - time.monotonic()),
                                               return_when=asyncio.FIRST_COMPLETED)
            # Prefer cancellation when a released slot and disconnect race.
            if disconnect in completed:
                raise Disconnected()
            if ticket.ready in completed:
                return ticket.ready.result()
            return self.limiter.timeout_rejection()
        finally:
            disconnect.cancel()
            await asyncio.gather(disconnect, return_exceptions=True)

    async def __call__(self, scope, receive, send):
        if (scope["type"] != "http" or scope["path"] not in {"/api/chat", "/api/chat/"}
                or scope.get("method") != "POST" or self.config.ENVIRONMENT != "production"):
            return await self.app(scope, receive, send)
        headers = dict(scope.get("headers", []))
        expected = self.config.INTERNAL_API_TOKEN or ""
        provided = headers.get(b"x-neko-internal-token", b"").decode("latin1")

        async def reject(message, status, retry=60, code="unauthorized"):
            log_event("chat_rejected", code=code, status=status, active=len(self.active), queued=len(self.limiter.waiting))
            await JSONResponse({"detail": message, "code": code, "retry_after": retry}, status_code=status,
                               headers={"Cache-Control": "no-store", "Retry-After": str(retry)})(scope, receive, send)

        if len(expected) < 32:
            return await reject("站内 Agent 正在维护。", 503, code="configuration")
        if not hmac.compare_digest(provided.encode(), expected.encode()):
            return await reject("请通过本站 Agent 访问。", 403)
        try:
            raw_ip = headers.get(b"x-neko-client-ip", b"").decode("ascii")
            # The authenticated proxy deliberately groups all visitors as one
            # identity when no trusted external IP provider is configured.
            ip = "local" if raw_ip == "local" else ipaddress.ip_address(raw_ip)
            if isinstance(ip, ipaddress.IPv6Address):
                ip = ip.ipv4_mapped or ipaddress.IPv6Network((ip, 64), strict=False).network_address
        except (ValueError, UnicodeDecodeError):
            return await reject("请从本站公网入口访问 Agent。", 403)
        identity = hmac.new(expected.encode(), str(ip).encode("ascii"), hashlib.sha256).hexdigest()
        rejection = self.attempt_guard.check(identity) or self.quota_store.blocked(identity)
        if rejection:
            return await reject(rejection.message, 429, rejection.retry_after, rejection.code)
        ticket = self.limiter.enter(identity)
        if isinstance(ticket, QuotaRejection):
            return await reject(ticket.message, 429, ticket.retry_after, ticket.code)
        charge = None
        try:
            started = time.monotonic()
            try:
                body = await self._read_body(headers, receive)
            except InvalidBody as exc:
                return await reject("消息太长或格式无效，请缩短消息或开启新对话。", exc.status, 0, "invalid_request")
            except TimeoutError:
                return await reject("读取消息超时，请稍后再试。", 408, 1, "body_timeout")
            rejection = await self._wait_for_slot(ticket, receive)
            if rejection:
                return await reject(rejection.message, 429, rejection.retry_after, rejection.code)
            # Check newly cached limits again after waiting. Only running slots
            # may start SQLite work, and the actual reservation remains atomic.
            rejection = self.quota_store.blocked(identity)
            if rejection:
                return await reject(rejection.message, 429, rejection.retry_after, rejection.code)
            charge = asyncio.create_task(self.quota_store.consume(identity))
            try:
                rejection = await asyncio.shield(charge)
            except (sqlite3.Error, OSError):
                return await reject("站内 Agent 正在维护，请稍后再试。", 503, code="quota_storage")
            log_event("chat_admission", duration_ms=round((time.monotonic() - started) * 1000, 2),
                      active=len(self.active), queued=len(self.limiter.waiting), waited=ticket.queued)
            if rejection:
                return await reject(rejection.message, 429, rejection.retry_after, rejection.code)
            replayed = False
            async def replay_receive():
                nonlocal replayed
                if not replayed:
                    replayed = True
                    return {"type": "http.request", "body": body, "more_body": False}
                return await receive()
            # Both public spellings execute the same route without a charged
            # redirect followed by a second charged POST.
            scope = {**scope, "path": "/api/chat/", "raw_path": b"/api/chat/"}
            await self.app(scope, replay_receive, send)
        except Disconnected:
            log_event("chat_admission", outcome="disconnected", active=len(self.active), queued=len(self.limiter.waiting))
            return await reject("请求已取消。", 499, 0, "cancelled")
        finally:
            # Keep admission until an in-flight SQLite reservation has finished.
            deferred_release = False
            try:
                if charge is not None and not charge.done():
                    try:
                        await asyncio.shield(charge)
                    except asyncio.CancelledError:
                        deferred_release = True
                        def release_when_done(task):
                            if not task.cancelled():
                                task.exception()  # Retrieve any late storage error.
                            self.limiter.release(ticket)
                        charge.add_done_callback(release_when_done)
                        raise
            finally:
                if not deferred_release:
                    self.limiter.release(ticket)
