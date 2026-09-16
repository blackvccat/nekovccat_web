import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { apply, inject } from '../website-tools.mjs'

function registeredTools() {
  const definitions = new Map()
  const guards = []
  apply({ tools: {
    register(definition) { definitions.set(definition.name, definition); return () => definitions.delete(definition.name) },
    guard(check) { guards.push(check); return () => {} },
  } })
  return { definitions, guards }
}

const execution = () => ({ signal: new AbortController().signal })

test('registers exactly the two website tools and only injects the tool registry', () => {
  const { definitions } = registeredTools()
  assert.deepEqual(inject, ['tools'])
  assert.deepEqual([...definitions.keys()], ['site_info', 'desktop_apps'])
  for (const definition of definitions.values()) {
    assert.equal(definition.parameters.type, 'object')
    assert.equal(definition.parameters.additionalProperties, false)
    assert.equal(definition.output.schema.type, 'object')
    assert.equal(definition.output.schema.additionalProperties, false)
  }
})

test('queries every public page and returns only the four known relative routes', async () => {
  const tool = registeredTools().definitions.get('site_info')
  const expected = { home: '/terminal', about: '/terminal?app=explorer&tab=about', terminal: '/terminal', contact: '/terminal?app=explorer&tab=contact' }
  assert.deepEqual(tool.parameters.properties.page.enum, Object.keys(expected))
  for (const [page, path] of Object.entries(expected)) {
    const result = await tool.execute({ page }, execution())
    assert.deepEqual(Object.keys(result), ['pages'])
    assert.equal(result.pages.length, 1)
    assert.equal(result.pages[0].path, path)
    assert.deepEqual(Object.keys(result.pages[0]), ['title', 'path', 'summary'])
  }
  assert.deepEqual((await tool.execute({}, execution())).pages.map(page => page.path), Object.values(expected))
})

test('queries all seven desktop apps and makes browser-only capability limits explicit', async () => {
  const tool = registeredTools().definitions.get('desktop_apps')
  const keys = ['agent', 'explorer', 'music', 'notes', 'settings', 'about', 'visitor']
  assert.deepEqual(tool.parameters.properties.app.enum, keys)
  for (const app of keys) {
    const result = await tool.execute({ app }, execution())
    assert.deepEqual(Object.keys(result), ['apps', 'path'])
    assert.equal(result.apps.length, 1)
    assert.equal(result.path, '/terminal')
    assert.deepEqual(Object.keys(result.apps[0]), ['name', 'description'])
  }
  assert.equal((await tool.execute({}, execution())).apps.length, 7)
  assert.match((await tool.execute({ app: 'music' }, execution())).apps[0].description, /网易云.*Spotify/)
  assert.match((await tool.execute({ app: 'music' }, execution())).apps[0].description, /不能控制播放/)
  assert.match((await tool.execute({ app: 'notes' }, execution())).apps[0].description, /不能读取或修改便签/)
  assert.match((await tool.execute({ app: 'settings' }, execution())).apps[0].description, /不能替用户修改/)
  assert.match((await tool.execute({ app: 'agent' }, execution())).apps[0].description, /官方 DeepSeek Harness/)
})

test('visitor mode is described as invite-only and the agent refuses to log anyone in', async () => {
  const { definitions } = registeredTools()
  const { description } = (await definitions.get('desktop_apps').execute({ app: 'visitor' }, execution())).apps[0]
  assert.match(description, /访客名与密码/)
  assert.match(description, /凭据由 Marcus 单独发给受邀访客/)
  assert.match(description, /不能代登录/)
  assert.match(description, /不要向用户索要密码/)
  assert.match(description, /按账号授权/)
  assert.match(description, /\/terminal\?app=visitor/)
  const { summary } = (await definitions.get('site_info').execute({ page: 'terminal' }, execution())).pages[0]
  assert.match(summary, /访客模式/)
  assert.match(summary, /未授权前不要描述其中的具体内容/)
})

