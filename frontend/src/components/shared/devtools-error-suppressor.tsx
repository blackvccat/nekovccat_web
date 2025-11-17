'use client'

import { useEffect } from 'react'

/**
 * 抑制 React DevTools 扩展的错误
 * 这些错误不影响应用功能，只是扩展的兼容性问题
 */
export default function DevToolsErrorSuppressor() {
  useEffect(() => {
    // 捕获并抑制 React DevTools 相关的错误
    const originalError = window.console.error
    const originalWarn = window.console.warn

    // 重写 console.error 以过滤 DevTools 错误
    window.console.error = (...args: unknown[]) => {
      const errorMessage = args.join(' ')
      
      // 检查是否是 React DevTools 的错误
      if (
        typeof errorMessage === 'string' &&
        (
          errorMessage.includes('Invalid argument not valid semver') ||
          errorMessage.includes('react_devtools_backend') ||
          errorMessage.includes('chrome-extension://fmkadmapgofadopljbjfkapdkoienihi')
        )
      ) {
        // 静默忽略这些错误
        return
      }
      
      // 其他错误正常输出
      originalError.apply(window.console, args)
    }

    // 也处理 window.onerror
    const handleError = (event: ErrorEvent) => {
      const errorMessage = event.message || ''
      
      // 如果是 React DevTools 错误，阻止默认行为
      if (
        errorMessage.includes('Invalid argument not valid semver') ||
        errorMessage.includes('react_devtools_backend') ||
        event.filename?.includes('chrome-extension://fmkadmapgofadopljbjfkapdkoienihi')
      ) {
        event.preventDefault()
        return true
      }
      
      return false
    }

    window.addEventListener('error', handleError)

    // 清理函数
    return () => {
      window.console.error = originalError
      window.console.warn = originalWarn
      window.removeEventListener('error', handleError)
    }
  }, [])

  return null
}

