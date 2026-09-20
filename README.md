# Marcus · Terminal

Next.js + FastAPI 的个人网站，为NEKO/My World的附属分支。地址是 **<https://example.com/terminal>**——一台可交互的像素风复古电脑，内置 DeepSeek Harness 站内 Agent、音乐软件、站点导航、便签与外观设置。它只有一个页面：打开 `/terminal` 就直接是桌面，没有单独的首页。域名根路径 <https://example.com/> 留给主站，顶栏 **HOME** 就指向那里（在当前标签页直接跳转），**Terminal** 是当前桌面；About 与 Contact 合并进桌面的 **MARCUS Browser**，旧地址会自动跳转。

## 站内助手

**MK Agent** 是 Terminal 桌面里的一个软件窗口，默认打开。桌面之外只剩 404 这类页面会用到右下角的深色玻璃面板，面板里同样有 Agent 与音乐两个标签；网站没有独立首页，所以这个面板平时不会出现。

面板与桌面 Agent 共用当前会话、输入草稿和正在进行的请求。通过站内链接切换页面、切换助手标签或收起面板后，再打开即可继续。聊天历史保存在当前浏览器；草稿和进行中的请求属于当前网页会话，刷新或退出页面不会在后台继续请求，也不提供跨设备同步。

## 桌面软件

- **MK Agent**：官方 DeepSeek Harness 负责模型循环、会话轨迹与站内工具，默认使用 DeepSeek FLASH。
- **MARCUS Browser**：复古站内浏览器，包含关于 MARCUS、项目/探索与经历、长廊及联系栏目。长廊挑选了主站「共鸣」展厅的一部分作品，带标题、简介与调性标注，点开任意画框会在新标签页打开主站对应作品。联系栏目给出公开邮箱与 GitHub 链接（示例值写在 `frontend/src/content/profile.ts`，换成自己的即可）。旧 About / Contact 与 `/my-world` 地址自动跳转。公开身份为 Marcus。
- **MARCUS Music**：粘贴网易云或 Spotify 分享链接，加载官方播放器，保存常听收藏。
- **Notes**：在当前浏览器自动保存便签。
- **Settings**：明暗主题（米白 / 暗色）、壁纸、壁纸动效、CRT 扫描线（开关 + 粗细四档）。
- **About Computer**：查看桌面说明。

桌面支持打开、聚焦、拖动、方向键移动、最大化、最小化和关闭窗口，任务栏可恢复窗口。移动端使用单窗口布局，支持减少动态效果偏好。

### 访客模式（需要访客名与密码）
默认账户名MK，密码12345678
桌面上的 **访客模式** 窗口是留给受邀访客的入口（桌面上点图标、开始菜单里选，或直接访问 `/terminal?app=visitor`）。输入 Marcus 给出的访客名与密码，由后端校验；通过后进入的是**这位访客自己的访客页**，而不是任何固定内容——页面上只列出服务器按账号授权给他的应用，以及一个「退出访客模式」按钮。每个访客可以拿到的应用各不相同：给谁开什么应用，完全由后端记录决定，桌面上也只有被授权的应用才会出现图标。

账号与授权来自服务器：`work/visitor-accounts.json` 里每个访客是一条 `{username, name, password_hash, apps}` 记录（用 `scripts/add-visitor.py <访客名> --generate --apps <应用 id>` 维护，密码只以 PBKDF2-SHA256 哈希保存，明文永不落盘）；`DATABASE_ENABLED=true` 时再叠加上数据库的 `visitor_accounts` 表（`apps` 列存逗号分隔的应用 id，MySQL 与 PostgreSQL 都支持），两份合并读取、同名访客直接拒绝，所以接了数据库以后 JSON 里原来的账号照常可用。应用本身是**一个应用一个文件夹**：`work/visitor-apps/<id>/` 里放 `app.json`、入口 HTML（及它引用的 js/css/图片）与 `assets/`（该应用自己的图标与壁纸）。移植一个应用 = 复制这个文件夹到对方服务器，再给对方账号授权该 id。界面在登录后由服务器下发（`entry`），可按 `permissions` 申请上传（`files`）与键值数据（`data`），也能内嵌 `embeds` 里声明的第三方源；示例见 `docs/visitor-app-example/`。

