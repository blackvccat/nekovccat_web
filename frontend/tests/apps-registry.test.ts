import assert from 'node:assert/strict'
import test from 'node:test'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { APPS_DIR, FRONTEND_DIR, GENERATED_PATH, REGISTRY_PATH, API_VERSION, check, loadApps, loadAppEntry, readRegistry } from '../../scripts/apps-registry.mjs'

/** codegen 脚本是 .mjs，没有类型声明；在这里给它一个最小形状供测试使用。 */
interface AppEntry {
  id: string
  dir: string
  manifest: { id: string; apiVersion: number; title: string; subtitle: string; icon: string; window: { width: number; height: number } }
}
const loadApp = loadAppEntry as (id: string) => AppEntry
const loadEnabledApps = loadApps as () => AppEntry[]
const enabled = readRegistry() as string[]

const appDirs = readdirSync(APPS_DIR, { withFileTypes: true }).filter(entry => entry.isDirectory() && !entry.name.startsWith('.')).map(entry => entry.name)

test('the committed generated registry is exactly what the codegen produces', () => {
  // 和暗色生成器同一条约定：改了 apps/ 或 registry.json 就得重新生成，否则桌面看不到新应用。
  const result = check()
  assert.ok(existsSync(GENERATED_PATH), '缺少 src/app-kit/generated.tsx，请运行 npm run app:registry')
  assert.ok(result.ok, 'apps.generated.tsx 与 apps/registry.json 不同步，请运行 npm run app:registry')
})

test('every app folder declares a matching, well-formed manifest', () => {
  for (const id of appDirs) {
    const entry = loadApp(id)
    assert.equal(entry.manifest.id, id, `${id} 的 manifest.id 必须等于文件夹名`)
    assert.equal(entry.manifest.apiVersion, API_VERSION, `${id} 的 apiVersion 与宿主不一致`)
    assert.ok(entry.manifest.title && entry.manifest.subtitle, `${id} 缺 title / subtitle`)
    assert.ok(entry.manifest.window.width > 0 && entry.manifest.window.height > 0, `${id} 的窗口尺寸不合法`)
    if (!entry.manifest.icon.startsWith('/')) {
      assert.ok(existsSync(join(entry.dir, 'assets', entry.manifest.icon)), `${id} 的图标素材不存在：${entry.manifest.icon}`)
    }
  }
  assert.deepEqual([...enabled].sort(), loadEnabledApps().map(entry => entry.id).sort())
})

test('every app only depends on the public contract, so it can be copied out', () => {
  // 可搬运性的硬条件：插件不得 import 宿主内部模块（@/components/* 或 @/lib/*）。
  for (const id of appDirs) {
    const source = readFileSync(join(APPS_DIR, id, 'app.tsx'), 'utf8')
    const imports = [...source.matchAll(/from\s+'([^']+)'/g)].map(match => match[1])
    for (const specifier of imports) {
      const allowed = specifier === 'react' || specifier.startsWith('@/app-kit') || specifier.startsWith('./')
      assert.ok(allowed, `${id}/app.tsx 不该 import ${specifier}：插件只能用 @/app-kit 与自己的相对路径`)
    }
  }
})

test('plugin styles use only host theme tokens, never hard-coded colours', () => {
  // 只用 --app-*，搬到别的同架构站点才会自动跟随那边的明暗主题。
  for (const id of appDirs) {
    const css = join(APPS_DIR, id, 'app.css')
    if (!existsSync(css)) continue
    const text = readFileSync(css, 'utf8')
    assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(text), `${id}/app.css 里出现了写死的颜色，请改用 --app-* token`)
    if (text.trim()) assert.ok(text.includes('var(--app-'), `${id}/app.css 没有使用任何 --app-* token`)
  }
})

test('the token sheet defines the same --app-* variables for both themes', () => {
  const css = readFileSync(join(FRONTEND_DIR, 'src', 'app', 'terminal', 'app-tokens.css'), 'utf8')
  const block = (start: string) => {
    const at = css.indexOf(start)
    assert.ok(at > -1, `找不到 token 块：${start}`)
    const scope = css.slice(at, css.indexOf('}', at))
    return [...scope.matchAll(/(--app-[a-z-]+):/g)].map(match => match[1]).sort()
  }
  const light = block('.marcus-desktop-page {')
  const dark = block('html[data-theme="dark"] .marcus-desktop-page {')
  assert.ok(light.length >= 8, `亮色 token 太少：${light.length}`)
  assert.deepEqual(dark, light, '暗色 token 与亮色不完全对应')
})

test('generated imports point at the apps directory', () => {
  const generated = readFileSync(GENERATED_PATH, 'utf8')
  for (const id of enabled) {
    assert.ok(generated.includes(`import App`), '生成物里没有组件 import')
    assert.ok(generated.includes(`../../apps/${id}/app`), `生成物里缺少 ${id} 的组件 import`)
    assert.ok(generated.includes(`../../apps/${id}/manifest.json`), `生成物里缺少 ${id} 的 manifest import`)
  }
  if (!enabled.length) assert.ok(generated.includes('export const PLUGIN_APPS: AppModule[] = []'))
})

test('registry.json stays a small, human-editable list', () => {
  const raw = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'))
  assert.ok(Array.isArray(raw.enabled), 'registry.json 必须有 enabled 数组')
  for (const id of raw.enabled) assert.ok(APPS_DIR && existsSync(join(APPS_DIR, id)), `启用的应用 ${id} 没有对应目录`)
})
