'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import MusicApp from '@/components/my-world/music-app'
import AgentApp from '@/components/agent/agent-app'
import PixelIcon from '@/components/my-world/pixel-icon'
import { MUSIC_PROVIDERS, useMusicSession } from './music-session'
import './site-music.css'

export default function SiteMusic() {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)
  const [tab, setTab] = useState<'agent' | 'music'>('agent')
  const trigger = useRef<HTMLButtonElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const { current, favoriteName, stop } = useMusicSession()
  const desktop = pathname === '/terminal'
  const collapse = () => { setExpanded(false); trigger.current?.focus() }

  useEffect(() => {
    if (!expanded || desktop) return
    closeButton.current?.focus()
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setExpanded(false); trigger.current?.focus() }
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [expanded, desktop])

  if (desktop) return null

  return <div className={`site-music ${pathname === '/' ? 'music-over-scenery' : 'music-on-paper'}`} data-music-ui>
    {expanded && <section id="site-music-panel" className="site-music-panel" aria-label="MK 站内助手面板">
      <header className="site-music-panel-bar"><span><i />MK / YOUR LITTLE COMPANION</span><button type="button" ref={closeButton} onClick={collapse} aria-label="收起助手面板">⌄</button></header>
      <div className="site-assistant-tabs" role="tablist" aria-label="助手功能">{(['agent', 'music'] as const).map(mode => <button type="button" key={mode} role="tab" id={`marcus-${mode}-tab`} aria-selected={tab === mode} aria-controls={`marcus-${mode}-panel`} tabIndex={tab === mode ? 0 : -1} onClick={() => setTab(mode)} onKeyDown={event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
        event.preventDefault()
        const next = event.key === 'Home' ? 'agent' : event.key === 'End' ? 'music' : mode === 'agent' ? 'music' : 'agent'
        setTab(next)
        document.getElementById(`marcus-${next}-tab`)?.focus()
      }}><PixelIcon name={mode} size={22} />{mode === 'agent' ? 'Agent 助手' : '音乐'}{mode === 'music' && current && <i aria-label="已载入音乐" />}</button>)}</div>
      <div id={`marcus-${tab}-panel`} role="tabpanel" aria-labelledby={`marcus-${tab}-tab`} className="site-music-panel-content">{tab === 'agent' ? <AgentApp /> : <MusicApp />}</div>
    </section>}
    <div className={`site-music-dock ${expanded ? 'is-open' : ''}`}>
      <button type="button" ref={trigger} className="site-music-launcher" aria-label={expanded ? '收起 MK 站内助手' : '打开 MK 站内助手'} aria-expanded={expanded} aria-controls="site-music-panel" onClick={() => { if (expanded) collapse(); else { setTab('agent'); setExpanded(true) } }}>
        <span className="site-music-symbol"><PixelIcon name="agent" size={32} /></span>
        <span className="site-music-label"><strong>MARCUS <span>站内助手</span></strong><small>{current ? `音乐已载入 · ${favoriteName.trim() || current.label}` : '聊聊这个世界，顺便听首歌'}</small></span>
        <span className="site-music-toggle" aria-hidden="true">{expanded ? '−' : '+'}</span>
      </button>
      <button type="button" className="site-music-shortcut" aria-label="打开音乐" onClick={() => { setTab('music'); setExpanded(true) }}><PixelIcon name="music" size={24} /></button>
      {current && <button type="button" className="site-music-stop" onClick={stop} aria-label="停止音乐" title={`停止 ${MUSIC_PROVIDERS[current.provider].name} 播放器`}>■</button>}
    </div>
  </div>
}
