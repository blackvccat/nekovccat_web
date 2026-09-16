'use client'

import { useEffect, useRef, useState } from 'react'
import { getSinceDates } from '@/lib/date-since'
import { createClientId } from '@/lib/client-id'
import type { VisitorAction, VisitorBlock } from '@/lib/visitor-view'

interface BlockProps {
  block: VisitorBlock
  onAction: (action: VisitorAction) => void
  onShowWallpaper: () => void
}

function ActionButton({ action, onAction }: { action: VisitorAction; onAction: (action: VisitorAction) => void }) {
  return <button type="button" className="text-button visit-action" onClick={() => onAction(action)}>{action.label}</button>
}

/** 通用区块渲染器：只认协议里定义的区块类型，具体文案全部来自后端返回的数据。 */
export default function VisitorBlocks({ blocks, onAction, onShowWallpaper }: { blocks: VisitorBlock[]; onAction: (action: VisitorAction) => void; onShowWallpaper: () => void }) {
  return <>
    {blocks.map((block, index) => <VisitorBlockView key={index} block={block} onAction={onAction} onShowWallpaper={onShowWallpaper} />)}
  </>
}

function VisitorBlockView({ block, onAction, onShowWallpaper }: BlockProps) {
  if (block.type === 'heading') {
    return <header className="visit-heading">
      <div>
        {block.eyebrow && <span className="eyebrow">{block.eyebrow}</span>}
        <h2>{block.title}</h2>
      </div>
      {block.action && <ActionButton action={block.action} onAction={onAction} />}
    </header>
  }
  if (block.type === 'text') {
    return <section className="visit-text">
      {block.title && <h3>{block.title}</h3>}
      <p>{block.lines.map((line, index) => <span key={index}>{line}<br /></span>)}</p>
    </section>
  }
  if (block.type === 'letter') return <LetterBlock block={block} />
  if (block.type === 'counter') return <CounterBlock block={block} onShowWallpaper={onShowWallpaper} />
  if (block.type === 'checklist') return <ChecklistBlock block={block} />
  if (block.type === 'footer') {
    return <footer className="visit-footer">
      <span>{block.text}</span>
      {block.action && <ActionButton action={block.action} onAction={onAction} />}
    </footer>
  }
  if (block.type === 'link') return <ActionButton action={block.action} onAction={onAction} />
  if (block.type === 'notice') {
    return <section className="visit-notice">
      <strong>{block.text}</strong>
      {block.note && <small>{block.note}</small>}
    </section>
  }
  if (block.type === 'files') return <FilesBlock block={block} />
  if (block.type === 'image') {
    return <figure className="visit-image">
      {/* eslint-disable-next-line @next/next/no-img-element -- 受保护素材由后端授权接口返回，不能走静态优化 */}
      <img src={block.src} alt={block.caption ?? ''} />
      {block.caption && <figcaption>{block.caption}</figcaption>}
    </figure>
  }
  return null
}

/** 下载列表：只读，没有任何上传入口 —— 条目与地址都来自后端配置。 */
function FilesBlock({ block }: { block: Extract<VisitorBlock, { type: 'files' }> }) {
  return <section className="visit-files">
    <div className="visit-files-head"><h3>{block.title}</h3><span>{block.items.length} 个文件</span></div>
    {block.intro && <p className="visit-files-intro">{block.intro}</p>}
    <ul>{block.items.map(item => <li key={item.href}>
      <span className="visit-file-glyph" aria-hidden="true" />
      <span className="visit-file-name">{item.name}{item.note && <small>{item.note}</small>}</span>
      {item.size && <span className="visit-file-size">{item.size}</span>}
      {/* 跨域链接的 download 会被浏览器忽略（能不能直接存下来由对方响应头决定），这里只当提示。 */}
      <a className="pixel-button visit-file-download" href={item.href} download={item.name} target="_blank" rel="noopener noreferrer">下载</a>
    </li>)}</ul>
    {block.note && <p className="visit-files-note">{block.note}</p>}
  </section>
}

function LetterBlock({ block }: { block: Extract<VisitorBlock, { type: 'letter' }> }) {
  const [open, setOpen] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => { if (open) headingRef.current?.focus({ preventScroll: true }) }, [open])

  if (!open) {
    return <button type="button" className="visit-letter-button" onClick={() => setOpen(true)}>
      <span className="visit-letter-seal" aria-hidden="true">✉</span>
      <span><strong>{block.title}</strong>{block.summary && <small>{block.summary}</small>}</span>
      <span className="visit-letter-open">{block.buttonLabel}</span>
    </button>
  }
  return <div className="visit-letter-reader">
    <div className="visit-letter-toolbar">
      <button type="button" className="pixel-button" onClick={() => setOpen(false)}>← 返回</button>
      {block.toolbar && <span>{block.toolbar}</span>}
    </div>
    <article className="visit-letter-paper" tabIndex={0}>
      <h2 tabIndex={-1} ref={headingRef}>{block.title}</h2>
      {block.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
    </article>
  </div>
}

