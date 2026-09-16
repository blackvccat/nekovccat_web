'use client'

import { useState, useRef, useEffect, useCallback, type ReactNode, type MouseEvent, type PointerEvent } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import MarcusBrowser from './marcus-browser'
import { browserPage, type BrowserPage } from '@/lib/desktop-links'
import PixelIcon, { PixelImage, iconFile } from './pixel-icon'
import MusicApp from './music-app'
import VisitorLogin from './visitor-login'
import VisitorHome from '@/components/visitor/visitor-home'
import VisitorApp from '@/components/visitor/visitor-app'
import { useMusicSession } from '@/components/music/music-session'
import { useVisitorMode } from '@/components/visitor/visitor-mode'
import { visitorAppIcon } from '@/lib/visitor-view'
import { AboutComputer, DEFAULT_SETTINGS, DESKTOP_APPS, NotesApp, SettingsApp, type DesktopAppId, type DesktopSettings } from './desktop-apps'
import NightHarborWallpaper from './night-harbor-wallpaper'
import { readDesktopSettings, resolveScanlineWidth } from '@/lib/desktop-settings'

/** Visitor app windows derive their own id so one desktop can host every granted application. */
const VISITOR_APP_PREFIX = 'visitor-app:'
type WindowId = DesktopAppId | `visitor-app:${string}`
interface DesktopWindow { id: WindowId; x: number; y: number; z: number; minimized: boolean; maximized: boolean }
const initialWindows: DesktopWindow[] = [{ id: 'agent', x: 204, y: 36, z: 1, minimized: false, maximized: false }]

interface AppInfo { id: WindowId; title: string; subtitle: string; width: number; height: number; icon: string }
const VISITOR_APP_SIZE = { width: 560, height: 580 }
/** 点一下就往右展开侧栏的窗口，以及展开后的宽度：左边照旧，右边多一栏列表。 */
const SIDE_PANELS: Partial<Record<DesktopAppId, number>> = { music: 1010, notes: 900 }

function visibleWindowWidth(id: WindowId, width: number, stageWidth: number) {
  return Math.min(width, stageWidth - (id === 'agent' && stageWidth >= 600 ? 160 : 16))
}

