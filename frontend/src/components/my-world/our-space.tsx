'use client'

import { useEffect, useState } from 'react'
import { getRelationshipDates } from '@/lib/relationship-dates'
import type { RelationshipContent } from '@/lib/relationship-content'
import { createClientId } from '@/lib/client-id'
import PixelIcon from './pixel-icon'
import OurLetter, { LetterEnvelope } from './our-letter'

interface Wish { id: string; text: string; done: boolean }
const WISHES_KEY = 'neko-our-space-wishes-v1'
const MAX_WISHES = 100
function readWishes(defaultWishes: string[]): { wishes: Wish[]; saved: boolean } {
  const defaults = defaultWishes.map((text, index) => ({ id: `default-${index}`, text, done: false }))
  try {
    const raw = localStorage.getItem(WISHES_KEY)
    if (!raw) return { wishes: defaults, saved: true }
    const value: unknown = JSON.parse(raw)
    if (!Array.isArray(value) || value.length > MAX_WISHES || !value.every(wish =>
      wish && typeof wish.id === 'string' && typeof wish.text === 'string' &&
      wish.text.trim().length > 0 && wish.text.length <= 120 && typeof wish.done === 'boolean',
    ) || new Set(value.map(wish => wish.id)).size !== value.length) throw new Error('Invalid wishes')
    return { wishes: value, saved: true }
  } catch {
    return { wishes: defaults, saved: false }
  }
}

export default function OurSpace({ content, onSeeWallpaper }: { content: RelationshipContent; onSeeWallpaper: () => void }) {
  // The desktop opens this window only after the relationship mode has hydrated.
  const [dates, setDates] = useState(() => getRelationshipDates(new Date(), content.startDate))
  const [state, setState] = useState(() => readWishes(content.defaultWishes))
  const [draft, setDraft] = useState('')
  const [feedback, setFeedback] = useState('')
  const [letterOpen, setLetterOpen] = useState(false)
  const completed = state.wishes.filter(wish => wish.done).length
  const anniversaryLabel = dates.anniversaryMonths % 12 === 0
    ? `${dates.anniversaryMonths / 12} 周年` : `${dates.anniversaryMonths} 个月`

  useEffect(() => {
    const refresh = () => setDates(getRelationshipDates(new Date(), content.startDate))
    const interval = setInterval(refresh, 30_000)
    document.addEventListener('visibilitychange', refresh)
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', refresh) }
  }, [content.startDate])

  function saveWishes(wishes: Wish[]) {
    let saved = true
    try { localStorage.setItem(WISHES_KEY, JSON.stringify(wishes)) } catch { saved = false }
    setState({ wishes, saved })
  }

  if (letterOpen) return <OurLetter letter={content.letter} onBack={() => {
    setLetterOpen(false)
    requestAnimationFrame(() => document.getElementById('open-yujuan-letter')?.focus({ preventScroll: true }))
  }} />

  return <div className="our-space-app">
    <div className="our-space-heading"><PixelIcon name="our-space" size={35} /><div><span className="eyebrow">{content.watermark}</span><h2>{content.title}</h2></div><button type="button" className="text-button our-space-edition" onClick={onSeeWallpaper}>看猫咪 ↗</button></div>
    <button id="open-yujuan-letter" type="button" className="our-letter-envelope" onClick={() => setLetterOpen(true)} aria-label="打开已解锁的信"><LetterEnvelope /><span><strong>{content.letter.title}</strong><small>{content.letter.summary}</small></span><span className="letter-open-label">拆开信 ↗</span></button>
    <section className="our-space-welcome" aria-labelledby="our-bond-title"><div><h3 id="our-bond-title">{content.bond.title}</h3><p>{content.bond.lines.map((line, index) => <span key={index}>{line}<br /></span>)}</p></div></section>
    <section className="together-counter inset-panel" aria-label="成为彼此伴侣的时间"><span>成为彼此伴侣的</span><div>第 <strong>{dates.daysTogether}</strong> 天</div><span>SINCE <time dateTime={content.startDate}>{content.startDate.replaceAll('-', '.')}</time></span></section>
    <section className="anniversary-card" aria-label="下一个纪念日"><div><span>{dates.daysUntilAnniversary === 0 ? '今天是我们的' : '下一个小纪念日'}</span><strong>{anniversaryLabel}<small><time dateTime={dates.nextAnniversaryDate}>{dates.nextAnniversaryDate.replaceAll('-', '.')}</time></small></strong></div><div className="anniversary-countdown">{dates.daysUntilAnniversary === 0 ? <strong>就是今天 ♡</strong> : <>还有 <strong>{dates.daysUntilAnniversary}</strong> 天</>}</div></section>
    <section className="our-wishes" aria-labelledby="our-wishes-title"><div className="wish-heading"><h3 id="our-wishes-title">想和你一起做的事</h3><span>{completed} / {state.wishes.length} 已完成</span></div><p className="wish-intro">{content.wishesIntro}</p>
      <ul>{state.wishes.map(wish => <li key={wish.id}><label className={wish.done ? 'wish-done' : ''}><input type="checkbox" checked={wish.done} onChange={() => { saveWishes(state.wishes.map(item => item.id === wish.id ? { ...item, done: !item.done } : item)); setFeedback(wish.done ? '已放回愿望清单。' : '又多了一件共同完成的小事。') }} /><span>{wish.text}</span></label><button type="button" className="remove-wish" aria-label={`删除愿望：${wish.text}`} onClick={() => { saveWishes(state.wishes.filter(item => item.id !== wish.id)); setFeedback('愿望已移除。') }}>×</button></li>)}</ul>
      {state.wishes.length === 0 && <p className="wish-empty">第一件想一起做的事，会是什么呢？</p>}
      <form className="wish-form" onSubmit={event => { event.preventDefault(); const text = draft.trim(); if (!text || state.wishes.length >= MAX_WISHES) return; saveWishes([...state.wishes, { id: createClientId(), text, done: false }]); setDraft(''); setFeedback('新的愿望已加入。') }}><label className="sr-only" htmlFor="our-new-wish">添加一件想和你一起做的事</label><input id="our-new-wish" className="inset-panel" value={draft} onChange={event => setDraft(event.target.value)} maxLength={120} placeholder="下一件想一起做的小事…" disabled={state.wishes.length >= MAX_WISHES} /><button type="submit" className="pixel-button" disabled={!draft.trim() || state.wishes.length >= MAX_WISHES}>＋ 添加</button></form>
      {state.wishes.length >= MAX_WISHES && <p className="wish-storage-note">清单已满，移除一些愿望后可以继续添加。</p>}
      <p className={`wish-storage-note ${state.saved ? '' : 'storage-unavailable'}`} role={state.saved ? undefined : 'alert'}>{state.saved ? '仅保存在这个浏览器，不会同步到其他设备。' : '浏览器存储不可用或清单未能读取；当前改动可能只在本次打开时保留。'}</p>
      <span className="sr-only" role="status">{feedback}</span>
    </section>
    <div className="our-space-footer"><span>{content.footer}</span><button type="button" className="text-button" onClick={onSeeWallpaper}>去看看两只小猫 ↗</button></div>
  </div>
}
