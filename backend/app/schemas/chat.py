"""聊天相关的数据模型"""
from pydantic import BaseModel, Field
from typing import List, Literal


class ChatMessage(BaseModel):
    """聊天消息模型"""
    role: Literal["user", "assistant"] = Field(..., description="消息角色")
    content: str = Field(..., description="消息内容", min_length=1)


class ChatRequest(BaseModel):
    """聊天请求模型"""
    messages: List[ChatMessage] = Field(
        ..., 
        description="聊天消息列表（包含历史消息）",
        min_items=1
    )


class ChatResponse(BaseModel):
    """聊天响应模型"""
    role: Literal["assistant"] = "assistant"
    content: str = Field(..., description="AI 响应内容")
    timestamp: str = Field(..., description="响应时间戳")