export default function PixelDesktop({ agent }: { agent: ReactNode }) {
  const { current: currentMusic, stop: stopMusic } = useMusicSession()
  const { isUnlocked, isReady: visitorReady, name: visitorName, apps: visitorApps, themedAppId, setThemedAppId } = useVisitorMode()
  const [windows, setWindows] = useState<DesktopWindow[]>(() => currentMusic ? [...initialWindows, { id: 'music', x: 280, y: 40, z: 2, minimized: false, maximized: false }] : initialWindows)
  const searchParams = useSearchParams()
  const launchQuery = searchParams.toString()
  const lastLaunchQuery = useRef<string | null>(null)
  const [browserLaunch, setBrowserLaunch] = useState<{ page: BrowserPage; key: number }>({ page: 'about', key: 0 })
  const [startOpen, setStartOpen] = useState(false)
  const [openPanels, setOpenPanels] = useState<Partial<Record<DesktopAppId, boolean>>>({})
  const [settings, setSettings] = useState<DesktopSettings>(DEFAULT_SETTINGS)
  const [time, setTime] = useState('--:--')
  const stageRef = useRef<HTMLDivElement>(null)
  const startRef = useRef<HTMLDivElement>(null)
  const zRef = useRef(currentMusic ? 2 : 1)
  const dragRef = useRef<{ id: WindowId; pointerId: number; startX: number; startY: number; x: number; y: number } | null>(null)
  const pressRef = useRef<{ x: number; y: number } | null>(null)
  const previousUnlockedRef = useRef<boolean | null>(null)
  const themedApp = visitorApps.find(app => app.id === themedAppId)

  /** Static desktop apps plus whichever visitor apps this account was granted; 图标统一是文件地址。 */
  const appInfo = useCallback((id: WindowId): AppInfo | undefined => {
    const known = DESKTOP_APPS.find(app => app.id === id)
    if (known) return { ...known, icon: iconFile(known.id) }
    if (!id.startsWith(VISITOR_APP_PREFIX)) return undefined
    const app = visitorApps.find(entry => `${VISITOR_APP_PREFIX}${entry.id}` === id)
    return app ? { id, title: app.title, subtitle: app.subtitle, icon: visitorAppIcon(app), ...VISITOR_APP_SIZE } : undefined
  }, [visitorApps])
  const apps: AppInfo[] = [
    ...DESKTOP_APPS.map(app => ({ ...app, icon: iconFile(app.id) })),
    ...visitorApps.map(app => ({ id: `${VISITOR_APP_PREFIX}${app.id}` as WindowId, title: app.title, subtitle: app.subtitle, icon: visitorAppIcon(app), ...VISITOR_APP_SIZE })),
  ]

  /** 侧栏展开后窗口变宽，其余窗口用登记尺寸。 */
  const windowWidth = useCallback((id: WindowId, width: number) => {
    const widened = SIDE_PANELS[id as DesktopAppId]
    return widened && openPanels[id as DesktopAppId] ? widened : width
  }, [openPanels])

  /** 开始菜单只放公共说明：登录后门口的提示语和访客应用的副标题都不出现在系统界面里。 */
  const startMenuNote = (id: WindowId) => id.startsWith(VISITOR_APP_PREFIX) || (id === 'visitor' && isUnlocked) ? '' : appInfo(id)?.subtitle ?? ''
  const visible = windows.filter(window => !window.minimized)
  const activeId = visible.reduce<DesktopWindow | undefined>((current, window) => !current || window.z > current.z ? window : current, undefined)?.id

  useEffect(() => {
    // A successful login opens the visitor page; the apps themselves never open by themselves.
    if (!visitorReady || previousUnlockedRef.current === isUnlocked) return
    previousUnlockedRef.current = isUnlocked
    if (!isUnlocked) {
      setThemedAppId(null)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Logging out closes the apps it opened and leaves the door on the login form.
      setWindows(previous => previous.filter(window => !window.id.startsWith(VISITOR_APP_PREFIX)))
      return
    }
    const stageWidth = stageRef.current?.clientWidth || 1000
    const stageHeight = stageRef.current?.clientHeight || 650
    const z = ++zRef.current
    setWindows(previous => [
      ...previous.filter(window => window.id !== 'visitor').map(window => window.id === 'agent' ? { ...window, minimized: true } : window),
      { id: 'visitor', x: Math.max(8, Math.min(140, stageWidth - 420)), y: Math.max(8, Math.min(20, stageHeight - 530)), z, minimized: false, maximized: false },
    ])
  }, [isUnlocked, visitorReady, setThemedAppId])

  /** 明暗写在 <html> 上：首屏引导脚本已按存档设过一次，这里跟上后续的切换。
   *  站内其它页面没有 .marcus-desktop-page，属性在那儿不起作用。 */
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme
  }, [settings.theme])

  useEffect(() => {
    const updateTime = () => setTime(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }))
    updateTime()
    const interval = setInterval(updateTime, 15000)
    try {
      const saved = JSON.parse(localStorage.getItem('marcus-desktop-settings') || 'null')
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Browser-only preferences must be restored after the shared SSR render.
      setSettings(readDesktopSettings(saved))
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
      const app = appInfo(window.id)
      if (!app) return window
      const preferredX = app.id === 'agent' && stage.clientWidth >= 600 ? Math.max(140, window.x) : window.x
      return { ...window, x: Math.max(8, Math.min(preferredX, stage.clientWidth - visibleWindowWidth(app.id, windowWidth(app.id, app.width), stage.clientWidth) - 20)), y: Math.max(8, Math.min(window.y, stage.clientHeight - Math.min(app.height, stage.clientHeight - 16) - 8)) }
    }))
    const observer = new ResizeObserver(fitWindows)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [appInfo, windowWidth])

  const focusWindow = (id: WindowId) => {
    const z = ++zRef.current
    setWindows(previous => previous.map(window => window.id === id ? { ...window, z, minimized: false } : window))
    if (id.startsWith(VISITOR_APP_PREFIX)) {
      const app = visitorApps.find(entry => `${VISITOR_APP_PREFIX}${entry.id}` === id)
      setThemedAppId(app?.hasWallpaper ? app.id : null)
    }
  }
  const openApp = useCallback((id: WindowId) => {
    const app = appInfo(id)
    if (!app) return
    setStartOpen(false)
    const z = ++zRef.current
    setWindows(previous => {
      if (previous.some(window => window.id === id)) return previous.map(window => window.id === id ? { ...window, z, minimized: false } : window)
      const stage = stageRef.current
      const width = stage?.clientWidth || 1000
      const height = stage?.clientHeight || 650
      const preferredX = id === 'visitor' ? 140 : 260 + previous.length * 24
      const preferredY = id === 'visitor' ? 20 : 62 + previous.length * 24
      return [...previous, { id, z, minimized: false, maximized: false, x: Math.max(8, Math.min(preferredX, width - visibleWindowWidth(id, app.width, width) - 20)), y: Math.max(8, Math.min(preferredY, height - app.height - 12)) }]
    })
  }, [appInfo])

  useEffect(() => {
    if (!visitorReady || lastLaunchQuery.current === launchQuery) return
    lastLaunchQuery.current = launchQuery
    const params = new URLSearchParams(launchQuery)
    const app = params.get('app')
    if (app === 'explorer') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Open a document selected by an external desktop URL.
      setBrowserLaunch(previous => ({ page: browserPage(params.get('tab')), key: previous.key + 1 }))
      openApp('explorer')
    }
    // /terminal?app=visitor opens the visitor window; granted apps also open by their own id.
    if (app === 'visitor') openApp('visitor')
    if (app && appInfo(`${VISITOR_APP_PREFIX}${app}`)) openApp(`${VISITOR_APP_PREFIX}${app}`)
  }, [launchQuery, visitorReady, openApp, appInfo])

  /** 展开侧栏会把窗口撑宽，顺手把它挪回画面内，别让右边跑到屏幕外。 */
  const toggleSidePanel = (id: DesktopAppId, next: boolean, element?: HTMLElement | null) => {
    setOpenPanels(previous => ({ ...previous, [id]: next }))
    if (!next || window.matchMedia('(max-width: 700px)').matches) return
    const stage = stageRef.current
    if (!stage) return
    const width = Math.min(SIDE_PANELS[id] ?? 0, stage.clientWidth - 16)
    const height = element?.offsetHeight || appInfo(id)?.height || 0
    setWindows(previous => previous.map(window => window.id === id
      ? { ...window, x: Math.max(8, Math.min(window.x, stage.clientWidth - width - 16)), y: Math.max(8, Math.min(window.y, stage.clientHeight - Math.min(height, stage.clientHeight - 16) - 8)) }
      : window))
  }
  /** 点窗口的空白处就展开侧栏；点在按钮/输入框上、或者刚拖过窗口，都不算。 */
  const expandSidePanel = (event: MouseEvent<HTMLElement>, id: WindowId) => {
    if (!SIDE_PANELS[id as DesktopAppId] || openPanels[id as DesktopAppId]) return
    if ((event.target as HTMLElement).closest('button, a, input, textarea, select, label, iframe')) return
    const pressed = pressRef.current
    if (pressed && Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y) > 6) return
    toggleSidePanel(id as DesktopAppId, true, event.currentTarget)
  }
  const minimizeWindow = (id: WindowId) => setWindows(previous => previous.map(window => window.id === id ? { ...window, minimized: true } : window))
  const maximizeWindow = (id: WindowId) => setWindows(previous => previous.map(window => window.id === id ? { ...window, maximized: !window.maximized } : window))
  const moveWindow = (id: WindowId, x: number, y: number, element: HTMLElement) => {
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
    try { localStorage.setItem('marcus-desktop-settings', JSON.stringify(next)) } catch { /* Settings still apply for this visit. */ }
  }
  const showDesktop = () => setWindows(previous => previous.map(window => ({ ...window, minimized: true })))

  return <main className="marcus-desktop-page" data-theme={settings.theme} data-scanline={resolveScanlineWidth(settings)}>
    <div className="computer-shell">
      <header className="computer-top"><Link href="/terminal" className="computer-brand"><PixelIcon name="agent" size={26} /><strong>MARCUS<span> personal computer</span></strong></Link><nav aria-label="网站导航"><a href="https://example.com/" title="前往主站首页（覆盖本页）">HOME</a><Link href="/terminal" aria-current="page">Terminal</Link></nav><span className="computer-model">MK-48</span></header>
      <div className={`computer-screen ${settings.scanlines ? 'crt-enabled' : ''}`}>
        <div
          className={`desktop-stage wallpaper-${themedApp ? 'visitor' : settings.wallpaper}`}
          data-desktop-mode={themedApp ? 'visitor' : 'default'}
          ref={stageRef}
          style={themedApp ? { backgroundImage: `url(/api/visitor/asset?app=${encodeURIComponent(themedApp.id)}&kind=wallpaper)` } : undefined}
        >
          {/* 访客应用自带壁纸时它就是背景，动画层只服务夜泊这一张桌面壁纸。 */}
          {!themedApp && settings.wallpaper === 'night-harbor' && <NightHarborWallpaper motion={settings.wallpaperMotion} />}
          {themedApp && <div className="desktop-watermark" aria-hidden="true"><span>{themedApp.watermark}</span></div>}
          <div className="desktop-icons" aria-label="桌面应用">{apps.map(app => <button type="button" className="desktop-icon" key={app.id} onClick={() => openApp(app.id)} aria-label={`打开 ${app.title}`}><PixelImage file={app.icon} size={43} /><span>{app.title}</span></button>)}</div>
          {windows.map(window => {
            const app = appInfo(window.id)
            if (!app) return null
            const active = activeId === window.id
            const isVisitorApp = window.id.startsWith(VISITOR_APP_PREFIX)
            // 登录后的访客窗口不再重复门口的提示语，访客应用的副标题也不出现在系统栏里。
            const statusLeft = isVisitorApp || (window.id === 'visitor' && isUnlocked) ? null : app.subtitle
            return <section key={window.id} hidden={window.minimized} className={`desktop-window ${window.id === 'agent' ? 'agent-window' : ''} ${active ? 'active-window' : ''} ${window.maximized ? 'maximized' : ''}`} aria-label={app.title} style={{ left: window.x, top: window.y, width: windowWidth(window.id, app.width), height: app.height, zIndex: window.z }} onPointerDownCapture={event => { pressRef.current = { x: event.clientX, y: event.clientY }; if (!active) focusWindow(window.id) }} onFocusCapture={() => { if (!active) focusWindow(window.id) }} onClick={event => expandSidePanel(event, window.id)}>
              <div className="window-titlebar" tabIndex={0} aria-label={`${app.title} 标题栏，可用方向键移动`} title="拖动标题栏移动窗口；双击最大化" onPointerDown={event => beginDrag(event, window)} onPointerMove={event => {
                const drag = dragRef.current
                if (drag?.id === window.id && drag.pointerId === event.pointerId) moveWindow(window.id, drag.x + event.clientX - drag.startX, drag.y + event.clientY - drag.startY, event.currentTarget.parentElement!)
              }} onPointerUp={() => { dragRef.current = null }} onPointerCancel={() => { dragRef.current = null }} onLostPointerCapture={() => { dragRef.current = null }} onDoubleClick={event => { if (!(event.target as HTMLElement).closest('button')) maximizeWindow(window.id) }} onKeyDown={event => {
                if (event.target !== event.currentTarget || window.maximized || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return
                event.preventDefault()
                moveWindow(window.id, window.x + (event.key === 'ArrowRight' ? 16 : event.key === 'ArrowLeft' ? -16 : 0), window.y + (event.key === 'ArrowDown' ? 16 : event.key === 'ArrowUp' ? -16 : 0), event.currentTarget.parentElement!)
              }}><span className="window-name"><PixelImage file={app.icon} size={20} />{app.title}<small>{window.id === 'agent' ? ' / 你的站内向导' : window.id === 'visitor' && visitorName ? ` / ${visitorName}` : ''}</small></span><div className="window-controls"><button type="button" aria-label={`最小化 ${app.title}`} onClick={() => minimizeWindow(window.id)}>_</button><button type="button" className="maximize-control" aria-label={`${window.maximized ? '还原' : '最大化'} ${app.title}`} onClick={() => maximizeWindow(window.id)}>□</button><button type="button" aria-label={`关闭 ${app.title}`} onClick={() => { if (window.id === 'music') stopMusic(); if (SIDE_PANELS[window.id as DesktopAppId]) toggleSidePanel(window.id as DesktopAppId, false); if (isVisitorApp) setThemedAppId(null); setWindows(previous => previous.filter(item => item.id !== window.id)) }}>×</button></div></div>
              <div className="window-content">{window.id === 'agent' ? agent : window.id === 'visitor' ? (isUnlocked ? <VisitorHome onOpenApp={appId => openApp(`${VISITOR_APP_PREFIX}${appId}`)} onShowDesktop={showDesktop} /> : <VisitorLogin />) : isVisitorApp ? <VisitorApp appId={window.id.slice(VISITOR_APP_PREFIX.length)} onShowWallpaper={showDesktop} /> : window.id === 'explorer' ? <MarcusBrowser initialPage={browserLaunch.page} launch={browserLaunch.key} /> : window.id === 'music' ? <MusicApp playerLayer={window.z} active={active} onActivate={() => focusWindow('music')} playlistOpen={!!openPanels.music} onTogglePlaylist={next => toggleSidePanel('music', next)} /> : window.id === 'notes' ? <NotesApp listOpen={!!openPanels.notes} onToggleList={next => toggleSidePanel('notes', next)} /> : window.id === 'settings' ? <SettingsApp settings={settings} onChange={updateSettings} /> : <AboutComputer />}</div>
              <div className={`window-statusbar ${statusLeft ? '' : 'status-only'}`}>{statusLeft && <span>{statusLeft}</span>}<span>{window.id === 'visitor' ? (isUnlocked ? '● VISITOR MODE' : '○ VISITOR MODE') : isVisitorApp ? '● SIGNED IN' : window.id === 'agent' ? '● TERMINAL' : 'MARCUS OS'}<span className="resize-grip" aria-hidden="true">◢</span></span></div>
            </section>
          })}
        </div>
        <footer className="desktop-taskbar">
          <div ref={startRef} className="start-area"><button type="button" className={`pixel-button start-button ${startOpen ? 'pressed' : ''}`} aria-expanded={startOpen} aria-controls="desktop-start-menu" onClick={() => setStartOpen(!startOpen)}><PixelIcon name="agent" size={25} /><strong>start</strong></button>{startOpen && <div id="desktop-start-menu" className="start-menu"><div className="start-menu-banner">MARCUS<span>OS</span></div><div><p>{isUnlocked ? 'VISITOR MODE' : 'MY LITTLE WORLD'}</p>{apps.map(app => <button key={app.id} type="button" onClick={() => openApp(app.id)}><PixelImage file={app.icon} size={30} /><span>{app.title}{startMenuNote(app.id) && <small>{startMenuNote(app.id)}</small>}</span><span>›</span></button>)}<a href="https://example.com/" className="start-home"><PixelIcon name="home" size={24} />前往主站首页 ↗</a></div></div>}</div>
          <div className="taskbar-divider" /><div className="taskbar-apps" aria-label="打开的应用">{windows.map(window => {
            const app = appInfo(window.id)
            if (!app) return null
            return <button type="button" key={window.id} className={`pixel-button task-button ${activeId === window.id ? 'pressed' : ''}`} aria-label={`切换到 ${app.title}`} aria-pressed={activeId === window.id} onClick={() => activeId === window.id ? minimizeWindow(window.id) : focusWindow(window.id)}><PixelImage file={app.icon} size={21} /><span>{app.title}</span></button>
          })}</div><button type="button" className="show-desktop" aria-label="显示桌面，最小化全部窗口" title="显示桌面" onClick={showDesktop}><span /></button><div className="system-tray inset-panel"><span className="status-dot" /><time aria-label="本地时间">{time}</time></div>
        </footer>
      </div>
      <div className="computer-chin"><span><span className="power-led" />POWER</span><div className="speaker-slots" aria-hidden="true" /><span className="computer-signature">a little space for big ideas.</span></div>
    </div>
  </main>
}
