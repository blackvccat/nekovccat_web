import { consumeChatStream, type ChatContentUpdate, type ChatProgressEvent, type ChatToolEvent } from './chat-stream'
import { responseErrorText } from './chat-errors'
import { toChatHistory, type ConversationMessage } from './chat-history'

export interface ChatRequestOptions {
  /** 聊天接口地址，可以是站内相对路径，也可以是绝对地址（开发时直连后端）。 */
  api: string
  history: ConversationMessage[]
  signal: AbortSignal
  onContent: (content: string, update?: ChatContentUpdate) => void
  onTool?: (event: ChatToolEvent) => void
  onProgress?: (event: ChatProgressEvent) => void
  /** 会话 nonce 的地址：相对路径时才需要它。测试注入桩用得上。 */
  sessionApi?: string
  fetcher?: typeof fetch
}

/** 发出一条消息并把它收完，返回权威正文。
 *
 * 抽成独立函数是为了能不带 React 测这条链路（会话 nonce → CSRF → v2 协商 → SSE/JSON 两条解析路 → 报错文案）：
 * 每一处 `await` 之后都重新检查一次取消，因为传输层不一定会尊重 abort——
 * 这条以前只写在流式解析里，取会话与等响应头那两段是空的。
 */
export async function requestChatReply({
  api, history, signal, onContent, onTool, onProgress, sessionApi = '/api/chat/session', fetcher = fetch,
}: ChatRequestOptions): Promise<string> {
  const check = () => { signal.throwIfAborted() }
  check()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (api.startsWith('/')) {
    // 会话 nonce 同时是 CSRF 凭据：聊天 POST 必须带上同一个值，缺了后端会 403。
    const session = await fetcher(sessionApi, { cache: 'no-store', signal })
    check()
    if (!session.ok) throw new Error(await responseErrorText(session, '暂时无法建立聊天会话，请刷新后重试。'))
    headers['X-Marcus-CSRF'] = (await session.json()).token
    check()
  }
  // 显式声明 v2：正文按 reply(delta|final) 的替换语义走；不带这个参数的旧客户端协议不变。
  const target = new URL(api, 'http://localhost')
  target.searchParams.set('protocol', 'v2')
  const requestApi = api.startsWith('/') ? target.pathname + target.search : target.href
  const response = await fetcher(requestApi, {
    method: 'POST', headers, body: JSON.stringify({ messages: toChatHistory(history) }), signal,
  })
  check()
  if (!response.ok) throw new Error(await responseErrorText(response, `聊天服务暂不可用（HTTP ${response.status}）`))
  let content: string
  let authoritative = false
  if ((response.headers.get('content-type') || '').includes('text/event-stream')) {
    if (!response.body) throw new Error('聊天服务没有返回内容，请重新发送。')
    content = await consumeChatStream(response.body, {
      onContent: (value, update) => {
        check()
        if (update?.kind === 'final') authoritative = true
        onContent(value, update)
      },
      onTool: event => { check(); onTool?.(event) },
      onProgress: event => { check(); onProgress?.(event) },
    }, signal)
  } else {
    // 老协议的一次性 JSON 回复，或者是后端的校验错误。
    const data = await response.json()
    check()
    if (typeof data.content !== 'string' || !data.content.trim()) throw new Error('聊天服务没有返回有效回复，请重新发送。')
    content = data.content
  }
  check()
  if (!content.trim()) throw new Error('Agent 没有返回文本，请重新发送。')
  // 老协议与 JSON 路径没有 authoritative 帧，这里补一次：界面要知道这已经是终稿，可以立刻落盘。
  if (!authoritative) onContent(content, { kind: 'final' })
  return content
}
