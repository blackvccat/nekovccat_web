'use client'

import { memo, useState, useRef, useEffect, useLayoutEffect, useId } from 'react'
import Link from 'next/link'
import { splitSiteLinks } from '@/lib/api/site-links'
import PixelIcon from '@/components/my-world/pixel-icon'
import HarborPixelIcon from '@/components/my-world/harbor-pixel-icon'
import { useAgentSession } from './agent-session'
import type { ConversationMessage } from '@/lib/api/chat-history'
import { activityFinished, type ChatActivity } from '@/lib/api/chat-activity'
import './agent-progress.css'

const SUGGESTIONS = ['桌面里有哪些软件？', '开启彩蛋模式', '介绍一下这个网站']

export default function AgentApp() {
  const {
    messages, isLoading, isReady, errorMessage, activities, stopReply, retryReply, canRetry, notice,
    draft: input, setDraft: setInput, sendMessage: onSendMessage, resetConversation: onResetConversation,
  } = useAgentSession()
  const inputId = useId()
  const messagesContainer = useRef<HTMLDivElement>(null)
  const composer = useRef<HTMLTextAreaElement>(null)
  const shouldFollow = useRef(true)
  const touchStartY = useRef<number | null>(null)
  const [showLatest, setShowLatest] = useState(false)
  const followLatest = () => {
    shouldFollow.current = true
    setShowLatest(false)
    const container = messagesContainer.current
    if (container) container.scrollTop = container.scrollHeight
  }
  const stopFollowing = () => { shouldFollow.current = false; setShowLatest(true) }

  useLayoutEffect(() => {
    const container = messagesContainer.current
    const hasConversation = messages.some(message => message.id !== 'assistant-greeting-initial')
    if (container && !hasConversation) container.scrollTop = 0
    else if (container && shouldFollow.current) container.scrollTop = container.scrollHeight
  }, [messages, activities, errorMessage, notice])

  const send = () => {
    if (!input.trim() || isLoading || !isReady) return
    followLatest()
    onSendMessage(input.trim())
    setInput('')
    composer.current?.focus()
  }

  return (
    <div className="agent-app">
      <div className="app-menubar">
        <span><span className={`status-dot ${isLoading ? 'busy' : ''}`} />{!isReady ? 'LOADING' : isLoading ? 'WORKING' : 'READY'}</span>
        <span className="muted-label">YOUR LOCAL GUIDE</span>
        <button type="button" onClick={() => { followLatest(); onResetConversation() }} disabled={!isReady || messages.length <= 1} title="清空对话并停止当前回复">新对话</button>
      </div>
      <div className="agent-messages inset-panel" ref={messagesContainer} role="log" tabIndex={0} aria-label="Agent 对话" aria-live="polite" aria-busy={isLoading}
        onScroll={() => {
          const el = messagesContainer.current
          if (!el) return
          const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 8
          shouldFollow.current = nearBottom
          setShowLatest(!nearBottom)
        }} onWheel={event => { if (event.deltaY < 0) stopFollowing() }}
        onPointerDown={event => { touchStartY.current = event.pointerType === 'touch' ? event.clientY : null }}
        onPointerMove={event => { if (touchStartY.current !== null && event.clientY > touchStartY.current + 4) stopFollowing() }}
        onPointerUp={() => { touchStartY.current = null }} onPointerCancel={() => { touchStartY.current = null }}
        onKeyDown={event => { if (event.target === event.currentTarget && ['PageUp', 'Home', 'ArrowUp'].includes(event.key)) stopFollowing() }}>
        <div className="agent-welcome">
          <span className="agent-mascot"><PixelIcon name="agent" size={48} /><HarborPixelIcon name="about" size={48} /></span>
          <div><div className="eyebrow">A LITTLE HELP, A LITTLE CURIOSITY.</div><h2>Hello, explorer.</h2><p>我是 NEKO，你的站内小向导。</p></div>
        </div>
        {messages.filter(message => message.id !== 'assistant-greeting-initial').map(message => <AgentMessage key={message.id} message={message} activities={activities[message.id]} />)}
        {messages.length <= 1 && <div className="agent-intro"><p>认识 NEKO · 逛建筑档案 · 发现彩蛋</p><div className="suggestions">{SUGGESTIONS.map(question => <button key={question} className="pixel-button" type="button" disabled={!isReady || isLoading} onClick={() => { followLatest(); onSendMessage(question) }}>{question}<span>↗</span></button>)}</div><p className="local-history-note">对话记录保存在这个浏览器中。</p></div>}
        <div className="agent-desktop-shortcuts"><Link href="/my-world?app=music" className="pixel-button"><HarborPixelIcon name="music" size={24} />打开音乐</Link><Link href="/my-world?app=explorer&tab=minecraft" className="pixel-button"><HarborPixelIcon name="explorer" size={24} />建筑档案</Link></div>
        {errorMessage && <div className="agent-error" role="alert">{errorMessage}</div>}
        {notice && <p className="agent-notice" role="status">{notice}</p>}
        {canRetry && <button type="button" className="pixel-button retry-reply" onClick={() => { followLatest(); void retryReply(); composer.current?.focus() }}>重试上一条 ↻</button>}
      </div>
      {showLatest && <button type="button" className="agent-latest" onClick={followLatest}>回到最新消息 ↓</button>}
      <form className="agent-composer" onSubmit={event => { event.preventDefault(); send() }}>
        <label className="sr-only" htmlFor={inputId}>给 NEKO Agent 发消息</label>
        <div className="composer-field inset-panel"><span aria-hidden="true">›</span><textarea ref={composer} id={inputId} value={input} onChange={event => setInput(event.target.value)} placeholder={isLoading ? "可以先写下一条，回复结束后发送…" : "和 NEKO 聊聊…"} rows={2} disabled={!isReady} onKeyDown={event => {
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send() }
        }} />{isLoading ? <button className="pixel-button send-button stop-reply" type="button" onClick={event => { event.preventDefault(); stopReply(); composer.current?.focus() }}>停止回复</button> : <button className="pixel-button send-button" type="submit" disabled={!input.trim() || isLoading || !isReady} aria-label="发送消息">发送 ↵</button>}</div>
        <div className="composer-hint"><span>ENTER 发送 <span className="hint-separator">/</span> SHIFT + ENTER 换行</span><span>NEKO AGENT</span></div>
      </form>
    </div>
  )
}


