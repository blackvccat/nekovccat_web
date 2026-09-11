'use client'

import { useState, useRef, useEffect, useCallback, type ReactNode, type PointerEvent } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import NekoBrowser from './neko-browser'
import SponsorApp from './sponsor-app'
import { browserPage, type BrowserPage } from '@/lib/desktop-links'
import PixelIcon from './pixel-icon'
import MusicApp from './music-app'
import OurSpace from './our-space'
import { useMusicSession } from '@/components/music/music-session'
import { useRelationshipMode } from '@/components/relationship/relationship-mode'
import { AboutComputer, DEFAULT_SETTINGS, DESKTOP_APPS, NotesApp, SettingsApp, type DesktopAppId, type DesktopSettings } from './desktop-apps'

interface DesktopWindow { id: DesktopAppId; x: number; y: number; z: number; minimized: boolean; maximized: boolean }
const initialWindows: DesktopWindow[] = [{ id: 'agent', x: 204, y: 36, z: 1, minimized: false, maximized: false }]

function visibleWindowWidth(id: DesktopAppId, width: number, stageWidth: number) {
  return Math.min(width, stageWidth - (id === 'agent' && stageWidth >= 600 ? 160 : 16))
}

export default function PixelDesktop({ agent }: { agent: ReactNode }) {
  const { current: currentMusic, stop: stopMusic } = useMusicSession()
  const { isGirlfriend, isReady: relationshipReady, content: relationshipContent } = useRelationshipMode()
  const [windows, setWindows] = useState<DesktopWindow[]>(() => currentMusic ? [...initialWindows, { id: 'music', x: 280, y: 40, z: 2, minimized: false, maximized: false }] : initialWindows)
  const searchParams = useSearchParams()
  const launchQuery = searchParams.toString()
  const lastLaunchQuery = useRef<string | null>(null)
  const [browserLaunch, setBrowserLaunch] = useState<{ page: BrowserPage; key: number }>({ page: 'about', key: 0 })
  const [startOpen, setStartOpen] = useState(false)
  const [settings, setSettings] = useState<DesktopSettings>(DEFAULT_SETTINGS)
  const [time, setTime] = useState('--:--')
  const stageRef = useRef<HTMLDivElement>(null)
  const startRef = useRef<HTMLDivElement>(null)
  const zRef = useRef(currentMusic ? 2 : 1)
  const dragRef = useRef<{ id: DesktopAppId; pointerId: number; startX: number; startY: number; x: number; y: number } | null>(null)
  const previousModeRef = useRef<boolean | null>(null)
  const apps = DESKTOP_APPS.filter(app => isGirlfriend || app.id !== 'our-space')
  const modeWindows = windows.filter(window => isGirlfriend || window.id !== 'our-space')
  const visible = modeWindows.filter(window => !window.minimized)
  const activeId = visible.reduce<DesktopWindow | undefined>((current, window) => !current || window.z > current.z ? window : current, undefined)?.id

  useEffect(() => {
    if (!relationshipReady || previousModeRef.current === isGirlfriend) return
    previousModeRef.current = isGirlfriend
    if (!isGirlfriend) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- A mode change removes only its own desktop window.
      setWindows(previous => previous.filter(window => window.id !== 'our-space'))
      return
    }
    const stageWidth = stageRef.current?.clientWidth || 1000
    const stageHeight = stageRef.current?.clientHeight || 650
    const z = ++zRef.current
    setWindows(previous => [
      ...previous.filter(window => window.id !== 'our-space').map(window => window.id === 'agent' ? { ...window, minimized: true } : window),
      { id: 'our-space', x: Math.max(8, Math.min(140, stageWidth - 400)), y: Math.max(8, Math.min(20, stageHeight - 560)), z, minimized: false, maximized: false },
    ])
  }, [isGirlfriend, relationshipReady])

  useEffect(() => {
    const updateTime = () => setTime(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }))
    updateTime()
    const interval = setInterval(updateTime, 15000)
    try {
      const saved = JSON.parse(localStorage.getItem('neko-desktop-settings') || 'null')
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Browser-only preferences must be restored after the shared SSR render.
      if (saved && ['island', 'dusk', 'sage'].includes(saved.wallpaper) && typeof saved.scanlines === 'boolean') setSettings(saved)
    } catch { /* Defaults remain usable if browser storage is unavailable. */ }
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const closeMenu = (event: globalThis.PointerEvent) => {
      if (startRef.current && !startRef.current.contains(event.target as Node)) setStartOpen(false)
    }
    const onEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setStartOpen(false) }
    document.addEventListener('pointerdown', closeMenu)
    document.addEventListener('keydown', onEscape)
    return () => { document.removeEventListener('pointerdown', closeMenu); document.removeEventListener('keydown', onEscape) }
  }, [])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const fitWindows = () => setWindows(previous => previous.map(window => {
      const app = DESKTOP_APPS.find(app => app.id === window.id)!
      const preferredX = app.id === 'agent' && stage.clientWidth >= 600 ? Math.max(140, window.x) : window.x
      return { ...window, x: Math.max(8, Math.min(preferredX, stage.clientWidth - visibleWindowWidth(app.id, app.width, stage.clientWidth) - 20)), y: Math.max(8, Math.min(window.y, stage.clientHeight - Math.min(app.height, stage.clientHeight - 16) - 8)) }
    }))
    const observer = new ResizeObserver(fitWindows)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  const focusWindow = (id: DesktopAppId) => {
    const z = ++zRef.current
    setWindows(previous => previous.map(window => window.id === id ? { ...window, z, minimized: false } : window))
  }
  const openApp = useCallback((id: DesktopAppId) => {
    if (id === 'our-space' && !isGirlfriend) return
    setStartOpen(false)
    const z = ++zRef.current
    setWindows(previous => {
      if (previous.some(window => window.id === id)) return previous.map(window => window.id === id ? { ...window, z, minimized: false } : window)
      const app = DESKTOP_APPS.find(app => app.id === id)!
      const stage = stageRef.current
      const width = stage?.clientWidth || 1000
      const height = stage?.clientHeight || 650
      return [...previous, { id, z, minimized: false, maximized: false, x: Math.max(8, Math.min(id === 'our-space' ? 140 : 260 + previous.length * 24, width - visibleWindowWidth(id, app.width, width) - 20)), y: Math.max(8, Math.min(id === 'our-space' ? 20 : 62 + previous.length * 24, height - app.height - 12)) }]
    })
  }, [isGirlfriend])

  useEffect(() => {
    if (!relationshipReady || lastLaunchQuery.current === launchQuery) return
    lastLaunchQuery.current = launchQuery
    const params = new URLSearchParams(launchQuery)
    const app = params.get('app')
    if (app === 'explorer') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Open a document selected by an external desktop URL.
      setBrowserLaunch(previous => ({ page: browserPage(params.get('tab')), key: previous.key + 1 }))
      openApp('explorer')
    } else if (app === 'sponsor') openApp('sponsor')
  }, [launchQuery, relationshipReady, openApp])

  const minimizeWindow = (id: DesktopAppId) => setWindows(previous => previous.map(window => window.id === id ? { ...window, minimized: true } : window))
  const maximizeWindow = (id: DesktopAppId) => setWindows(previous => previous.map(window => window.id === id ? { ...window, maximized: !window.maximized } : window))
  const moveWindow = (id: DesktopAppId, x: number, y: number, element: HTMLElement) => {
    const stage = stageRef.current
    if (!stage) return
    setWindows(previous => previous.map(window => window.id === id ? { ...window, x: Math.max(0, Math.min(x, stage.clientWidth - element.offsetWidth)), y: Math.max(0, Math.min(y, stage.clientHeight - element.offsetHeight)) } : window))
  }
  const beginDrag = (event: PointerEvent<HTMLElement>, window: DesktopWindow) => {
    if (event.button !== 0 || !event.isPrimary || (event.target as HTMLElement).closest('button') || window.maximized || matchMedia('(max-width: 700px)').matches) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { id: window.id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: window.x, y: window.y }
  }
  const updateSettings = (next: DesktopSettings) => {
    setSettings(next)
    try { localStorage.setItem('neko-desktop-settings', JSON.stringify(next)) } catch { /* Settings still apply for this visit. */ }
  }

  return <main className="neko-desktop-page">
    <div className="computer-shell">
      <header className="computer-top"><Link href="/" className="computer-brand"><PixelIcon name="agent" size={26} /><strong>NEKO<span> personal computer</span></strong></Link><nav aria-label="网站导航"><Link href="/">Home</Link><Link href="/my-world" aria-current="page">My World</Link></nav><span className="computer-model">NK–01</span></header>
      <div className={`computer-screen ${settings.scanlines ? 'crt-enabled' : ''}`}>
        <div className={`desktop-stage wallpaper-${isGirlfriend ? 'couple' : settings.wallpaper}`} data-desktop-mode={isGirlfriend ? 'girlfriend' : 'default'} ref={stageRef}>
          <div className={`desktop-watermark ${isGirlfriend ? 'couple-watermark' : ''}`} aria-hidden="true"><span>{isGirlfriend ? relationshipContent?.watermark : 'A SMALL WORLD OF YOUR OWN.'}</span>{!isGirlfriend && <><strong>Make room<br />for curiosity.</strong><span>NEKO PERSONAL DESKTOP / EST. NOW</span></>}</div>
          <div className="desktop-icons" aria-label="桌面应用">{apps.map(app => <button type="button" className="desktop-icon" key={app.id} onClick={() => openApp(app.id)} aria-label={`打开 ${app.title}`}><PixelIcon name={app.id} size={43} /><span>{app.title}</span></button>)}</div>
          {modeWindows.map(window => {
            const app = DESKTOP_APPS.find(app => app.id === window.id)!
            const active = activeId === window.id
            return <section key={window.id} hidden={window.minimized} className={`desktop-window ${window.id === 'agent' ? 'agent-window' : ''} ${active ? 'active-window' : ''} ${window.maximized ? 'maximized' : ''}`} aria-label={app.title} style={{ left: window.x, top: window.y, width: app.width, height: app.height, zIndex: window.z }} onPointerDownCapture={() => { if (!active) focusWindow(window.id) }} onFocusCapture={() => { if (!active) focusWindow(window.id) }}>
              <div className="window-titlebar" tabIndex={0} aria-label={`${app.title} 标题栏，可用方向键移动`} title="拖动标题栏移动窗口；双击最大化" onPointerDown={event => beginDrag(event, window)} onPointerMove={event => {
                const drag = dragRef.current
                if (drag?.id === window.id && drag.pointerId === event.pointerId) moveWindow(window.id, drag.x + event.clientX - drag.startX, drag.y + event.clientY - drag.startY, event.currentTarget.parentElement!)
              }} onPointerUp={() => { dragRef.current = null }} onPointerCancel={() => { dragRef.current = null }} onLostPointerCapture={() => { dragRef.current = null }} onDoubleClick={event => { if (!(event.target as HTMLElement).closest('button')) maximizeWindow(window.id) }} onKeyDown={event => {
                if (event.target !== event.currentTarget || window.maximized || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return
                event.preventDefault()
                moveWindow(window.id, window.x + (event.key === 'ArrowRight' ? 16 : event.key === 'ArrowLeft' ? -16 : 0), window.y + (event.key === 'ArrowDown' ? 16 : event.key === 'ArrowUp' ? -16 : 0), event.currentTarget.parentElement!)
              }}><span className="window-name"><PixelIcon name={app.id} size={20} />{app.title}<small>{window.id === 'agent' ? ' / 你的站内向导' : ''}</small></span><div className="window-controls"><button type="button" aria-label={`最小化 ${app.title}`} onClick={() => minimizeWindow(window.id)}>_</button><button type="button" className="maximize-control" aria-label={`${window.maximized ? '还原' : '最大化'} ${app.title}`} onClick={() => maximizeWindow(window.id)}>□</button><button type="button" aria-label={`关闭 ${app.title}`} onClick={() => { if (window.id === 'music') stopMusic(); setWindows(previous => previous.filter(item => item.id !== window.id)) }}>×</button></div></div>
              <div className="window-content">{window.id === 'agent' ? agent : window.id === 'our-space' && relationshipContent ? <OurSpace content={relationshipContent} onSeeWallpaper={() => setWindows(previous => previous.map(window => ({ ...window, minimized: true })))} /> : window.id === 'explorer' ? <NekoBrowser initialPage={browserLaunch.page} launch={browserLaunch.key} onSponsor={() => openApp('sponsor')} /> : window.id === 'sponsor' ? <SponsorApp /> : window.id === 'music' ? <MusicApp playerLayer={window.z} active={active} onActivate={() => focusWindow('music')} /> : window.id === 'notes' ? <NotesApp /> : window.id === 'settings' ? <SettingsApp settings={settings} onChange={updateSettings} /> : <AboutComputer />}</div>
              <div className="window-statusbar"><span>{app.subtitle}</span><span>{window.id === 'our-space' ? '♡ OUR SPACE' : window.id === 'agent' ? '● MY WORLD' : 'NEKO OS'}<span className="resize-grip" aria-hidden="true">◢</span></span></div>
            </section>
          })}
        </div>
        <footer className="desktop-taskbar">
          <div ref={startRef} className="start-area"><button type="button" className={`pixel-button start-button ${startOpen ? 'pressed' : ''}`} aria-expanded={startOpen} aria-controls="desktop-start-menu" onClick={() => setStartOpen(!startOpen)}><PixelIcon name="agent" size={25} /><strong>start</strong></button>{startOpen && <div id="desktop-start-menu" className="start-menu"><div className="start-menu-banner">NEKO<span>OS</span></div><div><p>{isGirlfriend ? 'OUR HOME' : 'MY LITTLE WORLD'}</p>{apps.map(app => <button key={app.id} type="button" onClick={() => openApp(app.id)}><PixelIcon name={app.id} size={30} /><span>{app.title}<small>{app.subtitle}</small></span><span>›</span></button>)}<Link href="/" className="start-home"><PixelIcon name="home" size={24} />返回网站首页 ↗</Link></div></div>}</div>
          <div className="taskbar-divider" /><div className="taskbar-apps" aria-label="打开的应用">{modeWindows.map(window => {
            const app = DESKTOP_APPS.find(app => app.id === window.id)!
            return <button type="button" key={window.id} className={`pixel-button task-button ${activeId === window.id ? 'pressed' : ''}`} aria-label={`切换到 ${app.title}`} aria-pressed={activeId === window.id} onClick={() => activeId === window.id ? minimizeWindow(window.id) : focusWindow(window.id)}><PixelIcon name={app.id} size={21} /><span>{app.title}</span></button>
          })}</div><button type="button" className="show-desktop" aria-label="显示桌面，最小化全部窗口" title="显示桌面" onClick={() => setWindows(previous => previous.map(window => ({ ...window, minimized: true })))}><span /></button><div className="system-tray inset-panel"><span className="status-dot" /><time aria-label="本地时间">{time}</time></div>
        </footer>
      </div>
      <div className="computer-chin"><span><span className="power-led" />POWER</span><div className="speaker-slots" aria-hidden="true" /><span className="computer-signature">a little space for big ideas.</span></div>
    </div>
  </main>
}
