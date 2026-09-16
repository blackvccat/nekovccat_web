import assert from 'node:assert/strict'
import test from 'node:test'
import { createReplyBuffer } from '../src/lib/api/chat-reply-buffer'

function harness() {
  const frames: Array<() => void> = []
  const published: string[] = []
  const cancelled: number[] = []
  const buffer = createReplyBuffer(
    value => published.push(value),
    callback => { frames.push(callback); return frames.length },
    handle => { cancelled.push(handle) },
  )
  return { buffer, frames, published, cancelled, run: () => frames.shift()?.() }
}

test('streamed snapshots publish at most once per frame and identical text never re-renders', () => {
  const { buffer, published, run } = harness()
  buffer.push('你')
  buffer.push('你好')
  buffer.push('你好，')
  assert.deepEqual(published, [], '同一个动画帧里只排队')
  run()
  assert.deepEqual(published, ['你好，'])
  buffer.push('你好，世界')
  run()
  buffer.push('你好，世界')
  run()
  assert.deepEqual(published, ['你好，', '你好，世界'], '内容没变就不再渲染')
})

test('a final snapshot is published immediately instead of waiting for a frame', () => {
  const { buffer, published } = harness()
  buffer.push('半截')
  buffer.push('完整答复', true)
  assert.deepEqual(published, ['完整答复'])
})

test('dispose cancels the queued frame and drops pending text', () => {
  const { buffer, published, frames, cancelled } = harness()
  buffer.push('半截')
  buffer.dispose()
  assert.equal(frames.length, 1)
  assert.deepEqual(cancelled, [1], '排队中的帧要被取消')
  frames.forEach(frame => frame())
  assert.deepEqual(published, [])
  buffer.push('停止之后的内容')
  assert.deepEqual(published, [])
})

test('flush publishes the newest snapshot before the conversation is persisted', () => {
  const { buffer, published, run } = harness()
  buffer.push('第一段')
  run()
  buffer.push('第一段，第二段')
  buffer.flush()
  assert.deepEqual(published, ['第一段', '第一段，第二段'])
})
