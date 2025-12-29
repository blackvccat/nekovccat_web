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

    // 检查是否是应该被抑制的错误
    const shouldSuppressError = (message: string): boolean => {
      const lowerMessage = message.toLowerCase()
      return (
        lowerMessage.includes('invalid argument not valid semver') ||
        lowerMessage.includes("not valid semver ('' received)") ||
        lowerMessage.includes('semver') && lowerMessage.includes("''") ||
        lowerMessage.includes('react_devtools_backend') ||
        lowerMessage.includes('chrome-extension://fmkadmapgofadopljbjfkapdkoienihi') ||
        lowerMessage.includes('chrome-extension://') && lowerMessage.includes('semver')
      )
    }

    // 重写 console.error 以过滤 DevTools 错误
    window.console.error = (...args: unknown[]) => {
      const errorMessage = args.map(arg => 
        typeof arg === 'string' ? arg : 
        typeof arg === 'object' && arg !== null ? JSON.stringify(arg) : 
        String(arg)
      ).join(' ')
      
      // 检查是否是 React DevTools 的错误
      if (shouldSuppressError(errorMessage)) {
        // 静默忽略这些错误
        return
      }
      
      // 其他错误正常输出
      originalError.apply(window.console, args)
    }

    // 也处理 window.onerror
    const handleError = (event: ErrorEvent) => {
      const errorMessage = (event.message || '').toLowerCase()
      
      // 如果是 React DevTools 错误，阻止默认行为
      if (
        shouldSuppressError(errorMessage) ||
        event.filename?.includes('chrome-extension://fmkadmapgofadopljbjfkapdkoienihi') ||
        event.filename?.includes('chrome-extension://') && errorMessage.includes('semver')
      ) {
        event.preventDefault()
        event.stopPropagation()
        return true
      }
      
      return false
    }

    // 处理 unhandledrejection 事件
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorMessage = (event.reason?.message || String(event.reason) || '').toLowerCase()
      
      if (shouldSuppressError(errorMessage)) {
        event.preventDefault()
        return true
      }
      
      return false
    }

    window.addEventListener('error', handleError, true)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // 清理函数
    return () => {
      window.console.error = originalError
      window.console.warn = originalWarn
      window.removeEventListener('error', handleError, true)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return null
}

