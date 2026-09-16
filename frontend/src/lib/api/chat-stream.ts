export interface ChatToolEvent {
  event: 'tool'
  name: string
  status: string
  message: string
  call_id?: string
}

export interface ChatProgressEvent {
  event: 'progress'
  stage: string
  message: string
}

export interface ChatContentUpdate {
  kind: 'delta' | 'replace' | 'final'
  messageId?: string
}

interface ChatStreamHandlers {
  onContent: (content: string, update?: ChatContentUpdate) => void
  onTool?: (event: ChatToolEvent) => void
  onProgress?: (event: ChatProgressEvent) => void
}

const interruptedMessage = '回复连接已中断，已保留收到的内容，请重新发送。'

/** Network chunks can end inside a UTF-8 character, an SSE line, or a JSON event. */
class EventDecoder {
  private decoder = new TextDecoder('utf-8', { fatal: true })
  private buffer = ''
  private data: string[] = []

  constructor(private onData: (data: unknown) => void) {}

  push(chunk: Uint8Array) {
    this.buffer += this.decoder.decode(chunk, { stream: true })
    this.drain(false)
  }

  finish() {
    this.buffer += this.decoder.decode()
    this.drain(true)
    // An event without its terminating blank line is incomplete at EOF.
  }

  private drain(atEnd: boolean) {
    while (true) {
      const end = this.buffer.search(/[\r\n]/)
      if (end < 0) return
      if (!atEnd && this.buffer[end] === '\r' && end === this.buffer.length - 1) return

      const line = this.buffer.slice(0, end)
      const separatorLength = this.buffer.slice(end, end + 2) === '\r\n' ? 2 : 1
      this.buffer = this.buffer.slice(end + separatorLength)

      if (line === '') {
        if (this.data.length) {
          const value = this.data.join('\n')
          this.data = []
          let parsed: unknown
          try {
            parsed = JSON.parse(value)
          } catch {
            throw new Error('聊天服务返回了无法解析的数据，请重新发送。')
          }
          this.onData(parsed)
        }
      } else if (line.startsWith('data:')) {
        const value = line.slice(5)
        this.data.push(value.startsWith(' ') ? value.slice(1) : value)
      }
      // Comments/heartbeats and other SSE fields do not contain chat content.
    }
  }
}

/** Consume the site's SSE protocol and require an explicit successful done event.
 *
 * 两套正文协议都能吃：老请求继续走追加式的 `{content}`；带 `protocol=v2` 的请求会收到
 * `reply(delta|final)`，换 message_id 视为整段替换、final 为准。一旦出现 reply 就不允许
 * 再混用老协议，否则同一段正文会被发两遍。每个事件之后都检查一次取消，传输层不可靠。
 */
export async function consumeChatStream(
  body: ReadableStream<Uint8Array>,
  handlers: ChatStreamHandlers,
  signal?: AbortSignal,
): Promise<string> {
  const reader = body.getReader()
  let complete = false
  let content = ''
  let messageId = ''
  let hasReply = false
  let hasFinal = false
  const decoder = new EventDecoder((value) => {
    signal?.throwIfAborted()
    if (complete) return
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('聊天服务返回了无效的消息。')
    }
    const data = value as Record<string, unknown>
    if (typeof data.error === 'string' && data.error) throw new Error(data.error)

    if (data.event === 'reply') {
      if (!['delta', 'final'].includes(String(data.phase)) || typeof data.message_id !== 'string' || !data.message_id || typeof data.content !== 'string' || hasFinal) {
        throw new Error('聊天服务返回了无效的正文事件，请重试。')
      }
      hasReply = true
      if (data.phase === 'final') {
        hasFinal = true
        content = data.content
        messageId = data.message_id
        handlers.onContent(content, { kind: 'final', messageId })
      } else {
        const replaced = messageId !== data.message_id
        content = replaced ? data.content : content + data.content
        messageId = data.message_id
        handlers.onContent(content, { kind: replaced ? 'replace' : 'delta', messageId })
      }
      return
    }

    if (data.event === 'progress') {
      if (typeof data.stage !== 'string' || !data.stage || typeof data.message !== 'string') {
        throw new Error('聊天服务返回了无效的进度事件。')
      }
      handlers.onProgress?.({ event: 'progress', stage: data.stage, message: data.message })
      return
    }

    if (data.event === 'tool') {
      if (typeof data.name !== 'string' || typeof data.status !== 'string') {
        throw new Error('聊天服务返回了无效的工具状态。')
      }
      handlers.onTool?.({
        event: 'tool',
        name: data.name,
        status: data.status,
        message: typeof data.message === 'string' ? data.message : '',
        ...(typeof data.call_id === 'string' && data.call_id ? { call_id: data.call_id } : {}),
      })
      return
    }

    if (typeof data.content === 'string') {
      if (hasReply) {
        // 声明了 v2 的服务器只能再用空内容做收尾哨兵：带正文就是协议混用，正文会被发两遍。
        if (data.content !== '') throw new Error('聊天服务混用了正文协议，请重试。')
        if (data.done === true && !hasFinal) throw new Error(interruptedMessage)
      } else if (data.content !== '') {
        content += data.content
        handlers.onContent(content, { kind: 'delta' })
      }
    }
    if (data.done === true) {
      if (hasReply && !hasFinal) throw new Error(interruptedMessage)
      complete = true
    }
  })
  const abort = () => { void reader.cancel().catch(() => {}) }
  signal?.addEventListener('abort', abort, { once: true })

  try {
    if (signal?.aborted) throw new DOMException('请求已取消', 'AbortError')
    while (!complete) {
      const { done, value } = await reader.read()
      signal?.throwIfAborted()
      if (done) {
        decoder.finish()
        break
      }
      decoder.push(value)
    }
    if (!complete) throw new Error(interruptedMessage)
    return content
  } finally {
    signal?.removeEventListener('abort', abort)
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}
