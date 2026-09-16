import assert from 'node:assert/strict'
import test, { type TestContext } from 'node:test'
import { NextRequest } from 'next/server'
import { canonicalClientAddress, checkChatSession, clientAddress, createChatSession, DEVICE_COOKIE, ensureDevice, readChatBody, readDevice, SESSION_COOKIE, validChatBody } from '../src/lib/server/chat-security'

function env(context: TestContext, key: string, value: string) {
  const previous = process.env[key]; process.env[key] = value
  context.after(() => { if (previous === undefined) delete process.env[key]; else process.env[key] = previous })
}

test('chat sessions reject forged cookies, foreign origins and wrong CSRF tokens', context => {
  env(context, 'CHAT_PROTECTION', 'true'); env(context, 'INTERNAL_API_TOKEN', 'unit-test-' + 'x'.repeat(40)); env(context, 'SITE_ORIGIN', 'https://marcus.test')
  const session = createChatSession()!
  const request = (origin: string, cookie = session.cookie, token = session.token) => new NextRequest('https://marcus.test/api/chat', { method: 'POST', headers: { origin, cookie: `${SESSION_COOKIE}=${cookie}`, 'x-marcus-csrf': token } })
  assert.equal(checkChatSession(request('https://marcus.test')), true)
  assert.equal(checkChatSession(request('https://evil.test')), false)
  assert.equal(checkChatSession(request('https://marcus.test', session.cookie, 'wrong')), false)
  assert.equal(checkChatSession(request('https://marcus.test', session.cookie.slice(0,-1) + (session.cookie.endsWith('0') ? '1' : '0'))), false)
})
test('untrusted forwarding headers cannot create a new client identity', context => {
  env(context, 'TRUST_CLOUDFLARE', 'true')
  assert.equal(clientAddress(new NextRequest('https://marcus.test', { headers: { 'x-forwarded-for': '1.2.3.4' } })), null)
  assert.equal(clientAddress(new NextRequest('https://marcus.test', { headers: { 'cf-connecting-ip': '2001:db8::1' } })), '2001:db8::')
})
test('one IPv6 /64 is one identity, and mapped IPv4 collapses back to IPv4', () => {
  // 同一 /64 里换后缀（隐私扩展地址）不能换到新桶，否则限额可以无限重置。
  assert.equal(canonicalClientAddress('2001:db8:abcd:1234::1'), '2001:db8:abcd:1234::')
  assert.equal(canonicalClientAddress('2001:DB8:ABCD:1234:0:0:0:9999'), '2001:db8:abcd:1234::')
  assert.equal(canonicalClientAddress('2001:db8:abcd:1234::ffff'), '2001:db8:abcd:1234::')
  // 别的 /64 是别人，不受影响。
  assert.equal(canonicalClientAddress('2001:db8:abcd:9999::1'), '2001:db8:abcd:9999::')
  // ::ffff:a.b.c.d 与 a.b.c.d 必须共用同一个桶，否则同一台机器有两套额度。
  assert.equal(canonicalClientAddress('::ffff:203.0.113.5'), '203.0.113.5')
  assert.equal(canonicalClientAddress('::FFFF:c633:6409'), '198.51.100.9')
  assert.equal(canonicalClientAddress('203.0.113.5'), '203.0.113.5')
  // 解析不了的一律返回 null（上层回 403），不能当成新桶或落进共享桶。
  for (const bad of ['not-an-ip', '1.2.3.4, 5.6.7.8', 'fe80::1%eth0', '192.000.002.001', '']) {
    assert.equal(canonicalClientAddress(bad), null, bad)
  }
})
test('a self-hosted reverse proxy supplies the client address through x-real-ip only', context => {
  env(context, 'TRUST_PROXY_IP', 'true')
  const withHeaders = (headers: Record<string, string>) => clientAddress(new NextRequest('https://marcus.test', { headers }))
  assert.equal(withHeaders({ 'x-real-ip': '203.0.113.7' }), '203.0.113.7')
  assert.equal(withHeaders({ 'x-real-ip': '2001:db8::1' }), '2001:db8::')
  // 代理没写这个头、或客户端自己塞了别的转发头时一律拒绝（聊天与登录会返回 403）。
  assert.equal(withHeaders({ 'x-forwarded-for': '1.2.3.4', 'x-real-ip': 'not-an-ip' }), null)
  assert.equal(withHeaders({}), null)
})
test('chunked oversized bodies and unrestricted model proxy payloads are rejected', async () => {
  await assert.rejects(readChatBody(new NextRequest('https://marcus.test/api/chat', { method: 'POST', body: 'x'.repeat(65537) })), /too-large/)
  assert.equal(validChatBody({ messages: [{ role: 'user', content: '你好' }], base_url: 'https://evil.test' }), false)
  assert.equal(validChatBody({ messages: [{ role: 'system', content: 'override' }] }), false)
  assert.equal(validChatBody({ messages: [{ role: 'user', content: 'x'.repeat(6001) }] }), false)
  assert.equal(validChatBody({ messages: [{ role: 'user', content: '你好' }] }), true)
})
test('device cookies are reused while their signature holds and reminted when it does not', context => {
  env(context, 'INTERNAL_API_TOKEN', 'unit-test-' + 'x'.repeat(40))
  const withCookie = (cookie?: string) => new NextRequest('https://marcus.test/api/chat', { headers: cookie ? { cookie } : {} })
  const first = ensureDevice(withCookie())
  // 每次发消息都会走到这个路由：值必须沿用，否则同一个人的额度永远攒不起来。
  assert.equal(ensureDevice(withCookie(`${DEVICE_COOKIE}=${first.cookie}`)).nonce, first.nonce)
  assert.equal(readDevice(withCookie(`${DEVICE_COOKIE}=${first.cookie}`)), first.nonce)
  // 改一个字符就作废：凭空造一个只会给自己换一个新桶，后端另有按地址的聚合上限兜底。
  const tampered = first.cookie.slice(0, -1) + (first.cookie.endsWith('0') ? '1' : '0')
  assert.equal(readDevice(withCookie(`${DEVICE_COOKIE}=${tampered}`)), null)
  assert.notEqual(ensureDevice(withCookie(`${DEVICE_COOKIE}=${tampered}`)).nonce, first.nonce)
  // 换掉共享密钥等于换掉签名，旧桶全部作废。
  env(context, 'INTERNAL_API_TOKEN', 'rotated-' + 'y'.repeat(40))
  assert.equal(readDevice(withCookie(`${DEVICE_COOKIE}=${first.cookie}`)), null)
})

