"""应用配置管理"""
from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    """应用配置"""
    
    # 数据库
    DATABASE_URL: str = "postgresql://postgres:changeme@localhost:5432/nekovccat_app"
    
    # CORS 配置
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    
    # AI API Keys
    OPENAI_API_KEY: str | None = None
    ANTHROPIC_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None
    
    # 应用配置
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # 服务器配置
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# 解析 CORS_ORIGINS（支持 JSON 字符串格式）
def get_cors_origins() -> List[str]:
    """获取 CORS 允许的来源列表"""
    import os
    cors_origins = os.getenv("CORS_ORIGINS", '["http://localhost:3000"]')
    try:
        # 尝试解析 JSON
        return json.loads(cors_origins)
    except (json.JSONDecodeError, TypeError):
        # 如果不是 JSON，按逗号分割
        return [origin.strip() for origin in cors_origins.split(",")]


settings = Settings()
settings.CORS_ORIGINS = get_cors_origins()

