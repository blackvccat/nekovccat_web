"""AI 服务集成"""
from typing import List
import asyncio
from google import genai
from app.schemas.chat import ChatMessage
from app.config import settings


class AIService:
    """AI 服务抽象类 - 使用 Google Gemini API"""
    
    def __init__(self):
        """初始化 Gemini 客户端"""
        self.client = None
        if settings.GEMINI_API_KEY:
            self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        else:
            # 如果没有配置 API Key，使用模拟响应
            print("警告: 未配置 GEMINI_API_KEY，将使用模拟响应")
    
    async def generate_response(self, messages: List[ChatMessage]) -> str:
        """
        生成 AI 响应
        
        Args:
            messages: 聊天消息历史
            
        Returns:
            str: AI 响应内容
        """
        # 如果没有配置 Gemini API Key，返回模拟响应
        if not self.client:
            return self._get_mock_response(messages)
        
        try:
            # 构建对话内容
            # 对于单条消息，直接使用字符串
            # 对于多条消息，构建对话历史字符串
            if len(messages) == 1:
                contents = messages[0].content
            else:
                # 将对话历史格式化为字符串
                conversation = []
                for msg in messages:
                    role_prefix = "用户" if msg.role == "user" else "助手"
                    conversation.append(f"{role_prefix}: {msg.content}")
                contents = "\n".join(conversation)
            
            # 使用 asyncio 在线程池中运行同步的 Gemini API 调用
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=contents
                )
            )
            
            # 提取响应文本
            if hasattr(response, 'text'):
                return response.text
            elif hasattr(response, 'candidates') and response.candidates:
                # 处理可能的响应格式
                candidate = response.candidates[0]
                if hasattr(candidate, 'content'):
                    return candidate.content.parts[0].text
                return str(candidate)
            else:
                return str(response)
                
        except Exception as e:
            # 如果 API 调用失败，返回错误信息和模拟响应
            print(f"Gemini API 调用失败: {str(e)}")
            return self._get_mock_response(messages)
    
    def _get_mock_response(self, messages: List[ChatMessage]) -> str:
        """获取模拟响应（当 API 不可用时）"""
        last_message = messages[-1].content.lower()
        
        # 简单的响应逻辑
        if "hello" in last_message or "hi" in last_message or "你好" in last_message:
            return "Hello! Welcome to My World. I'm your AI agent. How can I help you today?"
        elif "help" in last_message or "帮助" in last_message:
            return "I can help you with:\n- Answering questions\n- Providing information\n- Having conversations\n\nWhat would you like to know?"
        elif "about" in last_message or "关于" in last_message:
            return "This is My World - a creative space where technology meets art. Explore and discover!"
        elif "project" in last_message or "项目" in last_message:
            return "I'm working on various projects including web development, 3D graphics, and AI integration. What interests you?"
        else:
            return f"I understand you said: \"{messages[-1].content}\". That's interesting! Can you tell me more about it?"