/** Unchanged messages keep their parsed links and DOM while a new reply streams. */
const AgentMessage = memo(function AgentMessage({ message, activities }: { message: ConversationMessage; activities?: ChatActivity[] }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  useEffect(() => {
    if (copyState === 'idle') return
    const timer = setTimeout(() => setCopyState('idle'), 2200)
    return () => clearTimeout(timer)
  }, [copyState])
  return <div className={`agent-message ${message.role}`} data-message-role={message.role}>
    <div className="message-meta"><span>{message.role === 'user' ? 'YOU' : 'NEKO AGENT'}</span><time>{message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</time></div>
    {message.role === 'assistant' && <ExecutionProgress activities={activities} status={message.status} />}
    <div className={`message-text ${message.status === 'streaming' && message.content ? 'message-streaming' : ''}`}>
      {message.content && message.status === 'streaming' ? <span>{message.content}</span> : message.content ? splitSiteLinks(message.content).map((part, index) => part.href
        ? <Link key={index} href={part.href} className="site-message-link">{part.text} ↗</Link>
        : <span key={index}>{part.text}</span>) : <span className="muted-label" role="status">{activities?.length ? '正在准备回复' : '正在接入 Agent，繁忙时会自动排队，请勿重复发送。'}<span className="pixel-cursor">…</span></span>}
    </div>
    {message.status === 'interrupted' && <small className="interrupted-label">回复中断 · 已保留收到的内容</small>}
    {message.content && <button type="button" className="copy-message" aria-label="复制消息" onClick={async () => {
      try { await navigator.clipboard.writeText(message.content); setCopyState('copied') } catch { setCopyState('failed') }
    }}>{copyState === 'copied' ? '已复制' : '复制'}</button>}
    {copyState === 'failed' && <small className="copy-notice" role="status">复制未成功，请选中文字手动复制。</small>}
  </div>
})


const ExecutionProgress = memo(function ExecutionProgress({ activities = [], status }: { activities?: ChatActivity[]; status?: ConversationMessage['status'] }) {
  if (!activities.length) return null
  const latest = activities.reduce((current, entry) => entry.order > current.order ? entry : current)
  const summary = status === 'complete' ? '处理完成' : status === 'interrupted' ? '处理已中断' : latest.message || '正在处理请求…'
  return <details className="agent-execution">
    <summary><span className={`execution-indicator ${status === 'streaming' ? 'working' : ''}`} aria-hidden="true" /><span className="execution-summary" role="status">{summary}</span><small>{activities.length} 项步骤</small></summary>
    <ol>{activities.map(entry => {
      const label = entry.message || (entry.kind === 'tool' ? activityFinished(entry.status) ? '站内查询已结束' : '正在查询站内信息…' : '正在处理请求…')
      const result = entry.kind !== 'tool' ? '' : entry.status === 'interrupted' ? '已中断' : ['error', 'failed'].includes(entry.status) ? '未完成' : activityFinished(entry.status) ? '完成' : status === 'complete' ? '已结束' : '进行中'
      return <li key={entry.id}><span className={`execution-step-icon ${entry.kind === 'tool' && !activityFinished(entry.status) && status === 'streaming' ? 'working' : ''}`} aria-hidden="true">{entry.kind === 'tool' ? '↳' : '·'}</span><span>{label}</span>{result && <small>{result}</small>}</li>
    })}</ol>
  </details>
})
