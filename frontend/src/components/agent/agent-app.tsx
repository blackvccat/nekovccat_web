'use client'

import { memo, useCallback, useState, useRef, useEffect, useLayoutEffect, useId } from 'react'
import Link from 'next/link'
import { splitSiteLinks } from '@/lib/api/site-links'
import { activityFinished, type ChatActivity } from '@/lib/api/chat-activity'
import type { ConversationMessage } from '@/lib/api/chat-history'
import PixelIcon from '@/components/my-world/pixel-icon'
import { useAgentSession } from './agent-session'
import './agent-progress.css'

const SUGGESTIONS = ['桌面里有哪些软件？', '长廊里有什么？', '介绍一下这个网站']
// 吸底判定的容差：滚到离底部 8px 内就继续跟随，超过就认为用户在看上面。
const FOLLOW_THRESHOLD = 8

/** 一行摘要 + 可展开的真实步骤。只有工具名、后端固定文案与状态：参数与推理内容从不进来。 */
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

/** 每条消息单独成组件并 memo：流式回复每帧只重建最后那一条。

 * 会话状态里未变化的消息与 `activities[id]` 都保持同一个引用（见 agent-session 的 map 写法），
 * 复制状态也只按 id 传成两个布尔值，所以正在追加的那一条不会连带把之前每条都重渲染一遍
 * ——`splitSiteLinks` 与整棵子树的开销因此只落在真正变了的那条上。
 */
