"""聊天服务"""
from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.chat import ChatMessage, ChatResponse
from app.services.ai_service import AIService


class ChatService:
    """聊天业务逻辑"""
    
    def __init__(self, db: Optional[AsyncSession] = None):
        self.db = db  # 数据库会话（可选，当前未使用）
        self.ai_service = AIService()
    
    async def process_message(
        self, 
        messages: list[ChatMessage]
    ) -> ChatResponse:
        """
        处理聊天消息并返回 AI 响应
        
        Args:
            messages: 聊天消息列表（包含历史消息）
            
        Returns:
            ChatResponse: AI 响应
        """
        # 验证消息格式
        if not messages:
            raise ValueError("消息列表不能为空")
        
        # 获取最后一条用户消息
        last_message = messages[-1]
        if last_message.role != "user":
            raise ValueError("最后一条消息必须是用户消息")
        
        # 调用 AI 服务生成响应
        # 这里可以添加消息历史存储逻辑
        ai_response = await self.ai_service.generate_response(messages)
        
        # 返回响应
        return ChatResponse(
            role="assistant",
            content=ai_response,
            timestamp=datetime.utcnow().isoformat()
        )

