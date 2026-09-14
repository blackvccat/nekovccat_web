'use client'

import { Component, useCallback, useEffect, useState, useMemo, memo, Suspense, type ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import PageTransition from '@/components/shared/page-transition'

const PanoramaBackground = dynamic(() => import('./panorama-background'), { ssr: false, loading: () => null })

// 动态导入3D场景，只在需要时加载（保留作为备用选项）
const CityScene = dynamic(() => import('@/components/3d/city-scene'), {
  ssr: false,
  loading: () => null
})

interface PageLayoutProps {
  children: ReactNode
  use3DBackground?: boolean
  panoramaImage?: string // 全景图片路径
  panoramaMobileImage?: string
  panoramaPoster?: string
  enablePanoramaInteraction?: boolean // 是否启用全景图交互（拖动查看）
  enablePanoramaAutoRotate?: boolean // 是否启用全景图自动旋转
  panoramaRotateSpeed?: number // 全景图旋转速度（度/秒）
  textColor?: 'white' | 'black'
  transparentHeader?: boolean // 是否使用透明背景的 Header
}

class PanoramaBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onError() }
  render() { return this.state.failed ? null : this.props.children }
}

type Connection = EventTarget & { saveData?: boolean; effectiveType?: string }
interface PanoramaPreferences { reduced: boolean; saveData: boolean; lowPower: boolean; mobile: boolean }

function ProgressivePanorama({ imageSrc, mobileImageSrc, posterSrc, enableInteraction, enableAutoRotate, autoRotateSpeed }: {
  imageSrc: string; mobileImageSrc?: string; posterSrc: string
  enableInteraction: boolean; enableAutoRotate: boolean; autoRotateSpeed: number
}) {
  const [preferences, setPreferences] = useState<PanoramaPreferences | null>(null)
  const [visible, setVisible] = useState(false)
  const [posterReady, setPosterReady] = useState(false)
  const [requested, setRequested] = useState(false)
  const [started, setStarted] = useState(false)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [paused, setPaused] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const reportReady = useCallback(() => setReady(true), [])
  const reportError = useCallback(() => { setFailed(true); setReady(false) }, [])
  const requestPanorama = useCallback(() => {
    setFailed(false)
    setReady(false)
    setAttempt(value => value + 1)
    setRequested(true)
  }, [])

  useEffect(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    const mobile = matchMedia('(max-width: 768px)').matches
    const device = navigator as Navigator & { connection?: Connection; deviceMemory?: number }
    const connection = device.connection
    const updatePreferences = () => setPreferences({
      reduced: motion.matches,
      saveData: connection?.saveData === true || /^(slow-)?2g$/.test(connection?.effectiveType || ''),
      lowPower: mobile || (device.deviceMemory !== undefined && device.deviceMemory <= 4) || (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4),
      mobile,
    })
    const updateVisibility = () => setVisible(document.visibilityState === 'visible')
    updatePreferences()
    updateVisibility()
    motion.addEventListener('change', updatePreferences)
    connection?.addEventListener('change', updatePreferences)
    document.addEventListener('visibilitychange', updateVisibility)
    return () => {
      motion.removeEventListener('change', updatePreferences)
      connection?.removeEventListener('change', updatePreferences)
      document.removeEventListener('visibilitychange', updateVisibility)
    }
  }, [])

  useEffect(() => {
    if (started || !posterReady || !visible || !preferences) return
    if (!requested && (preferences.lowPower || preferences.reduced || preferences.saveData)) return
    let cancelled = false
    let frame = 0
    let idle = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    const startWhenIdle = () => {
      if (cancelled) return
      if ('requestIdleCallback' in window) {
        idle = window.requestIdleCallback(deadline => {
          // A short idle gap should not force module evaluation into the first paint.
          if (deadline.timeRemaining() < 8) startWhenIdle()
          else if (!cancelled) setStarted(true)
        })
      } else timer = setTimeout(() => { if (!cancelled) setStarted(true) }, 0)
    }
    // Next/Image fires onLoad after decode. Finish fonts and two browser frames
    // before enhancing the already-visible page; text never waits on this work.
    const afterFonts = () => {
      if (cancelled) return
      frame = requestAnimationFrame(() => { frame = requestAnimationFrame(startWhenIdle) })
    }
    void document.fonts.ready.then(afterFonts, afterFonts)
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      if (idle) window.cancelIdleCallback(idle)
      clearTimeout(timer)
    }
  }, [started, posterReady, visible, preferences, requested])

  useEffect(() => {
    if (!started || ready || failed || !visible) return
    // Failed chunks, unsupported WebGL and very slow textures retain a useful still image.
    const task = setTimeout(reportError, 15000)
    return () => clearTimeout(task)
  }, [started, ready, failed, visible, attempt, reportError])

  const rotate = enableAutoRotate && !paused && !preferences?.reduced
  return <div className="absolute inset-0 z-0 overflow-hidden bg-slate-800" data-panorama-state={failed ? 'fallback' : ready ? 'ready' : started ? 'loading' : 'poster'}
    onPointerDown={event => {
      // Only a gesture on the poster requests the mobile enhancement. Do not
      // capture it, prevent scrolling, or treat page links/text as drag handles.
      if (!started && !failed && enableInteraction && event.isPrimary && event.button === 0 && preferences && !preferences.reduced && !preferences.saveData && event.target instanceof HTMLImageElement) setRequested(true)
    }}>
    <Image unoptimized src={posterSrc} fill sizes="100vw" alt="" fetchPriority="high" loading="eager" className="object-cover" onLoad={() => setPosterReady(true)} onError={() => setPosterReady(true)} />
    {started && preferences && !failed && <PanoramaBoundary key={attempt} onError={reportError}>
      <div className={`absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none ${ready ? 'opacity-100' : 'opacity-0'}`}>
        <PanoramaBackground
          imageSrc={preferences.mobile && mobileImageSrc ? mobileImageSrc : imageSrc}
          enableInteraction={enableInteraction}
          enableAutoRotate={rotate}
          autoRotateSpeed={autoRotateSpeed}
          visible={visible}
          lowPower={preferences.lowPower}
          onReady={reportReady}
          onError={reportError}
        />
      </div>
    </PanoramaBoundary>}
    <div className="absolute bottom-[max(120px,env(safe-area-inset-bottom))] left-4 z-20 flex items-center gap-3 text-xs text-white md:bottom-6 md:left-10">
      {(!started || failed) && preferences && <button type="button" className={`${failed ? '' : 'sr-only focus-visible:not-sr-only'} min-h-11 rounded-full border border-white/40 bg-black/40 px-4 backdrop-blur-sm hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white`} onClick={requestPanorama}>
        {failed ? '重试全景' : '开启全景互动'}
      </button>}
      {ready && enableAutoRotate && !preferences?.reduced && <button type="button" aria-pressed={paused} className="sr-only focus-visible:not-sr-only rounded-full border border-white/40 bg-black/40 backdrop-blur-sm focus-visible:min-h-11 focus-visible:px-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" onClick={() => setPaused(value => !value)}>{paused ? '继续旋转' : '暂停旋转'}</button>}
      <span role="status" className="sr-only">{failed ? '静态风景' : ready ? '风景已就绪' : started ? '正在打开全景…' : '风景预览'}</span>
    </div>
  </div>
}

