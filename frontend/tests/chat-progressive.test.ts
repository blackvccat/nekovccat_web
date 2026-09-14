import assert from 'node:assert/strict'
import test from 'node:test'
import { consumeChatStream, type ChatContentUpdate, type ChatProgressEvent } from '../src/lib/api/chat-stream'
import { createReplyBuffer } from '../src/lib/api/chat-reply-buffer'
import { recordActivity, interruptActivity, type ChatActivity } from '../src/lib/api/chat-activity'
import { requestChatReply } from '../src/lib/api/chat-request'

const encoder = new TextEncoder()
const proof = `v1.${'a'.repeat(48)}.2000000000.${'b'.repeat(64)}`
const frame = (value: unknown) => `data: ${JSON.stringify(value)}\n\n`
const reply = (phase: 'delta' | 'final', message_id: string, content: string) => ({ event: 'reply', phase, message_id, content })
function source(text: string, split?: number) {
  const bytes = encoder.encode(text)
  return new ReadableStream<Uint8Array>({ start(controller) {
    if (split) { controller.enqueue(bytes.slice(0, split)); controller.enqueue(bytes.slice(split)) }
    else controller.enqueue(bytes)
    controller.close()
  } })
}
function fakeFrames() {
  let next = 0
  const callbacks = new Map<number, FrameRequestCallback>()
  return {
    schedule(callback: FrameRequestCallback) { const id = next++; callbacks.set(id, callback); return id },
    cancel(id: number) { callbacks.delete(id) },
    paint() { const pending = [...callbacks.values()]; callbacks.clear(); pending.forEach(callback => callback(0)) },
    get size() { return callbacks.size },
  }
}

test('real deltas appear before completion; a new message replaces tool preamble and final replaces all provisional text', async () => {
  const payload = [
    { event: 'progress', stage: 'preparing', message: '正在准备会话' },
    reply('delta', 'round-1', '我先查一'), reply('delta', 'round-1', '下。'),
    { event: 'tool', name: 'site_info', call_id: 'call-1', status: 'started', message: '查询站点' },
    reply('delta', 'round-2', '这是答复🐈'), reply('delta', 'round-2', '的初稿。'),
    reply('final', 'canonical', '这是权威最终答复。'), { content: '', done: true },
  ].map(frame).join('')
  for (let split = 1; split < encoder.encode(payload).length; split++) {
    const updates: string[] = []
    const kinds: Array<ChatContentUpdate['kind'] | undefined> = []
    const progress: ChatProgressEvent[] = []
    const result = await consumeChatStream(source(payload, split), {
      onContent: (text, update) => { updates.push(text); kinds.push(update?.kind) },
      onProgress: event => progress.push(event),
      onTool: event => assert.equal(event.call_id, 'call-1'),
    })
    assert.deepEqual(updates, ['我先查一', '我先查一下。', '这是答复🐈', '这是答复🐈的初稿。', '这是权威最终答复。'])
    assert.deepEqual(kinds, ['replace', 'delta', 'replace', 'delta', 'final'])
    assert.equal(result, '这是权威最终答复。')
    assert.equal(progress[0].stage, 'preparing')
  }
})

test('an open response publishes real text while final is still unavailable', async () => {
  let output!: ReadableStreamDefaultController<Uint8Array>
  let observed!: () => void
  const firstText = new Promise<void>(resolve => { observed = resolve })
  const stream = new ReadableStream<Uint8Array>({ start(controller) {
    output = controller
    output.enqueue(encoder.encode(frame(reply('delta', 'attempt-1', '先到的真增量'))))
  } })
  let finished = false
  const pending = consumeChatStream(stream, { onContent: () => observed() }).then(content => { finished = true; return content })
  await firstText
  assert.equal(finished, false)
  output.enqueue(encoder.encode(frame(reply('final', 'canonical', '最终答案')) + frame({ content: '', done: true })))
  assert.equal(await pending, '最终答案')
})

test('v2 requires authoritative final and done before it can unlock a desktop', async () => {
  const desktop = { event: 'desktop', action: 'unlock-girlfriend', proof }
  const invalid = [
    [reply('delta', 'r1', '临时文字'), desktop, { done: true }],
    [reply('delta', 'r1', '临时文字'), reply('final', 'r1', ''), desktop, { done: true }],
    [reply('delta', 'r1', '临时文字'), reply('final', 'r1', '最终'), desktop],
    [reply('final', 'r1', '最终'), reply('delta', 'r1', '不应再追加'), desktop, { done: true }],
  ]
  for (const events of invalid) {
    let unlocks = 0
    await consumeChatStream(source(events.map(frame).join('')), { onContent() {}, onDesktop() { unlocks++ } }).catch(() => {})
    assert.equal(unlocks, 0)
  }
})

test('cancellation inside a real delta suppresses later progress, text and authorization in the same network chunk', async () => {
  const controller = new AbortController()
  const events = [reply('delta', 'r1', '保留这句'), { event: 'progress', stage: 'analyzing', message: '处理中' }, reply('final', 'r1', '晚到最终'), { event: 'desktop', action: 'unlock-girlfriend', proof }, { done: true }]
  await assert.rejects(consumeChatStream(source(events.map(frame).join('')), {
    onContent: content => { assert.equal(content, '保留这句'); controller.abort() },
    onProgress() { assert.fail('late progress') }, onDesktop() { assert.fail('late authorization') },
  }, controller.signal), { name: 'AbortError' })
})

