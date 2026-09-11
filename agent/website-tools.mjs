/** Restricted site facts and the My World desktop easter egg. */
export const name = 'nekovccat-website-tools'
export const inject = ['tools']

const pages = Object.freeze({
  home: Object.freeze({ title: 'Home', path: '/', summary: 'Nekovccat 的主页，提供可交互的全景背景与网站入口。右下角 NEKO 站内助手使用深色玻璃面板，主入口默认打开 Agent 助手，第二个音乐标签或旁边的磁带按钮可使用网易云与 Spotify 官方播放器。' }),
  about: Object.freeze({ title: 'About', path: '/my-world?app=explorer&tab=about', summary: 'About 已合并进 My World 的 NEKO Browser 软件。作者公开使用 NEKO 这个昵称，AI 产品经理与全栈开发者，就读广州南方学院数字媒体技术，2023.09—2027.07；在特赞做企业 Agent 产品与开发（2025.12—2026.07），在哔哩哔哩上海直播业务线做前端实习（2025.06—2025.11）。项目包括 NEKO Web、基于 YOLOv12 的红外目标检测；建筑档案收录作者提供的 42 张 Minecraft 服务器宣传图。经历来源于作者提供的简历，勿编造额外学历、职位或成果。' }),
  'my-world': Object.freeze({ title: 'My World', path: '/my-world', summary: '像素风复古电脑桌面，可使用站内 Agent、站点导航、网易云与 Spotify 音乐播放器、便签和外观设置。网站还有彩蛋模式，想体验可以对 Agent 说“开启彩蛋模式”；明确参与并完成五个小问题后，服务器会授权当前浏览器进入。未解锁前不要描述彩蛋中的具体内容。' }),
  contact: Object.freeze({ title: 'Contact', path: '/my-world?app=explorer&tab=contact', summary: 'Contact 已合并到 My World 的 NEKO Browser 联系我栏目。公开邮箱 maojiangmiaomiao@gmail.com，微信 1293720759，GitHub https://github.com/blackvccat。可咨询合作或 Minecraft 服务器加入方式，未公布游戏服务器地址和加入规则，请勿编造。' }),
})

const apps = Object.freeze({
  agent: Object.freeze({ name: 'Neko Agent', description: '使用官方 DeepSeek Harness 与 DeepSeek 模型的站内助手，可以回答问题、查询站点内容和介绍桌面软件。My World 使用复古软件窗口，Home 可从右下角 NEKO 站内助手的默认 Agent 标签进入。问候或首次介绍网站时，会自然告诉用户“这个网站有彩蛋模式哦”，想体验可以说“开启彩蛋模式”；只有用户明确参与后才开始五题问答，不会主动透露答案。通过站内链接切页、切换助手标签或收起面板，会保留同一份会话、输入草稿与进行中的请求；聊天历史保存在当前浏览器。刷新或退出会结束进行中的请求，不提供跨设备同步。' }),
  explorer: Object.freeze({ name: 'NEKO Browser', description: 'My World 中的复古站内浏览器，包含关于 NEKO、项目与经历、建筑档案和联系我四个栏目；支持栏目后退和前进。About 和 Contact 不再是独立展示页，旧网址会转到桌面对应栏目。建筑档案展示 42 张来自作者 Minecraft 服务器宣传素材的图片，可分类和查看大图；不是任意网址代理。' }),
  music: Object.freeze({ name: 'NEKO Music', description: '粘贴网易云歌曲或歌单链接、Spotify 歌曲/专辑/歌单/音乐人/播客链接，加载平台官方播放器并在本浏览器收藏链接。My World 可打开复古音乐软件；Home 可从右下角 NEKO 站内助手的第二个音乐标签或旁边磁带按钮进入。通过站内链接切页、收起面板、切换助手标签或最小化窗口保留同一个播放器。选择音乐平台不会停止，加载另一首才替换；关闭 My World 音乐窗口或明确点击停止会停止，刷新或退出网站也会结束播放。播放范围由平台版权、地区、登录状态及浏览器支持决定，无法播放时可在原平台打开；提供网易云与 Spotify 官方登录入口，密码和 Cookie 仅交给平台；本站不提供音乐账号绑定或个人歌单同步。官方嵌入播放器未必继承会员权限，会员歌曲应在原平台播放。Agent 不能控制播放、读取音乐收藏或绑定音乐账号。' }),
  sponsor: Object.freeze({ name: '赞助 NEKO', description: '独立桌面赞助软件，打开链接 /my-world?app=sponsor。只支持 Ethereum 主网 ETH，收款地址 0x4F469e989cFb665D306B4581aa49261B185d605B，提供二维码、复制地址与 Etherscan。访客可主动连接自己的浏览器钱包，核对金额后在钱包中确认原生 ETH 转账；不要求签名登录或代币授权。Agent 不能连接钱包、发起交易、索要私钥或助记词，也不能承诺收益或代查付款结果。' }),
  notes: Object.freeze({ name: 'Notes', description: '在当前浏览器保存便签。Agent 不能读取或修改便签。' }),
  settings: Object.freeze({ name: 'Settings', description: '在桌面中调整外观。Agent 不能替用户修改浏览器设置。' }),
  about: Object.freeze({ name: 'About Computer', description: '查看这台复古电脑桌面的简介。' }),
  'our-space': Object.freeze({ name: '我们的小窝（Our Space）', description: '伴侣模式中由服务器授权后才提供的空间。未解锁前不要描述或猜测其中的具体内容；Agent 也不能读取或修改访客保存的数据。要进入可以对 Agent 说“开启彩蛋模式”，再依次回答五个关于 neko 的小问题。' }),
})