**前端在登录前不含任何访客应用素材**：没有应用组件、没有应用文案、没有应用自己的壁纸与图标文件名（桌面自己的壁纸是公开素材，见文末）。登录接口只接受访客名与密码两个字段，后端校验成功后签发绑定当前浏览器会话的 120 秒签名，Next 校验后写入 30 天的签名 `HttpOnly` Cookie，Cookie 里只带访客标识和他被授权的应用 id（服务端签名，改不了）。之后应用列表、应用视图、壁纸与图标都经 `/api/visitor/*` 代理到后端，由后端按账号复核授权后才返回；未授权、未登录或直接猜接口都拿不到任何内容。登录按客户端维度限流（默认 6 次/分钟、30 次/小时），同一访客名连续失败 10 次会锁定 15 分钟；密码不写入浏览器存储，Agent 没有凭据、不能代登录、不会索要密码，也不会透露某位访客能用哪些应用。

### MARCUS Music 音乐软件

从 Terminal 桌面和开始菜单中的 **MARCUS Music** 打开音乐软件（桌面之外的面板里，**音乐** 标签与磁带按钮是同一个入口）。粘贴平台分享链接并点击“加载”，再使用官方播放器里的播放按钮。网易云支持歌曲和歌单；Spotify 支持歌曲、专辑、歌单、音乐人和播客。输入链接会自动识别平台，分享文案里的完整链接也可使用。短链接（`163cn.tv`、`spotify.link`）请先在原平台打开，再复制完整地址。

可以给收藏命名，最多保存 20 个。收藏仅保存在当前浏览器，各页面共用同一份收藏，刷新或关闭音乐窗口后仍可恢复。

音乐会话和唯一的官方 iframe 由根布局持有。通过站内链接切换栏目、收起助手面板、切回 Agent 标签或最小化桌面音乐窗口，都保留当前播放器。选择网易云或 Spotify 平台按钮只切换链接输入入口；加载另一首音乐时才替换当前播放器。点击“停止播放”、入口旁的停止按钮，或关闭 Terminal 的 MARCUS Music 窗口会停止播放；刷新网页、关闭浏览器标签页或退出网站也会结束当前播放。

集成使用平台官方 iframe，不需要额外 API 密钥。提供网易云与 Spotify 官方登录入口，登录发生在官方页面；当前没有音乐账户绑定或个人歌单同步，内嵌播放器也不保证继承会员状态；播放范围与预览时长由平台的版权、地区、登录状态及浏览器支持决定。若播放器空白或不能播放，使用“在原平台打开”。应用不下载或代理音频，也不读取平台登录凭据。MK Agent 可介绍音乐软件，但不能控制播放器或读取本地收藏。

## 本地启动

当前工作区已经安装依赖并配置好本地密钥。在项目根目录运行：

```bash
backend/.venv/bin/python scripts/dev.py start
backend/.venv/bin/python scripts/dev.py status
backend/.venv/bin/python scripts/dev.py stop
```

| 服务        | 本地地址                                             |
| --------- | ------------------------------------------------ |
| 站点入口（桌面）  | http://127.0.0.1:3010/terminal                   |
| 旧地址       | `/my-world`、`/about`、`/contact`（307 跳转，查询参数原样保留） |
| 后端 API 文档 | http://127.0.0.1:8110/docs                       |

本地开发的后端端口是 **8110**（不是 8010）：Windows 常把 7964–8063 整段列为保留端口，8010 会绑不上（`WinError 10013`），所以本地让开这一段。生产仍用 8010。

本地开发时 `http://127.0.0.1:3010/` 根路径是 404——根路径在线上属于主站，应用不接管它，直接打开 `/terminal` 即可。

前后端绑定回环地址。Harness SDK 在后端按请求管理本地运行时子进程，不需要额外网关端口。启动脚本保留本项目已有进程，端口被其他进程占用时停止并提示。日志和 PID 位于 `work/marcus-*.log` / `work/marcus-*.pid`。修改后端或模型配置后，停止并重新启动。

### Windows 本地启动

`scripts/dev.py` 依赖 `lsof` 与 `.venv/bin/python`，只能在 macOS/Linux 上运行。Windows 使用 `scripts/dev-win.bat`，用法与上面一一对应；前端首次编译需要 10-30 秒。

