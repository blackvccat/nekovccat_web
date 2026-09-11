import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { apply, inject } from '../website-tools.mjs'

const expectedAnswers = { anime: ['角色甲', '角色乙', '角色丙', '角色甲全名', '角色乙昵称', '角色丙全名'], birthday: ['01-02'], cat_name: ['测试猫'], mbti: ['TEST'], initials: ['ABC'] }
const correctAnswers = { anime: '角色甲', birthday: '1月2日', cat_name: '测试猫', mbti: 'TEST', initials: 'ABC' }

function registeredTools(quizAnswers = JSON.stringify(expectedAnswers)) {
  const definitions = new Map()
  const guards = []
  const original = process.env.GIRLFRIEND_QUIZ_ANSWERS
  process.env.GIRLFRIEND_QUIZ_ANSWERS = quizAnswers
  try {
    apply({ tools: {
      register(definition) { definitions.set(definition.name, definition); return () => definitions.delete(definition.name) },
      guard(check) { guards.push(check); return () => {} },
    } })
  } finally {
    if (original === undefined) delete process.env.GIRLFRIEND_QUIZ_ANSWERS
    else process.env.GIRLFRIEND_QUIZ_ANSWERS = original
  }
  return { definitions, guards }
}

const execution = () => ({ signal: new AbortController().signal })

test('registers exactly the three website tools and only injects the tool registry', () => {
  const { definitions } = registeredTools()
  assert.deepEqual(inject, ['tools'])
  assert.deepEqual([...definitions.keys()], ['site_info', 'desktop_apps', 'girlfriend_mode'])
  for (const definition of definitions.values()) {
    assert.equal(definition.parameters.type, 'object')
    assert.equal(definition.parameters.additionalProperties, false)
    assert.equal(definition.output.schema.type, 'object')
    assert.equal(definition.output.schema.additionalProperties, false)
  }
})