test('v2 negotiation preserves existing stream query parameters and legacy canonical responses still work', async () => {
  const requests: string[] = []
  const content = await requestChatReply({ api: '/api/chat?stream=true&existing=value', history: [], signal: new AbortController().signal,
    onContent() {}, onTool() {}, activateDesktop: async () => true,
    fetcher: async input => {
      requests.push(String(input))
      if (input === '/api/chat/session') return Response.json({ token: 'test-session' })
      return new Response(source(frame({ content: 'legacy canonical' }) + frame({ done: true })), { headers: { 'Content-Type': 'text/event-stream' } })
    },
  })
  assert.equal(content, 'legacy canonical')
  assert.equal(requests[1], '/api/chat?stream=true&existing=value&protocol=v2')
})

test('the full v2 request contract preserves real progress and authorizes only canonical text after done', async () => {
  for (const done of [{ done: true }, { content: '', done: true }]) {
    const events: string[] = []
    const payload = [
      { event: 'progress', stage: 'preparing', message: '准备会话' },
      reply('delta', 'attempt-1', '查询前言'),
      { event: 'tool', name: 'site_info', call_id: 'call-1', status: 'started', message: '查询资料' },
      { event: 'tool', name: 'site_info', call_id: 'call-1', status: 'completed', message: '资料已找到' },
      reply('delta', 'attempt-2', '临时答案'), reply('final', 'final', '权威最终答案'),
      { event: 'desktop', action: 'unlock-girlfriend', proof }, done,
    ].map(frame).join('')
    const content = await requestChatReply({ api: '/api/chat?stream=true', history: [], signal: new AbortController().signal,
      onContent: value => events.push(`text:${value}`),
      onTool: event => events.push(`tool:${event.call_id}:${event.status}`),
      onProgress: event => events.push(`progress:${event.stage}`),
      activateDesktop: async (received, csrf) => { assert.equal(received, proof); assert.equal(csrf, 'test-session'); events.push('activate'); return true },
      fetcher: async input => input === '/api/chat/session' ? Response.json({ token: 'test-session' }) : new Response(source(payload), { headers: { 'Content-Type': 'text/event-stream' } }),
    })
    assert.equal(content, '权威最终答案')
    assert.deepEqual(events, ['progress:preparing', 'text:查询前言', 'tool:call-1:started', 'tool:call-1:completed', 'text:临时答案', 'text:权威最终答案', 'activate'])
  }
})

test('many transport chunks produce one frame; replacement discards queued preamble and final is immediate', () => {
  const frames = fakeFrames()
  const updates: string[] = []
  const buffer = createReplyBuffer(value => updates.push(value), frames.schedule, frames.cancel)
  buffer.push('前言一'); buffer.push('前言一二'); buffer.push('下一轮正文')
  assert.equal(frames.size, 1)
  assert.deepEqual(updates, [])
  frames.paint()
  assert.deepEqual(updates, ['下一轮正文'])
  buffer.push('未画出的临时文字')
  const longFinal = '完整答复🐈'.repeat(10000)
  buffer.push(longFinal, true)
  assert.equal(frames.size, 0)
  assert.equal(updates.at(-1), longFinal)
  frames.paint()
  assert.equal(updates.length, 2)
})

test('stop flushes received text once; reset disposes pending paints and a new request has its own buffer', () => {
  const frames = fakeFrames()
  const updates: string[] = []
  const stopped = createReplyBuffer(text => updates.push(text), frames.schedule, frames.cancel)
  stopped.push('已收到'); stopped.flush(); stopped.dispose(); stopped.push('晚到')
  frames.paint()
  assert.deepEqual(updates, ['已收到'])
  const old = createReplyBuffer(text => updates.push(text), frames.schedule, frames.cancel)
  old.push('旧会话队列'); old.dispose()
  const current = createReplyBuffer(text => updates.push(text), frames.schedule, frames.cancel)
  current.push('新会话正文')
  frames.paint()
  assert.deepEqual(updates, ['已收到', '新会话正文'])
})

test('parallel calls to one tool retain independent execution status and bounded stable entries', () => {
  let activities: ChatActivity[] = []
  const tool = (call_id: string, status: string) => ({ event: 'tool' as const, name: 'same_tool', call_id, status, message: '查询站内资料' })
  activities = recordActivity(activities, tool('call-a', 'started'))
  activities = recordActivity(activities, tool('call-b', 'started'))
  const firstId = activities[0].id
  activities = recordActivity(activities, tool('call-a', 'completed'))
  assert.equal(activities.length, 2)
  assert.equal(activities[0].id, firstId)
  assert.equal(activities[0].status, 'completed')
  assert.equal(activities[1].status, 'started')
  assert.equal(interruptActivity(activities)[1].status, 'interrupted')
  assert.equal(interruptActivity(activities)[0].status, 'completed')
  for (let i = 0; i < 80; i++) activities = recordActivity(activities, { event: 'progress', stage: i % 2 ? 'analyzing' : 'answering', message: '正在处理' })
  assert.equal(activities.length, 32)
  assert.equal(new Set(activities.map(item => item.id)).size, 32)
})
