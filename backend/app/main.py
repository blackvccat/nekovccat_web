"""FastAPI 应用入口"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import init_db, close_db
from app.api.routes import chat, health


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时执行
    if settings.ENVIRONMENT != "test":
        await init_db()
    yield
    # 关闭时执行
    await close_db()


# 创建 FastAPI 应用
app = FastAPI(
    title="Nekovccat Agent API",
    description="Agent 聊天后端 API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# CORS 配置 - 允许 Next.js 前端访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])


@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "Nekovccat Agent API",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "ok", "service": "backend"}

