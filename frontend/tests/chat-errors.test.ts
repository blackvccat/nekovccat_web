import assert from 'node:assert/strict'
import test from 'node:test'
import { responseErrorText, retryAfterSeconds, waitText } from '../src/lib/api/chat-errors'

const NOW = Date.parse('2026-09-10T00:00:00Z')

test('Retry-After accepts seconds and HTTP dates, and refuses everything else', () => {
  assert.equal(retryAfterSeconds('42', NOW), 42)
  assert.equal(retryAfterSeconds('Thu, 10 Sep 2026 00:00:30 GMT', NOW), 30)
  for (const value of [null, '', '0', '-1', '1.5', 'Infinity', 'garbage', 'Thu, 10 Sep 2026 00:00:00 GMT']) {
    assert.equal(retryAfterSeconds(value, NOW), null, String(value))
  }
})

test('the wait is spelled in the unit a person would use', () => {
  assert.equal(waitText(30), '30 秒')
  assert.equal(waitText(90), '2 分钟')
  assert.equal(waitText(7200), '2 小时')
})

test('a quota rejection tells the user how long to wait instead of inviting a retry', async () => {
  const response = Response.json({ detail: '免费额度已用完，登录访客模式可以继续。' },
    { status: 429, headers: { 'Retry-After': '90' } })
  assert.equal(await responseErrorText(response, '聊天服务暂不可用（HTTP 429）'),
    '免费额度已用完，登录访客模式可以继续。 请等待 2 分钟后再试，期间请勿重复发送。')
})

test('only quota statuses add a wait, and non-JSON bodies keep the readable fallback', async () => {
  const tooLarge = Response.json({ error: '消息太长' }, { status: 413, headers: { 'Retry-After': '5' } })
  assert.equal(await responseErrorText(tooLarge, 'fallback'), '消息太长')
  assert.equal(await responseErrorText(new Response('<html>502</html>', { status: 502 }), '聊天服务暂不可用（HTTP 502）'),
    '聊天服务暂不可用（HTTP 502）')
  const noHeader = Response.json({ message: '当前请求较多，请稍后再试。' }, { status: 503 })
  assert.equal(await responseErrorText(noHeader, 'fallback'), '当前请求较多，请稍后再试。')
})
