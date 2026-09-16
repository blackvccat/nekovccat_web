import { parseMusicLink, type MusicItem } from './links'
import source from './marcus-favorites.json'

export type MarcusSong = { item: MusicItem; name: string; note: string }

const MAX_SONGS = 40
const TEXT_LIMIT = 60

function clean(value: unknown, limit: number) {
  if (typeof value !== 'string') return ''
  return Array.from(value.replace(/[\u0000-\u001f\u007f]/g, '').trim()).slice(0, limit).join('')
}

/** 「歌单」：内容写在同一目录的 marcus-favorites.json。这里只做校验与去重，坏链接静默跳过（测试里会直接失败）。 */
export function marcusFavorites(entries: unknown = (source as { songs?: unknown }).songs): MarcusSong[] {
  if (!Array.isArray(entries)) return []
  const songs: MarcusSong[] = []
  const seen = new Set<string>()
  for (const entry of entries.slice(0, MAX_SONGS)) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue
    const row = entry as Record<string, unknown>
    if (typeof row.url !== 'string') continue
    try {
      const item = parseMusicLink(row.url)
      if (seen.has(item.url)) continue
      seen.add(item.url)
      songs.push({ item, name: clean(row.name, TEXT_LIMIT) || item.label, note: clean(row.note, TEXT_LIMIT) })
    } catch { /* 一行写错不影响整份歌单。 */ }
  }
  return songs
}