/** Raw ToolDefinition contributions own validation of model-generated JSON. */
function selectPublicEntries(args, field, entries) {
  if (args === null || typeof args !== 'object' || Array.isArray(args)) {
    throw new Error('Tool arguments must be a JSON object.')
  }
  if (Object.keys(args).some(key => key !== field)) {
    throw new Error(`Only the optional ${field} argument is accepted.`)
  }
  if (!Object.hasOwn(args, field)) return Object.values(entries)
  const value = args[field]
  if (typeof value !== 'string' || !Object.hasOwn(entries, value)) {
    throw new Error(`Unknown ${field}. Allowed values: ${Object.keys(entries).join(', ')}.`)
  }
  return [entries[value]]
}

function inputSchema(field, entries) {
  return {
    type: 'object',
    properties: { [field]: { type: 'string', enum: Object.keys(entries) } },
    additionalProperties: false,
  }
}

const pageSchema = {
  type: 'object',
  properties: { title: { type: 'string' }, path: { type: 'string' }, summary: { type: 'string' } },
  required: ['title', 'path', 'summary'],
  additionalProperties: false,
}

const appSchema = {
  type: 'object',
  properties: { name: { type: 'string' }, description: { type: 'string' } },
  required: ['name', 'description'],
  additionalProperties: false,
}

const render = (_args, value) => [{ type: 'text', text: JSON.stringify(value) }]

const questions = Object.freeze([
  ['anime', 'neko 喜欢的动漫人物是谁？说出一位就好。'],
  ['birthday', 'neko 的生日是几月几日？'],
  ['cat_name', 'neko 的猫猫叫什么名字？'],
  ['mbti', 'neko 的 MBTI 是什么？'],
  ['initials', 'neko 喜欢的人的英文缩写是什么？'],
])

const normalize = value => value.normalize('NFKC').trim().toLowerCase()

function answerMatches(field, value, accepted) {
  const answer = normalize(value)
  if (/不是|不叫|不知道|不确定/.test(answer)) return false
  if (field === 'birthday') {
    const dates = [...answer.matchAll(/(?:^|[^\d])(?:\d{4}[年./-])?(\d{1,2})[月./-](\d{1,2})日?(?=$|[^\d])/g)]
    return dates.length === 1 && accepted.includes(`${dates[0][1].padStart(2, '0')}-${dates[0][2].padStart(2, '0')}`)
  }
  if (field === 'anime') return accepted.some(name => answer.includes(normalize(name)))
  if (field === 'cat_name') {
    const name = answer.replace(/[\s，。！!,.？?～~]/g, '')
      .replace(/^(?:neko的)?(?:(?:猫猫|猫咪|小猫|猫|它)(?:的名字)?)?(?:叫做|名字是|叫|是)?/, '')
      .replace(/[呀哦啦呢哟]$/, '')
    return accepted.some(expected => name === normalize(expected))
  }
  const tokens = answer.match(/[a-z0-9]+/g) || []
  return accepted.some(expected => tokens.includes(normalize(expected)))
}