// 导航项常量，避免每次渲染都创建
const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/my-world', label: 'My World' },
] as const

// 记忆化Header组件，减少重渲染
const Header = memo(({ 
  isMenuOpen, 
  setIsMenuOpen, 
  isWhiteText,
  isTransparent
}: { 
  isMenuOpen: boolean
  setIsMenuOpen: (open: boolean) => void
  isWhiteText: boolean
  isTransparent?: boolean
}) => {
  // 如果是透明背景且不是白色文本，使用更暗的颜色以增强可读性
  const useDarkStyle = isTransparent && !isWhiteText
  
  const menuIconColor = isWhiteText ? 'bg-white' : (useDarkStyle ? 'bg-gray-700' : 'bg-[#D9D9D9]')
  const menuPanelBg = isWhiteText ? 'bg-black/80' : (useDarkStyle ? 'bg-gray-900/95' : 'bg-white')
  const menuPanelBorder = isWhiteText ? 'border-white/20' : (useDarkStyle ? 'border-gray-700/50' : 'border-gray-200')
  const menuPanelText = isWhiteText ? 'text-white' : (useDarkStyle ? 'text-gray-300' : 'text-gray-600')
  const menuHoverColor = isWhiteText ? 'hover:text-gray-300' : (useDarkStyle ? 'hover:text-white' : 'hover:text-gray-900')
  const navLinkText = isWhiteText ? 'text-white drop-shadow-lg' : (useDarkStyle ? 'text-gray-200 drop-shadow-lg' : 'text-black')
  const navLinkHoverBg = isWhiteText ? 'bg-white/20' : (useDarkStyle ? 'bg-gray-700/50' : 'bg-black')
  const navLinkHoverText = 'group-hover:text-white'

  // 根据透明度和文本颜色决定背景
  const headerBg = isTransparent 
    ? 'bg-transparent' 
    : (isWhiteText ? 'bg-transparent' : 'bg-white/90 backdrop-blur-md')
  
  return (
    <header className={`absolute top-0 left-0 right-0 z-50 ${headerBg}`}>
      <div className="px-[37px] py-[57px]">
        {/* 移动端：汉堡菜单 */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden flex flex-col gap-[4px] cursor-pointer"
          aria-label="菜单"
        >
          <span className={`w-[35px] h-[6px] ${menuIconColor} block ${isWhiteText ? 'drop-shadow-lg' : ''}`}></span>
          <span className={`w-[35px] h-[6px] ${menuIconColor} block ${isWhiteText ? 'drop-shadow-lg' : ''}`}></span>
          <span className={`w-[35px] h-[6px] ${menuIconColor} block ${isWhiteText ? 'drop-shadow-lg' : ''}`}></span>
        </button>

        {/* 移动端：菜单面板 */}
        {isMenuOpen && (
          <nav className={`md:hidden absolute top-[70px] left-[37px] ${menuPanelBg} ${menuPanelBorder} ${isWhiteText ? 'backdrop-blur-sm' : ''} border rounded shadow-lg p-4 z-30`}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`block py-2 ${menuPanelText} ${menuHoverColor} transition-colors`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Web端：导航链接 */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative group px-4 py-2"
            >
              <span className={`relative z-10 ${navLinkText} transition-colors duration-200 ${navLinkHoverText}`}>
                {item.label}
              </span>
              <span className={`absolute inset-0 rounded-[50px] ${navLinkHoverBg} ${isWhiteText ? 'backdrop-blur-sm' : ''} transition-opacity duration-200 opacity-0 group-hover:opacity-100`}></span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
})

Header.displayName = 'Header'

function PageLayout({ 
  children, 
  use3DBackground = false,
  panoramaImage,
  panoramaMobileImage,
  panoramaPoster,
  enablePanoramaInteraction = false,
  enablePanoramaAutoRotate = true,
  panoramaRotateSpeed = 12,
  textColor = 'black',
  transparentHeader = false
}: PageLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // 使用 useMemo 缓存计算结果
  const isWhiteText = useMemo(() => {
    return textColor === 'white' || use3DBackground || !!panoramaImage
  }, [textColor, use3DBackground, panoramaImage])

  // 确定背景类型
  const hasPanoramaBackground = !!panoramaImage
  const has3DBackground = use3DBackground && !hasPanoramaBackground

  return (
    <div className="w-full min-h-[480px] h-[100svh] relative">
      {/* 背景层 - 优先使用全景图，然后是3D场景，最后是纯色背景 */}
      {/* 始终保留全景图在后台，避免切换时白屏 */}
      {hasPanoramaBackground && (
        <ProgressivePanorama
          imageSrc={panoramaImage}
          mobileImageSrc={panoramaMobileImage}
          posterSrc={panoramaPoster || panoramaImage}
          enableInteraction={enablePanoramaInteraction}
          enableAutoRotate={enablePanoramaAutoRotate}
          autoRotateSpeed={panoramaRotateSpeed}
        />
      )}
      {has3DBackground && (
        <div className="absolute inset-0 z-0">
          <Suspense fallback={<div className="absolute inset-0 z-0 bg-gray-100" />}>
            <CityScene />
          </Suspense>
        </div>
      )}
      {!hasPanoramaBackground && !has3DBackground && (
        <div className="absolute inset-0 z-0 bg-white"></div>
      )}

      {/* Header 菜单 - 使用记忆化组件 */}
      <Header 
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        isWhiteText={isWhiteText}
        isTransparent={transparentHeader}
      />

      {/* 内容层 */}
      <div className="relative z-10 h-full pointer-events-none flex items-center justify-center">
        <div className="w-full px-4 pointer-events-auto relative z-10">
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </div>
    </div>
  )
}

// 导出记忆化的组件
export default memo(PageLayout)
