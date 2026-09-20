'use client'

/** 内置应用的**内容组件**。应用清单、窗口尺寸与其余元数据统一在 `@/app-kit` 里登记。 */
import { useState } from 'react'
import { NOTES_MAX, NOTES_STORAGE_KEY, createNoteId, noteLabel, restoreSavedNotes, type SavedNote } from '@/lib/desktop-notes'
import { DEFAULT_SETTINGS, SCANLINE_WIDTHS, THEMES, WALLPAPERS, WALLPAPER_MOTIONS, type DesktopSettings } from '@/lib/desktop-settings'
import { NIGHT_HARBOR_ASSETS } from './night-harbor-assets'

function readStored(key: string) {
  try { return localStorage.getItem(key) } catch { return null }
}

function readSavedNotes(): SavedNote[] {
  const raw = readStored(NOTES_STORAGE_KEY)
  if (!raw) return []
  try { return restoreSavedNotes(JSON.parse(raw)) } catch { return [] }
}

function stamp(updatedAt: number) {
  if (!updatedAt) return '时间未知'
  return new Date(updatedAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

/** 便签：草稿照旧自动存在浏览器里，只有点过「保存到列表」的才会进右边那份列表。全部只在本机。 */
export function NotesApp({ listOpen = false, onToggleList }: { listOpen?: boolean; onToggleList?: (next: boolean) => void }) {
  // This window mounts when the visitor opens it, after the desktop has hydrated.
  const [note, setNote] = useState(() => readStored('marcus-desktop-note') || '')
  const [title, setTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [notes, setNotes] = useState<SavedNote[]>(readSavedNotes)
  const [saved, setSaved] = useState(true)
  const [status, setStatus] = useState('')

  const updateDraft = (value: string) => {
    setNote(value)
    try { localStorage.setItem('marcus-desktop-note', value); setSaved(true) } catch { setSaved(false) }
  }
  const persist = (next: SavedNote[]) => {
    setNotes(next)
    try { localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(next)); setSaved(true) } catch { setSaved(false) }
  }
  const saveToList = () => {
    if (!note.trim()) { setStatus('便签还是空的，写点东西再保存。'); return }
    const id = editingId ?? createNoteId()
    const entry: SavedNote = { id, title: title.trim(), body: note, updatedAt: Date.now() }
    persist([entry, ...notes.filter(item => item.id !== id)].slice(0, NOTES_MAX))
    setEditingId(id)
    setStatus(`已保存到列表：${noteLabel(entry)}`)
  }
  /** 手机上的列表是整屏视图：选完或新建完就回到编辑器，不用再自己收起。 */
  const backToEditorOnPhone = () => { if (window.matchMedia('(max-width: 700px)').matches) onToggleList?.(false) }
  const newNote = () => {
    setTitle('')
    setEditingId(null)
    updateDraft('')
    setStatus('新便签：写完点「保存到列表」。')
    backToEditorOnPhone()
  }
  const openNote = (entry: SavedNote) => {
    setTitle(entry.title)
    setEditingId(entry.id)
    updateDraft(entry.body)
    setStatus(`正在编辑：${noteLabel(entry)}（改完再保存一次就覆盖它）`)
    backToEditorOnPhone()
  }
  const removeNote = (id: string) => {
    persist(notes.filter(item => item.id !== id))
    if (editingId === id) { setEditingId(null); setStatus('这条已经从列表里删掉了，编辑器里的文字还在。') }
  }

  return <div className={`notes-app ${listOpen ? 'list-open' : ''}`}>
    <div className="notes-main">
      <div className="app-menubar"><span>{(title.trim() || 'UNTITLED').toUpperCase()}.TXT</span><span>{saved ? '保存在此浏览器' : '仅本次保留'}</span></div>
      <div className="notes-toolbar">
        <input className="notes-title" value={title} maxLength={60} placeholder="标题（可以留空）" aria-label="便签标题" onChange={event => setTitle(event.target.value)} />
        <button type="button" className="pixel-button" onClick={saveToList}>{editingId ? '☆ 保存修改' : '☆ 保存到列表'}</button>
        <button type="button" className="pixel-button" onClick={newNote}>新建</button>
        {onToggleList && <button type="button" className={`pixel-button notes-list-toggle ${listOpen ? 'pressed' : ''}`} aria-expanded={listOpen} aria-controls="desktop-notes-list" onClick={() => onToggleList(!listOpen)}>{listOpen ? '▤ 收起列表' : `▤ 保存列表 · ${notes.length}`}</button>}
      </div>
      <label className="sr-only" htmlFor="desktop-notes">我的便签</label>
      <textarea id="desktop-notes" className="notes-paper" value={note} placeholder={'今天有什么想记下来的？\n\n一个念头、一段文字，或下一次想问 MARCUS 的问题。'} onChange={event => updateDraft(event.target.value)} />
      <div className="notes-footer"><span>{note.length} 字符</span><span className="notes-status">{status}</span><span>{saved ? '✓ 已自动保存' : '浏览器存储不可用'}</span></div>
    </div>
    {listOpen && <aside id="desktop-notes-list" className="notes-list" aria-label="已保存的便签">
      <div className="notes-list-head"><div><span className="eyebrow">SAVED ON THIS BROWSER</span><h3>保存列表</h3></div><button type="button" className="text-button notes-list-new" onClick={newNote}>＋ 新建</button><button type="button" className="text-button" onClick={() => onToggleList?.(false)}>收起 ▸</button></div>
      {notes.length ? <ul>{notes.map(entry => <li key={entry.id} className={editingId === entry.id ? 'selected' : ''}>
        <button type="button" className="notes-list-open" aria-current={editingId === entry.id ? 'true' : undefined} onClick={() => openNote(entry)}>
          <strong>{noteLabel(entry)}</strong>
          <small>{stamp(entry.updatedAt)} · {entry.body.length} 字符</small>
        </button>
        <button type="button" className="notes-list-remove" aria-label={`删除便签 ${noteLabel(entry)}`} onClick={() => removeNote(entry.id)}>×</button>
      </li>)}</ul> : <p className="notes-list-empty">还没有保存的便签。写完点一下「保存到列表」，它才会出现在这里。</p>}
      <p className="notes-list-note">全部只存在这个浏览器里，清掉站点数据就会一起消失。</p>
    </aside>}
  </div>
}

export function SettingsApp({ settings, onChange }: { settings: DesktopSettings; onChange: (settings: DesktopSettings) => void }) {
  // 只有夜泊带逐帧动画：另外几张是纯 CSS 背景，动效开关对它们没有意义。
  const animated = settings.wallpaper === 'night-harbor'
  return <div className="settings-app"><div className="app-section-title"><h2>Make yourself at home.</h2><p>把小小桌面，调成喜欢的样子。</p></div>
    <fieldset><legend>外观</legend><div className="theme-options">{THEMES.map(theme => <button type="button" key={theme.value} className={`theme-option ${settings.theme === theme.value ? 'selected' : ''}`} aria-pressed={settings.theme === theme.value} onClick={() => onChange({ ...settings, theme: theme.value })}><span className={`theme-swatch theme-swatch-${theme.value}`} aria-hidden="true" /><span><strong>{theme.title}</strong><small>{theme.caption}</small></span></button>)}</div></fieldset>
    <fieldset><legend>桌面壁纸</legend><div className="wallpaper-options">{WALLPAPERS.map(wallpaper => <button type="button" key={wallpaper.value} className={`wallpaper-option ${settings.wallpaper === wallpaper.value ? 'selected' : ''}`} aria-pressed={settings.wallpaper === wallpaper.value} onClick={() => onChange({ ...settings, wallpaper: wallpaper.value })}><span className={`wallpaper-preview wallpaper-${wallpaper.value}`} style={wallpaper.value === 'night-harbor' ? { backgroundImage: `url("${NIGHT_HARBOR_ASSETS.thumbnail}")` } : undefined} /><strong>{wallpaper.title}</strong><small>{wallpaper.caption}</small></button>)}</div></fieldset>
    <fieldset className="wallpaper-motion-settings" disabled={!animated} aria-describedby="wallpaper-motion-hint"><legend>壁纸动画</legend><div className="wallpaper-motion-options">{WALLPAPER_MOTIONS.map(option => <button type="button" key={option.value} className={`pixel-button ${settings.wallpaperMotion === option.value ? 'pressed' : ''}`} aria-pressed={settings.wallpaperMotion === option.value} onClick={() => onChange({ ...settings, wallpaperMotion: option.value })}>{option.title}</button>)}</div><p id="wallpaper-motion-hint">{animated ? '自动模式在手机和节省流量时保持静态；系统开启「减少动态效果」时，壁纸始终静止。' : '选择夜泊，才有猫尾、灯光与水面倒影。'}</p></fieldset>
    <label className="scanline-setting"><span><strong>CRT 扫描线</strong><small>缓慢下滚的一道道暗行，像老显示器的刷新。系统开启「减少动态效果」时保持静止。</small></span><input type="checkbox" checked={settings.scanlines} onChange={event => onChange({ ...settings, scanlines: event.target.checked })} /></label>
    <fieldset className="scanline-width-settings" disabled={!settings.scanlines} aria-describedby="scanline-width-hint"><legend>扫描线粗细</legend><div className="scanline-width-options">{SCANLINE_WIDTHS.map(width => <button type="button" key={width.value} className={`pixel-button ${settings.scanlineWidth === width.value ? 'pressed' : ''}`} aria-pressed={settings.scanlineWidth === width.value} onClick={() => onChange({ ...settings, scanlineWidth: width.value })}>{width.title}</button>)}</div><p id="scanline-width-hint">自动：明亮用细、暗色用中（1px 的细线在黑屏上看不见）。三档是线宽 1px / 2px / 3px，粗那一档明显更宽。</p></fieldset><div className="settings-footer"><span>设置仅保存在这个浏览器中。</span><button type="button" className="pixel-button" onClick={() => onChange(DEFAULT_SETTINGS)}>恢复默认</button></div></div>
}

