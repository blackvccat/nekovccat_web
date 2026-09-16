'use client'

import { useEffect, useState } from 'react'

interface LoadingScreenProps {
  isLoading: boolean
  onComplete?: () => void
  message?: string
}

export default function LoadingScreen({ 
  isLoading, 
  onComplete,
  message = 'LOADING SYSTEM...'
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [loadingText, setLoadingText] = useState('')
  const [dots, setDots] = useState('')

  useEffect(() => {
    if (!isLoading) {
      // 加载完成动画
      setProgress(100)
      setLoadingText('SYSTEM READY')
      const timer = setTimeout(() => {
        onComplete?.()
      }, 800)
      return () => clearTimeout(timer)
    } else {
      // 模拟加载进度
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return prev
          return prev + Math.random() * 8
        })
      }, 150)

      // 打字机效果
      let currentIndex = 0
      const textInterval = setInterval(() => {
        if (currentIndex < message.length) {
          setLoadingText(message.slice(0, currentIndex + 1))
          currentIndex++
        } else {
          clearInterval(textInterval)
        }
      }, 50)

      // 加载点动画
      const dotsInterval = setInterval(() => {
        setDots((prev) => {
          if (prev.length >= 3) return ''
          return prev + '.'
        })
      }, 300)

      return () => {
        clearInterval(progressInterval)
        clearInterval(textInterval)
        clearInterval(dotsInterval)
      }
    }
  }, [isLoading, onComplete, message])

  // 点动画
  useEffect(() => {
    if (isLoading && loadingText === message) {
      const interval = setInterval(() => {
        setDots((prev) => {
          if (prev.length >= 3) return ''
          return prev + '.'
        })
      }, 300)
      return () => clearInterval(interval)
    }
  }, [isLoading, loadingText, message])

  if (!isLoading && progress === 100) return null

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div className="text-center w-full max-w-2xl px-8">
        {/* 复古电脑屏幕边框 */}
        <div className="border-4 border-green-400 bg-black p-8 shadow-2xl">
          {/* 屏幕顶部装饰 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="font-mono text-green-400 text-xs">
              TERMINAL v2.0
            </div>
          </div>

          {/* 加载文本 */}
          <div className="mb-8">
            <div className="font-mono text-green-400 text-xl mb-2">
              <span className="text-cyan-400">{'>'}</span>{' '}
              <span className="animate-pulse">
                {loadingText || message}
                {loadingText === message && dots}
                <span className="animate-blink">_</span>
              </span>
            </div>
          </div>

          {/* 进度条 */}
          <div className="mb-4">
            <div className="w-full h-2 bg-gray-900 border-2 border-green-400 relative overflow-hidden">
              <div
                className="h-full bg-green-400 transition-all duration-300 relative"
                style={{ width: `${progress}%` }}
              >
                {/* 扫描线效果 */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
            <div className="text-green-400 text-sm mt-2 font-mono flex justify-between">
              <span>PROGRESS</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>

          {/* ASCII 艺术加载动画 */}
          <div className="font-mono text-green-400 text-xs mt-6">
            <pre className="text-left">
              {`[${'='.repeat(Math.floor(progress / 5))}${' '.repeat(20 - Math.floor(progress / 5))}]`}
            </pre>
          </div>

          {/* 系统信息 */}
          <div className="mt-6 text-gray-600 text-xs font-mono text-left">
            <div>{'>'} Initializing components...</div>
            <div>{'>'} Loading assets...</div>
            <div className={progress > 50 ? 'text-green-400' : ''}>
              {progress > 50 ? '✓' : '>'} Connecting to server...
            </div>
            <div className={progress > 80 ? 'text-green-400' : ''}>
              {progress > 80 ? '✓' : '>'} Preparing interface...
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-blink {
          animation: blink 1s infinite;
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  )
}

