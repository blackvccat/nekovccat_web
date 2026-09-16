import assert from 'node:assert/strict'
import test, { type TestContext } from 'node:test'
import { NextRequest } from 'next/server'
import { POST } from '../src/app/api/chat/route'
import { POST as POST_LOGIN } from '../src/app/api/chat/visitor-login/route'
import { POST as POST_CHAT } from '../src/app/api/chat/route'
import { ChatAttemptLimiter, chatAttemptError } from '../src/lib/server/chat-attempt-limiter'
import { createChatSession, SESSION_COOKIE } from '../src/lib/server/chat-security'
import { createHmac } from 'node:crypto'

const TOKEN = 'unit-test-' + 'x'.repeat(40)

function env(context: TestContext, key: string, value: string) {
  const previous = process.env[key]; process.env[key] = value
  context.after(() => { if (previous === undefined) delete process.env[key]; else process.env[key] = previous })
}

test('the fourth attempt in the window is shed, and every rejection restarts the cooldown', () => {
  let now = 1_000_000
  const limiter = new ChatAttemptLimiter({ limit: 3, windowMs: 10_000, cooldownMs: 30_000 }, () => now)
  for (let index = 0; index < 3; index += 1) assert.deepEqual(limiter.take('a'), { allowed: true })
  assert.deepEqual(limiter.take('a'), { allowed: false, retryAfter: 30, capacity: false })
  // 冷却期里再打不会把等待时间缩短，而是重新开始 30 秒：这才是「越打越久不能打」。
  now += 5_000
  assert.deepEqual(limiter.take('a'), { allowed: false, retryAfter: 30, capacity: false })
  // 熬过冷却就放行，而且窗口里那三发早就滑出去了，不打折扣地恢复。
  now += 35_000
  assert.deepEqual(limiter.take('a'), { allowed: true })
  // 另一台机器有自己的桶：限流按身份算，不互相连累。
  assert.deepEqual(limiter.take('b'), { allowed: true })
})

test('a full identity table fails closed for newcomers instead of evicting active cooldowns', () => {
  let now = 1_000_000
  const limiter = new ChatAttemptLimiter({ limit: 1, windowMs: 10_000, cooldownMs: 30_000, maxKeys: 2 }, () => now)
  assert.deepEqual(limiter.take('a'), { allowed: true })
  assert.deepEqual(limiter.take('b'), { allowed: true })
  // 表满：新身份拿不到名额（503 语义），攻击者换身份也挤不掉正在冷却的老身份。
  const full = limiter.take('c')
  assert.equal(full.allowed, false)
  assert.equal(full.allowed === false && full.capacity, true)
  now += 60_000
  assert.deepEqual(limiter.take('c'), { allowed: true })
})

test('the limiter is inert in development and sheds a real 429 when guarded', async context => {
  env(context, 'CHAT_PROTECTION', 'true')
  env(context, 'INTERNAL_API_TOKEN', TOKEN)
  env(context, 'SITE_ORIGIN', 'https://marcus.test')
  env(context, 'TRUST_CLOUDFLARE', 'true')
  const session = createChatSession()!
  let calls = 0
  context.mock.method(globalThis, 'fetch', async () => { calls += 1; return Response.json({ message: 'ok' }) })
  const post = (ip: string) => POST(new NextRequest('https://marcus.test/api/chat?stream=true', {
    method: 'POST',
    headers: {
      'content-type': 'application/json', origin: 'https://marcus.test', 'cf-connecting-ip': ip,
      cookie: `${SESSION_COOKIE}=${session.cookie}`, 'x-marcus-csrf': session.token,
    },
    body: JSON.stringify({ messages: [{ role: 'user', content: '介绍本站' }] }),
  }))

  // 1 秒 8 次这一类：前三发进得去，第四发在读 body 与连后端之前就被挡掉。
  for (let index = 0; index < 3; index += 1) assert.equal((await post('203.0.113.9')).status, 200)
  const shed = await post('203.0.113.9')
  assert.equal(shed.status, 429)
  assert.equal(shed.headers.get('retry-after'), '30')
  assert.match(shed.headers.get('x-request-id') || '', /^[a-f0-9-]{36}$/, '被拒的请求也要能被日志对上')
  assert.equal(calls, 3, '被拒的那一发不能到达后端')

  // 换个地址照常：一个人被冷却不影响别人。
  assert.equal((await post('203.0.113.10')).status, 200)
  assert.equal(calls, 4)
})

test('untrusted deployments never key the limiter on a client-supplied header', async context => {
  env(context, 'CHAT_PROTECTION', 'true')
  env(context, 'INTERNAL_API_TOKEN', TOKEN)
  env(context, 'SITE_ORIGIN', 'https://marcus.test')
  env(context, 'TRUST_CLOUDFLARE', 'false')
  const session = createChatSession()!
  context.mock.method(globalThis, 'fetch', async () => Response.json({ message: 'ok' }))
  const call = (header: Record<string, string>) => POST(new NextRequest('https://marcus.test/api/chat', {
    method: 'POST',
    headers: {
      'content-type': 'application/json', origin: 'https://marcus.test',
      cookie: `${SESSION_COOKIE}=${session.cookie}`, 'x-marcus-csrf': session.token, ...header,
    },
    body: JSON.stringify({ messages: [{ role: 'user', content: '介绍本站' }] }),
  }))
  // 没开信任开关时身份固定成 local，客户端自己填的地址换不到新桶（更严，不会更松）。
  assert.equal((await call({ 'cf-connecting-ip': '198.51.100.1' })).status, 200)
  assert.equal((await call({ 'cf-connecting-ip': '198.51.100.2' })).status, 200)
  assert.equal((await call({ 'cf-connecting-ip': '198.51.100.3' })).status, 200)
  assert.equal((await call({ 'cf-connecting-ip': '198.51.100.4' })).status, 429)
})

