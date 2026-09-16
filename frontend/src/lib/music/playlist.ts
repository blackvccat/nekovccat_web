export type PlaylistTrack = { id: string; name: string; artists: string; album: string; durationMs: number }
export type PlaylistPage = { id: string; name: string; total: number; tracks: PlaylistTrack[] }

/** 我们自己列的曲目数：网易云外链播放器的列表固定只给 10 首（它的请求里没有 n，改不了）。 */
export const PLAYLIST_TRACK_LIMIT = 50
const TEXT_LIMIT = 120
const MAX_DURATION_MS = 24 * 60 * 60 * 1000

function clean(value: unknown, limit = TEXT_LIMIT) {
  if (typeof value !== 'string') return ''
  return Array.from(value.replace(/[\u0000-\u001f\u007f]/g, '').trim()).slice(0, limit).join('')
}

/** 只信任自己后端写出的形状：字段缺失或类型不对的条目整条丢掉。 */
export function restorePlaylistTracks(value: unknown): PlaylistTrack[] {
  if (!Array.isArray(value)) return []
  const tracks: PlaylistTrack[] = []
  const seen = new Set<string>()
  for (const entry of value.slice(0, PLAYLIST_TRACK_LIMIT)) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue
    const row = entry as Record<string, unknown>
    // 只接受纯数字的歌曲 id：它会被拼进官方播放器地址，不能带任何别的东西。
    const id = typeof row.id === 'string' ? row.id : ''
    const name = clean(row.name)
    if (!/^\d{1,20}$/.test(id) || !name || seen.has(id)) continue
    seen.add(id)
    const duration = typeof row.durationMs === 'number' && Number.isFinite(row.durationMs) ? Math.min(Math.max(row.durationMs, 0), MAX_DURATION_MS) : 0
    tracks.push({ id, name, artists: clean(row.artists), album: clean(row.album), durationMs: Math.round(duration) })
  }
  return tracks
}

export function formatDuration(durationMs: number): string {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return '--:--'
  const seconds = Math.round(durationMs / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

/** 单曲官方播放地址：交给 parseMusicLink 再校验一次，这里只负责拼。 */
export function playlistSongUrl(trackId: string): string {
  return `https://music.163.com/song?id=${trackId}`
}

/** 经站内路由取歌单前 N 首；失败时抛出可以直接显示给用户的话。 */
export async function fetchPlaylist(playlistId: string, signal?: AbortSignal): Promise<PlaylistPage> {
  const response = await fetch(`/api/music/playlist?id=${encodeURIComponent(playlistId)}&limit=${PLAYLIST_TRACK_LIMIT}`, { signal, cache: 'no-store' })
  const payload = await response.json().catch(() => null) as { detail?: unknown; error?: unknown } | null
  if (!response.ok) {
    const detail = clean(payload?.detail) || clean(payload?.error) || '暂时拿不到这个歌单，请稍后再试。'
    throw new Error(detail)
  }
  const body = (payload ?? {}) as Record<string, unknown>
  return {
    id: clean(body.id) || playlistId,
    name: clean(body.name),
    total: typeof body.total === 'number' && Number.isFinite(body.total) ? Math.max(0, Math.round(body.total)) : 0,
    tracks: restorePlaylistTracks(body.tracks),
  }
}
