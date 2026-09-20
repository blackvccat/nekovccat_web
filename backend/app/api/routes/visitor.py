"""访客登录与访客应用：密码只在服务器端校验，应用内容只在授权后返回。"""
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse

from app.config import settings
from app.schemas.visitor import VisitorLoginRequest, VisitorLoginResponse
from app.services import visitor_accounts, visitor_app_storage, visitor_apps
from app.services.visitor_access import create_visitor_proof
from app.services.visitor_throttle import LoginFailureStore

router = APIRouter()

# 素材照原样发出去，所以类型要写清楚：<img> 不会猜扩展名，nosniff 下更不会。
# 真实应用还要下发 js/css/json 等静态文件，一并列全。
MEDIA_TYPES = {".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png",
               ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif",
               ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
               ".json": "application/json", ".html": "text/html", ".txt": "text/plain",
               ".map": "application/json", ".woff2": "font/woff2", ".woff": "font/woff",
               ".ico": "image/x-icon", ".mp3": "audio/mpeg", ".mp4": "video/mp4", ".pdf": "application/pdf"}


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


# ---------------------------------------------------------------- 真实应用（entry）

async def _authorised_app(app_id: str, request: Request):
    """登录 + 授权 + 注册表三重校验，返回 (账号, 应用)。"""
    account = await _authorised_account(request)
    try:
        registry = visitor_apps.load_apps()
    except visitor_apps.VisitorAppsUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from None
    if not visitor_apps.entitled(account.apps, app_id) or app_id not in registry:
        raise HTTPException(status_code=403, detail="这个应用没有对你开放。")
    return account, registry[app_id]


def _require(app, permission: str) -> None:
    """应用要在自己的 app.json 里声明 permissions 才能用对应能力。"""
    if permission not in app.permissions:
        raise HTTPException(status_code=403, detail="这个应用没有申请该能力。")


async def _read_upload(request: Request) -> bytes:
    """按上限流式读取上传：声明长度或累计字节一超限就 413，不把超大 body 读进内存。"""
    limit = visitor_app_storage.MAX_FILE_BYTES
    declared = request.headers.get("content-length")
    if declared and declared.isdigit() and int(declared) > limit:
        raise HTTPException(status_code=413, detail="文件太大。")
    body = bytearray()
    async for chunk in request.stream():
        body.extend(chunk)
        if len(body) > limit:
            raise HTTPException(status_code=413, detail="文件太大。")
    return bytes(body)


@router.get("/apps/{app_id}/shell")
async def visitor_app_shell(app_id: str, request: Request):
    """应用的 HTML 入口：登录且被授权后才返回，前端产物里没有任何应用界面。"""
    _account, app = await _authorised_app(app_id, request)
    path = visitor_apps.entry_file(app)
    if path is None:
        raise HTTPException(status_code=404, detail="应用界面暂时不可用。")
    try:
        html = path.read_text(encoding="utf-8")
    except OSError:
        raise HTTPException(status_code=404, detail="应用界面暂时不可用。") from None
    # 按应用收口第三方内嵌：全局 CSP 写的是 `frame-src 'self' https:`，这里再叠一条更严格的，
    # 两条策略取交集（必须同时放行），于是只有 app.json 的 embeds 里列出的源能嵌进来。
    frame_sources = " ".join(("'self'", *app.embeds))
    return HTMLResponse(html, headers={
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": f"frame-src {frame_sources}; frame-ancestors 'self'",
    })


@router.get("/apps/{app_id}/data")
async def visitor_app_data_list(app_id: str, request: Request):
    account, app = await _authorised_app(app_id, request)
    _require(app, "data")
    return JSONResponse({"data": visitor_app_storage.data_all(app_id, account.username)},
                        headers={"Cache-Control": "no-store"})


@router.put("/apps/{app_id}/data/{key}")
async def visitor_app_data_put(app_id: str, key: str, request: Request):
    account, app = await _authorised_app(app_id, request)
    _require(app, "data")
    try:
        value = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="值必须是 JSON。") from None
    try:
        visitor_app_storage.data_set(app_id, account.username, key, value)
    except visitor_app_storage.AppStorageError as exc:
        raise HTTPException(status_code=exc.status, detail=str(exc)) from None
    return JSONResponse({"ok": True}, headers={"Cache-Control": "no-store"})


@router.delete("/apps/{app_id}/data/{key}")
async def visitor_app_data_delete(app_id: str, key: str, request: Request):
    account, app = await _authorised_app(app_id, request)
    _require(app, "data")
    if not visitor_app_storage.data_delete(app_id, account.username, key):
        raise HTTPException(status_code=404, detail="这条数据不存在。")
    return JSONResponse({"removed": True}, headers={"Cache-Control": "no-store"})


@router.get("/apps/{app_id}/files")
async def visitor_app_files_list(app_id: str, request: Request):
    account, app = await _authorised_app(app_id, request)
    _require(app, "files")
    return JSONResponse({"files": visitor_app_storage.list_files(app_id, account.username)},
                        headers={"Cache-Control": "no-store"})


@router.put("/apps/{app_id}/files/{name}")
async def visitor_app_files_put(app_id: str, name: str, request: Request):
    """上传：请求体就是文件字节（application/octet-stream），避免额外依赖 multipart。"""
    account, app = await _authorised_app(app_id, request)
    _require(app, "files")
    payload = await _read_upload(request)
    if not payload:
        raise HTTPException(status_code=400, detail="空文件。")
    try:
        saved = visitor_app_storage.write_file(app_id, account.username, name, payload)
    except visitor_app_storage.AppStorageError as exc:
        raise HTTPException(status_code=exc.status, detail=str(exc)) from None
    return JSONResponse(saved, status_code=201, headers={"Cache-Control": "no-store"})


@router.get("/apps/{app_id}/files/{name}")
async def visitor_app_files_get(app_id: str, name: str, request: Request):
    account, app = await _authorised_app(app_id, request)
    _require(app, "files")
    path = visitor_app_storage.file_path(app_id, account.username, name)
    if path is None:
        raise HTTPException(status_code=404, detail="文件不存在。")
    media = MEDIA_TYPES.get(path.suffix.lower(), "application/octet-stream")
    headers = {"Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff"}
    # 默认下载；`?inline=1` 让浏览器内联显示（图片、PDF 预览用），此时不写 Content-Disposition。
    if request.query_params.get("inline") in ("1", "true"):
        return FileResponse(path, media_type=media, headers=headers)
    return FileResponse(path, media_type=media, filename=path.name, headers=headers)


@router.delete("/apps/{app_id}/files/{name}")
async def visitor_app_files_delete(app_id: str, name: str, request: Request):
    account, app = await _authorised_app(app_id, request)
    _require(app, "files")
    if not visitor_app_storage.delete_file(app_id, account.username, name):
        raise HTTPException(status_code=404, detail="文件不存在。")
    return JSONResponse({"removed": True}, headers={"Cache-Control": "no-store"})


# 必须放在最后：`{asset_path:path}` 会吞掉 /apps/{id}/ 之后的一切，前面这些精确路由要先注册。
@router.get("/apps/{app_id}/{asset_path:path}")
async def visitor_app_static(app_id: str, asset_path: str, request: Request):
    _account, app = await _authorised_app(app_id, request)
    path = visitor_apps.static_file(app, asset_path)
    if path is None:
        raise HTTPException(status_code=404, detail="文件不存在。")
    return FileResponse(path, media_type=MEDIA_TYPES.get(path.suffix.lower(), "application/octet-stream"),
                        headers={"Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff"})