function CounterBlock({ block, onShowWallpaper }: { block: Extract<VisitorBlock, { type: 'counter' }>; onShowWallpaper: () => void }) {
  const [dates, setDates] = useState(() => getSinceDates(new Date(), block.since))
  useEffect(() => {
    const refresh = () => setDates(getSinceDates(new Date(), block.since))
    const interval = setInterval(refresh, 30_000)
    document.addEventListener('visibilitychange', refresh)
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', refresh) }
  }, [block.since])

  const anniversaryLabel = dates.anniversaryMonths % 12 === 0
    ? `${dates.anniversaryMonths / 12}${block.yearUnit ?? ''}`
    : `${dates.anniversaryMonths}${block.monthUnit ?? ''}`

  return <>
    <section className="visit-counter inset-panel" aria-label={block.title}>
      <span>{block.title}</span>
      <div>第 <strong>{dates.days}</strong> {block.dayUnit}</div>
      {block.sinceLabel && <span>{block.sinceLabel} <time dateTime={block.since}>{block.since.replaceAll('-', '.')}</time></span>}
    </section>
    {block.anniversaryLabel && <section className="visit-anniversary" aria-label={block.anniversaryLabel}>
      <div>
        <span>{dates.daysUntilAnniversary === 0 ? (block.anniversaryToday ?? block.anniversaryLabel) : block.anniversaryLabel}</span>
        <strong>{anniversaryLabel}<small><time dateTime={dates.nextAnniversaryDate}>{dates.nextAnniversaryDate.replaceAll('-', '.')}</time></small></strong>
      </div>
      <div className="visit-anniversary-countdown">
        {dates.daysUntilAnniversary === 0 ? <strong>{block.anniversaryToday ?? ''}</strong>
          : <>{block.anniversaryRemaining} <strong>{dates.daysUntilAnniversary}</strong> {block.anniversaryUnit}</>}
      </div>
      <button type="button" className="text-button" onClick={onShowWallpaper}>↗</button>
    </section>}
  </>
}

interface Item { id: string; text: string; done: boolean }

function ChecklistBlock({ block }: { block: Extract<VisitorBlock, { type: 'checklist' }> }) {
  const [state, setState] = useState<{ items: Item[]; saved: boolean }>(() => read(block))
  const [draft, setDraft] = useState('')
  const completed = state.items.filter(item => item.done).length

  function save(items: Item[]) {
    let saved = true
    try { localStorage.setItem(block.storageKey, JSON.stringify(items)) } catch { saved = false }
    setState({ items, saved })
  }

  return <section className="visit-checklist">
    <div className="visit-checklist-head"><h3>{block.title}</h3><span>{completed} / {state.items.length}</span></div>
    {block.intro && <p className="visit-checklist-intro">{block.intro}</p>}
    <ul>{state.items.map(item => <li key={item.id}>
      <label className={item.done ? 'visit-item-done' : ''}>
        <input type="checkbox" checked={item.done} onChange={() => save(state.items.map(entry => entry.id === item.id ? { ...entry, done: !entry.done } : entry))} />
        <span>{item.text}</span>
      </label>
      <button type="button" className="visit-item-remove" aria-label={`删除：${item.text}`} onClick={() => save(state.items.filter(entry => entry.id !== item.id))}>×</button>
    </li>)}</ul>
    {state.items.length === 0 && <p className="visit-checklist-empty">还没有内容，添加第一条吧。</p>}
    <form className="visit-checklist-form" onSubmit={event => {
      event.preventDefault()
      const text = draft.trim()
      if (!text || state.items.length >= block.maxItems) return
      save([...state.items, { id: createClientId(), text, done: false }])
      setDraft('')
    }}>
      <label className="sr-only" htmlFor={`visit-add-${block.storageKey}`}>{block.title}</label>
      <input id={`visit-add-${block.storageKey}`} className="inset-panel" value={draft} onChange={event => setDraft(event.target.value)} maxLength={block.maxLength} placeholder={block.addPlaceholder ?? ''} disabled={state.items.length >= block.maxItems} />
      <button type="submit" className="pixel-button" disabled={!draft.trim() || state.items.length >= block.maxItems}>{block.addLabel ?? '添加'}</button>
    </form>
    <p className={`visit-checklist-note ${state.saved ? '' : 'storage-unavailable'}`} role={state.saved ? undefined : 'alert'}>
      {state.saved ? '仅保存在这个浏览器，不会同步到其他设备。' : '浏览器存储不可用或未能读取；当前改动可能只在本次打开时保留。'}
      {state.items.length >= block.maxItems ? ' 清单已满，移除一些后可以继续添加。' : ''}
    </p>
  </section>
}

function read(block: Extract<VisitorBlock, { type: 'checklist' }>): { items: Item[]; saved: boolean } {
  const defaults = block.defaults.map((text, index) => ({ id: `default-${index}`, text, done: false }))
  try {
    const raw = localStorage.getItem(block.storageKey)
    if (!raw) return { items: defaults, saved: true }
    const value: unknown = JSON.parse(raw)
    if (!Array.isArray(value) || value.length > block.maxItems || !value.every(item =>
      item && typeof item.id === 'string' && typeof item.text === 'string' &&
      item.text.trim().length > 0 && item.text.length <= block.maxLength && typeof item.done === 'boolean',
    ) || new Set(value.map(item => (item as Item).id)).size !== value.length) throw new Error('Invalid list')
    return { items: value as Item[], saved: true }
  } catch {
    return { items: defaults, saved: false }
  }
}
