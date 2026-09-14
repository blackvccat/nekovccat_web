'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useVisualViewport } from '@/lib/use-visual-viewport'
import PixelIcon from '@/components/my-world/pixel-icon'
import { MUSIC_PROVIDERS, useMusicPlayback } from './music-session'
import './site-music.css'

const PanelLoading = () => <p className="assistant-loading" role="status">正在打开…</p>
const AgentApp = dynamic(() => import('@/components/agent/agent-app'), { loading: PanelLoading })
const MusicApp = dynamic(() => import('@/components/my-world/music-app'), { loading: PanelLoading })

export default function SiteMusic() {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)
  const [tab, setTab] = useState<'agent' | 'music'>('agent')
  const trigger = useRef<HTMLButtonElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLElement>(null)
  const openedBy = useRef<HTMLButtonElement | null>(null)
  const { current, stop } = useMusicPlayback()
  const desktop = pathname === '/my-world'
  const root = useVisualViewport<HTMLDivElement>(!desktop)
  const collapse = () => { setExpanded(false); (openedBy.current?.isConnected ? openedBy.current : trigger.current)?.focus() }

  useEffect(() => {
    if (!expanded || desktop) return
    closeButton.current?.focus()
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.isComposing && !event.defaultPrevented && panel.current?.contains(event.target as Node)) { setExpanded(false); (openedBy.current?.isConnected ? openedBy.current : trigger.current)?.focus() }
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [expanded, desktop])

  if (desktop) return null

  return <div ref={root} className={`site-music ${pathname === '/' ? 'music-over-scenery' : 'music-on-paper'}`} data-music-ui>
    {expanded && <section ref={panel} id="site-music-panel" className="site-music-panel" aria-label="NEKO 站内助手面板">
      <header className="site-music-panel-bar"><span><i />NEKO / YOUR LITTLE COMPANION</span><button type="button" ref={closeButton} onClick={collapse} aria-label="收起助手面板">⌄</button></header>
      <div className="site-assistant-tabs" role="tablist" aria-label="助手功能">{(['agent', 'music'] as const).map(mode => <button type="button" key={mode} role="tab" id={`neko-${mode}-tab`} aria-selected={tab === mode} aria-controls={`neko-${mode}-panel`} tabIndex={tab === mode ? 0 : -1} onClick={() => setTab(mode)} onKeyDown={event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
        event.preventDefault()
        const next = event.key === 'Home' ? 'agent' : event.key === 'End' ? 'music' : mode === 'agent' ? 'music' : 'agent'
        setTab(next)
        document.getElementById(`neko-${next}-tab`)?.focus()
      }}><PixelIcon name={mode} size={22} />{mode === 'agent' ? 'Agent 助手' : '音乐'}{mode === 'music' && current && <i aria-label="已载入音乐" />}</button>)}</div>
      <div id={`neko-${tab}-panel`} role="tabpanel" aria-labelledby={`neko-${tab}-tab`} className="site-music-panel-content">{tab === 'agent' ? <AgentApp /> : <MusicApp />}</div>
    </section>}
    <div className={`site-music-dock ${expanded ? 'is-open' : ''}`}>
      <button type="button" ref={trigger} className="site-music-launcher" aria-label={expanded ? '收起 NEKO 站内助手' : '打开 NEKO 站内助手'} aria-expanded={expanded} aria-controls="site-music-panel" onClick={event => { if (expanded) collapse(); else { openedBy.current = event.currentTarget; setTab('agent'); setExpanded(true) } }}>
        <span className="site-music-symbol"><PixelIcon name="agent" size={32} /></span>
        <span className="site-music-label"><strong>NEKO <span>站内助手</span></strong><small>{current ? `音乐已载入 · ${current.label}` : '聊聊这个世界，顺便听首歌'}</small></span>
        <span className="site-music-toggle" aria-hidden="true">{expanded ? '−' : '+'}</span>
      </button>
      <button type="button" className="site-music-shortcut" aria-label="打开音乐" onClick={event => { openedBy.current = event.currentTarget; setTab('music'); setExpanded(true) }}><PixelIcon name="music" size={24} /></button>
      {current && <button type="button" className="site-music-stop" onClick={stop} aria-label="停止音乐" title={`停止 ${MUSIC_PROVIDERS[current.provider].name} 播放器`}>■</button>}
    </div>
  </div>
}
