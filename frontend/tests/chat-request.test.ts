import assert from 'node:assert/strict'
import test from 'node:test'
import { requestChatReply, retryAfterSeconds, retryableUserId, retryHistory } from '../src/lib/api/chat-request'
import { createAssistantGreeting, toChatHistory, type ConversationMessage } from '../src/lib/api/chat-history'

const user: ConversationMessage = { id: 'u1', role: 'user', content: '逛逛这个世界', timestamp: new Date(), status: 'complete' }
const partial: ConversationMessage = { id: 'a1', role: 'assistant', content: '收到的部分内容', timestamp: new Date(), status: 'interrupted' }
const history = [createAssistantGreeting(), user]
const proof = `v1.${'a'.repeat(48)}.2000000000.${'b'.repeat(64)}`
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}
function options(signal = new AbortController().signal) {
  return { api: 'https://backend.test/api/chat/', history, signal,
    onContent() {}, onTool() {}, activateDesktop: async () => true }
}

test('retries reuse one user message and exclude all prior incomplete replies from context', () => {
  const display = [...history, partial, { ...partial, id: 'a2' }]
  const id = retryableUserId(display)
  assert.equal(id, user.id)
  const retry = retryHistory(display, id!)!
  assert.deepEqual(toChatHistory(retry), [{ role: 'user', content: user.content }])
  assert.equal(display.length, 4, 'received partial replies remain visible')
  assert.equal(retryHistory([...display, { ...user, id: 'u2' }], user.id), null)
  assert.equal(retryableUserId([...display, { ...partial, id: 'done', status: 'complete' }]), null)
})

test('canceling while session creation is pending prevents the chat POST even if fetch ignores abort', async () => {
  const controller = new AbortController()
  const pending = deferred<Response>()
  let calls = 0
  const fetcher: typeof fetch = async () => { calls++; return pending.promise }
  const request = requestChatReply({ ...options(controller.signal), api: '/api/chat?stream=true', fetcher })
  const rejected = assert.rejects(request, { name: 'AbortError' })
  controller.abort()
  pending.resolve(Response.json({ token: 'test-session' }))
  await rejected
  assert.equal(calls, 1)
})

test('canceling a delayed JSON response produces no late text or desktop authorization', async () => {
  const controller = new AbortController()
  const pending = deferred<unknown>()
  const entered = deferred<void>()
  const response = Response.json({})
  response.json = () => { entered.resolve(); return pending.promise }
  const request = requestChatReply({ ...options(controller.signal), fetcher: async () => response,
    onContent() { assert.fail('late text') }, activateDesktop: async () => { assert.fail('late authorization') } })
  const rejected = assert.rejects(request, { name: 'AbortError' })
  await entered.promise
  controller.abort()
  pending.resolve({ content: 'late', desktop_action: 'unlock-girlfriend', desktop_proof: proof })
  await rejected
})

test('canceling a reply with a pending desktop event preserves delivered text and discards the event', async () => {
  const controller = new AbortController()
  const updates: string[] = []
  const stream = new ReadableStream<Uint8Array>({ start(output) {
    output.enqueue(new TextEncoder().encode(`data: {"event":"desktop","action":"unlock-girlfriend","proof":"${proof}"}\n\ndata: {"content":"保留文本"}\n\n`))
  } })
  await assert.rejects(requestChatReply({ ...options(controller.signal),
    fetcher: async () => new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } }),
    onContent(text) { updates.push(text); controller.abort() },
    activateDesktop: async () => { assert.fail('canceled reply changed the desktop') },
  }), { name: 'AbortError' })
  assert.deepEqual(updates, ['保留文本'])
})

test('authorization in flight receives the same abort signal and cannot complete a canceled turn', async () => {
  const controller = new AbortController()
  const entered = deferred<void>()
  const pending = deferred<boolean>()
  const request = requestChatReply({ ...options(controller.signal),
    fetcher: async () => Response.json({ content: '完成文本', desktop_action: 'unlock-girlfriend', desktop_proof: proof }),
    activateDesktop: async (_proof, _csrf, signal) => {
      assert.equal(signal, controller.signal)
      entered.resolve()
      return pending.promise
    },
  })
  const rejected = assert.rejects(request, { name: 'AbortError' })
  await entered.promise
  controller.abort()
  pending.resolve(true)
  await rejected
})

test('a new request can complete while a canceled old response is still pending', async () => {
  const oldController = new AbortController()
  const oldResponse = deferred<Response>()
  const updates: string[] = []
  const old = requestChatReply({ ...options(oldController.signal), fetcher: async () => oldResponse.promise, onContent: value => updates.push(value) })
  const rejected = assert.rejects(old, { name: 'AbortError' })
  oldController.abort()
  assert.equal(await requestChatReply({ ...options(), fetcher: async () => Response.json({ content: 'new reply' }), onContent: value => updates.push(value) }), 'new reply')
  oldResponse.resolve(Response.json({ content: 'old reply' }))
  await rejected
  assert.deepEqual(updates, ['new reply'])
})

test('a successful local request authorizes once after nonempty text with its session and signal', async () => {
  const events: string[] = []
  const signal = new AbortController().signal
  const content = await requestChatReply({ ...options(signal), api: '/api/chat?stream=true',
    fetcher: async input => input === '/api/chat/session' ? Response.json({ token: 'test-session' }) : Response.json({ content: '欢迎', desktop_action: 'unlock-girlfriend', desktop_proof: proof }),
    onContent: value => events.push(value),
    activateDesktop: async (receivedProof, csrf, receivedSignal) => {
      assert.equal(receivedProof, proof); assert.equal(csrf, 'test-session'); assert.equal(receivedSignal, signal)
      events.push('activated'); return true
    },
  })
  assert.equal(content, '欢迎')
  assert.deepEqual(events, ['欢迎', 'activated'])
})

test('chat and session rejection display cooldown without automatically retrying', async () => {
  for (const rejectSession of [false, true]) {
    const requests: string[] = []
    await assert.rejects(requestChatReply({ ...options(), api: '/api/chat?stream=true', fetcher: async input => {
      requests.push(String(input))
      if (!rejectSession && input === '/api/chat/session') return Response.json({ token: 'valid' })
      return Response.json({ detail: '短时间内请求过多。' }, { status: 429, headers: { 'Retry-After': '30' } })
    } }), /短时间内请求过多。 请等待 30 秒后再试，期间请勿重复发送。/)
    assert.equal(requests.length, rejectSession ? 1 : 2)
  }
})

test('queue saturation also displays the backend retry advice', async () => {
  await assert.rejects(requestChatReply({ ...options(), fetcher: async () => Response.json({ detail: '当前排队人数较多。' }, { status: 503, headers: { 'Retry-After': '10' } }) }), /请等待 10 秒后再试/)
})

test('retry-after accepts finite seconds or HTTP dates and rejects malformed or stale values', () => {
  const now = Date.parse('Mon, 14 Sep 2026 00:00:00 GMT')
  assert.equal(retryAfterSeconds('60', now), 60)
  assert.equal(retryAfterSeconds('Mon, 14 Sep 2026 00:00:30 GMT', now), 30)
  for (const value of [null, '', '-1', '1.5', 'Infinity', 'garbage', '0', 'Mon, 14 Sep 2026 00:00:00 GMT']) assert.equal(retryAfterSeconds(value, now), null)
})
