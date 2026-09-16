import assert from 'node:assert/strict'
import test from 'node:test'
import { createHmac } from 'node:crypto'
import { createVisitorAccess, verifyUnlockProof, verifyVisitorAccess } from '../src/lib/server/visitor-access'

const secret = 'unit-test-secret-' + 'x'.repeat(40)
process.env.INTERNAL_API_TOKEN = secret
const identity = { username: 'beibei', name: '贝贝', apps: ['our-space', 'guest-book'] }

test('visitor access cookies carry identity and grants, and cannot be forged', () => {
  const now = 1_700_000_000
  const cookie = createVisitorAccess(identity, now)
  assert.deepEqual(verifyVisitorAccess(cookie, now + 1), identity)
  assert.equal(verifyVisitorAccess(cookie.slice(0, -1) + (cookie.endsWith('0') ? '1' : '0'), now + 1), null)
  assert.equal(verifyVisitorAccess(cookie, now + 30 * 86400 + 1), null)
  assert.equal(verifyVisitorAccess(undefined, now), null)
  assert.equal(verifyVisitorAccess('v1.1.2.3', now), null)
  // The old v1/v2 shapes must not be accepted any more.
  assert.equal(verifyVisitorAccess(`v2.${now + 100}.YmVpYmVp.${'a'.repeat(48)}.${'b'.repeat(64)}`, now), null)
})

test('grants and identity are signed, so a visitor cannot add an app or rename themselves', () => {
  const now = 1_700_000_000
  const cookie = createVisitorAccess(identity, now)
  const [, expires, encodedUsername, encodedName, apps, nonce, signature] = cookie.split('.')
  assert.equal(apps, 'our-space,guest-book')
  const grants = `${expires}.${encodedUsername}.${encodedName}.our-space,guest-book,admin-app.${nonce}`
  const tampered = `v3.${grants}.${signature}`
  assert.equal(verifyVisitorAccess(tampered, now), null)
  const renamed = `v3.${expires}.${encodedUsername}.${Buffer.from('MARCUS', 'utf8').toString('base64url')}.${apps}.${nonce}.${signature}`
  assert.equal(verifyVisitorAccess(renamed, now), null)
  // A visitor with no grants still round-trips.
  assert.deepEqual(verifyVisitorAccess(createVisitorAccess({ username: 'guest', name: '访客', apps: [] }, now), now + 1),
    { username: 'guest', name: '访客', apps: [] })
})

test('visitor access requires the shared server secret and stays a v3 payload', () => {
  const previous = process.env.INTERNAL_API_TOKEN
  process.env.INTERNAL_API_TOKEN = 'short'
  try {
    assert.equal(verifyVisitorAccess(createVisitorAccess(identity)), null)
  } finally { process.env.INTERNAL_API_TOKEN = previous }
  assert.match(createVisitorAccess(identity), /^v3\.\d{10}\.[A-Za-z0-9_-]+\.([A-Za-z0-9_-]+)\.[a-z0-9,-]*\.([a-f0-9]{48})\.([a-f0-9]{64})$/)
})

test('visitor unlock proof is bound to the current chat session and expires', () => {
  const nonce = 'a'.repeat(48)
  const now = 1_700_000_000
  const expires = now + 120
  const payload = `v1.${nonce}.${expires}`
  const signature = createHmac('sha256', secret).update(`visitor-unlock:${payload}`).digest('hex')
  const proof = `${payload}.${signature}`
  assert.equal(verifyUnlockProof(proof, nonce, now + 1), true)
  assert.equal(verifyUnlockProof(proof, 'b'.repeat(48), now + 1), false)
  assert.equal(verifyUnlockProof(proof, nonce, expires + 1), false)
  // The old easter-egg purpose must not be accepted any more.
  const legacy = `${payload}.${createHmac('sha256', secret).update(`relationship-unlock:${payload}`).digest('hex')}`
  assert.equal(verifyUnlockProof(legacy, nonce, now + 1), false)
  assert.equal(verifyUnlockProof(123, nonce, now + 1), false)
})
