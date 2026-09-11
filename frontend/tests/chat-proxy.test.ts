import assert from 'node:assert/strict'
import test from 'node:test'
import { NextRequest } from 'next/server'
import { POST } from '../src/app/api/chat/route'

function request(signal?: AbortSignal) {
  return new NextRequest('http://localhost:3010/api/chat?stream=true', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: '介绍本站' }] }), signal,
  })
}

test('proxy preserves SSE bytes and carries browser cancellation to the backend', async context => {
  const incoming = request()
  const stream = 'data: {"event":"tool","name":"site_info","status":"started"}\n\ndata: {"content":"你好","done":true}\n\n'
  context.mock.method(globalThis, 'fetch', async (_url: unknown, options: RequestInit) => {
    assert.equal(options.signal, incoming.signal)
    assert.equal(options.cache, 'no-store')
    assert.deepEqual(JSON.parse(options.body as string), { messages: [{ role: 'user', content: '介绍本站' }] })
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } })
  })
  const response = await POST(incoming)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('x-accel-buffering'), 'no')
  assert.match(response.headers.get('cache-control') || '', /no-transform/)
  assert.equal(await response.text(), stream)
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
