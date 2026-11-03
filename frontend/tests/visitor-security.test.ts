import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import test from 'node:test'
import { createVisitorAccess, verifyVisitorAccess, verifyVisitorProof } from '../src/lib/server/visitor-security'

process.env.INTERNAL_API_TOKEN = 'visitor-test-token-' + 'x'.repeat(40)

test('visitor access cookies are username-bound, signed and expire', () => {
  const now = 1_700_000_000
  const cookie = createVisitorAccess('demo-visitor', now)
  assert.equal(verifyVisitorAccess(cookie, now + 10), 'demo-visitor')
  assert.equal(verifyVisitorAccess(cookie, now + 31 * 86400), null)
  assert.equal(verifyVisitorAccess(cookie + 'x', now), null)
  assert.equal(verifyVisitorAccess(undefined, now), null)
})

test('visitor proof is bound to the browser nonce and short expiry', () => {
  const nonce = 'a'.repeat(48)
  const now = 1_700_000_000
  const payload = `v1.${nonce}.${now + 120}`
  const signature = createHmac('sha256', process.env.INTERNAL_API_TOKEN || '')
    .update(`visitor-unlock:${payload}`).digest('hex')
  assert.equal(verifyVisitorProof(`${payload}.${signature}`, nonce, now), true)
  assert.equal(verifyVisitorProof(`${payload}.${signature}`, 'b'.repeat(48), now), false)
  assert.equal(verifyVisitorProof(`${payload}.${signature}`, nonce, now + 121), false)
  assert.equal(verifyVisitorProof(`${payload}.${'0'.repeat(64)}`, nonce, now), false)
})
