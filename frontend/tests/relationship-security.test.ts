import assert from 'node:assert/strict'
import test from 'node:test'
import { createHmac } from 'node:crypto'
import { createRelationshipAccess, verifyRelationshipAccess, verifyUnlockProof } from '../src/lib/server/relationship-security'

const secret = 'unit-test-secret-' + 'x'.repeat(40)
process.env.INTERNAL_API_TOKEN = secret

test('relationship access cannot be forged or extended', () => {
  const now = 1_700_000_000
  const access = createRelationshipAccess(now)
  assert.equal(verifyRelationshipAccess(access, now + 1), true)
  assert.equal(verifyRelationshipAccess(access.slice(0, -1) + (access.endsWith('0') ? '1' : '0'), now + 1), false)
  assert.equal(verifyRelationshipAccess(access, now + 30 * 86400 + 1), false)
})

test('unlock proof is bound to the current chat session and expires', () => {
  const nonce = 'a'.repeat(48)
  const now = 1_700_000_000
  const expires = now + 120
  const payload = `v1.${nonce}.${expires}`
  const signature = createHmac('sha256', secret).update(`relationship-unlock:${payload}`).digest('hex')
  const proof = `${payload}.${signature}`
  assert.equal(verifyUnlockProof(proof, nonce, now + 1), true)
  assert.equal(verifyUnlockProof(proof, 'b'.repeat(48), now + 1), false)
  assert.equal(verifyUnlockProof(proof, nonce, expires + 1), false)
})