test('queries every public page and returns only the four known relative routes', async () => {
  const tool = registeredTools().definitions.get('site_info')
  const expected = { home: '/', about: '/my-world?app=explorer&tab=about', 'my-world': '/my-world', contact: '/my-world?app=explorer&tab=contact' }
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

test('queries all eight desktop apps and makes browser-only capability limits explicit', async () => {
  const tool = registeredTools().definitions.get('desktop_apps')
  const keys = ['agent', 'explorer', 'music', 'sponsor', 'notes', 'settings', 'about', 'our-space']
  assert.deepEqual(tool.parameters.properties.app.enum, keys)
  for (const app of keys) {
    const result = await tool.execute({ app }, execution())
    assert.deepEqual(Object.keys(result), ['apps', 'path'])
    assert.equal(result.apps.length, 1)
    assert.equal(result.path, '/my-world')
    assert.deepEqual(Object.keys(result.apps[0]), ['name', 'description'])
  }
  assert.equal((await tool.execute({}, execution())).apps.length, 8)
  assert.match((await tool.execute({ app: 'music' }, execution())).apps[0].description, /网易云.*Spotify/)
  assert.match((await tool.execute({ app: 'music' }, execution())).apps[0].description, /不能控制播放/)
  assert.match((await tool.execute({ app: 'notes' }, execution())).apps[0].description, /不能读取或修改便签/)
  assert.match((await tool.execute({ app: 'settings' }, execution())).apps[0].description, /不能替用户修改/)
  assert.match((await tool.execute({ app: 'agent' }, execution())).apps[0].description, /官方 DeepSeek Harness/)
  assert.match((await tool.execute({ app: 'our-space' }, execution())).apps[0].description, /服务器授权/)
})

test('public guidance explains the shared assistant entry and session lifetime', async () => {
  const { definitions } = registeredTools()
  const site = definitions.get('site_info')
  for (const page of ['home']) {
    const { summary } = (await site.execute({ page }, execution())).pages[0]
    assert.match(summary, /右下角 NEKO 站内助手/)
    assert.match(summary, /默认打开 Agent/)
    assert.match(summary, /第二个音乐标签/)
  }
  const apps = definitions.get('desktop_apps')
  const { description: agent } = (await apps.execute({ app: 'agent' }, execution())).apps[0]
  assert.match(agent, /保留同一份会话、输入草稿与进行中的请求/)
  assert.match(agent, /聊天历史保存在当前浏览器/)
  const { description: music } = (await apps.execute({ app: 'music' }, execution())).apps[0]
  assert.match(music, /通过站内链接切页.*保留同一个播放器/)
  assert.match(music, /选择音乐平台不会停止，加载另一首才替换/)
  assert.match(music, /关闭 My World 音乐窗口或明确点击停止会停止/)
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
})

test('returns JSON output with only public facts and no invented personal details', async () => {
  for (const tool of registeredTools().definitions.values()) {
    const args = tool.name === 'girlfriend_mode' ? { answers: {} } : {}
    const value = await tool.execute(args, execution())
    const content = tool.output.render({}, value)
    assert.equal(content.length, 1)
    assert.equal(content[0].type, 'text')
    assert.deepEqual(JSON.parse(content[0].text), value)
    assert.doesNotMatch(content[0].text, /sk-[A-Za-z0-9]+|\/Users\/|backend\/|\.env/)
  }
  const site = registeredTools().definitions.get('site_info')
  assert.match((await site.execute({ page: 'contact' }, execution())).pages[0].summary, /maojiangmiaomiao@gmail.com/)
  assert.match((await site.execute({ page: 'about' }, execution())).pages[0].summary, /广州南方学院/)
})

test('honors cancelled tool execution before returning any facts', async () => {
  const controller = new AbortController()
  controller.abort()
  for (const tool of registeredTools().definitions.values()) {
    await assert.rejects(tool.execute({}, { signal: controller.signal }), { name: 'AbortError' })
  }
})

test('global guard denies every tool outside the three site tools', () => {
  const { guards } = registeredTools()
  assert.equal(guards.length, 1)
  for (const name of ['site_info', 'desktop_apps', 'girlfriend_mode']) assert.equal(guards[0]({ name }), undefined)
  for (const name of ['bash', 'pwsh', 'read_file', 'web_fetch', 'run_code', 'terminal', 'unknown']) {
    assert.equal(typeof guards[0]({ name }), 'string')
  }
})

test('plugin has no file, shell or network imports; patch disables minimal shell composition', async () => {
  const source = await readFile(new URL('../website-tools.mjs', import.meta.url), 'utf8')
  assert.doesNotMatch(source.replace('process.env.GIRLFRIEND_QUIZ_ANSWERS', 'configuredAnswers'), /\bimport\s|\brequire\s*\(|\bfetch\s*\(|\beval\s*\(|\bprocess\./)
  const patch = await readFile(new URL('../website.patch.yml', import.meta.url), 'utf8')
  for (const id of ['persistent-bash', 'persistent-pwsh', 'terminal-bash', 'terminal-pwsh', 'pty', 'subprocess', 'sandbox-policy', 'sandbox', 'jobs']) {
    assert.match(patch, new RegExp(`- id: ${id}\\n  disabled: true`))
  }
  assert.match(patch, /name: __WEBSITE_TOOLS_MODULE__/)
  assert.doesNotMatch(patch, /\/Users\/|\/home\//)
  assert.match(patch, /mode: native/)
})

test('quiz advances in order and unlocks only after all five answers are correct', async () => {
  const tool = registeredTools().definitions.get('girlfriend_mode')
  const answers = {}
  const prompts = [/动漫人物/, /生日/, /猫猫/, /MBTI/, /英文缩写/]
  for (const [index, [field, answer]] of Object.entries(correctAnswers).entries()) {
    const result = await tool.execute({ answers }, execution())
    assert.equal(result.unlocked, false)
    assert.equal(result.progress, index)
    assert.match(result.next_question, prompts[index])
    answers[field] = answer
  }
  const complete = await tool.execute({ answers }, execution())
  assert.equal(complete.unlocked, true)
  assert.equal(complete.progress, 5)
  assert.equal(complete.next_question, null)
  for (const [index, field] of Object.keys(correctAnswers).entries()) {
    const wrong = await tool.execute({ answers: { ...correctAnswers, [field]: 'wrong' } }, execution())
    assert.equal(wrong.unlocked, false)
    assert.equal(wrong.progress, index)
    assert.match(wrong.next_question, prompts[index])
  }
  assert.equal((await tool.execute({ answers: { initials: 'ABC' } }, execution())).progress, 0)
})

test('quiz normalizes natural answers, birthday formats and letter case without accepting wrong substrings', async () => {
  const tool = registeredTools().definitions.get('girlfriend_mode')
  for (const [field, variants] of Object.entries({
    anime: ['角色乙', '是角色丙呀', '我记得是角色甲', '角色甲全名', '角色乙昵称', '角色丙全名'],
    birthday: ['1月2日', '1.2', '01-02', '1/2', '2000-01-02', '2000年1月2日', '生日是1月2日'],
    cat_name: ['测试猫', '叫测试猫', '猫猫叫测试猫呀', 'neko的猫猫叫测试猫。'],
    mbti: ['test', 'TeSt', 'TEST型', '他的mbti是test'], initials: ['abc', 'AbC', '是 ABC'],
  })) {
    for (const answer of variants) assert.equal((await tool.execute({ answers: { ...correctAnswers, [field]: answer } }, execution())).unlocked, true, `${field}: ${answer}`)
  }
  for (const [field, variants] of Object.entries({
    anime: ['不知道', '不是角色甲'], birthday: ['4月13日', '11月2日', '01-020', '1月2日或5月1日'],
    cat_name: ['不是测试猫', '测试猫鼠'], mbti: ['INFP', 'nottest', 'xTESTx'], initials: ['XD YJ', 'XD YJ', 'ABCX', 'ABC123'],
  })) {
    for (const answer of variants) assert.equal((await tool.execute({ answers: { ...correctAnswers, [field]: answer } }, execution())).unlocked, false, `${field}: ${answer}`)
  }
})

test('quiz metadata and results never publish the answer dictionary', async () => {
  const tool = registeredTools().definitions.get('girlfriend_mode')
  const metadata = JSON.stringify({ ...tool, output: tool.output.schema })
  const result = await tool.execute({ answers: correctAnswers }, execution())
  for (const answer of Object.values(expectedAnswers).flat()) {
    assert.ok(!metadata.includes(answer))
    assert.ok(!JSON.stringify(result).includes(answer))
  }
  const changed = registeredTools(JSON.stringify({ ...expectedAnswers, cat_name: ['松果'] })).definitions.get('girlfriend_mode')
  assert.equal((await changed.execute({ answers: correctAnswers }, execution())).unlocked, false)
  assert.equal((await changed.execute({ answers: { ...correctAnswers, cat_name: '松果' } }, execution())).unlocked, true)
})

test('quiz rejects malformed or extra inputs and missing configuration', async () => {
  const tool = registeredTools().definitions.get('girlfriend_mode')
  for (const args of [null, [], 'answers', {}, { answers: correctAnswers, command: 'id' },
    { answers: null }, { answers: [] }, { answers: '角色甲' }, { answers: { anime: ['角色甲'] } },
    { answers: { anime: '' } }, { answers: { command: 'id' } }, { answers: { mbti: 'x'.repeat(201) } }]) {
    await assert.rejects(tool.execute(args, execution()))
  }
  for (const config of ['', '{}', 'null', '{', JSON.stringify({ ...expectedAnswers, cat_name: [''] })]) {
    const unavailable = registeredTools(config).definitions.get('girlfriend_mode')
    await assert.rejects(unavailable.execute({ answers: correctAnswers }, execution()), /unavailable/)
  }
})
