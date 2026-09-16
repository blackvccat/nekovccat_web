import assert from 'node:assert/strict'
import test, { type TestContext } from 'node:test'
import { NextRequest } from 'next/server'
import { POST } from '../src/app/api/chat/route'
import { ensureDevice } from '../src/lib/server/chat-security'
import { createVisitorAccess, VISITOR_COOKIE } from '../src/lib/server/visitor-access'

const TOKEN = 'unit-test-' + 'x'.repeat(40)

function request(signal?: AbortSignal, cookie?: string) {
  return new NextRequest('http://localhost:3010/api/chat?stream=true', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) },
    body: JSON.stringify({ messages: [{ role: 'user', content: '介绍本站' }] }), signal,
  })
}

function env(context: TestContext, key: string, value: string) {
  const previous = process.env[key]; process.env[key] = value
  context.after(() => { if (previous === undefined) delete process.env[key]; else process.env[key] = previous })
}

const encoder = new TextEncoder()

test('proxy preserves SSE bytes and hands the backend its own abort signal', async context => {
  const incoming = request()
  const stream = 'data: {"event":"tool","name":"site_info","status":"started"}\n\ndata: {"content":"你好","done":true}\n\n'
  let sentHeaders: Record<string, string> = {}
  let upstream: AbortSignal | undefined
  context.mock.method(globalThis, 'fetch', async (_url: unknown, options: RequestInit) => {
    upstream = options.signal as AbortSignal
    sentHeaders = options.headers as Record<string, string>
    // 代理自己持一个内部 controller（超时才能中止上游），所以不再是浏览器那个 signal 对象。
    assert.notEqual(options.signal, incoming.signal)
    assert.equal(options.cache, 'no-store')
    assert.deepEqual(JSON.parse(options.body as string), { messages: [{ role: 'user', content: '介绍本站' }] })
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } })
  })
  const response = await POST(incoming)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('x-accel-buffering'), 'no')
  assert.match(response.headers.get('cache-control') || '', /no-transform/)
  // 请求 id 从代理传到后端，再原样回到浏览器：用户报错时靠它对上两边日志。
  assert.equal(response.headers.get('x-request-id'), sentHeaders['X-Request-ID'])
  assert.match(response.headers.get('x-request-id') || '', /^[a-f0-9-]{36}$/)
  assert.equal(await response.text(), stream)
  assert.equal(upstream?.aborted, false)
})

test('cancelling the browser request aborts the upstream fetch', async context => {
  const controller = new AbortController()
  const incoming = request(controller.signal)
  let upstream: AbortSignal | undefined
  let upstreamAborted = false
  let pending: ReadableStreamDefaultController<Uint8Array> | undefined
  const body = new ReadableStream<Uint8Array>({
    start(inner) { pending = inner; inner.enqueue(encoder.encode('data: {"content":"你"}\n\n')) },
  })
  context.mock.method(globalThis, 'fetch', async (_url: unknown, options: RequestInit) => {
    upstream = options.signal as AbortSignal
    // 真实 fetch 在 signal 中止时会让响应体报错，桩要照做，否则这场测试测不到东西。
    options.signal?.addEventListener('abort', () => { upstreamAborted = true; pending?.error(new Error('upstream aborted')) })
    return new Response(body, { headers: { 'Content-Type': 'text/event-stream' } })
  })
  const response = await POST(incoming)
  const reader = response.body!.getReader()
  assert.match(new TextDecoder().decode((await reader.read()).value), /你/)
  assert.equal(upstream?.aborted, false)
  controller.abort()
  assert.equal(upstream?.aborted, true)
  assert.equal(upstreamAborted, true, '浏览器断开必须传到上游')
  await assert.rejects(reader.read(), /请求已取消/)
})

test('a silent upstream is cut by the header budget instead of hanging forever', async context => {
  env(context, 'CHAT_PROXY_HEADER_TIMEOUT_MS', '20')
  let upstream: AbortSignal | undefined
  context.mock.method(globalThis, 'fetch', (_url: unknown, options: RequestInit) => new Promise<Response>((_resolve, reject) => {
    upstream = options.signal as AbortSignal
    options.signal?.addEventListener('abort', () => reject(new Error('aborted')))
  }))
  const response = await POST(request())
  assert.equal(response.status, 504)
  assert.equal(upstream?.aborted, true)
  assert.match((await response.json()).error, /超时/)
})