```bat
scripts\dev-win.bat start
scripts\dev-win.bat status
scripts\dev-win.bat stop
```

依赖 Python 3.11 或 3.12（3.13 及以上没有锁定的依赖轮子）、Node.js 20.9 及以上。安装后需要自己填写两处内容：`backend/.env` 的 `DEEPSEEK_API_KEY`，以及访客模式账号 `work/visitor-accounts.json`（用 `python scripts/add-visitor.py <访客名> --generate` 生成；没配置时只有访客模式提示「尚未配置」，聊天不受影响）。详见 [scripts/LOCAL-DEV.md](scripts/LOCAL-DEV.md)。

### 首次安装到新环境

需要 Node.js 20.9+、Python 3.11+；官方 SDK 会安装同版本、与平台匹配的原生运行时 wheel。

```bash
python3.12 -m venv backend/.venv
backend/.venv/bin/python -m pip install -r backend/requirements.txt
(cd frontend && npm ci)
cp backend/.env.example backend/.env
```

在本机编辑 `backend/.env`，填写自己的 DeepSeek 密钥。不要把密钥提交到 Git，也不要写入 `NEXT_PUBLIC_*` 变量。

```dotenv
DEEPSEEK_API_KEY=replace_locally
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-flash
DEEPSEEK_REASONING_EFFORT=low
DATABASE_ENABLED=false
```

无需 PostgreSQL 即可使用当前桌面与聊天功能。现有数据库相关代码保留为可选功能；`docker-compose.yml` 尚未更新至此次 Harness 架构，当前完整启动入口为上面的本地脚本。

## DeepSeek Harness 架构

独立生产入口为 `https://example.com/terminal`，经反向代理（服务器本机 nginx，或专属 Cloudflare Managed Tunnel）访问服务器上的新站服务。服务模板、构建步骤、公网验收和回滚方法见 [deployment/README.md](deployment/README.md)。

服务器侧要留意的四件事：Tunnel 的 hostname 与 ingress 要指向本站（`/etc/marcusweb/tunnel.env` 那份配置）、`frontend.env` 的 `SITE_ORIGIN` 与 `backend.env` 的 `CORS_ORIGINS` 都只能写 `https://example.com` 这样的 origin，**不能带 `/terminal` 路径**（浏览器 `Origin` 头里没有路径，漏改或写错会让同源校验拒绝所有聊天请求）、`NEXT_PUBLIC_APP_URL` 是构建时变量要在构建前设成 `https://example.com/terminal`、反向代理要把 `/terminal` 连同应用自己的接口与静态资源路径（`/_next/*`、`/images/*`、`/fonts/*`、`/favicon.ico`）转给 Next，把 `/` 留给主站。生产聊天默认使用同源 `/api/chat`；后端地址只通过 Next 服务端的 `PYTHON_API_URL` 设置。请勿将本机 `.env.local`、虚拟环境或运行轨迹包含在发布包中。

```text
Terminal 桌面的 MK Agent 窗口 / 非桌面页面的站内面板
  → 根布局共享 Agent 会话、草稿与进行中的请求
  → Next.js /api/chat（同源代理）
  → FastAPI /api/chat/（校验、超时、SSE 与错误转换）
  → 官方 deepseek-harness-sdk
  → 官方 dsh 原生运行时 / Cordis 插件系统
  → DeepSeek V4 Pro（模型循环）
  ↔ site_info / desktop_apps（受限站内工具插件）
```

使用官方 `sdk-minimal` profile 并通过 `agent/website.patch.yml` 定制组合，不修改 Harness 源码。站内插件 `agent/website-tools.mjs` 注册两个工具：

- `site_info`：查询站内公开栏目、描述、桌面深链接及助手入口。
- `desktop_apps`：查询桌面软件的用途和能力范围，以及 Agent、音乐、访客模式在其它页面的使用方式。访客模式只描述成「需要 Marcus 发放的访客名与密码」，工具没有凭据、也不能代登录。

此站点组合禁用默认 shell 工具及其执行基础设施，未加载文件编辑、浏览器、搜索等通用工具；插件还会阻止所有非站内工具执行。它不读取本机文件、便签或外部网站。About/Contact 的真实公开内容由 MARCUS Browser 展示；Agent 使用整理后的公开资料，不读取原始简历，只称呼作者为 MARCUS，不透露、确认或猜测真实姓名。

