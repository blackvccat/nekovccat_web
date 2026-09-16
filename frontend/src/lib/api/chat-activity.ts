import type { ChatProgressEvent, ChatToolEvent } from './chat-stream'

export interface ChatActivity {
  id: string
  kind: 'progress' | 'tool'
  name: string
  message: string
  status: string
  order: number
  callId?: string
}
const finished = new Set(['completed', 'complete', 'success', 'failed', 'error', 'interrupted'])
export function activityFinished(status: string) { return finished.has(status) }

/** Keep bounded execution summaries; tool arguments and reasoning text never enter this view. */
export function recordActivity(previous: ChatActivity[], event: ChatProgressEvent | ChatToolEvent): ChatActivity[] {
  const order = previous.reduce((latest, item) => Math.max(latest, item.order), 0) + 1
  if (event.event === 'progress') {
    const last = previous.at(-1)
    if (last?.kind === 'progress' && last.name === event.stage && last.message === event.message) return previous
    return [...previous, { id: `progress-${order}`, kind: 'progress' as const, name: event.stage, message: event.message, status: 'observed', order }].slice(-32)
  }
  const index = event.call_id
    ? previous.findIndex(item => item.kind === 'tool' && item.callId === event.call_id)
    : previous.findLastIndex(item => item.kind === 'tool' && !item.callId && item.name === event.name && !activityFinished(item.status))
  const entry: ChatActivity = { id: event.call_id ? `tool-${event.call_id}` : `tool-${order}`, kind: 'tool', name: event.name, message: event.message, status: event.status, callId: event.call_id, order }
  if (index < 0) return [...previous, entry].slice(-32)
  const next = [...previous]
  next[index] = { ...entry, id: previous[index].id }
  return next
}

export function interruptActivity(previous: ChatActivity[]) {
  return previous.map(item => item.kind === 'tool' && !activityFinished(item.status) ? { ...item, status: 'interrupted' } : item)
}
