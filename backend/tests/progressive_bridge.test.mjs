import assert from 'node:assert/strict'
import test from 'node:test'
import { publicFrame, apply } from '../app/services/progressive_bridge.mjs'

test('bridge only exposes text and fixed reasoning markers from real attempt frames', () => {
  const base = { type: 'chunk', attemptId: 'owned:1', index: 0 }
  assert.deepEqual(publicFrame({ ...base, chunk: { type: 'reasoning-delta', text: 'PRIVATE_THINKING' } }), {
    type: 'analyzing', attemptId: 'owned:1', index: 0,
  })
  assert.deepEqual(publicFrame({ ...base, chunk: { type: 'text-delta', text: 'hello' } }), {
    type: 'text', attemptId: 'owned:1', index: 0, text: 'hello',
  })
  assert.equal(publicFrame({ ...base, chunk: { type: 'tool-call-delta', argumentsDelta: 'PRIVATE_ARGS' } }), null)
  assert.equal(publicFrame({ ...base, chunk: { type: 'finish', reason: { diagnostic: 'PRIVATE_ERROR' } } }), null)
})

test('legacy runtime does not install the bridge or write extra notifications', () => {
  const original = process.env.NEKO_PROGRESSIVE_STREAM
  delete process.env.NEKO_PROGRESSIVE_STREAM
  try { apply({ on() { assert.fail('legacy requests cannot subscribe to live frames') } }) }
  finally { if (original !== undefined) process.env.NEKO_PROGRESSIVE_STREAM = original }
})
