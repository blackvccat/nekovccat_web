"""访客登录与访客应用：密码只在服务器端校验，应用内容只在授权后返回。"""
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse

from app.config import settings
from app.schemas.visitor import VisitorLoginRequest, VisitorLoginResponse
from app.services import visitor_accounts, visitor_apps
from app.services.visitor_access import create_visitor_proof
from app.services.visitor_throttle import LoginFailureStore

router = APIRouter()

# 素材照原样发出去，所以类型要写清楚：<img> 不会猜扩展名，nosniff 下更不会。
MEDIA_TYPES = {".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png",
               ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif"}


def _failures() -> LoginFailureStore:
    return LoginFailureStore(
        settings.CHAT_LIMIT_DB, settings.VISITOR_MAX_FAILURES, settings.VISITOR_FAILURE_WINDOW_SECONDS,
    )


def _visitor_username(request: Request) -> str:
    """The proxy proves who is asking with the shared token plus this header."""
    username = visitor_accounts.normalize_username(request.headers.get("x-marcus-visitor", ""))
    if not username or len(username) > visitor_accounts.MAX_USERNAME_LENGTH:
        raise HTTPException(status_code=401, detail="请先登录访客模式。")
    return username


async def _authorised_account(request: Request):
    try:
        account = await visitor_accounts.find_account(_visitor_username(request))
    except visitor_accounts.VisitorAccountsUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from None
    if account is None or account.disabled:
        raise HTTPException(status_code=401, detail="请先登录访客模式。")
    return account


@router.post("/login", response_model=VisitorLoginResponse)
async def visitor_login(http_request: Request, request: VisitorLoginRequest):
    store = _failures()
    key = visitor_accounts.normalize_username(request.username)
    if key and store.is_locked(key):
        raise HTTPException(
            status_code=429, detail="尝试次数过多，请稍后再试。",
            headers={"Retry-After": str(store.retry_after(key) or settings.VISITOR_FAILURE_WINDOW_SECONDS)},
        )
    try:
        account = await visitor_accounts.authenticate(request.username, request.password)
    except visitor_accounts.VisitorAccountsUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from None
    if account is None:
        if key:
            store.record_failure(key)
        raise HTTPException(status_code=401, detail="访客名或密码不正确。")
    proof = create_visitor_proof(
        http_request.headers.get("x-marcus-session-id", ""), settings.INTERNAL_API_TOKEN or "",
    )
    if proof is None:
        raise HTTPException(status_code=503, detail="访客模式尚未就绪，请联系站点管理员。")
    store.clear(key)
    return VisitorLoginResponse(name=account.name, username=account.username, apps=list(account.apps), proof=proof)


@router.get("/apps")
async def visitor_apps_list(request: Request):
    """Only the applications this visitor may open, with no content attached."""
    account = await _authorised_account(request)
    try:
        registry = visitor_apps.load_apps()
    except visitor_apps.VisitorAppsUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from None
    return JSONResponse({
        "name": account.name,
        "apps": [registry[app_id].metadata() for app_id in account.apps if app_id in registry],
    }, headers={"Cache-Control": "no-store"})


@router.get("/apps/{app_id}")
async def visitor_app_view(app_id: str, request: Request):
    account = await _authorised_account(request)
    try:
        registry = visitor_apps.load_apps()
    except visitor_apps.VisitorAppsUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from None
    if not visitor_apps.entitled(account.apps, app_id) or app_id not in registry:
        raise HTTPException(status_code=403, detail="这个应用没有对你开放。")
    app = registry[app_id]
    return {"app": app.metadata(), "view": list(app.view)}


@router.get("/apps/{app_id}/assets/{kind}")
async def visitor_app_asset(app_id: str, kind: str, request: Request):
    account = await _authorised_account(request)
    try:
        registry = visitor_apps.load_apps()
    except visitor_apps.VisitorAppsUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from None
    if not visitor_apps.entitled(account.apps, app_id) or app_id not in registry:
        raise HTTPException(status_code=403, detail="这个应用没有对你开放。")
    path: Path | None = visitor_apps.app_asset(registry[app_id], kind)
    if path is None:
        raise HTTPException(status_code=404, detail="素材不存在。")
    return FileResponse(path, media_type=MEDIA_TYPES.get(path.suffix.lower()),
                        headers={"Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff"})
