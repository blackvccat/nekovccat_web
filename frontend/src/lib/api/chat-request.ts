import { consumeChatStream, type ChatToolEvent, type ChatProgressEvent, type ChatContentUpdate } from './chat-stream'
import { toChatHistory, type ConversationMessage } from './chat-history'

/** A retry reuses the latest unanswered user turn, including after a reload. */
export function retryableUserId(messages: ConversationMessage[]): string | null {
  const index = messages.findLastIndex(message => message.role === 'user')
  if (index < 0 || messages.slice(index + 1).some(message => message.role === 'assistant' && (!message.status || message.status === 'complete'))) return null
  return messages[index].id
}

export function retryHistory(messages: ConversationMessage[], userId: string): ConversationMessage[] | null {
  if (retryableUserId(messages) !== userId) return null
  return messages.slice(0, messages.findIndex(message => message.id === userId) + 1)
}

interface ChatRequest {
  api: string
  history: ConversationMessage[]
  signal: AbortSignal
  onContent: (content: string, update?: ChatContentUpdate) => void
  onTool: (event: ChatToolEvent) => void
  onProgress?: (event: ChatProgressEvent) => void
  activateDesktop: (proof: string, csrf: string, signal: AbortSignal) => Promise<boolean>
  fetcher?: typeof fetch
}

export function retryAfterSeconds(value: string | null, now = Date.now()): number | null {
  if (!value) return null
  const seconds = /^\d+$/.test(value.trim()) ? Number(value) : /^[A-Za-z]{3}, .+ GMT$/.test(value.trim()) ? (Date.parse(value) - now) / 1000 : NaN
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : null
}

async function responseError(response: Response, fallback: string): Promise<Error> {
  let detail = fallback
  try {
    const data = await response.json()
    const message = data.message || data.error || data.detail
    if (typeof message === 'string') detail = message
  } catch { /* Non-JSON responses retain the readable HTTP error. */ }
  const seconds = retryAfterSeconds(response.headers.get('retry-after'))
  if (seconds && [429, 503].includes(response.status)) {
    const duration = seconds < 60 ? `${seconds} 秒` : seconds < 3600 ? `${Math.ceil(seconds / 60)} 分钟` : `${Math.ceil(seconds / 3600)} 小时`
    detail += ` 请等待 ${duration}后再试，期间请勿重复发送。`
  }
  return new Error(detail)
}

/** Check cancellation after every async boundary, even when a transport ignores abort. */
export async function requestChatReply({ api, history, signal, onContent, onTool, onProgress, activateDesktop, fetcher = fetch }: ChatRequest): Promise<string> {
  const check = () => { signal.throwIfAborted() }
  check()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  let csrf = ''
  if (api.startsWith('/')) {
    const session = await fetcher('/api/chat/session', { cache: 'no-store', signal })
    check()
    if (!session.ok) {
      const error = await responseError(session, '暂时无法建立聊天会话，请重试。')
      check()
      throw error
    }
    csrf = (await session.json()).token
    check()
    headers['X-Neko-CSRF'] = csrf
  }
  // Negotiate replacements explicitly so pages still using v1 never append final twice.
  const target = new URL(api, 'http://localhost')
  target.searchParams.set('protocol', 'v2')
  const requestApi = api.startsWith('/') ? target.pathname + target.search : target.href
  const response = await fetcher(requestApi, { method: 'POST', headers, body: JSON.stringify({ messages: toChatHistory(history) }), signal })
  check()
  if (!response.ok) {
    const error = await responseError(response, `聊天服务暂不可用（HTTP ${response.status}）`)
    check()
    throw error
  }
  let content: string
  let proof = ''
  let authoritativeContentEmitted = false
  if ((response.headers.get('content-type') || '').includes('text/event-stream')) {
    if (!response.body) throw new Error('聊天服务没有返回内容，请重试。')
    content = await consumeChatStream(response.body, {
      onContent: (value, update) => {
        check()
        if (update?.kind === 'final') authoritativeContentEmitted = true
        onContent(value, update)
      },
      onTool: event => { check(); onTool(event) },
      onProgress: event => { check(); onProgress?.(event) },
      onDesktop: event => { check(); proof = event.proof },
    }, signal)
  } else {
    const data = await response.json()
    check()
    if (typeof data.content !== 'string') throw new Error('聊天服务没有返回有效回复，请重试。')
    content = data.content
    if (data.desktop_action === 'unlock-girlfriend' && typeof data.desktop_proof === 'string') proof = data.desktop_proof
  }
  check()
  if (!content.trim()) throw new Error('Agent 没有返回文本，请重试。')
  if (!authoritativeContentEmitted) onContent(content, { kind: 'final' })
  if (proof) {
    const activated = await activateDesktop(proof, csrf, signal)
    check()
    if (!activated) throw new Error('彩蛋授权未能完成，请重新验证。')
  }
  check()
  return content
}
