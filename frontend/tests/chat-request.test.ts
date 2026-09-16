import assert from 'node:assert/strict'
import test from 'node:test'
import { requestChatReply } from '../src/lib/api/chat-request'
import type { ConversationMessage } from '../src/lib/api/chat-history'

const history: ConversationMessage[] = [
  { id: 'u1', role: 'user', content: '有哪些页面？', timestamp: new Date(0), status: 'complete' },
]
const encoder = new TextEncoder()
const session = () => Response.json({ token: 'csrf-token-48' })
const signal = () => new AbortController().signal

function sse(...events: unknown[]) {
  return new Response(events.map(event => `data: ${JSON.stringify(event)}\n\n`).join(''), {
    headers: { 'Content-Type': 'text/event-stream' },
  })
}

/** 记录调用顺序并回放给定响应；fetcher 的注入点就是这一层存在的原因。 */
function recorder(responses: Response[]) {
  const calls: { url: string; init: RequestInit }[] = []
  const fetcher = (async (url: unknown, init: RequestInit) => {
    calls.push({ url: String(url), init })
    const next = responses.shift()
    if (!next) throw new Error('fetcher 收到了多余的请求')
    return next
  }) as unknown as typeof fetch
  return { calls, fetcher }
}

test('a relative api fetches the session first and sends its nonce as the CSRF header', async () => {
  const { calls, fetcher } = recorder([session(), sse({ event: 'reply', phase: 'final', message_id: 'm1', content: '你好' }, { content: '', done: true })])
  const chunks: string[] = []
  const content = await requestChatReply({
    api: '/api/chat?stream=true', history, signal: signal(), fetcher,
    onContent: value => chunks.push(value),
  })
  assert.equal(content, '你好')
  assert.equal(calls[0].url, '/api/chat/session')
  assert.equal(calls[0].init.cache, 'no-store')
  assert.equal(calls[1].url, '/api/chat?stream=true&protocol=v2')
  const headers = calls[1].init.headers as Record<string, string>
  assert.equal(headers['X-Marcus-CSRF'], 'csrf-token-48')
  assert.equal(headers['Content-Type'], 'application/json')
  assert.deepEqual(JSON.parse(String(calls[1].init.body)), { messages: [{ role: 'user', content: '有哪些页面？' }] })
  assert.deepEqual(chunks, ['你好'])
})

test('an absolute api skips the session fetch and negotiates v2 on the absolute url', async () => {
  // 开发时直连后端（绝对地址）没有站内会话：不该去取 nonce，也不该把相对路径拼错。
  const { calls, fetcher } = recorder([sse({ content: '好的', done: true })])
  const content = await requestChatReply({
    api: 'http://127.0.0.1:8010/api/chat/?stream=true', history, signal: signal(), fetcher,
    onContent: () => {},
  })
  assert.equal(content, '好的')
  assert.equal(calls.length, 1, '绝对地址不该再取一次会话')
  assert.equal(calls[0].url, 'http://127.0.0.1:8010/api/chat/?stream=true&protocol=v2')
  assert.equal((calls[0].init.headers as Record<string, string>)['X-Marcus-CSRF'], undefined)
})

test('a stream that never sends an authoritative frame still ends with one final update', async () => {
  // 老协议只有追加式增量：界面需要一次 final 才知道这是终稿（否则草稿不会立刻落盘）。
  const updates: (string | undefined)[] = []
  const content = await requestChatReply({
    api: '/api/chat?stream=true', history, signal: signal(),
    fetcher: recorder([session(), sse({ content: '你' }, { content: '好' }, { content: '', done: true })]).fetcher,
    onContent: (_value, update) => updates.push(update?.kind),
  })
  assert.equal(content, '你好')
  assert.deepEqual(updates, ['delta', 'delta', 'final'])
})

