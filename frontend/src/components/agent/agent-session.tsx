'use client'

import { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo, type ReactNode } from 'react'
import { getChatApiUrl } from '@/lib/api/client'
import { type ChatProgressEvent, type ChatToolEvent } from '@/lib/api/chat-stream'
import { createReplyBuffer } from '@/lib/api/chat-reply-buffer'
import { requestChatReply } from '@/lib/api/chat-request'
import { interruptActivity, recordActivity, type ChatActivity } from '@/lib/api/chat-activity'
import { CONVERSATION_STORAGE_KEY, createAssistantGreeting, restoreConversation, retryHistory, retryableUserId, type ConversationMessage } from '@/lib/api/chat-history'
import { createClientId } from '@/lib/client-id'

interface AgentSession {
  messages: ConversationMessage[]
  activities: Record<string, ChatActivity[]>
  isLoading: boolean
  isReady: boolean
  errorMessage: string | null
  notice: string | null
  toolStatus: ChatToolEvent | null
  canRetry: boolean
  draft: string
  setDraft: (value: string) => void
  sendMessage: (value: string) => Promise<void>
  stopReply: () => void
  retryReply: () => void
  resetConversation: () => void
}

const AgentSessionContext = createContext<AgentSession | null>(null)

export function useAgentSession(): AgentSession {
  const session = useContext(AgentSessionContext)
  if (!session) throw new Error('AgentApp must be rendered inside AgentSessionProvider')
  return session
}

