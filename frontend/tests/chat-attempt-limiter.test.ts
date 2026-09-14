import assert from 'node:assert/strict'
import test, { type TestContext } from 'node:test'
import { createHmac } from 'node:crypto'
import { NextRequest } from 'next/server'
import { ChatAttemptLimiter } from '../src/lib/server/chat-attempt-limiter'
import { createChatSession, SESSION_COOKIE } from '../src/lib/server/chat-security'
import { POST } from '../src/app/api/chat/route'
import { GET } from '../src/app/api/chat/session/route'
import { POST as unlockRelationship } from '../src/app/api/chat/relationship-unlock/route'
import { RELATIONSHIP_COOKIE, verifyRelationshipAccess } from '../src/lib/server/relationship-security'

function protectedEnvironment(context: TestContext) {
  for (const [key, value] of Object.entries({ CHAT_PROTECTION: 'true', TRUST_CLOUDFLARE: 'true', INTERNAL_API_TOKEN: 'unit-test-' + 'x'.repeat(40), SITE_ORIGIN: 'https://neko.test' })) {
    const old = process.env[key]; process.env[key] = value
    context.after(() => { if (old === undefined) delete process.env[key]; else process.env[key] = old })
  }
}

test('bursts require a quiet cooldown and blocked attempts extend it', () => {
  let now = 0
  const limiter = new ChatAttemptLimiter({ limit: 3, windowMs: 10000, cooldownMs: 30000 }, () => now)
  for (let i = 0; i < 3; i++) assert.equal(limiter.take('client').allowed, true)
  assert.deepEqual(limiter.take('client'), { allowed: false, retryAfter: 30, capacity: false })
  now = 29000
  assert.equal(limiter.take('client').allowed, false)
  now = 58000
  assert.equal(limiter.take('other').allowed, true)
  now = 59000
  assert.equal(limiter.take('client').allowed, true)
})

test('rolling attempt windows do not allow double bursts around a clock boundary', () => {
  let now = 9999
  const limiter = new ChatAttemptLimiter({ limit: 3, windowMs: 10000, cooldownMs: 30000 }, () => now)
  for (let i = 0; i < 3; i++) assert.equal(limiter.take('client').allowed, true)
  now = 10000
  assert.equal(limiter.take('client').allowed, false)
})

test('identity state stays bounded without evicting active protection and stale entries expire', () => {
  let now = 0
  const limiter = new ChatAttemptLimiter({ limit: 3, windowMs: 10000, cooldownMs: 30000, maxKeys: 2 }, () => now)
  assert.equal(limiter.take('first').allowed, true)
  assert.equal(limiter.take('second').allowed, true)
  for (let i = 0; i < 1000; i++) assert.deepEqual(limiter.take(`new-${i}`), { allowed: false, retryAfter: 10, capacity: true })
  assert.equal(limiter.size, 2)
  assert.equal(limiter.take('first').allowed, true)
  now = 10000
  assert.equal(limiter.take('new').allowed, true)
  assert.equal(limiter.size, 1)
})

test('chat attempts with forged sessions count before body parsing or upstream fetch and cannot rotate their cookie or IPv6 suffix', async context => {
  protectedEnvironment(context)
  context.mock.method(globalThis, 'fetch', async () => { assert.fail('blocked traffic reached backend') })
  for (let i = 1; i <= 4; i++) {
    const session = createChatSession()!
    const incoming = new NextRequest('https://neko.test/api/chat?stream=true', {
      method: 'POST', headers: { origin: 'https://neko.test', 'cf-connecting-ip': `2001:db8:10:1::${i}`, 'x-forwarded-for': `192.0.2.${i}`,
        cookie: `${SESSION_COOKIE}=${session.cookie}`, 'x-neko-csrf': i === 4 ? session.token : 'forged', 'content-type': 'application/json' },
      body: '{"messages":[{"role":"user","content":"hello"}]}',
    })
    Object.defineProperty(incoming, 'body', { get() { assert.fail('rejected traffic parsed a body') } })
    const response = await POST(incoming)
    assert.equal(response.status, i === 4 ? 429 : 403)
    assert.ok(response.headers.get('x-request-id'))
    if (i === 4) {
      assert.equal(response.headers.get('retry-after'), '30')
      assert.equal((await response.json()).code, 'burst_limit')
    }
  }
})

test('session endpoint throttles cookie rotation and ignores forged forwarded identities', async context => {
  protectedEnvironment(context)
  for (let i = 1; i <= 13; i++) {
    const incoming = new NextRequest('https://neko.test/api/chat/session', { headers: {
      origin: 'https://neko.test', 'cf-connecting-ip': '192.0.2.80', 'x-forwarded-for': `192.0.2.${i}`, cookie: `${SESSION_COOKIE}=forged-${i}`,
    } })
    const response = await GET(incoming)
    assert.equal(response.status, i === 13 ? 429 : 200)
    if (i === 13) assert.equal(response.headers.get('retry-after'), '60')
  }
})

