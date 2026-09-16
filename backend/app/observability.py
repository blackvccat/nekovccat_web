"""Small, content-free request and stage logs suitable for local or hosted use."""
import asyncio
from contextvars import ContextVar
import json
import logging
import time
from uuid import UUID, uuid4

request_id_context: ContextVar[str] = ContextVar("request_id", default="")
logger = logging.getLogger("marcus.telemetry")
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(message)s"))
    logger.addHandler(handler)
logger.setLevel(logging.INFO)
logger.propagate = False


def log_event(event: str, **fields: str | int | float | bool) -> None:
    # Callers supply fixed labels, timings and counters, never content, credentials,
    # tool arguments, IPs, SDK diagnostics or paths to private data.
    logger.info(json.dumps({"event": event, "request_id": request_id_context.get(), **fields}, ensure_ascii=False))


class RequestTelemetryMiddleware:
    """Accept a caller-supplied request id, echo it back, and log one line per request.

    只对失败与聊天/健康检查记账：访客素材这类正常读取每个文件都写一行会把日志冲淡。
    请求 id 仍然回显给所有响应，前端日志与后端日志靠它对上。
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        supplied = dict(scope.get("headers", [])).get(b"x-request-id", b"").decode("latin1")
        try:
            request_id = str(UUID(supplied))
        except ValueError:
            request_id = str(uuid4())
        token = request_id_context.set(request_id)
        started = time.monotonic()
        status, outcome = 500, "completed"
        path = scope.get("path", "")
        route = "chat" if path.startswith("/api/chat") else "health" if path.endswith(("health", "ready")) else "other"

        async def traced_send(message):
            nonlocal status
            if message["type"] == "http.response.start":
                status = message["status"]
                headers = [(key, value) for key, value in message.get("headers", []) if key.lower() != b"x-request-id"]
                message = {**message, "headers": [*headers, (b"x-request-id", request_id.encode())]}
            await send(message)

        try:
            await self.app(scope, receive, traced_send)
        except asyncio.CancelledError:
            outcome = "cancelled"
            raise
        except Exception:
            outcome = "server_error"
            raise
        finally:
            if status >= 400 or route != "other":
                log_event("http_request", route=route, status=status, outcome=outcome,
                          duration_ms=round((time.monotonic() - started) * 1000, 2))
            request_id_context.reset(token)
