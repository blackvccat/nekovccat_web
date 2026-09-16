"""聊天服务"""
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.chat import ChatMessage, ChatResponse
from app.services.ai_service import AIService


class ChatService:
    """聊天业务逻辑"""
    
    def __init__(self, db: Optional[AsyncSession] = None, runtime_manager=None):
        self.db = db  # 数据库会话（可选，当前未使用）
        self.ai_service = AIService(runtime_manager=runtime_manager)
    
    def validate_messages(self, messages: list[ChatMessage]) -> None:
        if not messages:
            raise ValueError("消息列表不能为空")
        if sum(len(message.content) for message in messages) > 24000:
            raise ValueError("对话较长，请开启新对话。")
        if messages[-1].role != "user":
            raise ValueError("最后一条消息必须是用户消息")
        self.ai_service.check_configuration()

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
        self.validate_messages(messages)
        
        # 调用 AI 服务生成响应
        # 这里可以添加消息历史存储逻辑
        ai_response = await self.ai_service.generate_reply(messages)
        
        # 返回响应
        return ChatResponse(
            role="assistant",
            content=ai_response["content"],
            timestamp=datetime.now(timezone.utc).isoformat(),
            desktop_action=ai_response.get("desktop_action"),
        )
