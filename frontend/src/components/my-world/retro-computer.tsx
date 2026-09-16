'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import type { ConversationMessage } from '@/lib/api/chat-history'
import type { ChatToolEvent } from '@/lib/api/chat-stream'
import { splitSiteLinks } from '@/lib/api/site-links'
import PixelIcon from './pixel-icon'

export type RetroMessage = ConversationMessage

interface RetroComputerProps {
  messages: RetroMessage[]
  onSendMessage: (message: string) => void
  onResetConversation: () => void
  isLoading: boolean
  isReady: boolean
  errorMessage: string | null
  toolStatus: ChatToolEvent | null
}

const SUGGESTIONS = ['站内有哪些页面？', '带我了解 About', '介绍一下这个网站']

export default function RetroComputer({ messages, onSendMessage, onResetConversation, isLoading, isReady, errorMessage, toolStatus }: RetroComputerProps) {
  const [input, setInput] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesContainer = useRef<HTMLDivElement>(null)
  const shouldFollow = useRef(true)

  useEffect(() => {
    const container = messagesContainer.current
    const hasConversation = messages.some(message => message.id !== 'assistant-greeting-initial')
    if (container && !hasConversation) container.scrollTop = 0
    else if (container && shouldFollow.current) container.scrollTop = container.scrollHeight
  }, [messages, toolStatus, errorMessage])

  const send = () => {
    if (!input.trim() || isLoading || !isReady) return
    shouldFollow.current = true
    onSendMessage(input.trim())
    setInput('')
  }

  return (
    <div className="agent-app">
      <div className="app-menubar">
        <span><span className={`status-dot ${isLoading ? 'busy' : ''}`} />{isLoading ? 'WORKING' : 'READY'}</span>
        <span className="muted-label">YOUR LOCAL GUIDE</span>
        <button type="button" onClick={onResetConversation} disabled={!isReady || messages.length <= 1} title="清空对话并停止当前回复">新对话</button>
      </div>
      <div className="agent-messages inset-panel" ref={messagesContainer} role="log" aria-label="Agent 对话" aria-live="polite"
        onScroll={() => {
          const el = messagesContainer.current
          if (el) shouldFollow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 64
        }}>
        <div className="agent-welcome">
          <PixelIcon name="agent" size={48} />
          <div><div className="eyebrow">A LITTLE HELP, A LITTLE CURIOSITY.</div><h2>Hello, explorer<span className="pixel-cursor">_</span></h2><p>我是 MK Agent，你的站内向导。想先去哪里看看？</p></div>
        </div>
        {messages.filter(message => message.id !== 'assistant-greeting-initial').map(message => (
          <div key={message.id} className={`agent-message ${message.role}`} data-message-role={message.role}>
            <div className="message-meta"><span>{message.role === 'user' ? 'YOU' : 'MK AGENT'}</span><time>{message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</time></div>
            <div className="message-text">
              {message.content ? splitSiteLinks(message.content).map((part, index) => part.href
                ? <Link key={index} href={part.href} className="site-message-link">{part.text} ↗</Link>
                : <span key={index}>{part.text}</span>) : <span className="muted-label">正在准备回复<span className="pixel-cursor">…</span></span>}
            </div>
            {message.status === 'interrupted' && <small className="interrupted-label">回复中断 · 已保留收到的内容</small>}
            {message.content && <button type="button" className="copy-message" aria-label="复制消息" onClick={async () => {
              try { await navigator.clipboard.writeText(message.content); setCopiedId(message.id) } catch { setCopiedId(null) }
            }}>{copiedId === message.id ? '已复制' : '复制'}</button>}
          </div>
        ))}
        {messages.length <= 1 && <div className="agent-intro"><p>查询页面 · 发现站点内容 · 自由对话</p><div className="suggestions">{SUGGESTIONS.map(question => <button key={question} className="pixel-button" type="button" disabled={!isReady || isLoading} onClick={() => { shouldFollow.current = true; onSendMessage(question) }}>{question}<span>↗</span></button>)}</div><p className="local-history-note">对话记录保存在这个浏览器中。</p></div>}
        {toolStatus && <div className="tool-status" role="status"><PixelIcon name="explorer" size={20} /><span>{toolStatus.message || (['completed', 'complete', 'success'].includes(toolStatus.status) ? '站内信息已找到' : '正在查询站内信息…')}</span></div>}
        {errorMessage && <div className="agent-error" role="alert">{errorMessage}</div>}
      </div>
      <form className="agent-composer" onSubmit={event => { event.preventDefault(); send() }}>
        <label className="sr-only" htmlFor="agent-message">给 MK Agent 发消息</label>
        <div className="composer-field inset-panel"><span aria-hidden="true">›</span><textarea id="agent-message" value={input} onChange={event => setInput(event.target.value)} placeholder="和 MARCUS 聊聊…" rows={2} disabled={!isReady || isLoading} onKeyDown={event => {
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send() }
          if (event.key === 'Escape') setInput('')
        }} /><button className="pixel-button send-button" type="submit" disabled={!input.trim() || isLoading || !isReady} aria-label="发送消息">{isLoading ? '···' : '发送 ↵'}</button></div>
        <div className="composer-hint"><span>ENTER 发送 <span className="hint-separator">/</span> SHIFT + ENTER 换行</span><span>MK AGENT</span></div>
      </form>
    </div>
  )
}
