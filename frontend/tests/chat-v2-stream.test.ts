import assert from 'node:assert/strict'
import test from 'node:test'
import { consumeChatStream } from '../src/lib/api/chat-stream'

const encoder = new TextEncoder()
const line = (value: unknown) => `data: ${JSON.stringify(value)}\n\n`

/** Feed the bytes in small slices so the decoder has to survive split UTF-8 characters. */
function body(text: string, slice = 7) {
  const bytes = encoder.encode(text)
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (let index = 0; index < bytes.length; index += slice) controller.enqueue(bytes.slice(index, index + slice))
      controller.close()
    },
  })
}

test('v2 reply frames accumulate, a new message id replaces the draft, and final wins', async () => {
  const updates: Array<[string, string | undefined]> = []
  const progress: string[] = []
  const stream = line({ event: 'progress', stage: 'analyzing', message: '正在分析问题…' })
    + line({ event: 'reply', phase: 'delta', message_id: 'reply-a', content: '前言。' })
    + line({ event: 'reply', phase: 'delta', message_id: 'reply-b', content: '正文' })
    + line({ event: 'reply', phase: 'delta', message_id: 'reply-b', content: '继续' })
    + line({ event: 'reply', phase: 'final', message_id: 'reply-b', content: '正文继续（最终）' })
    + line({ content: '', done: true })
  const content = await consumeChatStream(body(stream), {
    onContent: (value, update) => updates.push([value, update?.kind]),
    onProgress: event => progress.push(event.stage),
  })
  assert.equal(content, '正文继续（最终）')
  // 第一帧没有可比较的 message_id，所以也按替换处理；换 id 等于"工具调用后重新开始"。
  assert.deepEqual(updates, [
    ['前言。', 'replace'],
    ['正文', 'replace'],
    ['正文继续', 'delta'],
    ['正文继续（最终）', 'final'],
  ])
  assert.deepEqual(progress, ['analyzing'])
})

test('a v2 stream that never delivers final counts as interrupted, not as a reply', async () => {
  const stream = line({ event: 'reply', phase: 'delta', message_id: 'reply-a', content: '半截' }) + line({ content: '', done: true })
  await assert.rejects(consumeChatStream(body(stream), { onContent: () => {} }), /已中断/)
})

test('mixing the append-only protocol into a v2 stream is refused instead of doubling the text', async () => {
  const stream = line({ event: 'reply', phase: 'final', message_id: 'reply-a', content: '正文' })
    + line({ content: '又被追加一次' }) + line({ content: '', done: true })
  await assert.rejects(consumeChatStream(body(stream), { onContent: () => {} }), /混用了正文协议/)
})

test('a malformed reply frame fails loudly instead of rendering nonsense', async () => {
  const stream = line({ event: 'reply', phase: 'delta', message_id: '', content: 'x' }) + line({ content: '', done: true })
  await assert.rejects(consumeChatStream(body(stream), { onContent: () => {} }), /无效的正文事件/)
})

test('legacy streams keep working: appended content, tool status, empty done sentinel', async () => {
  const updates: string[] = []
  const tools: string[] = []
  const stream = line({ event: 'tool', name: 'site_info', status: 'running', message: '正在查询站内内容…' })
    + line({ content: '你' }) + line({ content: '好' }) + line({ content: '', done: true })
  const content = await consumeChatStream(body(stream), {
    onContent: value => updates.push(value),
    onTool: event => tools.push(`${event.name}:${event.status}`),
  })
  assert.equal(content, '你好')
  assert.deepEqual(updates, ['你', '你好'])
  assert.deepEqual(tools, ['site_info:running'])
})

test('a stream that ends without a done frame is an interruption', async () => {
  await assert.rejects(consumeChatStream(body(line({ content: '半句' })), { onContent: () => {} }), /已中断/)
})
