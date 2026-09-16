"""健康检查路由"""
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import database_ready
from app.security import quota_storage_ready

router = APIRouter()


@router.get("/health")
async def health():
    """健康检查端点（只证明进程活着）"""
    return {
        "status": "ok",
        "service": "backend",
        "message": "Backend service is running"
    }


@router.get("/ready")
async def ready(request: Request):
    """就绪检查：不使用付费模型的前提下，逐项确认真的能服务。

    /health 只说明进程活着；配置缺了、配额库写不进去、数据库连不上，它都照样回 200。
    发布时要问的是"这份版本能服务吗"，所以四项都要过，否则 503 并列出原因。

    agent 那一项读的是启动时准备好的运行时状态（`lifespan` 里已经 prepare 过一次），
    所以探针本身不会拉起子进程、也不会碰模型。
    """
    manager = getattr(request.app.state, "runtime_manager", None)
    production = settings.ENVIRONMENT == "production"
    checks = {
        "agent_configuration": bool(manager is not None and manager.ready),
        "proxy_authentication": not production or len(settings.INTERNAL_API_TOKEN or "") >= 32,
        "quota_storage": not production or quota_storage_ready(settings),
        "application_database": await database_ready(),
    }
    available = all(checks.values())
    return JSONResponse(
        {"status": "ready" if available else "unavailable", "checks": checks},
        status_code=200 if available else 503,
        headers={"Cache-Control": "no-store"},
    )