test('progress and tool frames are forwarded while the final reply wins over the deltas', async () => {
  const tools: string[] = []
  const progress: string[] = []
  const chunks: string[] = []
  const content = await requestChatReply({
    api: '/api/chat?stream=true', history, signal: signal(),
    fetcher: recorder([session(), sse(
      { event: 'progress', stage: 'preparing', message: '正在准备站内助手…' },
      { event: 'reply', phase: 'delta', message_id: 'm1', content: '半截' },
      { event: 'tool', name: 'site_info', status: 'completed', message: '站内查询已完成', call_id: 'abc' },
      { event: 'reply', phase: 'final', message_id: 'm2', content: '终稿' },
      { content: '', done: true },
    )]).fetcher,
    onContent: value => chunks.push(value),
    onTool: event => tools.push(`${event.name}:${event.status}:${event.call_id}`),
    onProgress: event => progress.push(event.stage),
  })
  assert.equal(content, '终稿')
  // final 是替换语义：界面上留下的只能是终稿，半截正文不会跟它拼在一起。
  assert.deepEqual(chunks, ['半截', '终稿'])
  assert.deepEqual(tools, ['site_info:completed:abc'])
  assert.deepEqual(progress, ['preparing'])
})

test('a one-shot JSON reply still works and an empty one is an error', async () => {
  const content = await requestChatReply({
    api: '/api/chat', history, signal: signal(),
    fetcher: recorder([session(), Response.json({ content: '一次性回复' })]).fetcher,
    onContent: () => {},
  })
  assert.equal(content, '一次性回复')
  await assert.rejects(requestChatReply({
    api: '/api/chat', history, signal: signal(),
    fetcher: recorder([session(), Response.json({ content: '   ' })]).fetcher,
    onContent: () => {},
  }), /没有返回有效回复/)
})

test('a rejection keeps the backend wording and adds how long to wait', async () => {
  const response = new Response(JSON.stringify({ detail: '消息有些频繁，请休息一会儿再试。' }), {
    status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '90' },
  })
  await assert.rejects(requestChatReply({
    api: '/api/chat', history, signal: signal(),
    fetcher: recorder([session(), response]).fetcher, onContent: () => {},
  }), /消息有些频繁，请休息一会儿再试。 请等待 2 分钟后再试，期间请勿重复发送。/)
})

test('a session that cannot be created fails before the paid request is sent', async () => {
  const { calls, fetcher } = recorder([new Response(JSON.stringify({ error: '正在维护' }), { status: 503 })])
  await assert.rejects(requestChatReply({
    api: '/api/chat', history, signal: signal(), fetcher, onContent: () => {},
  }), /正在维护/)
  assert.equal(calls.length, 1, '拿不到 nonce 就不该发聊天请求（也就不会扣额度）')
})

test('cancellation is rechecked after every await, even for a fetcher that ignores the signal', async () => {
  // 传输层可能完全不看 signal：那就在每个 await 之后自己检查一次，别把已取消的请求继续跑下去。
  const controller = new AbortController()
  const { calls, fetcher } = recorder([session(), sse({ event: 'reply', phase: 'delta', message_id: 'm1', content: '你' })])
  const ignoring = (async (url: RequestInfo | URL, init: RequestInit) => {
    controller.abort()
    return fetcher(url, init)
  }) as unknown as typeof fetch
  await assert.rejects(requestChatReply({
    api: '/api/chat', history, signal: controller.signal, fetcher: ignoring, onContent: () => {},
  }), error => error instanceof Error && error.name === 'AbortError')
  assert.equal(calls.length, 1, '取会话之后就发现取消了：聊天请求不该发出去')
})

test('a truncated stream reports an interruption instead of a half reply', async () => {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode('data: {"event":"reply","phase":"delta","message_id":"m1","content":"半截"}\n\n'))
      controller.close()
    },
  })
  await assert.rejects(requestChatReply({
    api: '/api/chat?stream=true', history, signal: signal(),
    fetcher: recorder([session(), new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } })]).fetcher,
    onContent: () => {},
  }), /回复连接已中断/)
})