test('public guidance explains the direct desktop entry and session lifetime', async () => {
  const { definitions } = registeredTools()
  const site = definitions.get('site_info')
  const { summary } = (await site.execute({ page: 'home' }, execution())).pages[0]
  assert.match(summary, /直接进入 MARCUS 的虚拟电脑桌面/)
  assert.match(summary, /https:\/\/example\.com\//)
  const { summary: desktop } = (await site.execute({ page: 'terminal' }, execution())).pages[0]
  assert.match(desktop, /复古电脑桌面/)
  const apps = definitions.get('desktop_apps')
  const { description: agent } = (await apps.execute({ app: 'agent' }, execution())).apps[0]
  assert.match(agent, /保留同一份会话、输入草稿与进行中的请求/)
  assert.match(agent, /聊天历史保存在当前浏览器/)
  assert.match(agent, /不会索要密码/)
  const { description: music } = (await apps.execute({ app: 'music' }, execution())).apps[0]
  assert.match(music, /通过站内链接切页.*保留同一个播放器/)
  assert.match(music, /选择音乐平台不会停止，加载另一首才替换/)
  assert.match(music, /关闭 Terminal 音乐窗口或明确点击停止会停止/)
  assert.match(music, /刷新或退出网站也会结束播放/)
  assert.match(music, /不提供音乐账号绑定或个人歌单同步/)
})

test('rejects malformed JSON arguments, traversal, inherited keys and arbitrary commands', async () => {
  const { definitions } = registeredTools()
  for (const [name, field] of [['site_info', 'page'], ['desktop_apps', 'app']]) {
    const tool = definitions.get(name)
    for (const value of ['', null, [], ['home'], {}, 0, 1, false, true, '../backend/.env', '/etc/passwd', 'file:///etc/passwd', 'https://example.invalid/', '$(id)', '__proto__', 'constructor', 'toString']) {
      await assert.rejects(tool.execute({ [field]: value }, execution()), /Unknown/)
    }
    for (const args of [null, [], 1, false, 'home', { command: 'id' }, { path: '../backend/.env' }, { [field]: 'home', extra: true }]) {
      await assert.rejects(tool.execute(args, execution()))
    }
  }
  for (const name of ['girlfriend_mode', 'visitor_login', 'shell', 'bash']) {
    assert.equal(definitions.get(name), undefined)
  }
})

test('returns JSON output with only public facts and no invented personal details', async () => {
  for (const tool of registeredTools().definitions.values()) {
    const value = await tool.execute({}, execution())
    const content = tool.output.render({}, value)
    assert.equal(content.length, 1)
    assert.equal(content[0].type, 'text')
    assert.deepEqual(JSON.parse(content[0].text), value)
    assert.doesNotMatch(content[0].text, /sk-[A-Za-z0-9]+|\/Users\/|backend\/|\.env|password_hash/)
  }
  const site = registeredTools().definitions.get('site_info')
  assert.match((await site.execute({ page: 'contact' }, execution())).pages[0].summary, /hello@example.com/)
  assert.match((await site.execute({ page: 'contact' }, execution())).pages[0].summary, /github\.com\/your-handle/)
  assert.match((await site.execute({ page: 'about' }, execution())).pages[0].summary, /BG0XXX/)
})

test('honors cancelled tool execution before returning any facts', async () => {
  const controller = new AbortController()
  controller.abort()
  for (const tool of registeredTools().definitions.values()) {
    await assert.rejects(tool.execute({}, { signal: controller.signal }), { name: 'AbortError' })
  }
})

test('global guard denies every tool outside the two site tools', () => {
  const { guards } = registeredTools()
  assert.equal(guards.length, 1)
  for (const name of ['site_info', 'desktop_apps']) assert.equal(guards[0]({ name }), undefined)
  for (const name of ['girlfriend_mode', 'visitor_login', 'bash', 'pwsh', 'read_file', 'web_fetch', 'run_code', 'terminal', 'unknown']) {
    assert.equal(typeof guards[0]({ name }), 'string')
  }
})

test('plugin has no file, shell, network or environment imports; patch disables minimal shell composition', async () => {
  const source = await readFile(new URL('../website-tools.mjs', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /\bimport\s|\brequire\s*\(|\bfetch\s*\(|\beval\s*\(|\bprocess\./)
  assert.doesNotMatch(source, /GIRLFRIEND_QUIZ_ANSWERS|quiz_answers|answerMatches|verifyQuiz/)
  const patch = await readFile(new URL('../website.patch.yml', import.meta.url), 'utf8')
  for (const id of ['persistent-bash', 'persistent-pwsh', 'terminal-bash', 'terminal-pwsh', 'pty', 'subprocess', 'sandbox-policy', 'sandbox', 'jobs']) {
    assert.match(patch, new RegExp(`- id: ${id}\\n  disabled: true`))
  }
  assert.match(patch, /name: __WEBSITE_TOOLS_MODULE__/)
  assert.doesNotMatch(patch, /\/Users\/|\/home\//)
  assert.match(patch, /mode: native/)
})