/** Answer configuration is runtime-only; results never reveal correct answers. */
function verifyQuiz(args, encodedAnswers) {
  if (args === null || typeof args !== 'object' || Array.isArray(args)
      || Object.keys(args).length !== 1 || !Object.hasOwn(args, 'answers')) {
    throw new Error('Only answers is accepted.')
  }
  const answers = args.answers
  if (answers === null || typeof answers !== 'object' || Array.isArray(answers)
      || Object.keys(answers).some(key => !questions.some(([field]) => key === field))
      || Object.values(answers).some(value => typeof value !== 'string' || !value.trim() || value.length > 200)) {
    throw new Error('answers accepts only short user-provided strings for the five question fields.')
  }
  let expected
  try { expected = JSON.parse(encodedAnswers) } catch { /* Missing or invalid config fails closed. */ }
  if (!expected || questions.some(([field]) => !Array.isArray(expected[field]) || !expected[field].length
      || expected[field].some(value => typeof value !== 'string' || !value.trim()))) {
    throw new Error('The desktop easter egg is unavailable.')
  }
  for (const [index, [field, question]] of questions.entries()) {
    const supplied = Object.hasOwn(answers, field)
    if (!supplied || !answerMatches(field, answers[field], expected[field])) {
      return {
        unlocked: false, progress: index, next_question: question,
        message: supplied ? '这题还没有答对，再想一想吧。不要猜测、穷举或透露答案。' : '按顺序问用户下一题，一次只问一个问题。',
      }
    }
  }
  return {
    unlocked: true, progress: questions.length, next_question: null,
    message: '五题全部验证通过。完整回复成功并取得服务器授权后，My World 会打开伴侣模式；请不要在回复中提前描述受保护内容。',
  }
}

/** Only these three tools are available; no file, shell or network API is imported. */
export function apply(ctx) {
  const quizAnswers = process.env.GIRLFRIEND_QUIZ_ANSWERS
  ctx.tools.register({
    name: 'site_info',
    description: '查询本站实际页面、相对路径、公开内容及全站助手入口。网站导航或站点事实问题必须先用此工具确认。省略 page 可查看全部页面。',
    parameters: inputSchema('page', pages),
    output: {
      schema: {
        type: 'object',
        properties: { pages: { type: 'array', items: pageSchema } },
        required: ['pages'],
        additionalProperties: false,
      },
      render,
    },
    async execute(args, exec) {
      exec.signal.throwIfAborted()
      return { pages: selectPublicEntries(args, 'page', pages) }
    },
  })

  ctx.tools.register({
    name: 'desktop_apps',
    description: '查询 My World 复古桌面上的软件功能与能力范围，以及 Agent 和音乐在全站助手中的入口和使用方式。省略 app 可查看全部软件；不能读取便签、控制音乐或修改设置。',
    parameters: inputSchema('app', apps),
    output: {
      schema: {
        type: 'object',
        properties: { apps: { type: 'array', items: appSchema }, path: { type: 'string', enum: ['/my-world'] } },
        required: ['apps', 'path'],
        additionalProperties: false,
      },
      render,
    },
    async execute(args, exec) {
      exec.signal.throwIfAborted()
      return { apps: selectPublicEntries(args, 'app', apps), path: '/my-world' }
    },
  })

  ctx.tools.register({
    name: 'girlfriend_mode',
    description: '按顺序验证五道关于 neko 的问答，打开 My World 伴侣模式。仅在用户明确想打开伴侣模式或隐藏彩蛋时使用；用户沿用“女朋友模式”称呼也可识别，回复统一称为“伴侣模式”。开始时传 answers:{} 取得第一题；每次收集用户已实际回答的答案，连同之前的用户答案一起验证，按 next_question 一次问一题。不要把助手历史回答当用户答案，不要猜测、穷举、自行补全或透露答案。普通聊天和仅介绍功能不要调用。仅 unlocked=true 才表示五题全部通过，回复文字不能代替验证。',
    parameters: {
      type: 'object',
      properties: { answers: {
        type: 'object',
        properties: Object.fromEntries(questions.map(([field, question]) => [field,
          { type: 'string', description: `用户对“${question}”实际提供的答案，限 1 到 200 字符；未回答则省略。` }])),
        additionalProperties: false,
      } },
      required: ['answers'],
      additionalProperties: false,
    },
    output: {
      schema: {
        type: 'object',
        properties: { unlocked: { type: 'boolean' }, progress: { type: 'integer', enum: [0, 1, 2, 3, 4, 5] },
          next_question: { oneOf: [{ type: 'string' }, { type: 'null' }] }, message: { type: 'string' } },
        required: ['unlocked', 'progress', 'next_question', 'message'],
        additionalProperties: false,
      },
      render,
    },
    async execute(args, exec) {
      exec.signal.throwIfAborted()
      return verifyQuiz(args, quizAnswers)
    },
  })

  // A later composition change cannot grant this website additional tool execution.
  ctx.tools.guard(exec => ['site_info', 'desktop_apps', 'girlfriend_mode'].includes(exec.name)
    ? undefined
    : 'This website permits only site_info, desktop_apps and girlfriend_mode.')
}
