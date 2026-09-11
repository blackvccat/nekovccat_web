import assert from 'node:assert/strict'
import test from 'node:test'
import { getChatApiUrl, getHealthApiUrl } from '../src/lib/api/client'

test('production requests stay on the deployed origin unless an external API is configured', () => {
  const previousApi = process.env.NEXT_PUBLIC_API_URL
  const previousMode = process.env.NODE_ENV
  try {
    Object.assign(process.env, { NODE_ENV: 'production' })
    for (const value of [undefined, '', '   ']) {
      if (value === undefined) delete process.env.NEXT_PUBLIC_API_URL
      else process.env.NEXT_PUBLIC_API_URL = value
      assert.equal(getChatApiUrl(), '/api/chat')
      assert.equal(getChatApiUrl(true), '/api/chat?stream=true')
      assert.equal(getHealthApiUrl(), '/api/health')
    }
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com/'
    assert.equal(getChatApiUrl(), 'https://api.example.com/api/chat/')
    assert.equal(getChatApiUrl(true), 'https://api.example.com/api/chat/?stream=true')
    assert.equal(getHealthApiUrl(), 'https://api.example.com/api/health')
  } finally {
    if (previousApi === undefined) delete process.env.NEXT_PUBLIC_API_URL
    else process.env.NEXT_PUBLIC_API_URL = previousApi
    if (previousMode === undefined) Reflect.deleteProperty(process.env, 'NODE_ENV')
    else Object.assign(process.env, { NODE_ENV: previousMode })
  }
})
