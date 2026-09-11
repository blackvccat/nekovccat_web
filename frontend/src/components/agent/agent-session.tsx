'use client'

import { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo, type ReactNode } from 'react'
import { getChatApiUrl } from '@/lib/api/client'
import { consumeChatStream, type ChatToolEvent } from '@/lib/api/chat-stream'
import { CONVERSATION_STORAGE_KEY, createAssistantGreeting, restoreConversation, toChatHistory, type ConversationMessage } from '@/lib/api/chat-history'
import { useRelationshipMode } from '@/components/relationship/relationship-mode'
import { createClientId } from '@/lib/client-id'

interface AgentSession {
  messages: ConversationMessage[]
  isLoading: boolean
  isReady: boolean
  errorMessage: string | null
  toolStatus: ChatToolEvent | null
  draft: string
  setDraft: (value: string) => void
  sendMessage: (value: string) => Promise<void>
  resetConversation: () => void
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
  const [isHydrated, setIsHydrated] = useState(false)
  const messagesRef = useRef(messages)
  const abortControllerRef = useRef<AbortController | null>(null)

  const updateMessages = useCallback((next: ConversationMessage[] | ((previous: ConversationMessage[]) => ConversationMessage[])) => {
    const updated = typeof next === 'function' ? next(messagesRef.current) : next
    messagesRef.current = updated
    setMessages(updated)
  }, [])

  const handleSendMessage = useCallback(async (value: string) => {
    const content = value.trim()
    if (!content || !isHydrated || abortControllerRef.current) return
    const controller = new AbortController()
    const isCurrent = () => abortControllerRef.current === controller && !controller.signal.aborted
    const userMessage: ConversationMessage = { id: createClientId(), role: 'user', content, timestamp: new Date(), status: 'complete' }
    const assistantId = createClientId()
    abortControllerRef.current = controller
    const history = [...messagesRef.current, userMessage]
    updateMessages([...history, { id: assistantId, role: 'assistant', content: '', timestamp: new Date(), status: 'streaming' }])
    setIsLoading(true)
    setErrorMessage(null)
    setToolStatus(null)

    const updateAssistant = (patch: Partial<ConversationMessage>) => {
      if (isCurrent()) updateMessages(previous => previous.map(message => message.id === assistantId ? { ...message, ...patch } : message))
    }
    try {
      const api = getChatApiUrl(true)
      const csrfHeaders: Record<string, string> = {}
      let csrfToken = ''
      if (api.startsWith('/')) {
        const session = await fetch('/api/chat/session', { cache: 'no-store', signal: controller.signal })
        if (!session.ok) throw new Error('暂时无法建立聊天会话，请刷新后重试。')
        csrfToken = (await session.json()).token
        csrfHeaders['X-Neko-CSRF'] = csrfToken
      }
      const response = await fetch(api, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...csrfHeaders },
        body: JSON.stringify({ messages: toChatHistory(history) }), signal: controller.signal,
      })
      if (!response.ok) {
        const text = await response.text()
        let detail = `聊天服务暂不可用（HTTP ${response.status}）`
        try {
          const data = JSON.parse(text)
          const message = data.message || data.error || data.detail
          if (typeof message === 'string') detail = message
        } catch { /* Keep a readable HTTP error for non-JSON responses. */ }
        throw new Error(detail)
      }
      let finalContent: string
      let unlockProof = ''
      if ((response.headers.get('content-type') || '').includes('text/event-stream')) {
        if (!response.body) throw new Error('聊天服务没有返回内容，请重新发送。')
        finalContent = await consumeChatStream(response.body, {
          onContent: content => updateAssistant({ content }),
          onTool: event => { if (isCurrent()) setToolStatus(event) },
          onDesktop: event => { if (isCurrent()) unlockProof = event.proof },
        }, controller.signal)
      } else {
        const data = await response.json()
        if (typeof data.content !== 'string' || !data.content.trim()) throw new Error('聊天服务没有返回有效回复，请重新发送。')
        finalContent = data.content
        if (data.desktop_action === 'unlock-girlfriend' && typeof data.desktop_proof === 'string') unlockProof = data.desktop_proof
      }
      if (!finalContent.trim()) throw new Error('Agent 没有返回文本，请重新发送。')
      updateAssistant({ content: finalContent, status: 'complete', timestamp: new Date() })
      if (isCurrent() && unlockProof && !(await activateGirlfriend(unlockProof, csrfToken))) throw new Error('彩蛋授权未能完成，请重新验证。')
    } catch (error) {
      if (!isCurrent()) return
      setErrorMessage(error instanceof Error ? error.message : '服务暂不可用，请稍后再试。')
      updateMessages(previous => previous
        .filter(message => message.id !== assistantId || message.content.trim() !== '')
        .map(message => message.id === assistantId ? { ...message, status: 'interrupted' } : message))
    } finally {
      if (isCurrent()) {
        abortControllerRef.current = null
        setIsLoading(false)
        setToolStatus(null)
      }
    }
  }, [isHydrated, updateMessages, activateGirlfriend])

  const handleResetConversation = useCallback(() => {
    const controller = abortControllerRef.current
    abortControllerRef.current = null
    controller?.abort()
    updateMessages([createAssistantGreeting()])
    setErrorMessage(null)
    setToolStatus(null)
    setIsLoading(false)
    setDraft('')
    try { localStorage.removeItem(CONVERSATION_STORAGE_KEY) } catch { /* Storage is optional. */ }
  }, [updateMessages])

  useEffect(() => {
    // Restore after hydration so the server and first client render agree.
    try { updateMessages(restoreConversation(localStorage.getItem(CONVERSATION_STORAGE_KEY))) } catch { /* Storage is optional. */ }
    setIsHydrated(true)
    return () => {
      const controller = abortControllerRef.current
      abortControllerRef.current = null
      controller?.abort()
    }
  }, [updateMessages])

  useEffect(() => {
    if (!isHydrated) return
    try { localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(messages)) } catch { /* Chat works without storage. */ }
  }, [messages, isHydrated])

  const session = useMemo<AgentSession>(() => ({
    messages,
    isLoading,
    isReady: isHydrated,
    errorMessage,
    toolStatus,
    draft,
    setDraft,
    sendMessage: handleSendMessage,
    resetConversation: handleResetConversation,
  }), [messages, isLoading, isHydrated, errorMessage, toolStatus, draft, handleSendMessage, handleResetConversation])

  return <AgentSessionContext.Provider value={session}>{children}</AgentSessionContext.Provider>
}
