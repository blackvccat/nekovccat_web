"""FastAPI 应用入口"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import sqlite3

from app.config import settings
from app.security import ChatProtectionMiddleware
from app.database import init_db, close_db
from app.api.routes import chat, health
from app.observability import RequestTelemetryMiddleware, log_event
from app.services.quota_store import ConcurrencyLimiter, QuotaStore
from app.services.runtime_manager import AgentRuntimeManager

quota_store = QuotaStore(settings)
limiter = ConcurrencyLimiter(settings.CHAT_MAX_CONCURRENT, settings.CHAT_QUEUE_MAX_SIZE,
                             settings.CHAT_QUEUE_WAIT_SECONDS)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    manager = AgentRuntimeManager(settings)
    app.state.runtime_manager = manager
    app.state.database_ready = await init_db()
    if settings.ENVIRONMENT == "production":
        try:
            await quota_store.initialize()
        except (sqlite3.Error, OSError):
            log_event("quota_storage", outcome="unavailable")
    await manager.initialize()
    try:
        yield
    finally:
        await manager.shutdown()
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

app.state.runtime_manager = None
app.state.quota_store = quota_store
app.state.database_ready = not settings.DATABASE_ENABLED
app.add_middleware(ChatProtectionMiddleware, quota_store=quota_store, limiter=limiter)
app.add_middleware(RequestTelemetryMiddleware)

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
