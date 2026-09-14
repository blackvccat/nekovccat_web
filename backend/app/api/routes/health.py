"""健康检查路由"""
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from app.config import settings

router = APIRouter()


@router.get("/health")
async def health():
    """健康检查端点"""
    return {
        "status": "ok",
        "service": "backend",
        "message": "Backend service is running"
    }


@router.get("/ready")
async def ready(request: Request):
    """Check local dependencies without generating a paid model request."""
    manager = getattr(request.app.state, "runtime_manager", None)
    production = settings.ENVIRONMENT == "production"
    checks = {
        "agent_configuration": bool(manager and manager.ready),
        "proxy_authentication": not production or len(settings.INTERNAL_API_TOKEN or "") >= 32,
        "quota_storage": not production or await request.app.state.quota_store.ready(),
        "application_database": bool(request.app.state.database_ready),
    }
    available = all(checks.values())
    return JSONResponse({"status": "ready" if available else "unavailable", "checks": checks},
                        status_code=200 if available else 503, headers={"Cache-Control": "no-store"})
