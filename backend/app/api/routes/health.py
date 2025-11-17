"""健康检查路由"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health():
    """健康检查端点"""
    return {
        "status": "ok",
        "service": "backend",
        "message": "Backend service is running"
    }

