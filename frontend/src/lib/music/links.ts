export type MusicProvider = 'spotify' | 'netease'

export type MusicItem = {
  provider: MusicProvider
  type: string
  id: string
  url: string
  embedUrl: string
  height: number
  label: string
}

const SPOTIFY_TYPES = {
  track: '歌曲',
  album: '专辑',
  playlist: '歌单',
  artist: '音乐人',
  episode: '播客单集',
  show: '播客',
} as const

const SUPPORTED_LINK_MESSAGE = '请粘贴网易云歌曲、歌单链接，或 Spotify 歌曲、专辑、歌单、音乐人、播客链接。'
const SHORT_LINK_MESSAGE = '这是平台短链接。请在原平台打开后，复制包含歌曲或歌单 ID 的完整链接。'

function spotifyItem(type: keyof typeof SPOTIFY_TYPES, id: string): MusicItem {
  return {
    provider: 'spotify',
    type,
    id,
    url: `https://open.spotify.com/${type}/${id}`,
    embedUrl: `https://open.spotify.com/embed/${type}/${id}?theme=0`,
    height: type === 'track' || type === 'episode' ? 152 : 352,
    label: `Spotify ${SPOTIFY_TYPES[type]} · …${id.slice(-6)}`,
  }
}

function neteaseItem(type: 'song' | 'playlist', id: string): MusicItem {
  const isSong = type === 'song'
  return {
    provider: 'netease',
    type,
    id,
    url: `https://music.163.com/${type}?id=${id}`,
    embedUrl: `https://music.163.com/outchain/player?type=${isSong ? 2 : 0}&id=${id}&auto=0&height=${isSong ? 66 : 430}`,
    height: isSong ? 86 : 450,
    label: `网易云 ${isSong ? '歌曲' : '歌单'} · ${id}`,
  }
}

function extractLink(input: string): string {
  if (typeof input !== 'string' || input.length > 4096) throw new Error(SUPPORTED_LINK_MESSAGE)
  const text = input.trim()
  if (/^(?:javascript|data|vbscript|file):/i.test(text)) throw new Error(SUPPORTED_LINK_MESSAGE)
  // Accept platform share sentences, but never HTML embed snippets or escaped URLs.
  if (!text || /[<>\\\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)) {
    throw new Error('请粘贴平台分享链接，不要粘贴 iframe 或 HTML 代码。')
  }
  const candidates = [...text.matchAll(/(?:https?:\/\/|spotify:)[^\s<>"'`，。！？；、（）【】《》「」『』]+/g)]
  if (candidates.length !== 1) throw new Error(candidates.length > 1 ? '一次请添加一个音乐链接。' : SUPPORTED_LINK_MESSAGE)
  const candidate = candidates[0]
  // Do not reinterpret a URL hidden inside a different scheme or another URL.
  if (candidate.index && /[\w/:?=&%#@.-]/.test(text[candidate.index - 1])) throw new Error(SUPPORTED_LINK_MESSAGE)
  return candidate[0].replace(/[.,;:!?)\]}，。！？；、）】》…]+$/u, '')
}

/** Convert an official share link into fixed, allowlisted player URLs. No network requests. */
export function parseMusicLink(input: string): MusicItem {
  const link = extractLink(input)
  const uri = /^spotify:(track|album|playlist|artist|episode|show):([A-Za-z0-9]{22})$/.exec(link)
  if (uri) return spotifyItem(uri[1] as keyof typeof SPOTIFY_TYPES, uri[2])

  // Inspect the original authority and path before URL can normalize encoded hosts,
  // backslashes, dot segments, or default ports into an apparently valid URL.
  const raw = /^(https?):\/\/([^/?#]+)([^?#]*)(?:\?[^#]*)?(?:#.*)?$/.exec(link)
  if (!raw || /[%@:\s]/.test(raw[2])) throw new Error(SUPPORTED_LINK_MESSAGE)
  const host = raw[2].toLowerCase()
  if (['spotify.link', '163cn.tv', 'www.163cn.tv'].includes(host)) throw new Error(SHORT_LINK_MESSAGE)

  if (host === 'open.spotify.com') {
    if (raw[1] !== 'https') throw new Error('请使用以 https://open.spotify.com/ 开头的 Spotify 链接。')
    const path = /^(?:\/intl-[a-z]{2})?(?:\/embed)?\/(track|album|playlist|artist|episode|show)\/([A-Za-z0-9]{22})\/?$/.exec(raw[3])
    if (!path) throw new Error('Spotify 链接不完整或类型不支持，请复制原平台的完整分享链接。')
    return spotifyItem(path[1] as keyof typeof SPOTIFY_TYPES, path[2])
  }

  if (!['music.163.com', 'www.music.163.com', 'y.music.163.com'].includes(host)) {
    throw new Error(SUPPORTED_LINK_MESSAGE)
  }
  const url = new URL(link)
  let route = raw[3]
  let query = url.search.slice(1)
  if (url.hash.startsWith('#/')) {
    if (route !== '' && route !== '/') throw new Error('网易云链接路径无效，请复制原平台的完整分享链接。')
    const hash = /^#(\/[^?]+)\?([^#]+)$/.exec(url.hash)
    if (!hash || new URLSearchParams(query).has('id')) throw new Error('网易云链接包含多个歌曲地址，请重新复制。')
    route = hash[1]
    query = hash[2]
  }
  const path = /^\/(?:m\/)?(song|playlist)\/?$/.exec(route)
  if (!path) throw new Error('暂时支持网易云歌曲和歌单，请复制对应的分享链接。')

  const entries = query.split('&').map(entry => entry.split('='))
  const ids = entries.filter(([key]) => key === 'id')
  const parsedIds = new URLSearchParams(query).getAll('id')
  if (ids.length !== 1 || parsedIds.length !== 1 || ids[0].length !== 2 || !/^\d{1,20}$/.test(ids[0][1])) {
    throw new Error('网易云链接缺少有效的歌曲或歌单 ID，请复制完整链接。')
  }
  const id = ids[0][1].replace(/^0+/, '')
  if (!id) throw new Error('网易云歌曲或歌单 ID 必须大于 0。')
  return neteaseItem(path[1] as 'song' | 'playlist', id)
}

/** Revalidate stored source URLs; stored provider/player fields are never trusted. */
export function restoreMusicItems(value: unknown): Array<{ item: MusicItem; name: string }> {
  if (!Array.isArray(value)) return []
  const restored: Array<{ item: MusicItem; name: string }> = []
  const seen = new Set<string>()
  for (const candidate of value.slice(0, 20)) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) continue
    const entry = candidate as Record<string, unknown>
    if (typeof entry.url !== 'string') continue
    try {
      const item = parseMusicLink(entry.url)
      if (seen.has(item.url)) continue
      seen.add(item.url)
      const name = typeof entry.name === 'string'
        ? Array.from(entry.name.replace(/[\u0000-\u001f\u007f]/g, '').trim()).slice(0, 60).join('')
        : ''
      restored.push({ item, name: name || item.label })
    } catch {
      // A corrupted or older entry does not prevent valid library items restoring.
    }
  }
  return restored
}
