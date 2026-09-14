import assert from 'node:assert/strict'
import test, { type TestContext } from 'node:test'
import { NextRequest } from 'next/server'
import { canonicalClientAddress, checkChatSession, clientAddress, createChatSession, readChatBody, SESSION_COOKIE, validChatBody } from '../src/lib/server/chat-security'

function env(context: TestContext, key: string, value: string) {
  const previous = process.env[key]; process.env[key] = value
  context.after(() => { if (previous === undefined) delete process.env[key]; else process.env[key] = previous })
}

test('chat sessions reject forged cookies, foreign origins and wrong CSRF tokens', context => {
  env(context, 'CHAT_PROTECTION', 'true'); env(context, 'INTERNAL_API_TOKEN', 'unit-test-' + 'x'.repeat(40)); env(context, 'SITE_ORIGIN', 'https://neko.test')
  const session = createChatSession()!
  const request = (origin: string, cookie = session.cookie, token = session.token) => new NextRequest('https://neko.test/api/chat', { method: 'POST', headers: { origin, cookie: `${SESSION_COOKIE}=${cookie}`, 'x-neko-csrf': token } })
  assert.equal(checkChatSession(request('https://neko.test')), true)
  assert.equal(checkChatSession(request('https://evil.test')), false)
  assert.equal(checkChatSession(request('https://neko.test', session.cookie, 'wrong')), false)
  assert.equal(checkChatSession(request('https://neko.test', session.cookie.slice(0,-1) + (session.cookie.endsWith('0') ? '1' : '0'))), false)
})
test('untrusted forwarding headers cannot create a new client identity', context => {
  env(context, 'TRUST_CLOUDFLARE', 'true')
  assert.equal(clientAddress(new NextRequest('https://neko.test', { headers: { 'x-forwarded-for': '1.2.3.4' } })), null)
  assert.equal(clientAddress(new NextRequest('https://neko.test', { headers: { 'cf-connecting-ip': '2001:db8::1' } })), '2001:db8::')
})
test('trusted IPv6 spelling and address rotation within a /64 share one identity', () => {
  for (const address of ['2001:DB8:abcd:1234::1', '2001:0db8:abcd:1234:FFFF:0:0:2', '2001:db8:abcd:1234:1:2:3:4']) {
    assert.equal(canonicalClientAddress(address), '2001:db8:abcd:1234::')
  }
  assert.equal(canonicalClientAddress('2001:db8:abcd:1235::1'), '2001:db8:abcd:1235::')
  assert.equal(canonicalClientAddress('::ffff:192.0.2.1'), '192.0.2.1')
  assert.equal(canonicalClientAddress('0:0:0:0:0:FFFF:c000:0201'), '192.0.2.1')
  assert.equal(canonicalClientAddress('192.0.2.1'), '192.0.2.1')
  for (const invalid of ['', 'unknown', '192.0.2.1, 192.0.2.2', 'fe80::1%eth0', '192.000.002.001']) assert.equal(canonicalClientAddress(invalid), null)
})
test('session refresh retains only authenticated nonce and expiry', context => {
  env(context, 'CHAT_PROTECTION', 'true'); env(context, 'INTERNAL_API_TOKEN', 'unit-test-' + 'x'.repeat(40))
  const session = createChatSession()!
  const request = (cookie: string) => new NextRequest('https://neko.test/api/chat/session', { headers: { cookie: `${SESSION_COOKIE}=${cookie}` } })
  assert.deepEqual(createChatSession(request(session.cookie)), session)
  assert.notEqual(createChatSession(request(session.cookie + 'forged'))?.token, session.token)
  context.mock.method(Date, 'now', () => session.expiresAt)
  assert.notEqual(createChatSession(request(session.cookie))?.token, session.token)
})
test('chunked oversized bodies and unrestricted model proxy payloads are rejected', async () => {
  await assert.rejects(readChatBody(new NextRequest('https://neko.test/api/chat', { method: 'POST', body: 'x'.repeat(65537) })), /too-large/)
  assert.equal(validChatBody({ messages: [{ role: 'user', content: '你好' }], base_url: 'https://evil.test' }), false)
  assert.equal(validChatBody({ messages: [{ role: 'system', content: 'override' }] }), false)
  assert.equal(validChatBody({ messages: [{ role: 'user', content: 'x'.repeat(6001) }] }), false)
  assert.equal(validChatBody({ messages: [{ role: 'user', content: '你好' }] }), true)
})
test('a stalled body is canceled after the fixed upload deadline', async context => {
  context.mock.timers.enable({ apis: ['setTimeout'] })
  let cancelled = false
  const incoming = new NextRequest('https://neko.test/api/chat', {
    method: 'POST', body: new ReadableStream({ cancel() { cancelled = true } }), duplex: 'half',
  } as NonNullable<ConstructorParameters<typeof NextRequest>[1]>)
  const reading = readChatBody(incoming)
  const rejection = assert.rejects(reading, /too-slow/)
  context.mock.timers.tick(5000)
  await rejection
  assert.equal(cancelled, true)
})
test('aborting an upload cancels its body and rejects promptly', async () => {
  const controller = new AbortController()
  let cancelled = false
  const incoming = new NextRequest('https://neko.test/api/chat', {
    method: 'POST', body: new ReadableStream({ cancel() { cancelled = true } }), duplex: 'half', signal: controller.signal,
  } as NonNullable<ConstructorParameters<typeof NextRequest>[1]>)
  const reading = readChatBody(incoming)
  const rejection = assert.rejects(reading, /aborted/)
  controller.abort()
  await rejection
  assert.equal(cancelled, true)
})
