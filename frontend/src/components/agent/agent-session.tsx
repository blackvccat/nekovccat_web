'use client'

import { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo, type ReactNode } from 'react'
import { getChatApiUrl } from '@/lib/api/client'
import type { ChatToolEvent } from '@/lib/api/chat-stream'
import { requestChatReply, retryableUserId, retryHistory } from '@/lib/api/chat-request'
import { createReplyBuffer } from '@/lib/api/chat-reply-buffer'
import { recordActivity, interruptActivity, type ChatActivity } from '@/lib/api/chat-activity'
import { CONVERSATION_STORAGE_KEY, createAssistantGreeting, restoreConversation, type ConversationMessage } from '@/lib/api/chat-history'
import { useRelationshipMode } from '@/components/relationship/relationship-mode'
import { createClientId } from '@/lib/client-id'

interface AgentSession {
  messages: ConversationMessage[]
  isLoading: boolean
  isReady: boolean
  errorMessage: string | null
  toolStatus: ChatToolEvent | null
  activities: Record<string, ChatActivity[]>
  draft: string
  setDraft: (value: string) => void
  sendMessage: (value: string) => Promise<void>
  resetConversation: () => void
  stopReply: () => void
  retryReply: () => Promise<void>
  canRetry: boolean
  notice: string | null
}

const AgentSessionContext = createContext<AgentSession | null>(null)

export function useAgentSession(): AgentSession {
  const session = useContext(AgentSessionContext)
  if (!session) throw new Error('AgentApp must be rendered inside AgentSessionProvider')
  return session
}

