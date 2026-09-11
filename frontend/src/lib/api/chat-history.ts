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
    content: '欢迎来到 My World。我是 NEKO，可以查询本站页面、介绍内容，并给你可点击的站内链接。这个网站还有彩蛋模式哦，想试试的话，就对我说「开启彩蛋模式」。',
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
