import assert from 'node:assert/strict'
import test, { type TestContext } from 'node:test'
import { NextRequest } from 'next/server'
import { POST } from '../src/app/api/chat/route'

function request(signal?: AbortSignal, protocol?: string) {
  return new NextRequest(`http://localhost:3010/api/chat?stream=true${protocol ? `&protocol=${protocol}` : ''}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: '介绍本站' }] }), signal,
  })
}

test('proxy preserves SSE bytes and propagates a generated request ID to the backend', async context => {
  const incoming = request()
  const stream = 'data: {"event":"tool","name":"site_info","status":"started"}\n\ndata: {"content":"你好","done":true}\n\n'
  context.mock.method(globalThis, 'fetch', async (_url: unknown, options: RequestInit) => {
    assert.equal(new URL(String(_url)).searchParams.has('protocol'), false)
    assert.ok(options.signal instanceof AbortSignal)
    assert.equal(options.signal.aborted, false)
    assert.match(new Headers(options.headers).get('x-request-id') || '', /^[a-f0-9-]{36}$/)
    assert.equal(options.cache, 'no-store')
    assert.deepEqual(JSON.parse(options.body as string), { messages: [{ role: 'user', content: '介绍本站' }] })
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } })
  })
  const response = await POST(incoming)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('x-accel-buffering'), 'no')
  assert.match(response.headers.get('cache-control') || '', /no-transform/)
  assert.match(response.headers.get('x-request-id') || '', /^[a-f0-9-]{36}$/)
  assert.equal(await response.text(), stream)
})

test('v2 streams pass reply replacement and progress bytes through without buffering', async context => {
  const initial = 'data: {"event":"progress","stage":"preparing","message":"正在准备回复"}\n\n'
  const end = 'data: {"event":"reply","phase":"final","message_id":"answer-1","content":"已完成"}\n\ndata: {"done":true}\n\n'
  let finishStream: () => void = () => {}
  context.mock.method(globalThis, 'fetch', async (url: unknown) => {
    assert.equal(new URL(String(url)).searchParams.get('protocol'), 'v2')
    return new Response(new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(initial))
        finishStream = () => { controller.enqueue(new TextEncoder().encode(end)); controller.close() }
      },
    }), { headers: { 'Content-Type': 'text/event-stream' } })
  })
  const response = await POST(request(undefined, 'v2'))
  const reader = response.body!.getReader()
  try {
    assert.equal(new TextDecoder().decode((await reader.read()).value), initial)
    finishStream()
    assert.equal(new TextDecoder().decode((await reader.read()).value), end)
    assert.equal((await reader.read()).done, true)
  } finally { await reader.cancel(); reader.releaseLock() }
})

test('unrecognized protocol values retain the legacy backend contract', async context => {
  context.mock.method(globalThis, 'fetch', async (url: unknown) => {
    assert.equal(new URL(String(url)).searchParams.has('protocol'), false)
    return new Response('data: {"content":"你好","done":true}\n\n', { headers: { 'Content-Type': 'text/event-stream' } })
  })
  const response = await POST(request(undefined, 'unrecognized'))
  assert.match(await response.text(), /你好/)
})

test('backend JSON errors retain their status, retry instructions and readable details', async context => {
  context.mock.method(globalThis, 'fetch', async () => Response.json({ detail: 'Agent 服务暂不可用' }, { status: 503, headers: { 'Retry-After': '10' } }))
  const response = await POST(request())
  assert.equal(response.status, 503)
  assert.equal(response.headers.get('retry-after'), '10')
  assert.deepEqual(await response.json(), { detail: 'Agent 服务暂不可用' })
})

test('legacy non-streaming JSON replies still pass through', async context => {
  const reply = { role: 'assistant', content: '欢迎回来', timestamp: '2026-09-10T00:00:00Z' }
  context.mock.method(globalThis, 'fetch', async () => Response.json(reply))
  const response = await POST(request())
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), reply)
})

function setBudget(context: TestContext, key: string, value: string) {
  const original = process.env[key]
  process.env[key] = value
  context.after(() => { if (original === undefined) delete process.env[key]; else process.env[key] = original })
}

test('browser abort closes the upstream body and interrupts a pending downstream read', async context => {
  const browser = new AbortController()
  let upstreamSignal: AbortSignal | null = null
  let cancelled = false
  context.mock.method(globalThis, 'fetch', async (_url: unknown, options: RequestInit) => {
    upstreamSignal = options.signal as AbortSignal
    return new Response(new ReadableStream({ cancel() { cancelled = true } }), { headers: { 'Content-Type': 'text/event-stream' } })
  })
  const response = await POST(request(browser.signal))
  const pending = response.body!.getReader().read()
  browser.abort()
  await assert.rejects(pending, /请求已取消/)
  assert.equal((upstreamSignal as unknown as AbortSignal).aborted, true)
  assert.equal(cancelled, true)
})

test('consumer cancellation aborts the upstream even when the browser signal is still active', async context => {
  let upstreamSignal: AbortSignal | null = null
  let cancelled = false
  context.mock.method(globalThis, 'fetch', async (_url: unknown, options: RequestInit) => {
    upstreamSignal = options.signal as AbortSignal
    return new Response(new ReadableStream({ cancel() { cancelled = true } }), { headers: { 'Content-Type': 'text/event-stream' } })
  })
  const response = await POST(request())
  await response.body!.cancel()
  assert.equal((upstreamSignal as unknown as AbortSignal).aborted, true)
  assert.equal(cancelled, true)
})

test('missing upstream headers fail with 504 inside the header budget', async context => {
  setBudget(context, 'CHAT_PROXY_HEADER_TIMEOUT_MS', '20')
  context.mock.method(globalThis, 'fetch', async (_url: unknown, options: RequestInit) => new Promise<Response>((_resolve, reject) => {
    options.signal!.addEventListener('abort', () => reject(new Error('aborted')), { once: true })
  }))
  const response = await POST(request())
  assert.equal(response.status, 504)
  assert.match((await response.json()).error, /超时/)
})

test('an idle stream fails visibly and cancels its upstream body', async context => {
  setBudget(context, 'CHAT_PROXY_IDLE_TIMEOUT_MS', '20')
  let cancelled = false
  context.mock.method(globalThis, 'fetch', async () => new Response(new ReadableStream({ cancel() { cancelled = true } }), {
    headers: { 'Content-Type': 'text/event-stream' },
  }))
  const response = await POST(request())
  await assert.rejects(response.text(), /超时/)
  assert.equal(cancelled, true)
})

test('heartbeats do not extend the whole-turn deadline indefinitely', async context => {
  setBudget(context, 'CHAT_PROXY_TIMEOUT_MS', '50')
  setBudget(context, 'CHAT_PROXY_IDLE_TIMEOUT_MS', '40')
  let interval: ReturnType<typeof setInterval>
  let cancelled = false
  context.mock.method(globalThis, 'fetch', async () => new Response(new ReadableStream({
    start(controller) { interval = setInterval(() => controller.enqueue(new TextEncoder().encode(': keep-alive\n\n')), 5) },
    cancel() { cancelled = true; clearInterval(interval) },
  }), { headers: { 'Content-Type': 'text/event-stream' } }))
  context.after(() => clearInterval(interval))
  const response = await POST(request())
  await assert.rejects(response.text(), /超时/)
  assert.equal(cancelled, true)
})