每个请求使用独立 SDK 运行时与随机会话 ID。浏览器的历史保留 `role/content`，作为结构化 `previous_context` 传入 SDK，当前问题独立放在 `input` 中。SDK 当前接收单次用户提示，未使用不存在的 OpenAI messages 导入接口。Harness 的 JSONL 轨迹位于 `work/deepseek-harness-home`；没有跨设备账户或聊天同步。

生产前后端只监听回环地址，经反向代理（本机 nginx 或 Cloudflare Tunnel）进入，客户端地址按入口方式二选一取用。聊天使用签名 HttpOnly 会话、CSRF 与固定来源校验，前后端用内部令牌鉴权；限制请求体、消息长度、可用参数和并发，SQLite 按分档持久化付费轮次额度：匿名按签名设备 cookie 20 条/12 小时，同一出口地址上再压 100 条/12 小时的聚合上限（清 cookie 换不到更多），登录访客按账号 100 条/12 小时，另有全站硬顶与 12/分、60/时的突发限制；访客登录另有一套更小的窗口与按访客名的失败锁定。只信任由 Cloudflare 注入的客户端地址；匿名会话不是用户身份认证，仍需关注额度消耗。模型密钥仅由服务端传入运行时环境；配置模板不含密钥，访客密码的哈希只留在后端进程内（不进系统提示、不进工具环境）。请求取消、客户端断开、超时后会关闭对应运行时子进程。浏览器接收站内工具执行状态及文本事件；中文 UTF-8、SSE 跨分包、断流与 RESET 的旧请求写入均有回归验证。

当前官方 Python SDK 0.1.5rc1 未对外转发逐 token 通知，因此工具状态实时更新，回答生成完毕后整段显示；页面没有人工模拟打字效果。

