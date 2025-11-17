'use client'

import { useState, useMemo, memo, Suspense } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ReactNode } from 'react'
import PanoramaBackground from './panorama-background'
import PageTransition from '@/components/shared/page-transition'

// 动态导入3D场景，只在需要时加载（保留作为备用选项）
const CityScene = dynamic(() => import('@/components/3d/city-scene'), {
  ssr: false,
  loading: () => null
})

interface PageLayoutProps {
  children: ReactNode
  use3DBackground?: boolean
  panoramaImage?: string // 全景图片路径
  enablePanoramaInteraction?: boolean // 是否启用全景图交互（拖动查看）
  enablePanoramaAutoRotate?: boolean // 是否启用全景图自动旋转
  panoramaRotateSpeed?: number // 全景图旋转速度（度/秒）
  textColor?: 'white' | 'black'
  transparentHeader?: boolean // 是否使用透明背景的 Header
}

// 导航项常量，避免每次渲染都创建
const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/my-world', label: 'My World' },
  { href: '/contact', label: 'Contact' },
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
    <div className="w-full h-screen relative">
      {/* 背景层 - 优先使用全景图，然后是3D场景，最后是纯色背景 */}
      {/* 始终保留全景图在后台，避免切换时白屏 */}
      {hasPanoramaBackground && (
        <PanoramaBackground 
          imageSrc={panoramaImage}
          enableInteraction={enablePanoramaInteraction}
          enableAutoRotate={enablePanoramaAutoRotate}
          autoRotateSpeed={panoramaRotateSpeed}
          className="z-0"
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

