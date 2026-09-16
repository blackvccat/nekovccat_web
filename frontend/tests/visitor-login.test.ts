import assert from 'node:assert/strict'
import test, { type TestContext } from 'node:test'
import { createHmac } from 'node:crypto'
import { NextRequest } from 'next/server'
import { POST } from '../src/app/api/chat/visitor-login/route'
import { GET as statusGet } from '../src/app/api/visitor/status/route'
import { GET as appGet } from '../src/app/api/visitor/app/route'
import { GET as assetGet } from '../src/app/api/visitor/asset/route'
import { createVisitorAccess } from '../src/lib/server/visitor-access'

const secret = 'unit-test-secret-' + 'x'.repeat(40)
const nonce = 'a'.repeat(48)

function env(context: TestContext, key: string, value: string) {
  const previous = process.env[key]
  process.env[key] = value
  context.after(() => { if (previous === undefined) delete process.env[key]; else process.env[key] = previous })
}

function proofFor(sessionNonce: string, purpose = 'visitor-unlock') {
  const payload = `v1.${sessionNonce}.${Math.floor(Date.now() / 1000) + 120}`
  return `${payload}.${createHmac('sha256', secret).update(`${purpose}:${payload}`).digest('hex')}`
}

function loginRequest(body: unknown) {
  return new NextRequest('http://localhost:3010/api/chat/visitor-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: `marcus-chat-session=${nonce}.${Date.now() + 3600_000}.${'b'.repeat(64)}` },
    body: JSON.stringify(body),
  })
}

function visitorRequest(url: string, identity = { username: 'beibei', name: '贝贝', apps: ['our-space'] }) {
  return new NextRequest(`http://localhost:3010${url}`, {
    headers: { cookie: `marcus-visitor-access=${createVisitorAccess(identity)}` },
  })
}

function useSecret(context: TestContext) {
  env(context, 'INTERNAL_API_TOKEN', secret)
  env(context, 'PYTHON_API_URL', 'http://backend.test')
}

test('a verified login stores identity and grants in the visitor cookie', async context => {
  useSecret(context)
  context.mock.method(globalThis, 'fetch', async (url: unknown, options: RequestInit) => {
    assert.equal(String(url), 'http://backend.test/api/visitor/login')
    const headers = options.headers as Record<string, string>
    assert.equal(headers['X-Marcus-Internal-Token'], secret)
    assert.equal(headers['X-Marcus-Client-IP'], 'local')
    assert.equal(headers['X-Marcus-Session-ID'], nonce)
    assert.deepEqual(JSON.parse(options.body as string), { username: 'beibei', password: 'correct horse' })
    return Response.json({ ok: true, name: '贝贝', username: 'beibei', apps: ['our-space', 'guest-book'], proof: proofFor(nonce) })
  })
  const response = await POST(loginRequest({ username: 'beibei', password: 'correct horse' }))
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { unlocked: true, name: '贝贝', username: 'beibei', apps: ['our-space', 'guest-book'] })
  const cookie = response.headers.get('set-cookie') || ''
  assert.match(cookie, /marcus-visitor-access=v3\./)
  assert.match(cookie, /HttpOnly/i)
  assert.match(cookie, /SameSite=Strict/i)
})

test('a proof for another session or a payload without identity never becomes a cookie', async context => {
  useSecret(context)
  const replies = [
    { ok: true, name: '贝贝', username: 'beibei', apps: [], proof: proofFor('c'.repeat(48)) },
    { ok: true, name: '贝贝', username: 'beibei', apps: [], proof: proofFor(nonce, 'relationship-unlock') },
    { ok: true, name: '贝贝', username: '', apps: [], proof: proofFor(nonce) },
    { ok: true, name: '', username: 'beibei', apps: [], proof: proofFor(nonce) },
    { ok: false, name: '贝贝', username: 'beibei', apps: [], proof: proofFor(nonce) },
  ]
  for (const reply of replies) {
    context.mock.method(globalThis, 'fetch', async () => Response.json(reply))
    const response = await POST(loginRequest({ username: 'beibei', password: 'correct horse' }))
    assert.equal(response.status, 502, JSON.stringify(reply))
    assert.equal(response.headers.get('set-cookie'), null)
  }
})

test('backend rejections keep their status, wording and no cookie', async context => {
  useSecret(context)
  context.mock.method(globalThis, 'fetch', async () => Response.json({ detail: '访客名或密码不正确。' }, { status: 401 }))
  const rejected = await POST(loginRequest({ username: 'beibei', password: 'wrong' }))
  assert.equal(rejected.status, 401)
  assert.deepEqual(await rejected.json(), { error: '访客名或密码不正确。' })
  assert.equal(rejected.headers.get('set-cookie'), null)

  context.mock.method(globalThis, 'fetch', async () => Response.json({ detail: '尝试次数过多，请稍后再试。' }, { status: 429, headers: { 'Retry-After': '600' } }))
  const locked = await POST(loginRequest({ username: 'beibei', password: 'wrong' }))
  assert.equal(locked.status, 429)
  assert.equal(locked.headers.get('retry-after'), '600')
})

