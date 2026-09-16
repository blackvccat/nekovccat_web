"""网易云公开歌单的曲目列表：只读转发，不接触任何用户凭证。

为什么要有这一层：网易云自己的外链播放器（outchain/player）列表固定只给 10 首——
它自己拼的查询里没有 n，我们在播放器地址上写什么都不管用。我们直接取接口反而更全：

* 官方榜单认 `n`，`?id=…&n=50` 一次就能拿到 50 首的完整信息；
* 用户歌单不认 `n`，无论怎么写都只内联前 10 首，但 `trackIds` 是完整的——
  这时按 trackIds 把缺的那些用 /api/song/detail 补齐（一次请求，最多 100 个 id）。
"""
import re
import time

import httpx

PLAYLIST_API = "https://music.163.com/api/v6/playlist/detail"
SONG_API = "https://music.163.com/api/song/detail"
PLAYLIST_ID = re.compile(r"^\d{1,20}$")
DEFAULT_TRACKS = 50
MAX_TRACKS = 100
CACHE_SECONDS = 300
REQUEST_HEADERS = {"User-Agent": "Mozilla/5.0", "Referer": "https://music.163.com/"}
_cache: dict[tuple[str, int], tuple[float, dict]] = {}


class PlaylistError(Exception):
    """带状态码的歌单错误：id 不合法(400)、歌单不存在(404)、拿不到(503)。"""

    def __init__(self, message: str, status: int = 503):
        super().__init__(message)
        self.status = status


def clamp_limit(limit: int) -> int:
    try:
        value = int(limit)
    except (TypeError, ValueError):
        return DEFAULT_TRACKS
    return max(1, min(value, MAX_TRACKS))


def _identifier(value: object) -> str:
    return str(value) if isinstance(value, (int, str)) and str(value).isdigit() else ""


def track_ids(detail: dict, inlined: list[dict], limit: int) -> list[str]:
    """歌单顺序以 trackIds 为准；没有 trackIds 的响应就退回内联的前几首。"""
    ids = [_identifier(item.get("id")) for item in (detail.get("trackIds") or []) if isinstance(item, dict)]
    ids = [value for value in ids if value][:limit]
    if ids:
        return ids
    return [value for value in (_identifier(item.get("id")) for item in inlined) if value][:limit]


def _artist_names(entry: dict) -> str:
    # 歌单内联用新字段（ar），/api/song/detail 补齐回来的还是老字段（artists），两套都要认。
    return " / ".join(
        str(artist.get("name", "")).strip()
        for artist in (entry.get("ar") or entry.get("artists") or [])
        if isinstance(artist, dict) and str(artist.get("name", "")).strip()
    )


def _track(entry: dict) -> dict:
    album = entry.get("al") or entry.get("album")
    album = album if isinstance(album, dict) else {}
    duration = entry.get("dt") or entry.get("duration") or 0
    return {
        "id": _identifier(entry.get("id")),
        "name": str(entry.get("name") or "").strip(),
        "artists": _artist_names(entry),
        "album": str(album.get("name") or "").strip(),
        "durationMs": int(duration) if isinstance(duration, (int, float)) else 0,
    }


def merge(detail: dict, inlined: list[dict], hydrated: list[dict], playlist_id: str, limit: int) -> dict:
    """把内联曲目与补齐的曲目按 trackIds 的顺序拼成最终列表。"""
    ids = track_ids(detail, inlined, limit)
    entries = [item for item in [*inlined, *hydrated] if isinstance(item, dict)]
    by_id = {_identifier(item.get("id")): item for item in entries if _identifier(item.get("id"))}
    tracks = [track for track in (_track(by_id[track_id]) for track_id in ids if track_id in by_id) if track["id"] and track["name"]]
    total = detail.get("trackCount")
    return {
        "id": playlist_id,
        "name": str(detail.get("name") or "").strip(),
        "total": int(total) if isinstance(total, (int, float)) else len(tracks),
        "tracks": tracks,
    }


async def _fetch_playlist(playlist_id: str, limit: int) -> dict:
    async with httpx.AsyncClient(timeout=8.0, headers=REQUEST_HEADERS, follow_redirects=True) as client:
        response = await client.get(PLAYLIST_API, params={"id": playlist_id, "n": limit})
        response.raise_for_status()
        return response.json()


async def _fetch_songs(ids: list[str]) -> list[dict]:
    async with httpx.AsyncClient(timeout=8.0, headers=REQUEST_HEADERS, follow_redirects=True) as client:
        response = await client.get(SONG_API, params={"ids": "[" + ",".join(ids) + "]"})
        response.raise_for_status()
        payload = response.json()
    songs = payload.get("songs") if isinstance(payload, dict) else None
    return [song for song in songs if isinstance(song, dict)] if isinstance(songs, list) else []


async def playlist_tracks(playlist_id: str, limit: int = DEFAULT_TRACKS) -> dict:
    if not PLAYLIST_ID.match(playlist_id or ""):
        raise PlaylistError("歌单地址不对。", 400)
    limit = clamp_limit(limit)
    cached = _cache.get((playlist_id, limit))
    if cached and time.monotonic() - cached[0] < CACHE_SECONDS:
        return cached[1]
    try:
        payload = await _fetch_playlist(playlist_id, limit)
        detail = payload.get("playlist") if isinstance(payload, dict) else None
        if not isinstance(detail, dict):
            raise PlaylistError("这个歌单不存在，或者没有公开曲目。", 404)
        inlined = [item for item in (detail.get("tracks") or []) if isinstance(item, dict)]
        known = {_identifier(item.get("id")) for item in inlined}
        missing = [track_id for track_id in track_ids(detail, inlined, limit) if track_id not in known]
        hydrated = await _fetch_songs(missing) if missing else []
    except PlaylistError:
        raise
    except Exception as exc:  # 网络、超时、限流、非 JSON：都当成「暂时拿不到」
        raise PlaylistError("暂时拿不到这个歌单，请稍后再试。") from exc
    data = merge(detail, inlined, hydrated, playlist_id, limit)
    _cache[(playlist_id, limit)] = (time.monotonic(), data)
    return data


def clear_cache() -> None:
    _cache.clear()