test('a stalled stream trips the idle budget even after the first bytes arrived', async context => {
  env(context, 'CHAT_PROXY_IDLE_TIMEOUT_MS', '20')
  let pending: ReadableStreamDefaultController<Uint8Array> | undefined
  const body = new ReadableStream<Uint8Array>({
    start(inner) { pending = inner; inner.enqueue(encoder.encode('data: {"content":"你"}\n\n')) },
  })
  context.mock.method(globalThis, 'fetch', async (_url: unknown, options: RequestInit) => {
    options.signal?.addEventListener('abort', () => pending?.error(new Error('aborted')))
    return new Response(body, { headers: { 'Content-Type': 'text/event-stream' } })
  })
  const response = await POST(request())
  const reader = response.body!.getReader()
  assert.match(new TextDecoder().decode((await reader.read()).value), /你/)
  // 之后再没有字节：空闲预算到点就应该中止上游并让前端看到中断，而不是一直挂着。
  await assert.rejects(reader.read(), /已中断/)
})

test('the backend Retry-After and request id reach the browser', async context => {
  context.mock.method(globalThis, 'fetch', async () => Response.json({ detail: '这个网络下的免费额度已用完' },
    { status: 429, headers: { 'Retry-After': '42' } }))
  const response = await POST(request())
  assert.equal(response.status, 429)
  assert.equal(response.headers.get('retry-after'), '42')
  assert.match(response.headers.get('x-request-id') || '', /^[a-f0-9-]{36}$/)
})

test('backend JSON errors retain their status and readable details', async context => {
  context.mock.method(globalThis, 'fetch', async () => Response.json({ detail: 'Agent 服务暂不可用' }, { status: 503 }))
  const response = await POST(request())
  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), { detail: 'Agent 服务暂不可用' })
})

test('legacy non-streaming JSON replies still pass through', async context => {
  const reply = { role: 'assistant', content: '欢迎回来', timestamp: '2026-09-10T00:00:00Z' }
  context.mock.method(globalThis, 'fetch', async () => Response.json(reply))
  const response = await POST(request())
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), reply)
})

test('the paid-turn tier travels as signed identities, and forged ones never do', async context => {
  const previous = process.env.INTERNAL_API_TOKEN
  process.env.INTERNAL_API_TOKEN = TOKEN
  context.after(() => { if (previous === undefined) delete process.env.INTERNAL_API_TOKEN; else process.env.INTERNAL_API_TOKEN = previous })
  const device = ensureDevice(new NextRequest('http://localhost:3010/api/chat/session'))
  const access = createVisitorAccess({ username: 'leo', name: 'Leo', apps: [] })
  let sent: Record<string, string> = {}
  context.mock.method(globalThis, 'fetch', async (_url: unknown, options: RequestInit) => {
    sent = options.headers as Record<string, string>
    return Response.json({ message: 'ok' })
  })
  await POST(request(undefined, `marcus-device=${device.cookie}; ${VISITOR_COOKIE}=${access}`))
  assert.equal(sent['X-Marcus-Device'], device.nonce)
  assert.equal(sent['X-Marcus-Visitor'], 'leo')
  // 没带 cookie：两个身份都不出现，后端按匿名（更严的那一档）算。
  await POST(request())
  assert.equal(sent['X-Marcus-Device'], undefined)
  assert.equal(sent['X-Marcus-Visitor'], undefined)
  // 签名对不上的 cookie 也换不到身份，不能自称登录。
  const forged = access.slice(0, -1) + (access.endsWith('0') ? '1' : '0')
  await POST(request(undefined, `marcus-device=${device.nonce}; ${VISITOR_COOKIE}=${forged}`))
  assert.equal(sent['X-Marcus-Device'], undefined)
  assert.equal(sent['X-Marcus-Visitor'], undefined)
})