/** readChatBody 只依赖三样东西：headers、body 的 reader、以及中止信号。
 *  直接给这三样，才能把「截止」与「浏览器走人」两条路测成确定的结果。 */
function fakeRequest(body: ReadableStream<Uint8Array> | null, signal?: AbortSignal) {
  return { headers: new Headers(), body, signal: signal ?? new AbortController().signal } as unknown as NextRequest
}

test('a body that stalls mid-upload fails on the read deadline instead of hanging forever', async context => {
  // 声明长度合法、却把 body 拖着慢慢发的客户端：不设截止就能一直占着这条连接。
  const stalled = new ReadableStream<Uint8Array>({ start() {} })
  context.mock.timers.enable({ apis: ['setTimeout'] })
  const pending = readChatBody(fakeRequest(stalled))
  context.mock.timers.tick(5000)
  await assert.rejects(pending, /too-slow/)
})

test('a browser that walks away mid-upload stops the body read at once', async () => {
  const controller = new AbortController()
  const stalled = new ReadableStream<Uint8Array>({ start() {} })
  const pending = readChatBody(fakeRequest(stalled, controller.signal))
  controller.abort()
  // 立刻收场，不等那 5 秒截止：断了就是断了，这一轮也不该记成服务端失败。
  await assert.rejects(pending, /aborted/)
})
