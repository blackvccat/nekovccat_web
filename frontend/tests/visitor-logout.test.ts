import assert from 'node:assert/strict'
import test, { type TestContext } from 'node:test'
import { NextRequest } from 'next/server'
import { POST } from '../src/app/api/visitor/logout/route'

function env(context: TestContext, key: string, value: string) {
  const previous = process.env[key]
  process.env[key] = value
  context.after(() => { if (previous === undefined) delete process.env[key]; else process.env[key] = previous })
}

function request(origin: string, host = 'localhost:3010') {
  return new NextRequest(`http://${host}/api/visitor/logout`, {
    method: 'POST',
    headers: { origin, host, 'sec-fetch-site': 'same-origin', cookie: 'marcus-visitor-access=v2.1.2.3.4' },
  })
}

test('same-origin logout clears the visitor cookie', async context => {
  env(context, 'SITE_ORIGIN', 'https://marcus.test')
  const response = await POST(request('https://marcus.test', 'marcus.test'))
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { unlocked: false })
  assert.match(response.headers.get('set-cookie') || '', /marcus-visitor-access=;/)
  assert.match(response.headers.get('set-cookie') || '', /Max-Age=0/)
})

test('dev origins match by host and foreign sites are refused', async context => {
  // No SITE_ORIGIN in development: Next reports localhost while the browser uses 127.0.0.1.
  env(context, 'SITE_ORIGIN', '')
  assert.equal((await POST(request('http://127.0.0.1:3010', '127.0.0.1:3010'))).status, 200)
  assert.equal((await POST(request('https://evil.test', 'evil.test'))).status, 403)
  assert.equal((await POST(request('http://127.0.0.1:3010', '127.0.0.1:3010'))).status, 200)
  const crossSite = new NextRequest('http://127.0.0.1:3010/api/visitor/logout', {
    method: 'POST', headers: { origin: 'http://127.0.0.1:3010', 'sec-fetch-site': 'cross-site' },
  })
  assert.equal((await POST(crossSite)).status, 403)
  env(context, 'SITE_ORIGIN', 'https://marcus.test')
  // A configured SITE_ORIGIN keeps the strict comparison even when the host header matches.
  assert.equal((await POST(request('https://other.test', 'marcus.test'))).status, 403)
})
