"""聊天 API 路由"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
import json
import asyncio
from app.database import get_db
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import ChatService

router = APIRouter()


@router.post("/")
async def chat(
    http_request: Request,
    request: ChatRequest,
    db: Optional[AsyncSession] = Depends(get_db)
):
    """
    处理聊天消息
    
    - **messages**: 聊天消息列表（包含历史消息）
    - **stream**: 是否使用流式响应（通过查询参数 ?stream=true）
    - 返回 AI Agent 的响应
    """
    try:
        chat_service = ChatService(db)
        
        # 从查询参数获取 stream 值
        stream_param = http_request.query_params.get('stream', 'false').lower()
        stream = stream_param == 'true'
        
        # 调试信息
        print(f"[DEBUG] URL: {http_request.url}")
        print(f"[DEBUG] Query params: {dict(http_request.query_params)}")
        print(f"[DEBUG] stream_param: {stream_param}, stream: {stream}")
        
        # 如果请求流式响应
        if stream:
            async def generate_stream():
                try:
                    # 获取完整响应
                    response = await chat_service.process_message(request.messages)
                    content = response.content
                    
                    # 模拟流式输出，逐字符发送
                    chunk_size = 3  # 每次发送3个字符，实现打字机效果
                    for i in range(0, len(content), chunk_size):
                        chunk = content[i:i + chunk_size]
                        data = {
                            "content": chunk,
                            "done": i + chunk_size >= len(content)
                        }
                        yield f"data: {json.dumps(data, ensure_ascii=False)}\n\n"
                        # 添加小延迟，模拟实时效果
                        await asyncio.sleep(0.05)
                except Exception as e:
                    # 发送错误信息
                    error_data = {
                        "error": str(e),
                        "done": True
                    }
                    yield f"data: {json.dumps(error_data, ensure_ascii=False)}\n\n"
            
            return StreamingResponse(
                generate_stream(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no"
                }
            )
        else:
            # 非流式响应（保持向后兼容）
            response = await chat_service.process_message(request.messages)
            return response
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"处理消息时出错: {str(e)}"
        )

