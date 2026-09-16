export const CONVERSATION_STORAGE_KEY = 'my-world-conversation'
export const GREETING_ID = 'assistant-greeting-initial'

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  status?: 'complete' | 'streaming' | 'interrupted' | 'error'
}

export function createAssistantGreeting(): ConversationMessage {
  return {
    id: GREETING_ID,
    role: 'assistant',
    content: '欢迎来到 Terminal。我是 MK Agent，可以查询本站页面、介绍内容，并给你可点击的站内链接。',
    timestamp: new Date('2024-01-01T00:00:00Z'),
  }
}

/** Display-only greetings, failed responses, and placeholders are not model history. */
export function toChatHistory(messages: ConversationMessage[]) {
  return messages
    .filter(message =>
      message.id !== GREETING_ID &&
      message.content.trim() !== '' &&
      (!message.status || message.status === 'complete') &&
      !(message.role === 'assistant' && /^系统提示[：:]/.test(message.content)),
    )
    .map(({ role, content }) => ({ role, content }))
}

/** The last question stays retryable until a finished reply exists after it.
 *
 * 中断、失败或仍在流式中的回复都不算"已答复"，所以刷新页面（streaming 会被还原成
 * interrupted）之后仍然可以重试同一条问题。
 */
export function retryableUserId(messages: ConversationMessage[]): string | null {
  let index = -1
  for (let position = messages.length - 1; position >= 0; position -= 1) {
    if (messages[position].role === 'user') { index = position; break }
  }
  if (index < 0) return null
  const answered = messages.slice(index + 1).some(message =>
    message.role === 'assistant' && (!message.status || message.status === 'complete'))
  return answered ? null : messages[index].id
}

/** Model context for a retry: everything up to that question, without the partial reply.
 *
 * 界面上保留半截回复，模型上下文里剔除它（toChatHistory 只会放行 complete 的消息）。
 */
export function retryHistory(messages: ConversationMessage[], userId: string): ConversationMessage[] | null {
  if (retryableUserId(messages) !== userId) return null
  const index = messages.findIndex(message => message.id === userId)
  return index < 0 ? null : messages.slice(0, index + 1)
}

export function restoreConversation(raw: string | null): ConversationMessage[] {
  const greeting = createAssistantGreeting()
  if (!raw) return [greeting]
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return [greeting]
  }
  if (!Array.isArray(parsed)) return [greeting]

  const messages: ConversationMessage[] = []
  for (const value of parsed) {
    if (!value || typeof value !== 'object') continue
    const item = value as Record<string, unknown>
    if (
      typeof item.id !== 'string' || item.id === GREETING_ID ||
      (item.role !== 'user' && item.role !== 'assistant') ||
      typeof item.content !== 'string' || !item.content.trim() ||
      typeof item.timestamp !== 'string'
    ) continue
    const timestamp = new Date(item.timestamp)
    if (!Number.isFinite(timestamp.getTime())) continue
    let status: ConversationMessage['status'] = 'complete'
    if (item.status === 'streaming' || item.status === 'interrupted') status = 'interrupted'
    if (item.status === 'error' || (item.role === 'assistant' && /^系统提示[：:]/.test(item.content))) {
      status = 'error'
    }
    messages.push({ id: item.id, role: item.role, content: item.content, timestamp, status })
  }
  return [greeting, ...messages]
}
