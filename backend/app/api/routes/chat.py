"""Site chat endpoints backed by the official DeepSeek Harness runtime."""
import asyncio
import json

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from app.schemas.chat import ChatRequest
from app.services.ai_service import AIServiceError
from app.services.chat_service import ChatService

router = APIRouter()


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
    # 进程级运行时由 lifespan 放在 app.state 上；没有它（不跑 lifespan 的调用）时 AIService 自建一份。
    service = ChatService(runtime_manager=getattr(http_request.app.state, "runtime_manager", None))
    try:
        service.validate_messages(request.messages)
        if http_request.query_params.get("stream", "false").lower() != "true":
            response = await _ordinary_with_disconnect(http_request, service, request.messages)
            return response.model_dump(exclude_none=True)
    except AIServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from None
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from None

    async def generate_stream():
        # 带 protocol=v2 的请求走替换语义（progress / reply(delta|final)）；其它请求协议不变。
        progressive = http_request.query_params.get("protocol") == "v2"
        try:
            async for data in service.ai_service.stream_response(request.messages, progressive=progressive):
                if data.get("event") == "heartbeat":
                    # SSE 注释行：中间层只要看到字节就重置空闲计时，长轮次因此不会被误判成断流。
                    yield ": keep-alive\n\n"
                    continue
                yield f"data: {json.dumps(data, ensure_ascii=False)}\n\n"
        except AIServiceError as exc:
            yield f"data: {json.dumps({'error': str(exc), 'done': True}, ensure_ascii=False)}\n\n"
        except Exception:
            yield f"data: {json.dumps({'error': '站内 Agent 暂时不可用，请稍后再试。', 'done': True}, ensure_ascii=False)}\n\n"

    return StreamingResponse(generate_stream(), media_type="text/event-stream", headers={
        "Cache-Control": "no-cache", "X-Accel-Buffering": "no",
    })
