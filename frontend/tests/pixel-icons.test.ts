import assert from 'node:assert/strict'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = readFileSync(path.join(root, 'src/components/my-world/pixel-icon.tsx'), 'utf8')
const publicDir = path.join(root, 'public/icons-svg')

/** 直接读组件里的「名字 → 文件」表：图标本体是文件，这张表是唯一把它们接起来的地方。 */
const entries = new Map([...source.matchAll(/([\w'-]+):\s*'([^']+\.svg)'/g)].map(match => [match[1].replace(/'/g, ''), match[2]]))

test('图标表覆盖了组件认得的每个名字，并且指向 public/icons-svg 里真实存在的文件', () => {
  assert.deepEqual([...entries.keys()].sort(), ['about', 'agent', 'explorer', 'home', 'music', 'notes', 'settings', 'visitor', 'visitor-app'])
  for (const [name, file] of entries) {
    const target = path.join(publicDir, file)
    assert.ok(existsSync(target), `${name} 指向的 ${file} 不存在（画稿改完要跑 scripts/pixel-icons.py sync）`)
    const body = readFileSync(target, 'utf8')
    assert.match(body, /^<svg /, `${file} 不是 SVG`)
    assert.match(body, /viewBox="/, `${file} 缺少 viewBox，缩放到 20~43px 会失真`)
  }
})

test('访客登录用 login.svg，占位图标用 visitor-app.svg', () => {
  assert.equal(entries.get('visitor'), 'login.svg')
  assert.equal(entries.get('visitor-app'), 'visitor-app.svg')
})

test('访客应用的私有图标不进公开目录', () => {
  const appsDir = path.join(root, '..', 'work', 'visitor-apps')
  if (!existsSync(appsDir)) return
  const served = new Set(readdirSync(publicDir))
  for (const entry of readdirSync(appsDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name.startsWith('_')) continue
    const manifest = path.join(appsDir, entry.name, 'app.json')
    if (!existsSync(manifest)) continue
    const app = JSON.parse(readFileSync(manifest, 'utf8')) as { icon?: unknown }
    if (typeof app.icon === 'string') {
      assert.ok(!served.has(app.icon), `${app.icon} 是访客应用的私有图标，不该出现在 public/icons-svg（登录前前端不能有它的痕迹）`)
    }
  }
})
