/**
 * 桌面应用注册表生成器。
 *
 * 读取 `frontend/apps/registry.json` 的 `enabled` 列表，为每个已启用的应用：
 *   1. 校验文件夹与 manifest（id 必须等于文件夹名、apiVersion 必须匹配）；
 *   2. 把 `apps/<id>/assets/` 复制到 `frontend/public/apps/<id>/`；
 *   3. 生成静态 import 的 `frontend/src/app-kit/generated.tsx`（Turbopack 不认动态路径，所以走生成）。
 * 同时清掉 `public/apps/` 下已不在名单里的目录。
 *
 * 用法：
 *   node scripts/apps-registry.mjs           生成（npm run app:registry）
 *   node scripts/apps-registry.mjs --check   只校验生成物是否与名单同步（npm test 用）
 */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
export const REPO_ROOT = resolve(HERE, '..')
export const FRONTEND_DIR = join(REPO_ROOT, 'frontend')
export const APPS_DIR = join(FRONTEND_DIR, 'apps')
export const PUBLIC_APPS_DIR = join(FRONTEND_DIR, 'public', 'apps')
export const REGISTRY_PATH = join(APPS_DIR, 'registry.json')
export const GENERATED_PATH = join(FRONTEND_DIR, 'src', 'app-kit', 'generated.tsx')
/** 与 src/app-kit/index.ts 的 APP_API_VERSION 保持一致。 */
export const API_VERSION = 1
const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,31}$/

function fail(message) {
  const error = new Error(message)
  throw error
}

export function readRegistry() {
  if (!existsSync(REGISTRY_PATH)) fail(`找不到 ${REGISTRY_PATH}`)
  let parsed
  try {
    parsed = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'))
  } catch (cause) {
    fail(`registry.json 不是合法 JSON：${cause.message}`)
  }
  const enabled = parsed && Array.isArray(parsed.enabled) ? parsed.enabled : fail('registry.json 缺少 enabled 数组')
  const seen = new Set()
  for (const id of enabled) {
    if (typeof id !== 'string' || !ID_PATTERN.test(id)) fail(`registry.json 里的应用 id 不合法：${JSON.stringify(id)}`)
    if (seen.has(id)) fail(`registry.json 里重复登记：${id}`)
    seen.add(id)
  }
  return enabled
}

export function loadAppEntry(id) {
  const dir = join(APPS_DIR, id)
  if (!existsSync(dir)) fail(`registry.json 登记了 ${id}，但找不到目录 apps/${id}/`)
  const manifestPath = join(dir, 'manifest.json')
  if (!existsSync(manifestPath)) fail(`apps/${id}/ 缺少 manifest.json`)
  let manifest
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  } catch (cause) {
    fail(`apps/${id}/manifest.json 不是合法 JSON：${cause.message}`)
  }
  for (const field of ['id', 'title', 'subtitle', 'icon']) {
    if (typeof manifest[field] !== 'string' || !manifest[field].trim()) fail(`apps/${id}/manifest.json 的 ${field} 必须是非空字符串`)
  }
  if (manifest.id !== id) fail(`apps/${id}/manifest.json 的 id 是 ${JSON.stringify(manifest.id)}，必须等于文件夹名 ${id}`)
  if (manifest.apiVersion !== API_VERSION) fail(`apps/${id} 的 apiVersion 是 ${JSON.stringify(manifest.apiVersion)}，宿主是 ${API_VERSION}`)
  if (!manifest.window || typeof manifest.window.width !== 'number' || typeof manifest.window.height !== 'number') {
    fail(`apps/${id}/manifest.json 的 window.width / window.height 必须是数字`)
  }
  if (!existsSync(join(dir, 'app.tsx'))) fail(`apps/${id}/ 缺少 app.tsx（默认导出应用组件）`)
  return { id, dir, manifest }
}

export function loadApps() {
  return readRegistry().map(loadAppEntry)
}

/** 生成 `src/app-kit/generated.tsx` 的内容；纯函数，方便测试与 --check 比对。 */
export function renderGenerated(entries) {
  const lines = []
  lines.push('// 由 scripts/apps-registry.mjs 根据 frontend/apps/registry.json 生成，请勿手改。')
  lines.push('// 要改：编辑 apps/ 目录或 registry.json，然后运行 `npm run app:registry`。')
  lines.push("import type { AppModule } from './index'")
  entries.forEach((entry, index) => {
    lines.push(`import manifest${index} from '../../apps/${entry.id}/manifest.json'`)
    lines.push(`import App${index} from '../../apps/${entry.id}/app'`)
  })
  lines.push('')
  lines.push('export const PLUGIN_APPS: AppModule[] = [')
  entries.forEach((entry, index) => {
    lines.push(`  { manifest: manifest${index} as AppModule['manifest'], Component: App${index} },`)
  })
  lines.push(']')
  lines.push('')
  return lines.join('\n')
}

/** 把每个应用自带的 assets 复制到 public/apps/<id>/，并清掉不在名单里的旧目录。 */
export function syncAssets(entries) {
  const keep = new Set(entries.map(entry => entry.id))
  if (existsSync(PUBLIC_APPS_DIR)) {
    for (const name of readdirSync(PUBLIC_APPS_DIR)) {
      if (!keep.has(name)) rmSync(join(PUBLIC_APPS_DIR, name), { recursive: true, force: true })
    }
  }
  for (const entry of entries) {
    const source = join(entry.dir, 'assets')
    const relativeIcon = !entry.manifest.icon.startsWith('/')
    if (!existsSync(source)) {
      if (relativeIcon) fail(`apps/${entry.id}/ 缺少 assets/ 目录，但 manifest.icon 是相对路径 ${entry.manifest.icon}`)
      continue
    }
    const target = join(PUBLIC_APPS_DIR, entry.id)
    rmSync(target, { recursive: true, force: true })
    mkdirSync(dirname(target), { recursive: true })
    cpSync(source, target, { recursive: true })
    if (relativeIcon && !existsSync(join(source, entry.manifest.icon))) {
      fail(`apps/${entry.id}/assets/ 里找不到图标 ${entry.manifest.icon}`)
    }
  }
}

const normalize = text => text.replaceAll('\r\n', '\n')

export function build() {
  const entries = loadApps()
  return { entries, generated: renderGenerated(entries) }
}

export function writeAll() {
  const { entries, generated } = build()
  syncAssets(entries)
  mkdirSync(dirname(GENERATED_PATH), { recursive: true })
  writeFileSync(GENERATED_PATH, generated, 'utf8')
  return { entries, generated }
}

export function check() {
  const { entries, generated } = build()
  if (!existsSync(GENERATED_PATH)) fail(`缺少生成物 ${GENERATED_PATH}，请运行 npm run app:registry`)
  const current = normalize(readFileSync(GENERATED_PATH, 'utf8'))
  return { ok: current === normalize(generated), expected: generated, current, entries }
}

function main() {
  const args = process.argv.slice(2)
  if (args.includes('--check')) {
    const result = check()
    if (!result.ok) {
      console.error('apps.generated.tsx 与 apps/registry.json 不同步，请运行 npm run app:registry。')
      process.exit(1)
    }
    console.log(`apps registry: ${result.entries.length} 个插件应用，已同步。`)
    return
  }
  const { entries } = writeAll()
  console.log(`apps registry: 已写入 ${entries.length} 个插件应用（${entries.map(entry => entry.id).join(', ') || '无'}）。`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (cause) {
    console.error(`apps registry 失败：${cause.message}`)
    process.exit(1)
  }
}