const AgentMessage = memo(function AgentMessage({ message, activities, copied, failed, onCopy }: {
  message: ConversationMessage
  activities?: ChatActivity[]
  copied: boolean
  failed: boolean
  onCopy: (id: string, content: string) => void
}) {
  return <div className={`agent-message ${message.role}`} data-message-role={message.role}>
    <div className="message-meta"><span>{message.role === 'user' ? 'YOU' : 'MK AGENT'}</span><time>{message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</time></div>
    {message.role === 'assistant' && <ExecutionProgress activities={activities} status={message.status} />}
    <div className={`message-text ${message.status === 'streaming' && message.content ? 'message-streaming' : ''}`}>
      {message.content ? splitSiteLinks(message.content).map((part, index) => part.href
        ? <Link key={index} href={part.href} className="site-message-link">{part.text} ↗</Link>
        : <span key={index}>{part.text}</span>) : <span className="muted-label" role="status">{activities?.length ? '正在准备回复' : '正在接入 Agent，繁忙时会自动排队，请勿重复发送。'}<span className="pixel-cursor">…</span></span>}
    </div>
    {message.status === 'interrupted' && <small className="interrupted-label">回复中断 · 已保留收到的内容</small>}
    {message.content && <button type="button" className="copy-message" aria-label="复制消息" onClick={() => onCopy(message.id, message.content)}>{copied ? '已复制' : failed ? '复制失败' : '复制'}</button>}
    {failed && <small className="copy-notice" role="status">复制未成功，请选中文字手动复制。</small>}
  </div>
})

export default function AgentApp() {
  const {
    messages, activities, isLoading, isReady, errorMessage, notice, toolStatus, canRetry,
    draft: input, setDraft: setInput, sendMessage: onSendMessage,
    stopReply: onStopReply, retryReply: onRetryReply, resetConversation: onResetConversation,
  } = useAgentSession()
  const inputId = useId()
  const [copyState, setCopyState] = useState<{ id: string; result: 'copied' | 'failed' } | null>(null)
  const [showLatest, setShowLatest] = useState(false)
  const messagesContainer = useRef<HTMLDivElement>(null)
  const shouldFollow = useRef(true)
  const touchStartY = useRef<number | null>(null)

  const followLatest = () => {
    shouldFollow.current = true
    setShowLatest(false)
    const container = messagesContainer.current
    if (container) container.scrollTop = container.scrollHeight
  }
  const stopFollowing = () => {
    shouldFollow.current = false
    setShowLatest(true)
  }

  // 绘制前贴底，避免出现先渲染在中间再跳到底部的闪烁。
  useLayoutEffect(() => {
    const container = messagesContainer.current
    if (!container) return
    const hasConversation = messages.some(message => message.id !== 'assistant-greeting-initial')
    if (!hasConversation) container.scrollTop = 0
    else if (shouldFollow.current) container.scrollTop = container.scrollHeight
  }, [messages, toolStatus, errorMessage, notice])

  useEffect(() => {
    if (!copyState) return
    const timer = setTimeout(() => setCopyState(null), 2200)
    return () => clearTimeout(timer)
  }, [copyState])

  const send = () => {
    if (!input.trim() || isLoading || !isReady) return
    followLatest()
    onSendMessage(input.trim())
    setInput('')
  }

  const copy = useCallback(async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopyState({ id, result: 'copied' })
    } catch {
      setCopyState({ id, result: 'failed' })
    }
  }, [])

  return (
    <div className="agent-app">
      <div className="app-menubar">
        <span><span className={`status-dot ${isLoading ? 'busy' : ''}`} />{isLoading ? 'WORKING' : 'READY'}</span>
        <span className="muted-label">YOUR LOCAL GUIDE</span>
        <button type="button" onClick={onResetConversation} disabled={!isReady || messages.length <= 1} title="清空对话并停止当前回复">新对话</button>
      </div>
      <div className="agent-messages inset-panel" ref={messagesContainer} role="log" aria-label="Agent 对话" aria-live="polite"
        tabIndex={0} aria-busy={isLoading}
        onScroll={() => {
          const el = messagesContainer.current
          if (!el) return
          const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= FOLLOW_THRESHOLD
          shouldFollow.current = nearBottom
          setShowLatest(!nearBottom)
        }}
        onWheel={event => { if (event.deltaY < 0) stopFollowing() }}
        onPointerDown={event => { touchStartY.current = event.pointerType === 'touch' ? event.clientY : null }}
        onPointerMove={event => {
          // 手指下拉（内容上移）时停止跟随；4px 的容差避免误触。
          if (touchStartY.current !== null && event.clientY > touchStartY.current + 4) stopFollowing()
        }}
        onPointerUp={() => { touchStartY.current = null }}
        onPointerCancel={() => { touchStartY.current = null }}
        onKeyDown={event => {
          // 只认焦点在滚动容器本身时的按键，输入框里的方向键不受影响。
          if (event.target === messagesContainer.current && ['PageUp', 'Home', 'ArrowUp'].includes(event.key)) stopFollowing()
        }}>
        <div className="agent-welcome">
          <PixelIcon name="agent" size={48} />
          <div><div className="eyebrow">A LITTLE HELP, A LITTLE CURIOSITY.</div><h2>Hello, explorer<span className="pixel-cursor">_</span></h2><p>我是 MK Agent，你的站内向导。想先去哪里看看？</p></div>
        </div>
        {messages.filter(message => message.id !== 'assistant-greeting-initial').map(message => (
          <AgentMessage key={message.id} message={message} activities={activities[message.id]}
            copied={copyState?.id === message.id && copyState.result === 'copied'}
            failed={copyState?.id === message.id && copyState.result === 'failed'}
            onCopy={copy} />
        ))}
        {messages.length <= 1 && <div className="agent-intro"><p>认识 MARCUS · 逛长廊 · 认识桌面</p><div className="suggestions">{SUGGESTIONS.map(question => <button key={question} className="pixel-button" type="button" disabled={!isReady || isLoading} onClick={() => { followLatest(); void onSendMessage(question) }}>{question}<span>↗</span></button>)}</div><p className="local-history-note">对话记录保存在这个浏览器中。</p></div>}
        {toolStatus && <div className="tool-status" role="status"><PixelIcon name="explorer" size={20} /><span>{toolStatus.message || (['completed', 'complete', 'success'].includes(toolStatus.status) ? '站内信息已找到' : '正在查询站内信息…')}</span></div>}
        {notice && <div className="agent-notice" role="status">{notice}</div>}
        {errorMessage && <div className="agent-error" role="alert">{errorMessage}</div>}
      </div>
      {showLatest && <button type="button" className="agent-latest" onClick={followLatest}>回到最新消息 ↓</button>}
      {canRetry && <div className="agent-actions"><button type="button" className="retry-reply" onClick={() => { followLatest(); onRetryReply() }}>重试上一条 ↻</button></div>}
      <form className="agent-composer" onSubmit={event => { event.preventDefault(); send() }}>
        <label className="sr-only" htmlFor={inputId}>给 MK Agent 发消息</label>
        <div className="composer-field inset-panel"><span aria-hidden="true">›</span><textarea id={inputId} value={input} onChange={event => setInput(event.target.value)} placeholder={isLoading ? '可以先写下一条，回复结束后发送…' : '和 MARCUS 聊聊…'} rows={2} disabled={!isReady} onKeyDown={event => {
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send() }
        }} />{isLoading
          ? <button className="pixel-button send-button stop-reply" type="button" onClick={onStopReply} aria-label="停止回复">停止回复</button>
          : <button className="pixel-button send-button" type="submit" disabled={!input.trim() || !isReady} aria-label="发送消息">发送 ↵</button>}</div>
        <div className="composer-hint"><span>ENTER 发送 <span className="hint-separator">/</span> SHIFT + ENTER 换行</span><span>MK AGENT</span></div>
      </form>
    </div>
  )
}
