import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const appsDir = path.join(root, '..', 'work', 'visitor-apps')

/** 协议字段：这些值是前端的类型与接口本来就要认识的词，不算内容。 */
const PROTOCOL_KEYS = new Set(['apiVersion', 'entry', 'embeds', 'permissions', 'window'])
const PROTOCOL_WORDS = new Set(['files', 'data', 'wallpaper', 'icon'])

/** 收齐 app.json 里的「内容」字符串：应用名、副标题、水印…… */
function collect(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') {
    const text = value.trim()
    if (text.length < 5) return out                                        // 太短的词会撞上通用界面文案
    if (PROTOCOL_WORDS.has(text.toLowerCase())) return out
    if (text.startsWith('/')) return out                                   // 站内公开路径，本来就该出现在前端
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return out                       // 日期
    if (/^https?:\/\//i.test(text)) return out                             // 外链不算私密内容
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

/** 每个应用的 app.json 与它的素材文件名（图标、壁纸）。 */
function appRegistries(): { manifest: Record<string, unknown>; assets: string[] }[] {
  if (!existsSync(appsDir)) return []
  return readdirSync(appsDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('.') && !entry.name.startsWith('_'))
    .map(entry => {
      const manifestPath = path.join(appsDir, entry.name, 'app.json')
      if (!existsSync(manifestPath)) return null
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, unknown>
      const assetsDir = path.join(appsDir, entry.name, 'assets')
      const assets = existsSync(assetsDir) ? readdirSync(assetsDir) : []
      return { manifest, assets }
    })
    .filter((value): value is { manifest: Record<string, unknown>; assets: string[] } => value !== null)
}

function frontendSources(directory: string, out: string[] = []): string[] {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) frontendSources(target, out)
    else if (/\.(tsx?|css|mjs)$/.test(entry.name)) out.push(target)
  }
  return out
}

/**
 * 登录前前端不含任何访客应用的痕迹：应用 id、素材文件名、app.json 里的文案都不许出现在前端源码里。
 * （应用的 HTML/JS 由服务器在登录后下发，构建期根本不会被前端 import，所以不在此扫描范围。）
 */
test('访客应用的标识与注册表文案不出现在前端源码里', () => {
  const registries = appRegistries()
  if (!registries.length) return
  const needles = new Set<string>()
  for (const { manifest, assets } of registries) {
    // id 里像 `files` 这种通用词会撞上代码本身，只查有辨识度的（较长或带连字符）。
    if (typeof manifest.id === 'string' && manifest.id.length >= 6 && !PROTOCOL_WORDS.has(manifest.id)) needles.add(manifest.id)
    for (const asset of assets) needles.add(asset)
    for (const needle of collect(manifest)) needles.add(needle)
  }
  assert.ok(needles.size > 5, '没读到访客应用的标识，检查一下 work/visitor-apps/')
  const haystack = frontendSources(path.join(root, 'src')).map(file => readFileSync(file, 'utf8')).join('\n')
  const leaked = [...needles].filter(needle => haystack.includes(needle))
  assert.deepEqual(leaked, [], `前端源码里出现了访客应用的痕迹：${leaked.join('、')}`)
})
