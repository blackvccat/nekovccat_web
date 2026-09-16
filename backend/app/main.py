"""FastAPI 应用入口"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.security import ChatProtectionMiddleware
from app.database import init_db, close_db
from app.observability import RequestTelemetryMiddleware
from app.services.runtime_manager import AgentRuntimeManager
from app.api.routes import chat, health, music, visitor


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时执行
    # 运行时管理器是进程级的一份：它持有「准备一次」的补丁与在飞租约，放在这里由路由按需取用。
    manager = AgentRuntimeManager(settings)
    app.state.runtime_manager = manager
    if settings.DATABASE_ENABLED and settings.ENVIRONMENT != "test":
        await init_db()
    # 启动就把配置准备一次：补丁缺了、key 没配，应该在 /ready 上暴露，而不是等第一个用户付费时才发现。
    await manager.initialize()
    try:
        yield
    finally:
        # 关闭时执行
        await manager.shutdown()
        if settings.DATABASE_ENABLED:
            await close_db()


# 创建 FastAPI 应用
app = FastAPI(
    title="MK Agent API",
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

# 默认 None：不跑 lifespan 的场景（测试、一次性调用）里路由会自建一份运行时。
app.state.runtime_manager = None
app.add_middleware(ChatProtectionMiddleware)
# 遥测在最外层：被拒绝的请求也要有 status / 耗时 / 请求 id 的记账。
app.add_middleware(RequestTelemetryMiddleware)

# 注册路由
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(visitor.router, prefix="/api/visitor", tags=["visitor"])
app.include_router(music.router, prefix="/api/music", tags=["music"])


@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "MK Agent API",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "ok", "service": "backend"}