test('malformed bodies and backend outages fail closed without contacting the backend', async context => {
  useSecret(context)
  let calls = 0
  context.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json({ ok: true, name: 'x', username: 'x', apps: [], proof: proofFor(nonce) }) })
  for (const body of [{}, { username: 'beibei' }, { password: 'x' }, { username: '', password: 'x' },
    { username: 'u'.repeat(65), password: 'x' }, { username: 'beibei', password: 'p'.repeat(201) },
    { username: 'beibei', password: 'x', admin: true }, { username: 'beibei', password: 'x', name: '贝贝' }]) {
    assert.equal((await POST(loginRequest(body))).status, 422, JSON.stringify(body))
  }
  assert.equal(calls, 0)

  context.mock.method(globalThis, 'fetch', async () => { throw new Error('backend down') })
  const down = await POST(loginRequest({ username: 'beibei', password: 'x' }))
  assert.equal(down.status, 503)
  assert.equal(down.headers.get('set-cookie'), null)
})

test('status returns identity and the granted app metadata, or a locked shape', async context => {
  useSecret(context)
  context.mock.method(globalThis, 'fetch', async (url: unknown, options: RequestInit) => {
    assert.equal(String(url), 'http://backend.test/api/visitor/apps')
    assert.equal((options.headers as Record<string, string>)['X-Marcus-Visitor'], 'beibei')
    return Response.json({ name: '贝贝', apps: [{ id: 'our-space', title: '我们的小屋', subtitle: '', watermark: '', hasIcon: false, hasWallpaper: true }] })
  })
  const unlocked = await statusGet(visitorRequest('/api/visitor/status'))
  assert.equal(unlocked.status, 200)
  assert.deepEqual(await unlocked.json(), {
    unlocked: true, name: '贝贝', username: 'beibei',
    apps: [{ id: 'our-space', title: '我们的小屋', subtitle: '', watermark: '', hasIcon: false, hasWallpaper: true }],
  })
  const locked = await statusGet(new NextRequest('http://localhost:3010/api/visitor/status'))
  assert.deepEqual(await locked.json(), { unlocked: false, name: null, username: null, apps: [] })
})

test('status refreshes a cookie whose grants fell behind the backend', async context => {
  useSecret(context)
  const app = (id: string, title: string) => ({ id, title, subtitle: '', watermark: '', hasIcon: true, hasWallpaper: false })
  // 登录之后又给这位访客开了新应用：后端返回的列表比 Cookie 里多一个，Cookie 要跟着更新，
  // 否则这次会话会一直拿旧列表把新应用挡在门外（图标和应用接口都会 403）。
  context.mock.method(globalThis, 'fetch', async () => Response.json({ name: '贝贝', apps: [app('our-space', 'Ourspace'), app('files', 'Files')] }))
  const refreshed = await statusGet(visitorRequest('/api/visitor/status'))
  const cookie = refreshed.headers.get('set-cookie') ?? ''
  assert.match(cookie, /marcus-visitor-access=/)
  assert.match(decodeURIComponent(cookie), /our-space,files/)
  assert.match(cookie, /HttpOnly/)

  // 授权没变时不要白写一次 Cookie。
  context.mock.method(globalThis, 'fetch', async () => Response.json({ name: '贝贝', apps: [app('our-space', 'Ourspace')] }))
  assert.equal((await statusGet(visitorRequest('/api/visitor/status'))).headers.get('set-cookie'), null)
})

test('app views only load for granted apps and only after login', async context => {
  useSecret(context)
  context.mock.method(globalThis, 'fetch', async (url: unknown, options: RequestInit) => {
    assert.equal(String(url), 'http://backend.test/api/visitor/apps/our-space')
    assert.equal((options.headers as Record<string, string>)['X-Marcus-Visitor'], 'beibei')
    return Response.json({ app: { id: 'our-space', title: '我们的小屋' }, view: [{ type: 'text', title: null, lines: ['hi'] }] })
  })
  const view = await appGet(visitorRequest('/api/visitor/app?app=our-space'))
  assert.equal(view.status, 200)
  assert.deepEqual(await view.json(), { app: { id: 'our-space', title: '我们的小屋' }, view: [{ type: 'text', title: null, lines: ['hi'] }] })
  // Not logged in, or an app this visitor was not granted, never reaches the backend.
  let calls = 0
  context.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json({}) })
  assert.equal((await appGet(new NextRequest('http://localhost:3010/api/visitor/app?app=our-space'))).status, 403)
  assert.equal((await appGet(visitorRequest('/api/visitor/app?app=secret-app'))).status, 403)
  assert.equal((await appGet(visitorRequest('/api/visitor/app?app=../../etc/passwd'))).status, 403)
  assert.equal(calls, 0)
})

test('private assets stream only for granted apps', async context => {
  useSecret(context)
  context.mock.method(globalThis, 'fetch', async (url: unknown) => {
    assert.equal(String(url), 'http://backend.test/api/visitor/apps/our-space/assets/wallpaper')
    return new Response(new Uint8Array([1, 2, 3]), { headers: { 'Content-Type': 'image/webp' } })
  })
  const asset = await assetGet(visitorRequest('/api/visitor/asset?app=our-space&kind=wallpaper'))
  assert.equal(asset.status, 200)
  assert.equal(asset.headers.get('content-type'), 'image/webp')
  assert.deepEqual([...new Uint8Array(await asset.arrayBuffer())], [1, 2, 3])
  let calls = 0
  context.mock.method(globalThis, 'fetch', async () => { calls++; return new Response(null) })
  assert.equal((await assetGet(visitorRequest('/api/visitor/asset?app=other&kind=wallpaper'))).status, 403)
  assert.equal((await assetGet(visitorRequest('/api/visitor/asset?app=our-space&kind=exe'))).status, 403)
  assert.equal((await assetGet(new NextRequest('http://localhost:3010/api/visitor/asset?app=our-space&kind=wallpaper'))).status, 403)
  assert.equal(calls, 0)
})
