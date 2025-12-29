'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import PageLayout from '@/components/layout/page-layout'
import RetroComputer, { RetroMessage } from '@/components/my-world/retro-computer'
import { getChatApiUrl } from '@/lib/api/client'

const STORAGE_KEY = 'my-world-conversation'

interface StoredMessage extends Omit<RetroMessage, 'timestamp'> {
  timestamp: string
}

const createAssistantGreeting = (): RetroMessage => ({
  id: 'assistant-greeting-initial', // 使用固定 ID 避免 hydration mismatch
  role: 'assistant',
  content: '欢迎来到 My World 终端，我是常驻 AI Agent。告诉我你在探索什么，我们一起深入看看。',
  timestamp: new Date('2024-01-01T00:00:00Z') // 使用固定时间戳避免 hydration mismatch
})

export default function MyWorld() {
  // 服务器端和客户端都返回相同的初始状态（欢迎消息），避免 hydration mismatch
  // 然后在客户端 useEffect 中加载历史消息
  const [messages, setMessages] = useState<RetroMessage[]>(() => {
    // 服务器端和客户端都先返回欢迎消息，确保一致
    return [createAssistantGreeting()]
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const messagesRef = useRef<RetroMessage[]>(messages)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isLoadingFromStorageRef = useRef(false) // 跟踪是否正在从 localStorage 加载
  
  // Keep ref and state in sync
  const updateMessages = useCallback((newMessages: RetroMessage[] | ((prev: RetroMessage[]) => RetroMessage[])) => {
    if (typeof newMessages === 'function') {
      setMessages(prev => {
        const updated = newMessages(prev)
        // 确保创建新的数组引用
        const newArray = [...updated]
        messagesRef.current = newArray
        return newArray
      })
    } else {
      // 确保创建新的数组引用
      const newArray = [...newMessages]
      messagesRef.current = newArray
      setMessages(newArray)
    }
  }, [])

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim()) {
      return
    }

    setErrorMessage(null)
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    // Add user message
    const userMessage: RetroMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    }
    
    // 先获取当前消息，然后添加用户消息和 AI 占位符
    const currentMessagesBeforeUpdate = [...messagesRef.current]
    
    // 创建 AI 回复消息占位符（在 try 块外部定义，以便在 catch 块中也能访问）
    const assistantMessageId = (Date.now() + 1).toString()
    const assistantMessage: RetroMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    }
    
    // 一次性添加用户消息和 AI 占位符，确保顺序正确
    const updatedMessagesWithBoth = [...currentMessagesBeforeUpdate, userMessage, assistantMessage]
    
    // 更新状态和 ref
    updateMessages(updatedMessagesWithBoth)
    setIsLoading(true)

    try {
      // 构建发送给 API 的消息列表（只包含 role 和 content）
      // 只包含用户消息，不包括 AI 占位符
      const updatedMessagesWithUser = [...currentMessagesBeforeUpdate, userMessage]
      const apiMessages = updatedMessagesWithUser.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
      
      // 验证：最后一条消息必须是用户消息（这应该总是成立的，因为我们刚添加了用户消息）
      if (apiMessages.length === 0 || apiMessages[apiMessages.length - 1].role !== 'user') {
        throw new Error('Invalid message format: last message must be from user')
      }

      // Call API with streaming
      const response = await fetch(getChatApiUrl(true), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages
        }),
        signal: controller.signal
      })

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          // 尝试多种可能的错误字段
          errorMessage = errorData.message || errorData.error || errorData.detail || errorMessage
          // 如果有详细信息，添加到错误消息中
          if (errorData.detail && errorData.detail !== errorMessage) {
            errorMessage = `${errorMessage} - ${errorData.detail}`
          }
        } catch (e) {
          // 如果无法解析 JSON，尝试读取文本
          try {
            const errorText = await response.text()
            if (errorText) {
              errorMessage = errorText
            }
          } catch {
            // 忽略，使用默认错误消息
          }
        }
        throw new Error(errorMessage)
      }

      // 检查 Content-Type，如果不是流式响应，按 JSON 处理
      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('text/event-stream')) {
        // 如果不是流式响应，按普通 JSON 响应处理
        const data = await response.json()
        
        // 检查响应格式
        if (data.content) {
          // 更新 AI 消息内容
          updateMessages(prev => {
            const updated = prev.map(msg => {
              if (msg.id === assistantMessageId) {
                return { ...msg, content: data.content, timestamp: new Date() }
              }
              return msg
            })
            messagesRef.current = updated
            return updated
          })
        } else if (data.role === 'assistant' && data.content) {
          // 兼容不同的响应格式
          updateMessages(prev => {
            const updated = prev.map(msg => 
              msg.id === assistantMessageId 
                ? { ...msg, content: data.content, timestamp: new Date() }
                : msg
            )
            messagesRef.current = updated
            return updated
          })
        } else {
          console.error('Invalid response format:', data)
          throw new Error('Invalid response format: missing content')
        }
        return
      }

      // 处理流式响应
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulatedContent = ''

      if (!reader) {
        throw new Error('No response body')
      }

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                
                // 检查是否有错误
                if (data.error) {
                  throw new Error(data.error)
                }
                
                if (data.content) {
                  accumulatedContent += data.content
                  // 实时更新消息内容
                  updateMessages(prev => {
                    const updated = prev.map(msg => 
                      msg.id === assistantMessageId 
                        ? { ...msg, content: accumulatedContent }
                        : msg
                    )
                    messagesRef.current = updated
                    return updated
                  })
                }
                if (data.done) {
                  // 流式响应完成，更新最终时间戳
                  updateMessages(prev => {
                    const updated = prev.map(msg => 
                      msg.id === assistantMessageId 
                        ? { ...msg, timestamp: new Date() }
                        : msg
                    )
                    messagesRef.current = updated
                    return updated
                  })
                }
              } catch (e) {
                // 如果是错误数据，抛出错误
                if (e instanceof Error && e.message) {
                  throw e
                }
                // 否则忽略解析错误，继续处理下一行
              }
            }
          }
        }
      } catch (streamError) {
        // 如果流式读取出错，但已经有部分内容，保留已接收的内容
        if (accumulatedContent) {
          updateMessages(prev => {
            const updated = prev.map(msg => 
              msg.id === assistantMessageId 
                ? { ...msg, content: accumulatedContent, timestamp: new Date() }
                : msg
            )
            messagesRef.current = updated
            return updated
          })
        }
        throw streamError
      }
    } catch (error) {
      console.error('Error sending message:', error)
      
      // 提取错误信息
      let errorMessage = '服务暂不可用，请稍后再试。'
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        errorMessage = '请求已取消'
      } else if (error instanceof Error) {
        errorMessage = error.message || error.toString() || '未知错误'
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String((error as any).message)
      }

      console.error('Error details:', {
        error,
        type: typeof error,
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      })

      setErrorMessage(errorMessage)
      
      // 移除空的 AI 占位符消息（如果存在）
      updateMessages(prev => {
        const filtered = prev.filter(msg => 
          !(msg.id === assistantMessageId && msg.content === '')
        )
        return filtered
      })
      
      // Add error message
      const errorReply: RetroMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `系统提示：${errorMessage}`,
        timestamp: new Date()
      }
      
      updateMessages(prev => [...prev, errorReply])
    } finally {
      setIsLoading(false)
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null
      }
    }
  }, [updateMessages])

  const handleResetConversation = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    const greeting = createAssistantGreeting()
    updateMessages([greeting])
    setErrorMessage(null)
  }, [updateMessages])

  // 同步 messagesRef
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // 客户端挂载后加载历史消息
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isHydrated) return // 已经加载过了

    isLoadingFromStorageRef.current = true // 标记正在加载

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: StoredMessage[] = JSON.parse(stored)
        if (parsed.length > 0) {
          const hydratedMessages: RetroMessage[] = parsed.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
          // 如果当前只有欢迎消息，则替换为历史消息
          setMessages(prev => {
            if (prev.length === 1 && prev[0].id === 'assistant-greeting-initial') {
              messagesRef.current = hydratedMessages
              // 延迟重置加载标志，确保状态更新完成
              setTimeout(() => {
                isLoadingFromStorageRef.current = false
              }, 200)
              return hydratedMessages
            }
            isLoadingFromStorageRef.current = false
            return prev
          })
        } else {
          isLoadingFromStorageRef.current = false
        }
      } else {
        isLoadingFromStorageRef.current = false
      }
    } catch (error) {
      console.warn('读取本地对话失败，使用默认欢迎语。', error)
      isLoadingFromStorageRef.current = false
    } finally {
      setIsHydrated(true)
    }
  }, [isHydrated])
  
  // 同步 messagesRef
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])


  // 持久化到本地
  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return
    // 如果正在从 localStorage 加载，不要保存，避免覆盖
    if (isLoadingFromStorageRef.current) {
      return
    }
    
    try {
      const serializable: StoredMessage[] = messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      }))
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable))
    } catch (error) {
      console.warn('写入本地对话失败', error)
    }
  }, [messages, isHydrated])

  // 页面卸载时中断请求
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])


  return (
    <PageLayout use3DBackground={false} textColor="black" transparentHeader={true}>
      <div className="w-full h-full flex items-center justify-center py-8">
        <div className="mt-16 w-full">
          <RetroComputer
            messages={messages}
            onSendMessage={handleSendMessage}
            onResetConversation={handleResetConversation}
            isLoading={isLoading}
            errorMessage={errorMessage}
          />
        </div>
      </div>
    </PageLayout>
  )
}