export function AgentSessionProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ConversationMessage[]>(() => [createAssistantGreeting()])
  const [activities, setActivities] = useState<Record<string, ChatActivity[]>>({})
  const [draft, setDraft] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [toolStatus, setToolStatus] = useState<ChatToolEvent | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const messagesRef = useRef(messages)
  const activeRequest = useRef<{ controller: AbortController; assistantId: string; buffer: ReturnType<typeof createReplyBuffer> } | null>(null)
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateMessages = useCallback((next: ConversationMessage[] | ((previous: ConversationMessage[]) => ConversationMessage[])) => {
    const updated = typeof next === 'function' ? next(messagesRef.current) : next
    messagesRef.current = updated
    setMessages(updated)
  }, [])

  const persistMessages = useCallback(() => {
    if (persistTimer.current) { clearTimeout(persistTimer.current); persistTimer.current = null }
    // 落盘前先把待发布的那一帧刷出去，否则存下的是上一帧的半截回复。
    activeRequest.current?.buffer.flush()
    try { localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(messagesRef.current)) } catch { /* 聊天不依赖存储 */ }
  }, [])

  const runReply = useCallback(async (history: ConversationMessage[], display: ConversationMessage[]) => {
    if (activeRequest.current) return
    const controller = new AbortController()
    const assistantId = createClientId()
    // 正文按动画帧合并后再进 state：逐字回调不再逐个触发渲染与全量序列化。
    const buffer = createReplyBuffer(content => {
      const active = activeRequest.current
      if (!active || active.controller !== controller || controller.signal.aborted) return
      updateMessages(previous => previous.map(message =>
        message.id === assistantId && message.content !== content ? { ...message, content } : message))
    })
    activeRequest.current = { controller, assistantId, buffer }
    const isCurrent = () => activeRequest.current?.controller === controller && !controller.signal.aborted
    const updateAssistant = (patch: Partial<ConversationMessage>) => {
      if (isCurrent()) updateMessages(previous => previous.map(message => message.id === assistantId ? { ...message, ...patch } : message))
    }
    updateMessages([...display, { id: assistantId, role: 'assistant', content: '', timestamp: new Date(), status: 'streaming' }])
    setActivities(previous => ({ ...previous, [assistantId]: [] }))
    setIsLoading(true)
    setErrorMessage(null)
    setNotice(null)
    setToolStatus(null)
    const record = (event: ChatProgressEvent | ChatToolEvent) => {
      if (!isCurrent()) return
      setActivities(previous => ({ ...previous, [assistantId]: recordActivity(previous[assistantId] ?? [], event) }))
    }
    try {
      // v2 协商、会话 nonce、两条解析路与报错文案都在 chat-request 里：那段现在能脱离 React 单测。
      const finalContent = await requestChatReply({
        api: getChatApiUrl(true),
        history,
        signal: controller.signal,
        // 换 message_id 的整段替换与终稿都要立刻落盘，其余增量按帧合并。
        onContent: (content, update) => buffer.push(content, update?.kind === 'final'),
        onTool: event => { if (isCurrent()) setToolStatus(event); record(event) },
        onProgress: record,
      })
      updateAssistant({ content: finalContent, status: 'complete', timestamp: new Date() })
    } catch (error) {
      if (!isCurrent()) return
      setErrorMessage(error instanceof Error ? error.message : '服务暂不可用，请稍后再试。')
      setActivities(previous => ({ ...previous, [assistantId]: interruptActivity(previous[assistantId] ?? []) }))
      // 半截回复留在界面上，但状态标成 interrupted：它不再进模型上下文，也不假装成功。
      updateMessages(previous => previous
        .filter(message => message.id !== assistantId || message.content.trim() !== '')
        .map(message => message.id === assistantId ? { ...message, status: 'interrupted' } : message))
    } finally {
      if (isCurrent()) {
        activeRequest.current = null
        buffer.dispose()
        setIsLoading(false)
        setToolStatus(null)
      }
    }
  }, [updateMessages])

  const handleSendMessage = useCallback(async (value: string) => {
    const content = value.trim()
    if (!content || !isHydrated || activeRequest.current) return
    const userMessage: ConversationMessage = { id: createClientId(), role: 'user', content, timestamp: new Date(), status: 'complete' }
    const history = [...messagesRef.current, userMessage]
    await runReply(history, history)
  }, [isHydrated, runReply])

  const handleStopReply = useCallback(() => {
    const active = activeRequest.current
    if (!active) return
    // 先把最后一帧刷到界面，再断引用：这样 runReply 的 catch/finally 不会再弹错误。
    active.buffer.flush()
    activeRequest.current = null
    active.buffer.dispose()
    active.controller.abort()
    setActivities(previous => ({ ...previous, [active.assistantId]: interruptActivity(previous[active.assistantId] ?? []) }))
    updateMessages(previous => previous
      .filter(message => message.id !== active.assistantId || message.content.trim() !== '')
      .map(message => message.id === active.assistantId ? { ...message, status: 'interrupted' } : message))
    setToolStatus(null)
    setIsLoading(false)
    setNotice('已停止回复，收到的内容与草稿已保留。')
  }, [updateMessages])

  const handleRetryReply = useCallback(() => {
    const userId = retryableUserId(messagesRef.current)
    if (!userId) return
    const history = retryHistory(messagesRef.current, userId)
    if (!history) return
    void runReply(history, messagesRef.current)
  }, [runReply])

  const handleResetConversation = useCallback(() => {
    const active = activeRequest.current
    activeRequest.current = null
    active?.buffer.dispose()
    active?.controller.abort()
    updateMessages([createAssistantGreeting()])
    setActivities({})
    setErrorMessage(null)
    setNotice(null)
    setToolStatus(null)
    setIsLoading(false)
    setDraft('')
    try { localStorage.removeItem(CONVERSATION_STORAGE_KEY) } catch { /* 聊天不依赖存储 */ }
  }, [updateMessages])

  useEffect(() => {
    // Restore after hydration so the server and first client render agree.
    try { updateMessages(restoreConversation(localStorage.getItem(CONVERSATION_STORAGE_KEY))) } catch { /* 聊天不依赖存储 */ }
    setIsHydrated(true)
    return () => {
      const active = activeRequest.current
      activeRequest.current = null
      active?.buffer.dispose()
      active?.controller.abort()
    }
  }, [updateMessages])

  useEffect(() => {
    if (!isHydrated) return
    // 流式期间每 800ms 落一次盘就够（每次 messages 变化都写会把主线程拖住）；结束后立刻写。
    if (!isLoading) { persistMessages(); return }
    if (persistTimer.current) return
    persistTimer.current = setTimeout(() => { persistTimer.current = null; persistMessages() }, 800)
  }, [messages, isLoading, isHydrated, persistMessages])

  useEffect(() => {
    if (!isHydrated) return
    // 切后台、进 bfcache 或直接关闭时立刻落盘：移动端被系统回收时不至于丢掉最后一段。
    const onHide = () => { if (document.visibilityState === 'hidden') persistMessages() }
    window.addEventListener('pagehide', persistMessages)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('pagehide', persistMessages)
      document.removeEventListener('visibilitychange', onHide)
      persistMessages()
    }
  }, [isHydrated, persistMessages])

  const canRetry = useMemo(() => !isLoading && retryableUserId(messages) !== null, [messages, isLoading])

  const session = useMemo<AgentSession>(() => ({
    messages,
    activities,
    isLoading,
    isReady: isHydrated,
    errorMessage,
    notice,
    toolStatus,
    canRetry,
    draft,
    setDraft,
    sendMessage: handleSendMessage,
    stopReply: handleStopReply,
    retryReply: handleRetryReply,
    resetConversation: handleResetConversation,
  }), [messages, activities, isLoading, isHydrated, errorMessage, notice, toolStatus, canRetry, draft, handleSendMessage, handleStopReply, handleRetryReply, handleResetConversation])

  return <AgentSessionContext.Provider value={session}>{children}</AgentSessionContext.Provider>
}