test('session endpoint retains signed cookies across tabs and fails closed without trusted ingress identity', async context => {
  protectedEnvironment(context)
  const session = createChatSession()!
  const response = await GET(new NextRequest('https://neko.test/api/chat/session', { headers: {
    origin: 'https://neko.test', 'cf-connecting-ip': '192.0.2.81', cookie: `${SESSION_COOKIE}=${session.cookie}`,
  } }))
  assert.equal(response.status, 200)
  assert.equal((await response.json()).token, session.token)
  assert.equal(response.cookies.get(SESSION_COOKIE)?.value, session.cookie)
  const denied = await GET(new NextRequest('https://neko.test/api/chat/session', { headers: { 'x-forwarded-for': '192.0.2.82' } }))
  assert.equal(denied.status, 403)
})

test('proxy forwards canonical IPv6 subnet identity to the backend', async context => {
  protectedEnvironment(context)
  const session = createChatSession()!
  context.mock.method(globalThis, 'fetch', async (_url: unknown, options: RequestInit) => {
    assert.equal(new Headers(options.headers).get('x-neko-client-ip'), '2001:db8:20:2::')
    return Response.json({ content: 'hello' })
  })
  const response = await POST(new NextRequest('https://neko.test/api/chat', { method: 'POST', headers: {
    origin: 'https://neko.test', 'cf-connecting-ip': '2001:0DB8:0020:0002:ABCD:1:2:3', cookie: `${SESSION_COOKIE}=${session.cookie}`, 'x-neko-csrf': session.token, 'content-type': 'application/json',
  }, body: '{"messages":[{"role":"user","content":"hello"}]}' }))
  assert.equal(response.status, 200)
  await response.text()
})

test('unlock endpoint counts forged sessions before parsing and rejects requests without trusted identity', async context => {
  protectedEnvironment(context)
  assert.equal((await unlockRelationship(new NextRequest('https://neko.test/api/chat/relationship-unlock', { method: 'POST' }))).status, 403)
  for (let i = 1; i <= 4; i++) {
    const incoming = new NextRequest('https://neko.test/api/chat/relationship-unlock', { method: 'POST', headers: {
      origin: 'https://neko.test', 'cf-connecting-ip': `2001:db8:30:3::${i}`, cookie: `${SESSION_COOKIE}=forged-${i}`,
    } })
    Object.defineProperty(incoming, 'body', { get() { assert.fail('rejected unlock attempt parsed a body') } })
    const response = await unlockRelationship(incoming)
    assert.equal(response.status, i === 4 ? 429 : 403)
    if (i === 4) assert.equal(response.headers.get('retry-after'), '30')
  }
})

test('unlock endpoint bounds upload bytes and total upload time', async context => {
  protectedEnvironment(context)
  context.mock.timers.enable({ apis: ['setTimeout'] })
  const session = createChatSession()!
  const headers = { origin: 'https://neko.test', 'cf-connecting-ip': '192.0.2.90', cookie: `${SESSION_COOKIE}=${session.cookie}`, 'x-neko-csrf': session.token, 'content-type': 'application/json' }
  const large = await unlockRelationship(new NextRequest('https://neko.test/api/chat/relationship-unlock', { method: 'POST', headers, body: 'x'.repeat(65537) }))
  assert.equal(large.status, 413)
  let cancelled = false
  const slow = unlockRelationship(new NextRequest('https://neko.test/api/chat/relationship-unlock', {
    method: 'POST', headers, body: new ReadableStream({ cancel() { cancelled = true } }), duplex: 'half',
  } as NonNullable<ConstructorParameters<typeof NextRequest>[1]>))
  context.mock.timers.tick(5000)
  assert.equal((await slow).status, 408)
  assert.equal(cancelled, true)
})

test('a valid session-bound proof unlocks independently of chat attempts', async context => {
  protectedEnvironment(context)
  const session = createChatSession()!
  const ip = '192.0.2.91'
  for (let i = 0; i < 4; i++) await POST(new NextRequest('https://neko.test/api/chat', { method: 'POST', headers: { 'cf-connecting-ip': ip } }))
  const payload = `v1.${session.token}.${Math.floor(Date.now() / 1000) + 120}`
  const signature = createHmac('sha256', process.env.INTERNAL_API_TOKEN!).update(`relationship-unlock:${payload}`).digest('hex')
  const response = await unlockRelationship(new NextRequest('https://neko.test/api/chat/relationship-unlock', { method: 'POST', headers: {
    origin: 'https://neko.test', 'cf-connecting-ip': ip, cookie: `${SESSION_COOKIE}=${session.cookie}`, 'x-neko-csrf': session.token, 'content-type': 'application/json',
  }, body: JSON.stringify({ proof: `${payload}.${signature}` }) }))
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { unlocked: true })
  assert.equal(verifyRelationshipAccess(response.headers.get('set-cookie')?.split(';')[0].slice(RELATIONSHIP_COOKIE.length + 1)), true)
})