export function AgentSessionProvider({ children }: { children: ReactNode }) {
  const { activateGirlfriend } = useRelationshipMode()
  const [messages, setMessages] = useState<ConversationMessage[]>(() => [createAssistantGreeting()])
  const [draft, setDraft] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [toolStatus, setToolStatus] = useState<ChatToolEvent | null>(null)
  const [activities, setActivities] = useState<Record<string, ChatActivity[]>>({})
  const [notice, setNotice] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const messagesRef = useRef(messages)
  const activeRequest = useRef<{ controller: AbortController; assistantId: string; buffer: ReturnType<typeof createReplyBuffer> } | null>(null)

  const updateMessages = useCallback((next: ConversationMessage[] | ((previous: ConversationMessage[]) => ConversationMessage[])) => {
    const updated = typeof next === 'function' ? next(messagesRef.current) : next
    messagesRef.current = updated
    setMessages(updated)
  }, [])

  const interruptAssistant = useCallback((assistantId: string) => {
    updateMessages(previous => previous
      .filter(message => message.id !== assistantId || message.content.trim() !== '')
      .map(message => message.id === assistantId ? { ...message, status: 'interrupted' } : message))
  }, [updateMessages])

  const runReply = useCallback(async (history: ConversationMessage[], display: ConversationMessage[]) => {
    if (!isHydrated || activeRequest.current) return
    const controller = new AbortController()
    const assistantId = createClientId()
    const buffer = createReplyBuffer(content => {
      if (activeRequest.current?.controller === controller && !controller.signal.aborted) {
        updateMessages(previous => previous.map(message => message.id === assistantId && message.content !== content ? { ...message, content } : message))
      }
    })
    const request = { controller, assistantId, buffer }
    activeRequest.current = request
    const isCurrent = () => activeRequest.current === request && !controller.signal.aborted
    updateMessages([...display, { id: assistantId, role: 'assistant', content: '', timestamp: new Date(), status: 'streaming' }])
    setIsLoading(true)
    setErrorMessage(null)
    setNotice(null)
    setToolStatus(null)
    setActivities(previous => ({ ...previous, [assistantId]: [] }))
    try {
      const content = await requestChatReply({
        api: getChatApiUrl(true), history, signal: controller.signal,
        onContent: (content, update) => { if (isCurrent()) buffer.push(content, update?.kind === 'final') },
        onTool: event => {
          if (!isCurrent()) return
          setToolStatus(event)
          setActivities(previous => ({ ...previous, [assistantId]: recordActivity(previous[assistantId] || [], event) }))
        },
        onProgress: event => {
          if (isCurrent()) setActivities(previous => ({ ...previous, [assistantId]: recordActivity(previous[assistantId] || [], event) }))
        },
        activateDesktop: activateGirlfriend,
      })
      if (isCurrent()) {
        buffer.push(content, true)
        updateMessages(previous => previous.map(message => message.id === assistantId ? { ...message, content, status: 'complete', timestamp: new Date() } : message))
      }
    } catch (error) {
      if (!isCurrent()) return
      buffer.flush()
      setErrorMessage(error instanceof Error ? error.message : '服务暂不可用，请稍后再试。')
      interruptAssistant(assistantId)
      setActivities(previous => ({ ...previous, [assistantId]: interruptActivity(previous[assistantId] || []) }))
    } finally {
      buffer.dispose()
      if (isCurrent()) {
        activeRequest.current = null
        setIsLoading(false)
        setToolStatus(null)
      }
    }
  }, [isHydrated, updateMessages, activateGirlfriend, interruptAssistant])

  const handleSendMessage = useCallback(async (value: string) => {
    const content = value.trim()
    if (!content || !isHydrated || activeRequest.current) return
    const userMessage: ConversationMessage = { id: createClientId(), role: 'user', content, timestamp: new Date(), status: 'complete' }
    const history = [...messagesRef.current, userMessage]
    await runReply(history, history)
  }, [isHydrated, runReply])

  const handleStopReply = useCallback(() => {
    const request = activeRequest.current
    if (!request) return
    request.buffer.flush()
    activeRequest.current = null
    request.buffer.dispose()
    request.controller.abort()
    interruptAssistant(request.assistantId)
    setActivities(previous => ({ ...previous, [request.assistantId]: interruptActivity(previous[request.assistantId] || []) }))
    setIsLoading(false)
    setToolStatus(null)
    setNotice('已停止回复，收到的内容与草稿已保留。')
  }, [interruptAssistant])

  const handleRetryReply = useCallback(async () => {
    if (!isHydrated || activeRequest.current) return
    const userId = retryableUserId(messagesRef.current)
    const history = userId ? retryHistory(messagesRef.current, userId) : null
    // Keep previous partial replies visible, but omit them from model context.
    if (history) await runReply(history, messagesRef.current)
  }, [isHydrated, runReply])

  const handleResetConversation = useCallback(() => {
    const request = activeRequest.current
    activeRequest.current = null
    request?.buffer.dispose()
    request?.controller.abort()
    setActivities({})
    updateMessages([createAssistantGreeting()])
    setErrorMessage(null)
    setToolStatus(null)
    setIsLoading(false)
    setDraft('')
    setNotice(null)
    try { localStorage.removeItem(CONVERSATION_STORAGE_KEY) } catch { /* Storage is optional. */ }
  }, [updateMessages])

  useEffect(() => {
    // Restore after hydration so the server and first client render agree.
    try { updateMessages(restoreConversation(localStorage.getItem(CONVERSATION_STORAGE_KEY))) } catch { /* Storage is optional. */ }
    setIsHydrated(true)
    return () => {
      const request = activeRequest.current
      activeRequest.current = null
      request?.buffer.dispose()
      request?.controller.abort()
    }
  }, [updateMessages])

  const persistenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const persistMessages = useCallback(() => {
    if (persistenceTimer.current) clearTimeout(persistenceTimer.current)
    persistenceTimer.current = null
    activeRequest.current?.buffer.flush()
    try { localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(messagesRef.current)) } catch { /* Chat works without storage. */ }
  }, [])
  useEffect(() => {
    if (!isHydrated) return
    if (!isLoading) persistMessages()
    else if (!persistenceTimer.current) persistenceTimer.current = setTimeout(persistMessages, 800)
  }, [messages, isHydrated, isLoading, persistMessages])
  useEffect(() => {
    if (!isHydrated) return
    const onHidden = () => { if (document.visibilityState === 'hidden') persistMessages() }
    window.addEventListener('pagehide', persistMessages)
    document.addEventListener('visibilitychange', onHidden)
    return () => {
      window.removeEventListener('pagehide', persistMessages)
      document.removeEventListener('visibilitychange', onHidden)
      persistMessages()
    }
  }, [isHydrated, persistMessages])

  const session = useMemo<AgentSession>(() => ({
    messages,
    isLoading,
    isReady: isHydrated,
    errorMessage,
    toolStatus,
    activities,
    draft,
    setDraft,
    sendMessage: handleSendMessage,
    resetConversation: handleResetConversation,
    stopReply: handleStopReply,
    retryReply: handleRetryReply,
    canRetry: !isLoading && !!retryableUserId(messages),
    notice,
  }), [messages, isLoading, isHydrated, errorMessage, toolStatus, draft, handleSendMessage, handleResetConversation, handleStopReply, handleRetryReply, notice, activities])

  return <AgentSessionContext.Provider value={session}>{children}</AgentSessionContext.Provider>
}
