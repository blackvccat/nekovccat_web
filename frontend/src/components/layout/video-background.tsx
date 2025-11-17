'use client'

import { useRef, useEffect, useState } from 'react'

interface VideoBackgroundProps {
  videoSrc: string
  poster?: string
  className?: string
}

export default function VideoBackground({ 
  videoSrc, 
  poster,
  className = '' 
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // 尝试播放视频
    const playPromise = video.play()
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsLoaded(true)
        })
        .catch((err) => {
          console.warn('Video autoplay failed:', err)
          setError(true)
        })
    }

    // 处理视频加载
    const handleLoadedData = () => {
      setIsLoaded(true)
    }

    const handleError = () => {
      console.error('Video loading error')
      setError(true)
    }

    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('error', handleError)

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('error', handleError)
    }
  }, [])

  if (error) {
    // 如果视频加载失败，显示备用背景
    return (
      <div className={`absolute inset-0 bg-gray-900 ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center text-white/50">
          <p>视频加载失败</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        poster={poster}
        preload="auto"
      >
        <source src={videoSrc} type="video/mp4" />
        <source src={videoSrc} type="video/webm" />
        您的浏览器不支持视频播放
      </video>
      
      {/* 加载遮罩 */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
          <div className="text-white/50">加载中...</div>
        </div>
      )}
    </div>
  )
}