test('chatAttemptError stays inert until the deployment is guarded', context => {
  env(context, 'CHAT_PROTECTION', 'true')
  assert.equal(chatAttemptError('203.0.113.200', 'chat'), null, '第一发永远放行')
  env(context, 'CHAT_PROTECTION', 'false')
  assert.equal(chatAttemptError('203.0.113.200', 'chat'), null, '开发环境这一层不生效')
})

test('the credential path has its own bucket, so chatting never blocks a login', async context => {
  env(context, 'CHAT_PROTECTION', 'true')
  env(context, 'INTERNAL_API_TOKEN', TOKEN)
  env(context, 'SITE_ORIGIN', 'https://marcus.test')
  env(context, 'TRUST_CLOUDFLARE', 'true')
  const session = createChatSession()!
  let calls = 0
  // 登录要真能成功（否则量到的是授权而不是限流）：proof 由后端签发，格式见 verifyUnlockProof。
  const proofFor = () => {
    const payload = `v1.${session.token}.${Math.floor(Date.now() / 1000) + 60}`
    return `${payload}.${createHmac('sha256', TOKEN).update(`visitor-unlock:${payload}`).digest('hex')}`
  }
  context.mock.method(globalThis, 'fetch', async () => {
    calls += 1
    return Response.json({ ok: true, name: 'Leo', username: 'leo', apps: [], proof: proofFor() })
  })
  const headers = {
    'content-type': 'application/json', origin: 'https://marcus.test', 'cf-connecting-ip': '203.0.113.31',
    cookie: `${SESSION_COOKIE}=${session.cookie}`, 'x-marcus-csrf': session.token,
  }
  const login = () => POST_LOGIN(new NextRequest('https://marcus.test/api/chat/visitor-login', {
    method: 'POST', headers, body: JSON.stringify({ username: 'leo', password: 'guess' }),
  }))
  const chat = () => POST_CHAT(new NextRequest('https://marcus.test/api/chat?stream=true', {
    method: 'POST', headers, body: JSON.stringify({ messages: [{ role: 'user', content: '你好' }] }),
  }))

  // 先把聊天的桶打满：它不该波及登录。
  for (let index = 0; index < 3; index += 1) assert.equal((await chat()).status, 200)
  assert.equal((await chat()).status, 429, '聊天的桶确实满了')
  assert.equal((await login()).status, 200, '聊天被限流不该连带登录')

  // 撞密码有自己的一把桶：10 秒内的第 4 次被挡，且不再往后端发。
  for (let index = 0; index < 2; index += 1) assert.equal((await login()).status, 200)
  const shed = await login()
  assert.equal(shed.status, 429)
  assert.equal(shed.headers.get('retry-after'), '30')
  assert.equal(calls, 6, '被挡下的登录尝试不能到达后端')
})

test('ten simultaneous sends become three upstream calls and seven shed ones', async context => {
  env(context, 'CHAT_PROTECTION', 'true')
  env(context, 'INTERNAL_API_TOKEN', TOKEN)
  env(context, 'SITE_ORIGIN', 'https://marcus.test')
  env(context, 'TRUST_CLOUDFLARE', 'true')
  const session = createChatSession()!
  let upstream = 0
  context.mock.method(globalThis, 'fetch', async () => {
    upstream += 1
    // 上游故意慢一点，模拟一轮真实生成：前端这一层不该因为慢就多放行。
    await new Promise(resolve => setTimeout(resolve, 30))
    return Response.json({ message: 'ok' })
  })
  const send = () => POST(new NextRequest('https://marcus.test/api/chat?stream=true', {
    method: 'POST',
    headers: {
      'content-type': 'application/json', origin: 'https://marcus.test', 'cf-connecting-ip': '203.0.113.44',
      cookie: `${SESSION_COOKIE}=${session.cookie}`, 'x-marcus-csrf': session.token,
    },
    body: JSON.stringify({ messages: [{ role: 'user', content: '你好' }] }),
  }))
  const responses = await Promise.all(Array.from({ length: 10 }, send))
  const codes = responses.map(response => response.status).sort()
  assert.deepEqual(codes, [200, 200, 200, 429, 429, 429, 429, 429, 429, 429])
  assert.equal(upstream, 3, '被挡下的七发不能到达后端（也就不会扣额度、不会占后端并发）')
  // 被拒的回答带等待时间，界面可以直接照着显示。
  const shed = responses.find(response => response.status === 429)!
  assert.equal(shed.headers.get('retry-after'), '30')
  assert.equal((await shed.json()).code, 'burst_limit')
})
