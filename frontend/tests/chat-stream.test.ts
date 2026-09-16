import assert from 'node:assert/strict'
import test from 'node:test'
import { consumeChatStream, type ChatToolEvent } from '../src/lib/api/chat-stream'

const encoder = new TextEncoder()
function streamOf(chunks: Uint8Array[]) {
  return new ReadableStream<Uint8Array>({ start(controller) { chunks.forEach(chunk => controller.enqueue(chunk)); controller.close() } })
}
function bytes(text: string) { return encoder.encode(text) }

test('all byte boundaries preserve UTF-8, CRLF events, content and tool state', async () => {
  const payload = bytes(': heartbeat\r\n\r\ndata:{"event":"tool","name":"site_info","status":"started","message":"正在查询"}\r\n\r\ndata: {"content":"你好🐈","done":false}\r\n\r\ndata: {"content":"，世界。","done":true}\r\n\r\n')
  for (let split = 1; split < payload.length; split++) {
    const updates: string[] = []
    const tools: ChatToolEvent[] = []
    const result = await consumeChatStream(streamOf([payload.slice(0, split), payload.slice(split)]), { onContent: value => updates.push(value), onTool: event => tools.push(event) })
    assert.equal(result, '你好🐈，世界。', `split at byte ${split}`)
    assert.equal(updates.at(-1), result)
    assert.equal(tools[0]?.message, '正在查询')
    assert.equal(tools.length, 1)
  }
  assert.equal(await consumeChatStream(streamOf([...payload].map(byte => new Uint8Array([byte]))), { onContent() {} }), '你好🐈，世界。')
})

test('multiple data lines and several events in one chunk are valid SSE', async () => {
  const result = await consumeChatStream(streamOf([bytes('event: message\ndata: {"content":\ndata: "一行", "done": false}\n\ndata: {"content":"二行"}\n\ndata: {"done":true}\n\n')]), { onContent() {} })
  assert.equal(result, '一行二行')
})

test('EOF without done rejects while preserving already delivered text', async () => {
  const updates: string[] = []
  await assert.rejects(consumeChatStream(streamOf([bytes('data: {"content":"保留部分"}\n\n')]), { onContent: content => updates.push(content) }), /连接已中断/)
  assert.deepEqual(updates, ['保留部分'])
})

test('an unterminated done frame is not mistaken for success', async () => {
  await assert.rejects(consumeChatStream(streamOf([bytes('data: {"done":true}\n')]), { onContent() {} }), /连接已中断/)
})

test('stream errors remain errors even if they also carry done', async () => {
  await assert.rejects(consumeChatStream(streamOf([bytes('data: {"error":"模型暂不可用","done":true}\n\n')]), { onContent() {} }), /模型暂不可用/)
})

test('malformed completed JSON and truncated UTF-8 fail visibly', async () => {
  await assert.rejects(consumeChatStream(streamOf([bytes('data: {"content":\n\n')]), { onContent() {} }), /无法解析/)
  await assert.rejects(consumeChatStream(streamOf([new Uint8Array([0xe4, 0xbd])]), { onContent() {} }), TypeError)
})

test('done cancels a stream without waiting for the server to close its connection', async () => {
  let canceled = false
  const stream = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(bytes('data: {"content":"完成","done":true}\n\n')) }, cancel() { canceled = true } })
  assert.equal(await consumeChatStream(stream, { onContent() {} }), '完成')
  assert.equal(canceled, true)
  assert.equal(stream.locked, false)
})

test('abort interrupts a pending read and produces no late content callback', async () => {
  const controller = new AbortController()
  let canceled = false
  const stream = new ReadableStream<Uint8Array>({ cancel() { canceled = true } })
  const result = consumeChatStream(stream, { onContent() { assert.fail('a canceled request wrote content') } }, controller.signal)
  controller.abort()
  await assert.rejects(result, { name: 'AbortError' })
  assert.equal(canceled, true)
  assert.equal(stream.locked, false)
})

test('legacy desktop frames and unknown events are ignored, never executed', async () => {
  // The visitor login replaced the old in-chat unlock: nothing in the stream may drive the desktop.
  const legacy = `data: ${JSON.stringify({ event: 'desktop', action: 'unlock-girlfriend', proof: `v1.${'a'.repeat(48)}.2000000000.${'b'.repeat(64)}` })}\n\n`
  const payload = bytes(`${legacy}data: {"event":"tool","name":"girlfriend_mode","status":"completed"}\n\ndata: {"content":"已解锁访客模式 unlock-girlfriend","done":true}\n\n`)
  const tools: ChatToolEvent[] = []
  const result = await consumeChatStream(streamOf([payload]), { onContent() {}, onTool: event => tools.push(event) })
  assert.equal(result, '已解锁访客模式 unlock-girlfriend')
  assert.equal(tools.length, 1)
  for (const frame of ['data: {"event":"visitor","action":"unlock"}\n\ndata: {"done":true}\n\n', legacy + 'data: {"done":true}\n\n']) {
    assert.equal(await consumeChatStream(streamOf([bytes(frame)]), { onContent() {} }), '')
  }
})
