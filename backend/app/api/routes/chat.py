"""聊天 API 路由"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import ChatService

router = APIRouter()


@router.post("/", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: Optional[AsyncSession] = Depends(get_db)
):
    """
    处理聊天消息
    
    - **messages**: 聊天消息列表（包含历史消息）
    - 返回 AI Agent 的响应
    """
    try:
        # 数据库是可选的，聊天服务不依赖数据库
        chat_service = ChatService(db)
        response = await chat_service.process_message(request.messages)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"处理消息时出错: {str(e)}"
        )

