"""公开歌单的曲目列表：浏览器不直连第三方（跨域 + CSP 都不允许），只经这里拿。"""
from fastapi import APIRouter, HTTPException, Query

from app.services import netease_music

router = APIRouter()


@router.get("/netease/playlist/{playlist_id}")
async def netease_playlist(
    playlist_id: str,
    limit: int = Query(netease_music.DEFAULT_TRACKS, ge=1, le=netease_music.MAX_TRACKS),
):
    try:
        return await netease_music.playlist_tracks(playlist_id, limit)
    except netease_music.PlaylistError as exc:
        raise HTTPException(status_code=exc.status, detail=str(exc)) from None
