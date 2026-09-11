import assert from 'node:assert/strict'
import test, { type TestContext } from 'node:test'
import { NextRequest } from 'next/server'
import { checkChatSession, clientAddress, createChatSession, readChatBody, SESSION_COOKIE, validChatBody } from '../src/lib/server/chat-security'

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
  assert.equal(clientAddress(new NextRequest('https://neko.test', { headers: { 'cf-connecting-ip': '2001:db8::1' } })), '2001:db8::1')
})
test('chunked oversized bodies and unrestricted model proxy payloads are rejected', async () => {
  await assert.rejects(readChatBody(new NextRequest('https://neko.test/api/chat', { method: 'POST', body: 'x'.repeat(65537) })), /too-large/)
  assert.equal(validChatBody({ messages: [{ role: 'user', content: '你好' }], base_url: 'https://evil.test' }), false)
  assert.equal(validChatBody({ messages: [{ role: 'system', content: 'override' }] }), false)
  assert.equal(validChatBody({ messages: [{ role: 'user', content: 'x'.repeat(6001) }] }), false)
  assert.equal(validChatBody({ messages: [{ role: 'user', content: '你好' }] }), true)
})
