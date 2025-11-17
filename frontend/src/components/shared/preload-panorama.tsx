'use client'

import { useEffect } from 'react'

/**
 * 预加载全景图组件
 * 在页面加载时提前开始加载全景图
 */
export default function PreloadPanorama({ imageSrc }: { imageSrc: string }) {
  useEffect(() => {
    // 创建 link 标签预加载图片
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = imageSrc
    document.head.appendChild(link)

    // 同时使用 Image 对象预加载
    const img = new Image()
    img.src = imageSrc

    return () => {
      // 清理
      if (document.head.contains(link)) {
        document.head.removeChild(link)
      }
    }
  }, [imageSrc])

  return null
}

