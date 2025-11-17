'use client'

import { useEffect } from 'react'

export default function FontLoader() {
  useEffect(() => {
    // 动态加载 Jersey 25 字体
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Jersey+25&display=swap'
    document.head.appendChild(link)

    return () => {
      // 清理：移除字体链接（可选）
      document.head.removeChild(link)
    }
  }, [])

  return null
}

