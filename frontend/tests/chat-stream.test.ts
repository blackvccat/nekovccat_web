import assert from 'node:assert/strict'
import test from 'node:test'
import { consumeChatStream, type ChatToolEvent, type ChatDesktopEvent } from '../src/lib/api/chat-stream'

const encoder = new TextEncoder()
function streamOf(chunks: Uint8Array[]) {
  return new ReadableStream<Uint8Array>({ start(controller) { chunks.forEach(chunk => controller.enqueue(chunk)); controller.close() } })
}
function bytes(text: string) { return encoder.encode(text) }
const unlockProof = `v1.${'a'.repeat(48)}.2000000000.${'b'.repeat(64)}`
const unlockFrame = JSON.stringify({ event: 'desktop', action: 'unlock-girlfriend', proof: unlockProof })

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

test('desktop unlock is delivered once, only after a complete nonempty reply at all byte boundaries', async () => {
  const payload = bytes(`data: {"content":"欢迎回到我们的小窝🐈"}\n\ndata: ${unlockFrame}\n\ndata: ${unlockFrame}\n\ndata: {"done":true}\n\n`)
  for (let split = 1; split < payload.length; split++) {
    const events: ChatDesktopEvent[] = []
    let text = ''
    await consumeChatStream(streamOf([payload.slice(0, split), payload.slice(split)]), {
      onContent: value => { text = value; assert.equal(events.length, 0) },
      onDesktop: event => { assert.equal(text, '欢迎回到我们的小窝🐈'); events.push(event) },
    })
    assert.deepEqual(events, [{ event: 'desktop', action: 'unlock-girlfriend', proof: unlockProof }])
  }
})

test('desktop action on an incomplete, failed, malformed or empty reply never unlocks', async () => {
  const action = 'data: {"event":"desktop","action":"unlock-girlfriend"}\n\n'
  const replies = [
    action,
    action + 'data: {"content":"欢迎"}\n\n',
    action + 'data: {"error":"请求失败","done":true}\n\n',
    action + 'data: broken\n\n',
    action + 'data: {"done":true}\n\n',
    action + 'data: {"content":"  ","done":true}\n\n',
    'data: {"event":"desktop","action":"run-shell"}\n\ndata: {"done":true}\n\n',
  ]
  for (const payload of replies) {
    let unlocks = 0
    await consumeChatStream(streamOf([bytes(payload)]), { onContent() {}, onDesktop() { unlocks++ } }).catch(() => {})
    assert.equal(unlocks, 0, payload)
  }
})

test('assistant prose and tool progress claiming success do not unlock the desktop', async () => {
  await consumeChatStream(streamOf([bytes('data: {"event":"tool","name":"girlfriend_mode","status":"completed"}\n\ndata: {"content":"女朋友模式已解锁 unlock-girlfriend","done":true}\n\n')]), {
    onContent() {}, onDesktop() { assert.fail('prose is not a desktop command') },
  })
})

test('cancel after a desktop action but before done discards the pending unlock', async () => {
  const controller = new AbortController()
  const stream = new ReadableStream<Uint8Array>({ start(streamController) {
    streamController.enqueue(bytes(`data: ${unlockFrame}\n\ndata: {"content":"欢迎"}\n\n`))
  } })
  await assert.rejects(consumeChatStream(stream, {
    onContent() { controller.abort() },
    onDesktop() { assert.fail('canceled request changed the desktop') },
  }, controller.signal), { name: 'AbortError' })
})
