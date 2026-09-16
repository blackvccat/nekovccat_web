import assert from 'node:assert/strict'
import test from 'node:test'
import { webcrypto } from 'node:crypto'
import { createClientId } from '../src/lib/client-id'

test('HTTP LAN crypto without randomUUID generates distinct valid UUIDv4 IDs without throwing', context => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'crypto')
  context.after(() => {
    if (original) Object.defineProperty(globalThis, 'crypto', original)
    else Reflect.deleteProperty(globalThis, 'crypto')
  })
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: { getRandomValues: webcrypto.getRandomValues.bind(webcrypto) },
  })
  assert.equal(typeof globalThis.crypto.randomUUID, 'undefined')

  const ids = new Set<string>()
  assert.doesNotThrow(() => {
    for (let index = 0; index < 256; index++) {
      const id = createClientId()
      assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
      ids.add(id)
    }
  })
  assert.equal(ids.size, 256)
})

test('secure origins keep using the native randomUUID implementation', context => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'crypto')
  context.after(() => {
    if (original) Object.defineProperty(globalThis, 'crypto', original)
    else Reflect.deleteProperty(globalThis, 'crypto')
  })
  const expected = '56092272-84b6-4c56-a1b4-6168b9fd806c'
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: {
      randomUUID: () => expected,
      getRandomValues: () => assert.fail('Native UUID support should be preferred'),
    },
  })
  assert.equal(createClientId(), expected)
})
