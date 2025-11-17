'use client'

import { ReactNode, useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'

type TransitionType = 'fade' | 'slide' | 'scale' | 'blur'

interface PageTransitionProps {
  children: ReactNode
  transitionType?: TransitionType
  duration?: number
}

// 根据路径确定转场类型
function getTransitionType(pathname: string): TransitionType {
  if (pathname === '/') return 'fade'
  if (pathname === '/my-world') return 'blur'
  if (pathname === '/about') return 'slide'
  if (pathname === '/contact') return 'scale'
  return 'fade'
}

export default function PageTransition({ 
  children, 
  transitionType,
  duration = 500 
}: PageTransitionProps) {
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayChildren, setDisplayChildren] = useState(children)
  const [transitionClass, setTransitionClass] = useState('')
  const prevPathname = useRef(pathname)
  const type = transitionType || getTransitionType(pathname)

  useEffect(() => {
    // 如果路径改变，触发转场
    if (prevPathname.current !== pathname) {
      // 立即更新内容，避免白屏
      setDisplayChildren(children)
      prevPathname.current = pathname
      
      // 如果是回到首页，使用更快的转场
      const isBackToHome = pathname === '/'
      const transitionDuration = isBackToHome ? 200 : duration / 2
      
      setIsTransitioning(true)
      
      // 根据类型设置转场类
      switch (type) {
        case 'fade':
          setTransitionClass('opacity-0')
          break
        case 'slide':
          setTransitionClass('opacity-0 translate-x-8')
          break
        case 'scale':
          setTransitionClass('opacity-0 scale-95')
          break
        case 'blur':
          setTransitionClass('opacity-0 blur-md')
          break
      }

      // 使用 requestAnimationFrame 优化动画性能
      const rafId = requestAnimationFrame(() => {
        setIsTransitioning(false)
        setTransitionClass('')
      })

      return () => cancelAnimationFrame(rafId)
    }
  }, [pathname, children, type, duration])

  // 初始加载时不显示转场
  const isInitialMount = useRef(true)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
  }, [])

  return (
    <div
      className={`transition-all ${
        isTransitioning ? transitionClass : 'opacity-100 translate-x-0 scale-100 blur-0'
      }`}
      style={{ 
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'ease-in-out',
        willChange: isTransitioning ? 'opacity, transform, filter' : 'auto'
      }}
    >
      {displayChildren}
    </div>
  )
}

