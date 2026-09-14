'use client'

import { createContext, memo, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { parseMusicLink, restoreMusicItems, type MusicItem, type MusicProvider } from '@/lib/music/links'
import { clipPlayerRect, type ClippedPlayerRect, type Rect } from '@/lib/music/geometry'

const STORAGE_KEY = 'neko-music-library-v1'
export const MUSIC_PROVIDERS = {
  netease: { name: '网易云音乐', url: 'https://music.163.com/', placeholder: 'https://music.163.com/playlist?id=…' },
  spotify: { name: 'Spotify', url: 'https://open.spotify.com/', placeholder: 'https://open.spotify.com/playlist/…' },
}
type SavedMusic = { item: MusicItem; name: string }
type PlayerSlot = { element: HTMLDivElement; layer: number; active: boolean; activate: () => void }
type PlayerStatus = 'idle' | 'loading' | 'loaded' | 'slow'
type MusicPlayback = { current: MusicItem | null; stop: () => void; reloadPlayer: () => void; playerStatus: PlayerStatus }
type MusicSession = {
  provider: MusicProvider; input: string; current: MusicItem | null; favoriteName: string
  error: string; notice: string; library: SavedMusic[]; ready: boolean
  setInput: (input: string) => void; setFavoriteName: (name: string) => void
  load: (url: string, name?: string) => void; stop: () => void
  switchProvider: (provider: MusicProvider) => void; saveFavorite: () => void; removeFavorite: (url: string) => void
  registerSlot: (slot: PlayerSlot) => () => void
} & MusicPlayback
const MusicContext = createContext<MusicSession | null>(null)
const PlaybackContext = createContext<MusicPlayback | null>(null)
const PlayerSlotContext = createContext<MusicSession['registerSlot'] | null>(null)

/** Desktop chrome only subscribes to playback, not link drafts and collection edits. */
export function useMusicPlayback() {
  const playback = useContext(PlaybackContext)
  if (!playback) throw new Error('MusicSessionProvider is required')
  return playback
}

export function useMusicSession() {
  const session = useContext(MusicContext)
  if (!session) throw new Error('MusicSessionProvider is required')
  return session
}

export function MusicSessionProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<MusicProvider>('netease')
  const [input, setInput] = useState('')
  const [current, setCurrent] = useState<MusicItem | null>(null)
  const [favoriteName, setFavoriteName] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [library, setLibrary] = useState<SavedMusic[]>([])
  const [ready, setReady] = useState(false)
  const [slot, setSlot] = useState<PlayerSlot | null>(null)
  const [revision, setRevision] = useState(0)
  const [playerProgress, setPlayerProgress] = useState<{ key: string; status: PlayerStatus }>({ key: '', status: 'idle' })
  const playerKey = current ? `${current.embedUrl}:${revision}` : ''
  const activePlayerKey = useRef(playerKey)
  useLayoutEffect(() => { activePlayerKey.current = playerKey }, [playerKey])
  const playerStatus: PlayerStatus = !current ? 'idle' : playerProgress.key === playerKey ? playerProgress.status : 'loading'

  useEffect(() => {
    if (!playerKey) return
    const timer = window.setTimeout(() => setPlayerProgress(previous => previous.key === playerKey && previous.status === 'loaded' ? previous : { key: playerKey, status: 'slow' }), 12000)
    return () => window.clearTimeout(timer)
  }, [playerKey])
  const playerLoaded = useCallback((key: string) => {
    if (key === activePlayerKey.current) setPlayerProgress({ key, status: 'loaded' })
  }, [])
  const reloadPlayer = useCallback(() => setRevision(previous => previous + 1), [])

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Restore browser storage after the shared server render.
      setLibrary(restoreMusicItems(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')))
    } catch { setNotice('浏览器存储不可用，收藏仅在本次访问中保留。') }
    setReady(true)
    const sync = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY && event.key !== null) return
      try { setLibrary(restoreMusicItems(JSON.parse(event.newValue || '[]'))) } catch { /* Keep the last valid collection. */ }
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  const registerSlot = useCallback((next: PlayerSlot) => {
    setSlot(next)
    return () => setSlot(previous => previous?.element === next.element ? null : previous)
  }, [])

  const load = useCallback((url: string, name?: string) => {
    try {
      const item = parseMusicLink(url)
      setCurrent(item)
      setProvider(item.provider)
      setInput(item.url)
      setFavoriteName(name || library.find(saved => saved.item.url === item.url)?.name || item.label)
      setError('')
      setNotice('站内切页会保留当前音乐，打开后请使用官方播放器里的播放按钮。')
    } catch (cause) { setError(cause instanceof Error ? cause.message : '暂时无法识别这个链接。') }
  }, [library])
  const stop = useCallback(() => { setCurrent(null); setRevision(previous => previous + 1); setNotice('播放器已停止。') }, [])
  const persist = useCallback((next: SavedMusic[], message: string) => {
    setLibrary(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next.map(saved => ({ url: saved.item.url, name: saved.name }))))
      setNotice(message)
    } catch { setNotice('浏览器存储不可用，收藏仅在本次访问中保留。') }
  }, [])
  const saveFavorite = useCallback(() => {
    if (!current || !ready) return
    const others = library.filter(saved => saved.item.url !== current.url)
    if (others.length >= 20) { setNotice('最多保存 20 个收藏，请先移除一个。'); return }
    persist([{ item: current, name: Array.from(favoriteName.trim()).slice(0, 60).join('') || current.label }, ...others], '已保存到这个浏览器的音乐收藏。')
  }, [current, ready, library, favoriteName, persist])
  const switchProvider = useCallback((next: MusicProvider) => {
    if (next === provider) return
    setProvider(next); setInput(''); setError(''); setNotice('')
    // Browsing the other source does not interrupt the current player.
  }, [provider])
  const updateInput = useCallback((value: string) => { setInput(value); setError('') }, [])
  const removeFavorite = useCallback((url: string) => persist(library.filter(saved => saved.item.url !== url), '已移除这个收藏。'), [library, persist])
  const playback = useMemo(() => ({ current, stop, playerStatus, reloadPlayer }), [current, stop, playerStatus, reloadPlayer])
  const session = useMemo(() => ({ provider, input, current, favoriteName, error, notice, library, ready,
    setInput: updateInput, setFavoriteName, load, stop, switchProvider, saveFavorite, removeFavorite, registerSlot,
    playerStatus, reloadPlayer }), [provider, input, current, favoriteName, error, notice, library, ready,
    updateInput, load, stop, switchProvider, saveFavorite, removeFavorite, registerSlot, playerStatus, reloadPlayer])

  return <PlaybackContext.Provider value={playback}><PlayerSlotContext.Provider value={registerSlot}><MusicContext.Provider value={session}>
    {children}
    <PersistentMusicPlayer current={current} slot={slot} playerKey={playerKey} onLoaded={playerLoaded} />
  </MusicContext.Provider></PlayerSlotContext.Provider></PlaybackContext.Provider>
}

