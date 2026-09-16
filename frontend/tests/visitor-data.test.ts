import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const registry = path.join(root, '..', 'work', 'visitor-apps.json')

/** 协议字段：这些值是前端渲染器必须认识的词（heading、files、wallpaper…），不算内容。 */
const PROTOCOL_KEYS = new Set(['_说明', 'type', 'kind', 'since'])
/** 同上：前端的渲染器与类型里本来就有这些词（区块类型、动作类型、素材类型），不能算泄漏。 */
const PROTOCOL_WORDS = new Set(['heading', 'text', 'letter', 'counter', 'checklist', 'footer', 'link', 'image', 'files',
  'wallpaper', 'icon', 'logout'])

/** 收齐注册表里的「内容」字符串：文案、应用名、素材名、下载地址…… */
function collect(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') {
    const text = value.trim()
    if (text.length < 5) return out                                        // 太短的词会撞上通用界面文案
    if (PROTOCOL_WORDS.has(text.toLowerCase())) return out
    if (text.startsWith('/')) return out                                   // 站内公开路径，本来就该出现在前端
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return out                       // 日期
    if (/^https?:\/\/(example\.com|localhost|127\.0\.0\.1)/i.test(text)) return out  // 指向本站的链接
    out.push(text)
    return out
  }
  if (Array.isArray(value)) {
    for (const item of value) collect(item, out)
    return out
  }
  if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) if (!PROTOCOL_KEYS.has(key)) collect(item, out)
  }
  return out
}

function walk(directory: string, out: string[] = []): string[] {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) walk(target, out)
    else if (/\.(tsx?|css|mjs)$/.test(entry.name)) out.push(target)
  }
  return out
}

/** 访客应用的内容只允许待在 work/ 与后端，前端源码里一个都不该有。 */
test('注册表里的应用数据不出现在前端源码里', () => {
  if (!existsSync(registry)) return
  const needles = [...new Set(collect(JSON.parse(readFileSync(registry, 'utf8'))))]
  assert.ok(needles.length > 5, '没读到注册表内容，检查一下 work/visitor-apps.json')
  const haystack = walk(path.join(root, 'src')).map(file => readFileSync(file, 'utf8')).join('\n')
  const leaked = needles.filter(needle => haystack.includes(needle))
  assert.deepEqual(leaked, [], `前端源码里出现了访客应用的数据：${leaked.join('、')}`)
})