官方资料：[DeepSeek Harness](https://www.deepseek.com/harness/en/)、[源码与 Python SDK](https://github.com/deepseek-ai/deepseek-harness/tree/main/python/sdk)。本项目固定 `deepseek-harness-sdk==0.1.5rc1`，它仍是官方开发者预览版本。

## 验证命令

```bash
(cd backend && .venv/bin/python -m unittest discover -s tests -v)
node --test agent/tests/*.test.mjs
(cd frontend && npm test)
(cd frontend && npm run type-check)
```

## 项目目录

```text
frontend/                 Next.js 网站、像素桌面与桌面软件
frontend/apps/            桌面应用目录（可装卸；见 frontend/apps/README.md）
backend/                  FastAPI 与官方 Harness SDK 集成
agent/website.patch.yml   站点专用 Cordis 组合补丁
agent/website-tools.mjs   无外部 I/O 的站内工具插件
scripts/dev.py            前后端本地服务管理
docs/APP-DEVELOPMENT.md   应用开发与部署教程（系统应用 / 访客应用）
docs/visitor-app-example/ 访客应用示例（可直接复制）
work/                     运行时、日志、轨迹与临时验证文件（忽略提交）
outputs/                  预览素材与使用说明（本地交付文件）
```

改动历史（按天记「改了什么 / 为什么 / 怎么验证」）见 [CHANGELOG.md](CHANGELOG.md)；各子系统的设计原理、不变量与实测数字见 [DESIGN.md](DESIGN.md)。

默认壁纸是本项目的 `/images/cloud.jpg`；「猫咪小岛」那张由已授权的 `gpt-image-2` CLI 生成，经 128 色与方像素处理后转为无损 WebP，同样放在 `/images/` 下，无需外链图片服务。

桌面壁纸都是站点自己的素材，和访客应用那套按账号下发的私有素材（`/api/visitor/asset`）是两条路，任何一张桌面壁纸都不含访客信息。

「夜泊」是其中唯一带逐帧动画的一张：海报（`wallpaper-*.webp`）打底，`ambience-*.webp` 是排成一行的精灵图，`manifest-*.json` 记下 8 个区域各自在画面里的位置与每帧的时长，组件按这些时长把当前帧画到区域对应的 `<canvas>` 上——猫尾静止 3.2 秒后摆 17 帧，灯光与水面倒影各有自己的循环。所以它只在选中且允许动效时才下载精灵图：手机、省流、`prefers-reduced-motion` 或「关闭」档都只显示海报。文件名里的 12 位十六进制是内容哈希，`next.config.ts` 据此给了 `immutable` 长缓存；换素材要同时改文件名与 `night-harbor-assets.ts`。

### 明暗两套主题

桌面有米白（默认）与暗色两套配色，在 **Settings → 外观** 里切换，选择只存在当前浏览器（和其它桌面偏好一起）。

亮色就是原来的样子，一个像素都没有改：暗色不是手写的第二套样式表，而是 `scripts/desktop-theme.mjs` 从亮色 CSS **算出来的覆盖表**（`frontend/src/app/terminal/desktop-dark.css`）。生成器给每个颜色按用途定角色——正文、面板、边线、斜面、指示灯、压在深底上的浅字——再各自压到暗色区间，并且保住彼此的明暗次序，所以按钮的亮边/暗边、面板与窗口的层次感在暗色下依然成立。

暗色调子按**绿屏终端**（RobCo 那种）的三条规则来分：**① 屏幕是黑的**——屏幕里的一切底子（窗口、面板、输入框、任务栏、菜单）压在 3%–9% 亮度，只带一丝绿味，是黑屏而不是深灰面板；**② 屏上画出来的都是绿的**——文字、框线、斜面、光标都是同一支磷光绿，所以正文不是中性灰；**③ 主次靠绿的亮度分**，选中项**反白**（绿底黑字，还带一点辉光），这是终端里最醒目的那类高亮。绿之外只留三样：**机箱**（外壳与屏幕边框，暗金属灰、饱和度 0.08，看得出是"机器"而不是屏幕）、**琥珀**（忙碌点）、**告警红**（报错与删除）。

三个亮度档位是算出来的：正文 88%、次要文字 59%、提示 54%（下限保证黑底上仍有 4.5:1）。反白只给**纯文字**的行（发送键、当前栏目、进度摘要）——任务的图标是光栅画、不跟 `currentColor`，亮绿底会把浅色图标吃掉，所以带图标的那几处仍用暗绿条。屏幕玻璃感（四角压暗 + 一点绿辉光）由生成器补在 `.computer-screen::before` 上，只有暗色有。

**CRT 扫描线**（Settings 里的开关 + 粗细四档）现在是**动态的**：一道道光栅缓慢下滚，每档一个周期（细 2s / 中 2.7s / 粗 4s，匀速约 1.5px/秒）。粗细可选**自动 / 细 / 中 / 粗**，三档按**线宽**单调递增——细 **1px** 线 / 3px 周期、中 **2px** / 4px、粗 **3px** / 6px；只变密度不变线宽是分不出来的（试过，中与粗都是 2px 时看着几乎一样）。默认自动：**明亮取细**（米白屏上刚好）、**暗色取中**（1px 细线压在近黑屏上等于没有），线色也按主题分（明亮深绿 5%、暗色纯黑 25%）。

动画用 `transform: translateY` 而不是 `background-position`——前者走合成器，后者每帧要重绘一整屏；叠加层向上多出一个周期，滚动一个周期后与起点完全重合，所以既无缝也不会在循环边界露边。系统开启「减少动态效果」时，线还在但保持静止（由文件末尾那条全局规则统一关掉动画）。

几条边界：

- 每条暗色规则都挂在 `html[data-theme="dark"] .marcus-desktop-page` 下（属性选择器让它的优先级必定高于对应的亮色规则），所以**站内助手面板与 404 这类页面完全不参与主题**。
- 壁纸画面、桌面图标标签、水印这些都是「画在图上的颜色」，按原样保留；主题预览的两个色块也是固定的。
- 动明暗只影响桌面，访问者看不到一帧米白：主题在手写引导脚本里于首屏之前就写进 `<html data-theme>`。
- 改了亮色 CSS 就要重新生成：`npm run theme:dark`；`npm run theme:report` 会打印色表并自检出「暗色下还亮着的面板 / 还看不清的字」。`npm test` 里有一条测试校验生成物与亮色 CSS 同步，忘了重跑会被逮住。
