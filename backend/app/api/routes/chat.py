"""Site chat endpoints backed by the official DeepSeek Harness runtime."""
import asyncio
import json
from contextlib import aclosing, suppress
from anyio import CancelScope

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from app.schemas.chat import ChatRequest
from app.services.ai_service import AIServiceError
from app.services.chat_service import ChatService
from app.services.relationship_access import create_unlock_proof
from app.config import settings
from app.observability import log_event

router = APIRouter()


class ChatStreamingResponse(StreamingResponse):
    """A stalled socket must not keep an owned model run alive indefinitely."""
    async def stream_response(self, send):
        async def bounded_send(message):
            await asyncio.wait_for(send(message), timeout=settings.CHAT_SEND_TIMEOUT_SECONDS)
        timed_out = False
        try:
            await super().stream_response(bounded_send)
        except TimeoutError:
            timed_out = True
            log_event("chat_stream", outcome="send_timeout")
        finally:
            if hasattr(self.body_iterator, "aclose"):
                # Starlette cancels this task on browser disconnect. Shield the
                # generator close so its owned SDK cleanup can still run.
                with CancelScope(shield=True), suppress(asyncio.CancelledError):
                    await asyncio.shield(self.body_iterator.aclose())
        if timed_out:
            with suppress(TimeoutError, OSError):
                await asyncio.wait_for(send({"type": "http.response.body", "body": b"", "more_body": False}), timeout=1.0)


async def _ordinary_with_disconnect(request: Request, service: ChatService, messages):
    async def watch_disconnect():
        while not await request.is_disconnected():
            await asyncio.sleep(0.2)

    work = asyncio.create_task(service.process_message(messages))
    disconnect = asyncio.create_task(watch_disconnect())
    try:
        finished, _ = await asyncio.wait([work, disconnect], return_when=asyncio.FIRST_COMPLETED)
        if work in finished:
            return work.result()
        raise HTTPException(status_code=499, detail="请求已取消")
    finally:
        for task in (work, disconnect):
            if not task.done():
                task.cancel()
        await asyncio.gather(work, disconnect, return_exceptions=True)


@router.post("/")
async def chat(http_request: Request, request: ChatRequest):
    service = ChatService(runtime_manager=getattr(http_request.app.state, "runtime_manager", None))
    relationship_proof = lambda: create_unlock_proof(
        http_request.headers.get("x-neko-session-id", ""), settings.INTERNAL_API_TOKEN or ""
    )
    try:
        service.validate_messages(request.messages)
        if http_request.query_params.get("stream", "false").lower() != "true":
            response = await _ordinary_with_disconnect(http_request, service, request.messages)
            data = response.model_dump(exclude_none=True)
            if data.get("desktop_action") == "unlock-girlfriend":
                proof = relationship_proof()
                if proof:
                    data["desktop_proof"] = proof
                else:
                    data.pop("desktop_action", None)
            return data
    except AIServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from None
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from None

    async def generate_stream():
        try:
            progressive = http_request.query_params.get("protocol") == "v2"
            async with aclosing(service.ai_service.stream_response(request.messages, progressive=progressive)) as events:
                async for data in events:
                    if data.get("event") == "heartbeat":
                        yield ": keep-alive\n\n"
                        continue
                    if data.get("event") == "desktop" and data.get("action") == "unlock-girlfriend":
                        proof = relationship_proof()
                        if not proof:
                            continue
                        data = {**data, "proof": proof}
                    yield f"data: {json.dumps(data, ensure_ascii=False)}\n\n"
        except AIServiceError as exc:
            yield f"data: {json.dumps({'error': str(exc), 'done': True}, ensure_ascii=False)}\n\n"
        except Exception:
            yield f"data: {json.dumps({'error': '站内 Agent 暂时不可用，请稍后再试。', 'done': True}, ensure_ascii=False)}\n\n"

    return ChatStreamingResponse(generate_stream(), media_type="text/event-stream", headers={
        "Cache-Control": "no-cache", "X-Accel-Buffering": "no",
    })