/** A visual position for the single root player. Moving between slots never reparents its iframe. */
export function MusicPlayerSlot({ height, layer = 80, active = true, onActivate }: { height: number; layer?: number; active?: boolean; onActivate?: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const activateRef = useRef(onActivate)
  const registerSlot = useContext(PlayerSlotContext)
  if (!registerSlot) throw new Error('MusicSessionProvider is required')
  useLayoutEffect(() => { activateRef.current = onActivate }, [onActivate])
  useLayoutEffect(() => {
    if (!ref.current) return
    return registerSlot({ element: ref.current, layer, active, activate: () => activateRef.current?.() })
  }, [registerSlot, layer, active])
  return <div ref={ref} className="music-player-slot" style={{ height }} aria-label="官方播放器显示区域" />
}

const PersistentMusicPlayer = memo(function PersistentMusicPlayer({ current, slot, playerKey, onLoaded }: { current: MusicItem | null; slot: PlayerSlot | null; playerKey: string; onLoaded: (key: string) => void }) {
  const [geometry, setGeometry] = useState<ClippedPlayerRect | null>(null)
  const [loadCount, setLoadCount] = useState(0)

  useLayoutEffect(() => {
    if (!slot || !current) return
    const parents: HTMLElement[] = []
    for (let node = slot.element.parentElement; node; node = node.parentElement) parents.push(node)
    let frame = 0
    const update = () => {
      frame = 0
      const clips: Rect[] = [{ left: 0, top: 0, width: window.innerWidth, height: window.innerHeight }]
      for (const parent of parents) {
        const style = getComputedStyle(parent)
        if (/(auto|scroll|hidden|clip)/.test(`${style.overflowX} ${style.overflowY}`)) clips.push(parent.getBoundingClientRect())
      }
      const next = clipPlayerRect(slot.element.getBoundingClientRect(), clips)
      setGeometry(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    const resize = new ResizeObserver(schedule)
    resize.observe(slot.element)
    parents.forEach(parent => resize.observe(parent))
    const mutation = new MutationObserver(schedule)
    parents.forEach(parent => mutation.observe(parent, { attributes: true, attributeFilter: ['style', 'class', 'hidden'] }))
    const app = slot.element.closest('.music-app')
    // Error messages and labels can move the slot without changing any ancestor's size.
    if (app) mutation.observe(app, { childList: true, characterData: true, subtree: true })
    window.addEventListener('resize', schedule)
    window.addEventListener('scroll', schedule, true)
    window.visualViewport?.addEventListener('resize', schedule)
    window.visualViewport?.addEventListener('scroll', schedule)
    schedule()
    return () => {
      cancelAnimationFrame(frame); resize.disconnect(); mutation.disconnect()
      window.removeEventListener('resize', schedule); window.removeEventListener('scroll', schedule, true)
      window.visualViewport?.removeEventListener('resize', schedule); window.visualViewport?.removeEventListener('scroll', schedule)
    }
  }, [current, slot])

  const visible = !!(slot && geometry && slot.element.isConnected)
  // Keep this node at one location in the root layout, even when no page exposes a slot.
  return <div className="persistent-music-player" hidden={!visible} data-testid="persistent-music-player" data-frame-loads={loadCount}
    style={visible && geometry ? { left: geometry.left, top: geometry.top, width: geometry.width, height: geometry.height, zIndex: slot!.layer } : undefined}>
    {current && <iframe key={playerKey} src={current.embedUrl} title={`${MUSIC_PROVIDERS[current.provider].name}音乐播放器`}
      width={geometry?.frameWidth || 320} height={current.height}
      style={{ left: geometry?.offsetLeft || 0, top: geometry?.offsetTop || 0, width: geometry?.frameWidth || 320, height: current.height }}
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin" onLoad={() => { setLoadCount(count => count + 1); onLoaded(playerKey) }} />}
    {visible && !slot!.active && <button type="button" className="music-player-activate" aria-label="激活 NEKO Music 播放器" onClick={slot!.activate} />}
  </div>
})
