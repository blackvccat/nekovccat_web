export type SavedNote = { id: string; title: string; body: string; updatedAt: number }

export const NOTES_STORAGE_KEY = 'marcus-desktop-notes-v1'
export const NOTES_MAX = 40
const TITLE_MAX = 60
const BODY_MAX = 20000
const LABEL_MAX = 40

function cleanText(value: unknown, limit: number) {
  if (typeof value !== 'string') return ''
  const text = value.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
  return Array.from(text).slice(0, limit).join('')
}

/** 只信任自己写进浏览器的形状：标题、正文、时间都重新截断，坏数据整条丢掉。 */
export function restoreSavedNotes(value: unknown): SavedNote[] {
  if (!Array.isArray(value)) return []
  const notes: SavedNote[] = []
  const seen = new Set<string>()
  for (const candidate of value.slice(0, NOTES_MAX)) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) continue
    const row = candidate as Record<string, unknown>
    if (typeof row.id !== 'string' || typeof row.body !== 'string') continue
    const id = row.id.slice(0, 64)
    const body = cleanText(row.body, BODY_MAX)
    if (!id || seen.has(id) || !body.trim()) continue
    seen.add(id)
    notes.push({
      id,
      title: cleanText(row.title, TITLE_MAX),
      body,
      updatedAt: typeof row.updatedAt === 'number' && Number.isFinite(row.updatedAt) ? row.updatedAt : 0,
    })
  }
  return notes
}

/** 列表里显示什么：先看标题，没有标题就用正文第一行。 */
export function noteLabel(note: SavedNote): string {
  const title = note.title.trim()
  if (title) return title
  const line = note.body.split('\n').map(part => part.trim()).find(Boolean) || ''
  return Array.from(line).slice(0, LABEL_MAX).join('') || '无标题'
}

export function createNoteId(): string {
  const uuid = globalThis.crypto?.randomUUID?.()
  return uuid ? `note-${uuid}` : `note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
