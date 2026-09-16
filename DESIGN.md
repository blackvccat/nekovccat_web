# 技术设计文档：MARCUS

写给**要改这个项目的人**：站点由哪些部分组成、每块为什么这么设计、实现落在哪里、不变量是什么、改完怎么验证。

示例账号为"MK"  密码为"12345678"

| 想知道 | 看 |
| --- | --- |
| 站点是什么、怎么本地跑、怎么用 | [README.md](README.md) |
| 每个文件是干什么的（穷举） | [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) |
| 访客账号与数据库 | [deployment/DATABASE.md](deployment/DATABASE.md)、接 MySQL 见 [deployment/MYSQL.md](deployment/MYSQL.md) |
| **架构与设计原理（本文）** | —— |

其它目录里的文档（backend / deployment / scripts / frontend，以及仓库外那两份）逐条列在文末 **§17 文档地图**。

当前规模：**后端 109 条单测、前端 153 条、`tsc` 0 错、`npm run build` 通过**。

---

## 1. 站点是什么

一台**可交互的像素风复古电脑**：打开 `/terminal` 就是桌面，桌面里跑着站内 Agent、站内浏览器、音乐、便签、设置与外设说明；受邀访客用访客名与密码登录后，会看到**属于他自己的**应用与素材（由服务器按账号授权）。域名根路径 `/` 留给主站，顶栏 HOME 指向那里。

功能地图：

| 功能 | 一句话 | 前端入口 | 后端 |
| --- | --- | --- | --- |
| 像素桌面 | 窗口管理、任务栏、开始菜单、深链接 | `components/my-world/pixel-desktop.tsx` | —— |
| MK Agent | DeepSeek Harness 驱动的站内助手，流式回复 + 执行进度 | `components/agent/` | `/api/chat`（SSE） |
| MARCUS Browser | 关于 / 项目 / 长廊 / 联系四栏目，正文构建期静态 | `components/my-world/marcus-browser.tsx` | —— |
| MARCUS Music | 网易云 / Spotify 官方播放器 + 收藏 | `components/my-world/music-app.tsx`、`components/music/` | `/api/music/netease/playlist` |
| Notes | 便签与保存列表（全在本浏览器） | `components/my-world/desktop-apps.tsx` | —— |
| Settings | 明暗、壁纸、壁纸动效、CRT 扫描线（开关 + 粗细） | 同上 | —— |
| About Computer | 桌面说明卡 | 同上 | —— |
| 访客模式 | 登录、按账号下发的应用与私有素材 | `components/visitor/`、`my-world/visitor-login.tsx` | `/api/visitor/*` |

---

## 2. 架构总览

### 2.1 两条线

本仓库是 **MARCUS** 线。另一条线是**主分支（NEKO / My World）**，两份代码同源，所以能逐文件对照。本项目的做法是**按清单逐项采纳**：每条写成 BACKLOG 里的稳定 ID（`A*` Agent 能力 / `S*` 安全缺口），带改动文件、依赖与验证方式；**不接受的也写下来**（伴侣彩蛋线、队列式并发器…），免得以后重复讨论。

### 2.2 进程与目录

```
浏览器
  └─ nginx（只按精确前缀转发；限速待做，见 §13.3）
       └─ Next（frontend/，standalone server.js，3010）
            ├─ 页面 /terminal：像素桌面 + 桌面应用
            ├─ /api/chat[...]：代理 + 会话凭证 + CSRF + body 前置校验 + 廉价限流
            └─ /api/visitor[...]：访客模式（登录、状态、应用视图、私有素材）
                 └─ FastAPI（backend/，uvicorn 8010，单 worker）
                      ├─ app/security.py：令牌、身份归一、额度、并发、试次闸门（中间件）
                      ├─ app/services/*：配额库、Agent 运行时、流缓冲、遮蔽、访客注册表
                      └─ DeepSeek Harness 子进程（agent/ 的站点工具插件 + 组合补丁）
```

### 2.3 一次聊天请求的链路

| 层 | 职责 | 限额/防护 | 代码 |
| --- | --- | --- | --- |
| 浏览器 | 输入、流式渲染 | 前端试次闸门（3 发/10 秒） | `lib/server/chat-attempt-limiter.ts`、`app/api/chat/route.ts` |
| Next | 会话 nonce、CSRF、来源校验、body 前置校验 | 读 body 截止 5s、长度上限 | `lib/server/chat-security.ts` |
| 后端中间件 | 令牌 → 身份 → 路径归一 → body 校验 → 试次闸门 → 额度 → 并发 | 见 §7.6 | `backend/app/security.py` |
| 后端服务 | Agent 运行时、事件流、投影与遮蔽 | 并发 3、通知/正文上限、流缓冲水位 | `services/ai_service.py`、`stream_buffer.py` |
| Harness 子进程 | 模型循环、站内工具 | 工具白名单执行前二次校验 | `agent/website-tools.mjs` |

完整调用链（`backend/app/services/ai_service.py:120` 起）：`chat.py:52` → `AIService._run` → `manager.acquire`（按存活租约再卡一次并发）→ 工作线程 `lease.start/run` → SDK 子进程的 `on_notification` 回调 → 投影/遮蔽 → `StreamBuffer.publish` → `_run` 里的 `buffer.get` → SSE 生成器 → 浏览器。

### 2.4 前端外壳与 Provider 层级

`app/layout.tsx:47-59` 由外到内：**`MusicSessionProvider` → `VisitorModeProvider` → `AgentSessionProvider`**。

- 音乐最外：根部只渲染**一个** `PersistentMusicPlayer` iframe，它必须跨路由存活，所以 provider 要在最外层；
- Agent 最内：桌面窗口与右下角面板都要用；
- `SiteMusic`（右下角面板）在 `/terminal` 直接 `return null`（桌面自带音乐窗口），其它页面常驻，内含 Agent / Music 两个 tab。

---

## 3. 前端：像素桌面

### 3.1 窗口管理器（`components/my-world/pixel-desktop.tsx`）

- **状态**：`DesktopWindow{id,x,y,z,minimized,maximized}`；id 是 `DesktopAppId` 或 `visitor-app:<id>`（访客应用与桌面应用共用一套窗口，:21-23）。窗口数组只增不重排，z 用 `zRef` 单调整数发号（:49）。
- **打开**：已存在则提 z 并取消最小化；否则按 `260+24n` 级联落位并夹进舞台（:148-162）。`appInfo()` 找不到的 id 一律丢弃（:56-62）——**未授权的访客应用不可能被打开**。
- **拖动**：标题栏 `pointerdown` → `setPointerCapture` + dragRef 快照，`pointermove` 用差值移动；最大化、非主键、窄屏（`max-width:700px`）时禁用（:206-210, 207）。
- **最大化**是布尔翻转（:200）；**最小化**只置位，窗口仍留在任务栏（:199）；**关闭**时联动 `stopMusic()`、收起侧栏、清掉访客主题（:246）。
- **键盘可达性**：标题栏 `tabIndex=0` + 方向键每次 16px 移动（:239, 242-245）；`onFocusCapture`/`onPointerDownCapture` 提 z，Tab 到窗口即置顶（:238）。
- **z 序**不维护数组：`activeId` = 未最小化里 z 最大者（:76-77）。**舞台缩小**时 `ResizeObserver` 把窗口夹回可视区（:126-138）。

### 3.2 任务栏与开始菜单

任务栏列**所有**窗口（含最小化的）；点已活动窗口 = 最小化，否则聚焦（:257）；「显示桌面」一键全最小化（:215）。开始菜单列全部应用（桌面应用 + 已授权访客应用）（:253）。

**刻意隐藏信息**：`startMenuNote` 抹掉访客应用的副标题与登录后访客窗口的提示语（:74-75, 236-237），访客窗口状态栏用 `● SIGNED IN` 而不是副标题（:248）——系统 UI 不暴露"邀请"这件事。

### 3.3 深链接（`lib/desktop-links.ts`）

- `?app=explorer&tab=about|projects|gallery|contact` → 打开站内浏览器并定位栏目；`?app=visitor` → 打开访客窗口；其它值若命中已授权访客应用 id 则开对应窗口（`pixel-desktop.tsx:170-176`）。
- 整个查询串作为 launch key，`lastLaunchQuery` ref 防重复消费；`tab` 变化也算新启动，所以 key 必须含 `tab`（:39-41, 164-166），并由自增的 `key` 驱动浏览器重置历史（`marcus-browser.tsx:18-21`）。
- 白名单外回落 `about`（`desktop-links.ts:6-8`）；Agent 回复里的站内链接同样受白名单约束（`lib/api/site-links.ts:2`），其余保持纯文本。

### 3.4 桌面应用一览

| 应用 | 数据从哪来 | 本地存储 key（写在哪个文件） | 边界行为 |
| --- | --- | --- | --- |
| MK Agent | 后端 SSE | `my-world-conversation`（沿用旧名，`lib/api/chat-history.ts`） | 问候/失败/系统提示**不进模型历史**（`lib/api/chat-history.ts:20-30`）；进度面板不含工具参数与推理 |
| SIGNED IN | 后端 `/api/visitor/*` | 无（凭据是 HttpOnly Cookie） | 未登录是登录表单，登录后是访客页 + 授权应用卡片；密码不落存储 |
| MARCUS Browser | 构建期静态 `content/` | 无 | 自带 `history[]+index`（追加 `slice(-40)`，前进后退只挪 index） |
| MARCUS Music | 官方 iframe + `/api/music/*` | `marcus-music-library-v1`（收藏，上限 20，`components/music/music-session.tsx`） | 收藏恢复时**重新解析校验 URL**；`storage` 事件跨标签同步 |
| Notes | 全本地 | `marcus-desktop-note`（草稿）、`marcus-desktop-notes-v1`（列表，上限 40）——都在 `lib/desktop-notes.ts` | 恢复时逐字段截断 + 去重，坏条整条丢；存储不可用降级为"仅本次保留" |
| Settings | 全本地 | `marcus-desktop-settings`（`pixel-desktop.tsx` 读写、`app/terminal/page.tsx` 首屏读） | 读档逐字段兜底（§11） |
| About Computer | 纯静态 | 无 | —— |

### 3.5 站内浏览器

四栏目 about / projects / gallery / contact；正文**全部来自构建期静态数据** `content/profile.ts`（`PROFILE`：7 条经历、7 个项目、12 项技能）与 `content/showcase.ts`（长廊 8 件：7 视频 + 1 图），前端不发任何请求。长廊缩略图是本地 WebP，点画框在新标签打开主站播放器（`showcaseLink()`）。图片一律 `unoptimized` + 显式宽高（静态导出友好）。

### 3.6 音乐

- **只认官方 iframe**：`lib/music/links.ts` 不联网，把分享链接折算成固定的 `embedUrl` / `autoplayUrl`；解析时**先看原始 authority/path 再交 URL 规范化**，防编码主机、反斜杠、点段欺骗（:78）。
- **歌单**：`/api/music/playlist` 代理到 FastAPI（`limit` 夹 1..100）。官方外链播放器固定只给 10 首，所以网易云歌单**自己列 50 首**（`lib/music/playlist.ts:4-5`），仅 Spotify 或列表失败时才挂 iframe。
- **唯一 iframe**：`PersistentMusicPlayer` 在 Provider 根部渲染一次，宿主只渲染 `MusicPlayerSlot` 占位并登记几何（`music-session.tsx:99-114`）——iframe **永不 reparent**，所以切页、关窗、最小化都不断音。
- **几何裁剪**：`clipPlayerRect` 求「槽位 ∩ 所有 overflow 祖先 ∩ 视口」，返回裁剪矩形与帧内偏移（`lib/music/geometry.ts:21-48`）；测量挂 `ResizeObserver` + `MutationObserver` + 捕获阶段 scroll/resize + `visualViewport`。

### 3.7 便签

两个 key：草稿与保存列表。`restoreSavedNotes` 对每条做形状校验、超长截断、去重，坏条丢弃而不是整份作废（`lib/desktop-notes.ts:16-36`）；手机端列表是整屏视图（`desktop-apps.tsx:64`）。

---

## 4. 访客模式

### 4.1 状态机与登录

```
EMPTY ──探测 /api/visitor/status──▶ isReady ──登录──▶ unlocked
   ▲                                                    │
   └──────────────── lock()（调 logout 清 Cookie）────────┘
```

`unlock()`（`components/visitor/visitor-mode.tsx:31-89`）：先取 `/api/chat/session` 的 nonce → 以 `X-Marcus-CSRF` 打 `/api/chat/visitor-login` → 成功后重拉 status 并清 `themedAppId`。服务端在解码 proof 时校验 nonce（`app/api/chat/visitor-login/route.ts:63`），Cookie 是 `HttpOnly` + `SameSite=Strict`（同文件 :68-70）。**status 路由会在授权变化时重写 Cookie 里的 apps 列表**（`api/visitor/status/route.ts:21-31`），所以授权调整无需重新登录。

登录侧限额：**6 次/分钟、30 次/小时**，同一访客名连续失败 10 次锁 15 分钟；前端另有一把 3 发/10 秒的廉价桶，走 `login:` 前缀，**与聊天不共用**（共用会让"刚聊过几条就去登录"被误伤，也会让攻击者的登录尝试混进聊天流量）。

### 4.2 应用视图的通用区块协议（`lib/visitor-view.ts` + `components/visitor/visitor-blocks.tsx`）

前端只认**协议**：10 种区块（heading / text / letter / counter / checklist / files / notice / footer / link / image）与 3 种动作（wallpaper / link / logout）。**应用自身的文案与素材全部来自后端**，所以登录前的前端文件里没有应用组件、没有应用文案、没有应用素材文件名；未知区块类型返回 `null` 以向前兼容（`visitor-blocks.tsx:65`）。

### 4.3 私有素材与主题壁纸

- 素材只经 `/api/visitor/asset?app=<id>&kind=wallpaper|icon` 下发；服务端三重校验：`kind` 枚举 + 该账号是否被授权 + 文件名取自注册表，且 `resolve()` 后要求 parent 等于素材目录（`backend/app/services/visitor_apps.py:214-228`）。缓存头 `private, no-store`。
- `hasWallpaper` 的应用在**打开/聚焦**时把桌面 stage 换成它的壁纸并显示水印，失焦或关闭即清（`pixel-desktop.tsx:222-229, 143-146, 246`）——访客的私有画面不会在桌面上停留。

### 4.4 账号注册表（`backend/app/services/visitor_*.py`）

| 件 | 管什么 | 要点 |
| --- | --- | --- |
| `visitor_accounts` | 账号与密码哈希 | PBKDF2-SHA256 **600k 次**、16 字节盐、格式 `pbkdf2_sha256$600000$salt$digest`；未知用户名也走 `DUMMY_HASH`（时间上分不出账号是否存在）；NFKC + casefold 归一；**文件与数据库合并、重名直接拒绝**（不猜用哪份密码）；数据库故障**不回退文件**（避免静默降级门禁） |
| `visitor_apps` | 应用注册表（授权 id 的唯一来源） | 纯文件；区块类型白名单；素材路径解析限制 |
| `visitor_access` | 短时凭证 | 2 分钟 HMAC proof；Cookie 里只带访客标识与被授权应用 id |
| `visitor_throttle` | 登录窗口 | 按用户名滚动窗口 + 失败锁定 |

### 4.5 退出

`lock()` 调 `/api/visitor/logout`（只清 Cookie，后端不存会话）→ 前端清 state 与 `themedAppId` → **卸载全部访客窗口**（`visitor-mode.tsx:83-87`）。

---

## 5. 后端：结构与接口

### 5.1 应用装配与中间件顺序

`lifespan`（`app/main.py:14-31`）：建**进程级** `AgentRuntimeManager` 存入 `app.state.runtime_manager`；`DATABASE_ENABLED` 且非 test 才 `init_db()`；启动即 `await manager.initialize()`——让配置缺失在 `/api/ready` 暴露，而不是等第一个付费用户来踩；关闭时 `shutdown()` + `close_db()`。

中间件添加顺序与**实际执行顺序相反**（Starlette 后加者在外层），所以自外向内是：**`RequestTelemetry` → `ChatProtection` → `CORS` → 路由**。遥测在最外，是为了被拒的请求也记账。

**关键：`ChatProtection` 只在 `ENVIRONMENT=production` 生效**（`security.py:54-55`）——本地开发不会撞额度；单测显式把 `ENVIRONMENT` 设成 `production` 来验证它（`tests/test_security.py:42` 起）。生产缺 `INTERNAL_API_TOKEN`（<32 字符）时**所有受保护路径直接 503**（fail-closed）。

### 5.2 路由清单

| 路径 | 方法 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| `/api/chat/` | POST | 内部令牌 + 身份额度 | `?stream=true` 走 SSE；`protocol=v2` 用替换语义；`AIServiceError → 其状态码`，流内错误发 `{error,done:true}`；断开 → 499 |
| `/api/health`、`/api/ready` | GET | **无** | ready 四项检查（agent 配置 / 令牌长度 / 配额库可写 / 可选数据库），任一失败 503；**不拉起子进程、不碰模型** |
| `/api/visitor/login` | POST | 内部令牌 + 登录窗口 | 入 `username/password`（`extra=forbid`），出 `name/username/apps/proof` |
| `/api/visitor/apps`、`/apps/{id}`、`/apps/{id}/assets/{kind}` | GET | 内部令牌 + `X-Marcus-Visitor` | 401 未登录/停用、403 无授权、404 素材缺失、503 注册表坏 |
| `/api/music/netease/playlist/{id}` | GET | 内部令牌 | `limit` 1–100；400/404/503 |

`/docs`、`/redoc` 只在 `DEBUG` 下开放。

### 5.3 服务层分工

- `ChatService`（`services/chat_service.py:10`）只做校验与响应包装；`AIService`（`services/ai_service.py:21`）持有运行时与 SDK。
- 输入打包（`ai_service.py:46`）：历史进 `previous_context`、本轮进 `input`；**不重放付费轮次**；推理、子会话、工具参数不出后端（:54-66）。

### 5.4 配置分组（`backend/app/config.py`）

| 组 | 键（默认值） |
| --- | --- |
| 路径 | `DSH_HOME=work/deepseek-harness-home`、`DSH_PATCH_PATH=agent/website.patch.yml`、`VISITOR_{APPS,ACCOUNTS}_PATH`、`VISITOR_ASSETS_DIR`、`CHAT_LIMIT_DB=work/chat-limits.sqlite` |
| SDK 上限/超时 | `DSH_REQUEST_TIMEOUT=180`、`DSH_MAX_TOKENS=4096`、`DSH_INITIALIZE_TIMEOUT=30`、`DSH_CLEANUP_TIMEOUT=5`、`DSH_MAX_NOTIFICATION_EVENTS=4096`、`DSH_MAX_NOTIFICATION_BYTES=2MiB`、`DSH_MAX_REPLY_BYTES=64KiB` |
| 额度 | 窗口 12h、设备 20、IP 100、IP 24h 150、访客 100、全站 800、并发 3 |
| 出站水位 | `CHAT_STREAM_MAX_EVENTS=128`、`CHAT_STREAM_MAX_BYTES=64KiB`、心跳 15s |
| body / 试次闸门 | `CHAT_BODY_MAX_BYTES=65536`、`CHAT_BODY_TIMEOUT_SECONDS=2`、burst 4 / 回填 10s、冷却 30→900s、缓存 4096 / 1800s、全站桶 60 + 20/s |
| 访客登录 | 6/分、30/时、10 次失败 / 900s |

带上限校验的只有三项：`CHAT_SQLITE_TIMEOUT_SECONDS le=10`、`CHAT_BODY_MAX_BYTES le=1048576`、`CHAT_BODY_TIMEOUT_SECONDS le=2`。突发额度 `BURST_PER_MINUTE=12` / `BURST_PER_HOUR=60` 硬编码在 `security.py:28-29`。

---

## 6. Agent

### 6.1 组合补丁（`agent/website.patch.yml`）

基线是官方 `sdk-minimal`：**禁用 persistent / terminal-bash / pwsh / pty / subprocess / sandbox(-policy) / jobs 共 9 项**，`tools.mode=native`——即模型在这个子进程里**没有 shell、没有文件系统、没有网络**。用令牌 `__WEBSITE_TOOLS_MODULE__` 插入站点工具模块；后端 `prepare()` 把令牌替换成 `agent/website-tools.mjs` 的绝对路径并写进 `DSH_HOME`（`runtime_manager.py:138-141`）。

`progressive_bridge.mjs` 是**另一个独立补丁**（只把逐 token 的瞬态帧桥出 stdio），仅在 v2 请求时一并挂载——两者不是一处。

### 6.2 工具清单与能力边界

| 工具 | 作用 | 参数 | 返回 |
| --- | --- | --- | --- |
| `site_info` | 查公开页面（home / about / terminal / contact）的标题、路径、简介 | 可选 `page` | 页面表或单页 |
| `desktop_apps` | 查 7 个桌面应用的能力边界，并给 `path=/terminal` | 可选 `app` | 应用表或单条 |

两个都**只读**。保障方式（`website-tools.mjs`）：

- 参数必须是 JSON object、**只允许出现一个字段**、用 `Object.hasOwn` 做枚举白名单（拒 `__proto__` / `constructor` / `toString` 等继承键）（:70-85）；
- 页面与应用两张表 `Object.freeze`；`ctx.tools.guard` 二次收口，非这两个名字一律拒绝（:166-170）；
- 不 import 任何 fs / net / process，无 `fetch` / `eval` / `require`（测试断言，`agent/tests/website-tools.test.mjs:146-149`）；
- 中途取消靠 `exec.signal.throwIfAborted()`（:134）。

**刻意不给的能力**：无访客凭据、不代登录、不索要密码、不读便签、不控播放器、不改设置。

### 6.3 v2 渐进协议与逐 token 的来源

`reply(phase=delta|final, message_id)`：换 `message_id` 即整段替换，`final` 权威覆盖；另有 `progress(stage, message)` 与空 `{content:"",done:true}` 哨兵；静默期每约 15 秒一行 `: keep-alive`（这是前端"空闲 45 秒超时"的前提）。

钉住的 SDK 不上报瞬态帧，只给最终结果——所以**逐 token 依赖子进程内的桥**。实测同一次提问：没挂桥整轮 9 个事件、正文在 2.33 秒一次性出现；挂了桥 93 个事件、`reply(delta)` 在 2.09→2.25 秒间陆续到达。结论：只搬前端解析器与后端投影不够。

### 6.4 运行时长治四件套

| 模块 | 职责 |
| --- | --- |
| `harness_adapter.py` | 只补「SDK 关子进程但漏关三根管道」的 workaround（每轮原本泄漏 2 个文件对象），等上游修复 |
| `runtime_manager.py` | 补丁**准备一次全进程复用**（:122-149，含 progressive patch）；`acquire` 按**真实存活租约**再卡一次 `CHAT_MAX_CONCURRENT`（:168）；`RuntimeLease` 引用计数让 close 与 run 赛跑不产生孤儿（:36-93）；`shutdown` 有超时（:212-217）。**它不池化运行时**——每轮仍是独立子进程 |
| `progressive_reply.py` | v2 投影：progress 去重、新 attempt 重置 message_id、逐字节上限、`final` 覆盖 delta 并清遮蔽尾 |
| `stream_buffer.py` | 线程 → 事件循环的**唯一交接点**：有界队列 + 同回复增量合并（≤4KB），满即 503 `slow_consumer` 并清队 |

### 6.5 前端行为（`components/agent/`）

| 能力 | 实现要点 |
| --- | --- |
| 按帧合并正文 | 一帧最多一次 setState，`final` 不等帧（`lib/api/chat-reply-buffer.ts`） |
| 草稿保留 | 流式中输入框不禁用；800ms 去抖写 localStorage + `pagehide`/`visibilitychange(hidden)` 强制落盘 |
| 停止 | flush → 断引用（避免误弹错误）→ dispose → abort → 标 `interrupted` |
| 重试 | 界面留半截回复，但从模型上下文剔除它（`retryableUserId` / `retryHistory` 两个纯函数） |
| 滚动跟随 | 8px 阈值 + wheel/触摸/键盘三路停止 + 「回到最新消息」按钮在滚动容器外 |
| 复制三态 | idle / copied / failed + 2.2 秒复位 |
| 进度面板 | 只含工具名、后端固定文案、状态与脱敏 `call_id` |
| 渲染开销 | `AgentMessage` / `ExecutionProgress` 走 `memo`，流式追加只重建最后一条 |

---

## 7. 限额、防洪与安全

### 7.1 四条设计原则

1. **廉价的前置门挡在最前面**：试次闸门在任何 body 解析与 sqlite 工作之前拦人。
2. **被拒也要计数**：`requests` 表只记放行的那一发，单靠它挡不住"一直被拒还一直打"。
3. **失败要可见**：宁可回带 `code` 的 503，也不静默堆积或截断正文；一轮 outcome 默认 `cancelled`，只有真发终态才算完成（日志不撒谎）。
4. **不阻塞事件循环**：sqlite 一律走 `asyncio.to_thread` 且有等待上限（`CHAT_SQLITE_TIMEOUT_SECONDS`）。

### 7.2 六档额度（滚动窗口，只算付费轮次）

| 档 | 额度 | 说明 |
| --- | --- | --- |
| 匿名设备（Cookie） | 20 / 12 小时 | 主档 |
| 匿名 IP 兜底 | 100 / 12 小时 | 清 cookie 时接住 |
| 匿名 IP 日上限 | 150 / 24 小时 | 管住"两段各刷满 100+100" |
| 登录访客 | 100 / 12 小时 | 按账号分桶 |
| 全站硬顶 | 800 / 24 小时 | 最后的钱包保险 |
| 突发 | 12 / 分钟 + 60 / 小时 | `security.py:28-29` |

窗口按**滚动**算（不按自然日切，否则 11:59 与 12:01 各刷一轮）。身份是 `HMAC(INTERNAL_API_TOKEN, ip)`——IP 不落库，伪造头也造不出新桶。**IPv6 按 /64 归一**，`::ffff:a.b.c.d` 与对应 IPv4 同桶（这是唯一能绕过全部额度的点）。地址解析失败一律 403：既不能当新桶（更松）也不能落共享桶（连累别人）。

### 7.3 试次闸门 `AttemptGuard`

内存令牌桶，挂在中间件最前面：单身份突发 4、每 10 秒回填 1、用尽即冷却 30 秒并按 `strikes` 翻倍（上限 900 秒，`strikes` 封顶 32）；另有全站桶（突发 60、20 发/秒）。**身份表满时拒新身份**，而不是挤出冷却中的老身份（fail-closed）。

前端也有一把同量级的桶（聊天 3 发/10 秒，第 4 发根本不发到后端）。**两把都要有**：一把在 Node 进程内，一把在 FastAPI 进程内。

### 7.4 并发与资源

- `CHAT_MAX_CONCURRENT = 3`：**两处共用同一个键**——中间件按身份数比一次，`RuntimeManager` 按存活租约再比一次。满了直接 429（**不做队列**：队列只会把等待搬进后端内存）。
- 同一键同时只允许一个在飞的轮次（连点不会拉起第二个子进程）。
- 单进程内存状态，**不要给后端加 worker**（§13.8）。

### 7.5 body 边界

| 位置 | 参数 | 行为 |
| --- | --- | --- |
| 后端中间件 | 65536 字节 / 2 秒 | 读完 body 校验，415/413/422 挡在额度与 sqlite 之前；通过后用 `replay_receive` 原样交回路由 |
| 前端 | `MAX_BODY_READ_MS = 5000` | 声明长度合法却拖着发 → 408；断开 → 499 |

收益是**畸形请求不再白扣用户额度**，也是"只有路由会接受的请求才该扣额度"这条不变量的落点。

### 7.6 中间件的判定顺序

```
1. 路径不在受保护前缀内 / 非 production → 直接放行
2. 方法不是 POST → 交给路由（405），不扣额度
3. 校验 INTERNAL_API_TOKEN（不符 403；生产缺失或 <32 字符 → 503 fail-closed）
4. 解析并归一客户端地址（非法 403）
5. 身份 = HMAC(ip)；路径归一（/api/chat → /api/chat/，避免 307 白扣两发）
6. 读 body 并前置校验（Disconnected→499 / InvalidBody→415/413/422 / 超时→408）
7. AttemptGuard.check(identity) → 冷却或全站桶 → 429
8. 并发与额度判定（走 to_thread）→ 429 / 503 quota_storage
9. 放行，用 replay_receive 把 body 交回路由
10. finally：槽位等判定落地后再摘（取消不漏名额）
```

第 10 步曾是**真 bug**：判定在 `to_thread` 里、取消对它无效，旧写法先摘槽位、线程随后才写回，于是每取消一次就永久占住一个并发名额，三次之后整站发不出消息。现在分"已落地／未落地（注册 done 回调）"两条走法。

### 7.7 密钥遮蔽与日志卫生

- `SecretRedactor`：密钥按长度降序，把"疑似某个密钥前缀"的尾巴扣住不发，切在任意位置都不漏一半；集合是 `(DEEPSEEK_API_KEY, INTERNAL_API_TOKEN)`。
- **两条协议都要遮**：v2 投影与最终文本、以及老协议的逐块增量（老路径曾漏遮——密钥在流里已经发出去了）。
- 日志只记固定字段：`agent_configuration` / `agent_stage` / `agent_turn`（含 `peak_buffer_bytes`、`cleanup_ok`）、拒绝时 `chat_rejected(code, status, active, queued)`。`LogHygieneTests` 断言密钥、上游诊断、工具参数、用户正文、提示词都不出现，并用"这些日志确实写出来了"做正向控制。

### 7.8 「瞬间 10 条」实测

| 场景 | 结果 |
| --- | --- |
| 同一台设备 10 并发 | 1 发 200、3 发 429「正在回复」、6 发 429 冷却；配额表只加 1 行；全部 24ms 返回 |
| 十个不同出口 10 并发（路由占槽 400ms） | 3 发 200、7 发 429；**同时占槽峰值恰好 3**；配额表只加 3 行；事件循环跳了 39 次 |
| 前端 10 并发（走 Next） | 3 发到达后端、7 发在 Next 就被挡，带 `Retry-After: 30` |

教训：**用瞬间返回的假路由测不出并发上限**——槽位在返回时就释放了，10 发会全过。

### 7.9 注入面与发布物卫生

一次针对性审查（登录注入 / Agent 注入 / API 泄露 / 发布物泄露）**没有找到可被利用的漏洞**，结论：

- **登录**：SQL 全参数化；未知账号走 `DUMMY_HASH` 付同样成本；失败计数对未知账号也记（锁定不成为枚举预言机）；密码只在前端停留一跳，不写浏览器存储。
- **私有素材**：三重校验（§4.3）；前端登录前不含任何应用组件、文案与素材文件名。
- **Agent**：工具白名单 + 冻结表 + own property 校验；工具模块内没有 `exec/spawn/fetch/readFile`；模型输出里只有**精确等于**白名单的站内路径才变链接；全仓没有 `dangerouslySetInnerHTML`。
- **API 与发布物**：nginx 只按精确前缀转发（后端 `/api/ready`、`/docs` 公网不可达）；密钥只在服务端，不出现在任何 `NEXT_PUBLIC_*`；`serverSourceMaps: false` 去掉 64 个服务端 `.map`；`work/`、`.env`、`*.map` 三类不许进发布包。

### 7.10 已知边界与挂账

| 项 | 状态 |
| --- | --- |
| **S12 nginx 边缘限速** | **未做**（唯一未做的清单项），步骤与实测命令见 SERVER-OPS 第八节第 1 条 |
| 线上复核 | 未做：SERVER-OPS 第八节第 3 条的复核表 |
| `TRUST_PROXY_IP` / `TRUST_CLOUDFLARE` | **必须开且只开一个**（线上用前者）；都不开时试次闸门的身份是常量，3 发/10 秒会落到整个站点上 |
| 歌单接口 | 只接受 1–20 位数字 id（SSRF 不成立），自身无限流，靠 S12 压 |
| 额度窗口粒度 | 滚动窗口以「小时」为粒度，跨边界仍有理论上的轻微超额 |

---

## 8. 桌面外观系统（主题生成器）

### 8.1 为什么是生成器

`desktop.css`、`desktop-software.css`、`music-app.css`、`agent-progress.css` 四份样式里有 **483 处带颜色的声明、432 个不同色值**，每个斜面的亮边暗边都是手调的。手写暗色版写不全，**漏掉的那一条就是暗色界面里的一块浅斑**。所以暗色由 `scripts/desktop-theme.mjs` 从亮色 CSS **算出来**（产出 `frontend/src/app/terminal/desktop-dark.css`：318 条规则 / 470 条声明，其中 20 条是"跟随主题 token"的副本）。亮色一个像素都不动。

### 8.2 角色模型

每条带颜色的声明先定**角色**（按属性 → 再按选择器与色值细分）：

| 角色 | 谁用它 | 细分规则 |
| --- | --- | --- |
| `screen` | `background*` 默认 | 屏幕里的底子 |
| `screen-state` | 交互态的 `background` | 悬停 / 按下 / 当前项 |
| `text` | `color` 默认 | 明度 >0.80 → `text-on-dark`；暖色够饱和 → `accent-text` |
| `edge` | `border*` | 交互态 → `highlight` |
| `shadow` | `box-shadow` / `text-shadow` / `filter` | 斜面与投影 |
| `highlight` | 交互态的文字与边线 | 链接、焦点圈、悬停 |
| `inverse` | 反白条（手写规则） | 选中项 |
| `machine` | `MACHINE` 选择器表：外壳、顶栏、机脚下巴、屏幕边框 | 机箱 |
| `bar` | `--navy`（活动窗口标题栏、开始菜单竖条） | 当前项 |
| `accent` / `accent-text` / `alert-surface` | 饱和填充 / 暖色文字 / 浅暖底板 | 指示灯、报错、告警 |

**只有填充算指示灯**——边线与斜面跟着几何角色走，否则便签那几条米黄分隔线会变成暗色界面里的金线。

### 8.3 最终调色板：什么绿、什么黑、什么程度

按绿屏终端的三条规则分：**① 屏幕是黑的 ② 屏上画出来的都是绿的 ③ 主次靠绿的亮度分，选中项反白**。

| 角色 | 明度映射（L 是亮色原色明度） | 色相 | 饱和度 | 实测色值 |
| --- | --- | --- | --- | --- |
| `screen` | `0.02 + 0.075·L` → **3%–9%** | 140 | 0.16 | 面板 `#131a16`、按钮 `#121915` |
| `screen-state` | `clamp(0.082 + 1.3(L−0.87), 0.05, 0.24)` | 140 | 0.30 | 悬停 `#182c1f`（+0.048）、按下 `#09110b`（−0.035） |
| `text` | `clamp(1.05 − 0.85·L, 0.54, 0.88)` → **正文 88% / 次要 59% / 提示 54%** | 140 | 0.50 | 正文 `#c7ecd3`、次要 `#57c77c` |
| `edge` | `0.26 + 0.26·L` | 140 | 0.42 | 按钮描边 `#388a54` |
| `shadow` | `L<0.70 ? 0.005+0.09L : 0.068+1.35(L−0.70)`（拐点 70%） | 140 | 0.40 | 亮边 `#437254`、暗边近黑 |
| `highlight` | `clamp(1.0 − 0.55·L, 0.62, 0.92)` | 140 | 0.60 | 链接 `#9bdeb1` |
| `inverse` | 常数 **0.62** | 140 | 0.55 | 反白底 `#69d38c` + 近黑字 `#08110b` |
| `machine` | `0.05 + 0.11·L` → **10%–16%** | 158 | **0.08** | 机箱 `#212725`（刻意低饱和，绝不是金色） |
| `bar` | 常数 0.15 | 140 | 0.34 | 活动窗口标题栏 `#193322` |
| `accent` | `clamp(L, 0.55, 0.70)` | 归族 | 0.72 | 指示灯 `#3adf71`、忙碌点 `#e8b130` |
| `accent-text` | `clamp(L, 0.70, 0.82)` | 归族 | 0.61 | 报错文字 `#d88e82` |
| `alert-surface` | `0.04 + 0.06·L` | 归族 | 0.30 | 报错底板 `#251816` |

强调色**只允许三族**：绿（H140）、琥珀（H42，忙碌/注意）、告警红（H8，报错与删除）。

必须保住的**次序**：`亮边 > 屏幕底 > 暗边`（按钮因此仍是凸起的）、`屏幕底 < 机箱`（机箱比屏幕亮一档）。两条都有测试。

### 8.4 作用域与优先级

每条暗色规则都挂在 **`html[data-theme="dark"] .marcus-desktop-page`** 下（源里裸写的选择器会补上根类），因此站内助手面板与 404 页面**完全不参与主题**，且暗色规则优先级**必定**高于对应的亮色规则。

**踩过的坑**：抬高优先级会打破亮色内部"具体变体 vs 基准规则"的关系。活动窗口标题栏那次——它的规则写的是 `background: var(--navy)`，没有色值字面量、被生成器跳过了，于是"未激活标题栏"的暗色规则盖住了它。修法：**凡是引用主题 token 的声明都补一条暗色副本**（+20 条）+ 回归测试。

### 8.5 手写补充规则（`handWrittenCss`）

| 规则 | 作用 | 细节 |
| --- | --- | --- |
| **反白高亮**（`INVERSE_SELECTORS`） | 选中/当前项 = 绿底黑字 + 7px 辉光 | 只给**纯文字**的行（发送键、当前栏目、进度摘要）——图标是光栅画（`PixelImage` 渲染 SVG 文件，不跟 `currentColor`），亮绿底会把它吃掉 |
| **屏幕玻璃感**（`.computer-screen::before`） | 四角压暗 58%→100% + 一点绿辉光 | `z-index` 低于扫描线、`pointer-events: none` |
| **暗色扫描线** | 只覆盖 `--scan-ink`（纯黑 25%） | 不整套覆盖 `background`，否则会把粗细档位一起盖掉 |

### 8.6 迭代史与教训（这段最值得读）

| 版本 | 做法 | 为什么不行 |
| --- | --- | --- |
| 一 | 把米白整体压暗，**色相沿用亮色** | 米白是暖的 → 面板变成**橄榄金** |
| 二 | 一切色相拉到磷光绿、饱和度照抄亮色 | **绿过头**：底子绿、正文也绿，长文累，层次只剩明度差 |
| 三 | "绿是灯光，不是墙纸"：近中性玻璃底 + 绿只给交互 | 方向对一半，但**正文是中性灰、面板停在 12%–15%**——那是普通暗色主题，不是终端 |
| 四（定稿） | **屏幕是黑的、屏上画出来的都是绿的、主次靠绿的亮度、选中反白** | 这才是绿屏终端的结构 |

三条结论：**黑不是"深灰"**（终端的黑在 3%–9%）；**屏上的字必须是绿的**（主次靠亮度不靠色相）；**选中是反白**，不是"稍亮一点的底"。

### 8.7 操作手册

```bash
npm run theme:dark      # 改完亮色 CSS 或生成器后重新生成
npm run theme:report    # 色表 + 自检（可疑映射 / 色相出界 / 跳过的规则）
node ../scripts/desktop-theme.mjs --check   # 校验是否同步（npm test 里也有一条）
```

| 想改 | 改哪 |
| --- | --- |
| 暗色整体观感 | `DARK_PALETTE`（各角色的明度/色相/饱和度） |
| 单个地方不对 | `RULE_OVERRIDES`（按选择器指定角色或禁掉归族） |
| 哪些选择器算机箱 / 交互态 | `MACHINE` / `INTERACTIVE` 正则 |
| 哪些选择器不参与映射 | `fixedReason`（图片上下文、主题预览色块、手写覆盖） |
| 反白给哪几行 | `INVERSE_SELECTORS` |

### 8.8 自检与不变量

`--report` 打三类体检，**都应当是零**：可疑映射（屏幕底 >18%、机箱 >25%、边线 >62%、斜面 >55%、文字 <52%）、色相出界（屏幕必须绿 ±12°、机箱必须中性 S ≤0.12、强调色只能在三族 ±6°）、需要人工确认（有颜色但不在角色表里）。

测试另钉了：暗色规则必须全部带作用域、亮色源文件不许出现 `data-theme`、斜面次序、每个映射的方向、填充才算指示灯、反白的底与字、扫描线三档必须线宽与周期都不同。

---

## 9. CRT 扫描线子系统

| 档位 | 线宽 / 周期 | 动画 | 占空比 |
| --- | --- | --- | --- |
| 细 | **1px** / 3px | `crt-scan-thin` 2s | 33% |
| 中 | **2px** / 4px | `crt-scan-medium` 2.7s | 50% |
| 粗 | **3px** / 6px | `crt-scan-coarse` 4s | 50% |

- **动态**：匀速下滚约 1.5px/秒。用 **`transform: translateY`** 而不是 `background-position`——后者是绘制属性、每帧重绘一整屏；叠加层向上多出一个周期（`top: calc(-1 * var(--scan-tile))`），平移一个周期后与起点重合，所以**无缝且循环边界不露边**。
- **线色按主题**：亮色深绿 5%（`#20351d0d`）、暗色纯黑 25%（`#00000040`）。1px 细线压在近黑屏上等于没有——当初要加粗的原因。
- **默认档**：`resolveScanlineWidth()` 解析 `auto`——**明亮用细、暗色用中**（中就是原来那组 2px/4px 的观感）。纯函数、有测试。
- **开关与禁用**：开关控制有无；关掉时"粗细"整块禁用；`prefers-reduced-motion: reduce` 时线还在但静止。
- **一次返工**：第一版中与粗都是 2px 线宽、只差密度，看着几乎一样。改成按线宽单调递增，并加守卫：**相邻两档的线宽与周期必须同时不同**。

---

## 10. 动态壁纸子系统（夜泊）

**结构**：海报打底 + 一张精灵图（`ambience-*.webp`）+ 清单（`manifest-*.json`）。清单记 8 个区域（两块招牌、三处灯光、两片水面倒影、猫尾）在画面里的位置与每帧时长；组件按这些时长把当前帧画到区域对应的 `<canvas>` 上——猫尾静止 3.2 秒后摆 17 帧，灯光与水面各有自己的循环（4–17.6 秒）。纯逻辑（清单校验、cover 几何、帧调度）在 `night-harbor-animation.ts`，可在 Node 里直接单测。

**动效三档**（`auto`/`on`/`off`）：`auto` 在窄屏（≤700px）、粗指针、`save-data`、`prefers-reduced-motion` 下保持静态。

| 素材 | 大小 | 何时下 |
| --- | --- | --- |
| 海报 `wallpaper-*.webp` | 225 KB | 选中且显示时 |
| 移动版 `mobile-*.webp` | 89 KB | 窄屏且非强制开启动效 |
| 精灵图 `ambience-*.webp` | 496 KB | 只在允许动效且海报已加载后（idle 回调） |
| 缩略图 `thumbnail-*.webp` | 26 KB | 只在设置面板里 |
| 清单 `manifest-*.json` | 8 KB（过网 1.7 KB） | 随精灵图 |

**加载与释放**：`AbortController` + `generation` 计数丢弃迟到结果；`release()` 撤销 objectURL、清空 canvas、停表；`pagehide` 暂停、`pageshow` 恢复。文件名带内容哈希 → `next.config.ts` 给 `immutable` 长缓存。

---

## 11. 桌面偏好模型（`lib/desktop-settings.ts`）

| 字段 | 取值 | 默认 |
| --- | --- | --- |
| `theme` | `light` / `dark` | `light` |
| `wallpaper` | 七张壁纸的 id | `cloud` |
| `wallpaperMotion` | `auto` / `on` / `off` | `auto` |
| `scanlines` | 布尔 | `false` |
| `scanlineWidth` | `auto` / `thin` / `medium` / `coarse` | `auto` |

**逐字段兜底**：读档时每个字段单独校验，坏字段退回默认，**其余选择必须活下来**——旧存档缺 `theme`/`wallpaperMotion`/`scanlineWidth` 时不能让整份偏好作废（否则设置面板一个档位都不选中、壁纸选择也会丢）。有测试。

**首屏不闪米白**：主题写在 `<html data-theme>` 上，由 `app/terminal/page.tsx` 的引导脚本在桌面标记之前执行——React 挂载后再切会先闪一屏米白。因为该属性写在 hydrate 之前，`app/layout.tsx` 的 `<html>` 需要 `suppressHydrationWarning`。

---

## 12. 内容、数据与本地脚本

### 12.1 内容数据

| 文件 | 形状 | 消费方 |
| --- | --- | --- |
| `frontend/src/content/profile.ts` | `PROFILE`（姓名/别名/呼号/角色/位置/邮箱/GitHub/自述/引言/座右铭/学历）+ 7 条经历 + 7 个项目 + 12 项技能 | `marcus-browser.tsx:40-60` |
| `frontend/src/content/showcase.ts` | `SHOWCASE_GALLERY` 8 件（7 视频 + 1 图，含比例、缩略图、尺寸） | `marcus-browser.tsx:17`、`showcaseLink()` 拼主站播放器 |

改文案只动这两个 `.ts`。**注意**：同一批事实在 Agent 侧硬编码于 `agent/website-tools.mjs:5-67`，改站点描述时要手工同步（已知的重复）。

### 12.2 图标生成（`scripts/pixel-icons.py`，GRID=24）

| 子命令 | 作用 |
| --- | --- |
| `sync` | 画稿 `work/icons-svg/*.svg` → 公开 `frontend/public/icons-svg/` 或私有 `work/visitor-assets/`（按 `visitor-apps.json` 的引用判定），并删掉已消失/泄漏到公开目录的文件 |
| `preview` | 生成 `work/icons-preview.html`，按 43/30/21/20px 真实尺寸对照 |
| `export` | 矢量画稿 → 24×24 PNG 落 `work/icons/`（另存 @8x） |
| `build` | PNG → 矢量像素画稿（裁到边界居中、矩形路径），`--dry-run` 可预览 |

约定：只认直线 `M/L/H/V/Z`，遇曲线报错并指文件名；PNG 为 8bit RGBA。

### 12.3 访客账号维护（`scripts/add-visitor.py`）

位置参数 `username` + 开关 `--list/--remove/--disable/--enable/--sql/--db`；密码三选一：`--ask-password` / `--generate`(20 位) / `--password`。哈希格式与后端一致（PBKDF2-SHA256 600k）。授权用 `--apps a,b` 整份替换、`none` 清空、省略则保留（id 限 `^[a-z0-9][a-z0-9-]{0,31}$`，最多 32 个）。三个密码参数都不给 + 带 `--apps` = 只改授权；都不给 = 只改密码。`--db` 直连 `visitor_accounts` upsert（URL 从 `--db-env` 读），**不碰 JSON**；默认写 `work/visitor-accounts.json` 并 `chmod 600`。

### 12.4 本地开发脚本

`scripts/dev-win.ps1` 支持 `start/stop/restart/status`（无参数 = start）：端口被占用时**直接复用**、不重复启动；`stop` 只杀端口占用进程且进程名必须是 `node`/`python`/`cmd`/`powershell`，另外只清理由本项目起的、父进程已死的 reload worker——**不会误杀别的程序**。`dev-win.bat` 刻意纯 ASCII（cmd.exe 解析含多字节字符的批处理会错位，中文全交给 PS 输出）。`scripts/dev.py` 是 macOS/Linux 版（依赖 `lsof`）。

### 12.5 运行时目录 `work/`（不进 Git、不进发布包）

| 路径 | 作用 |
| --- | --- |
| `chat-limits.sqlite` | 限流计数（付费轮次 / 登录窗口 / 失败次数） |
| `deepseek-harness-home/` | Agent 轨迹、`workspace/`、`profiles/`、`sessions/`，以及运行时生成的 patch 副本 |
| `visitor-accounts.json` | 访客账号与密码哈希 |
| `visitor-apps.json` | 应用注册表（授权 id 的唯一来源） |
| `visitor-apps.parked.json` | 摘下的区块，后端不读 |
| `visitor-assets/` | 私有素材，仅登录后经后端下发 |
| `relationship-private/`、`relationship-private.json` | 私有素材（与本产品定位不符的部分） |
| `icons/`、`icons-svg/`、`icons-preview.html` | 图标画稿与本地中间产物 |
| `marcus-*.log` | 本地开发日志 |

### 12.6 数据库（可选，`deployment/DATABASE.md`）

想用 SQL 管账号时开 `DATABASE_ENABLED=true`：先读 `visitor_accounts` 全表，再读 JSON 文件，**可同时用**。**同名访客两边都有 → 直接 503 拒绝**（不猜用哪份密码）；文件不存在则纯库模式；库不可用直接失败不降级；停用账号照常加载但认证必失败。每请求重读，改完即时生效（无需重启）。

---

## 13. 部署与运维

### 13.1 两种上线入口（二选一）

| 入口 | 准备 | 信任开关 |
| --- | --- | --- |
| 本机 nginx（线上在用） | 开 80/443，certbot 终结 TLS | `TRUST_PROXY_IP=true` |
| Cloudflare Tunnel（备用） | 入站零开端口，ingress 指 `127.0.0.1:3010` | `TRUST_CLOUDFLARE=true` |

**客户端身份来源跟入口绑定**：开错等于把 IP 限流桶交出去，所以两套都留着并写清二选一。

### 13.2 systemd 单元

| 单元 | 跑什么 | 端口 / 目录 | 重启 |
| --- | --- | --- | --- |
| `marcusweb-backend` | uvicorn **单 worker** | 8010，cwd `.../backend`，读 `/etc/marcusweb/backend.env`，`DSH_HOME=/var/lib/marcusweb-harness` | `on-failure` / 3s |
| `marcusweb-frontend` | node 跑 `.next/standalone/server.js` | 3010，cwd 即 standalone | `on-failure` / 3s |
| `marcusweb-tunnel` | cloudflared `run`（独立用户） | —— | `always` / 5s |

依赖：frontend → backend，tunnel → frontend。日志全在 journal，没有文件日志。

### 13.3 nginx

只转发 `/terminal`、`/_next/`、`/images/`、`/icons-svg/`、`/fonts/`、`/favicon.ico`、`/api/{chat,visitor,music,health}`，`/` 留给主站；**逐个前缀列、禁写 `location /api/`**——所以后端 `/api/ready`、`/docs` 公网不可达。每 location 显式 `proxy_cache off`（宝塔全局开了 proxy_cache）。`/api/chat` 关 `proxy_buffering`、read/send 300s（SSE 必需）。**限速 `limit_req`/`limit_conn` 尚未配置（S12）**。

### 13.4 构建与发布包

`npm ci` → `NEXT_TELEMETRY_DISABLED=1 npm run build`（`output: 'standalone'`）→ 把 `public/` 与 `.next/static` 拷进 `.next/standalone/` → 打包。**不许进包**：`work/`（私有名单/素材/限额库）、`.env`、`*.map`；自查 `tar -tzf … | grep -E '(^|/)(work|\.env|.*\.map)'` 应无输出。交叉构建要换 Linux 原生绑定、大文件分片上传并比对 sha256。

### 13.5 环境变量

| 组 | 键 |
| --- | --- |
| 后端密钥 | `DEEPSEEK_API_KEY`、`INTERNAL_API_TOKEN`（≥32 且两端一致）、`DATABASE_ENABLED/URL` |
| 后端路径 | `VISITOR_ACCOUNTS_PATH` / `VISITOR_APPS_PATH` / `VISITOR_ASSETS_DIR`（必须绝对路径）、`HOST` / `PORT` |
| 后端限额与超时 | `CHAT_*`（额度、试次闸门、body、流缓冲）、`DSH_*`（体积与超时） |
| 前端 | `SITE_ORIGIN`（只写 origin，`CORS_ORIGINS` 同规则）、`CHAT_PROXY_*`（三段超时预算） |
| 二选一 | `TRUST_PROXY_IP` / `TRUST_CLOUDFLARE`；`NEXT_PUBLIC_APP_URL` 是构建时变量 |

**改了就变行为**的：信任开关、`CHAT_*` 额度、`CHAT_MAX_CONCURRENT`（状态在单进程内存）。

### 13.6 运维动作

重启 `systemctl restart marcusweb-{backend,frontend}`；nginx 只 `reload`。日志 `journalctl -u … -f`。改 `.py`/env 必须重启，**访客名单与 agent 工具免重启**。回滚用 `standalone.prev`、`*.bak-<时间戳>` 或 `current` 软链切上一 release。`/api/ready` 四项：`agent_configuration`、`proxy_authentication`、`quota_storage`、`application_database`。`X-Request-ID` 由前端生成、后端回写并落日志，用来把"用户说某次报错"对到日志。

### 13.7 坑与教训（改脚本前先读）

1. **构建前删 `.next`**，否则 Turbopack 复用旧模块图会报 `lightningcss` 找不到（看着像缺文件，其实是缓存脏了）。
2. `lightningcss` / `@tailwindcss/oxide` 的**原生绑定要放进包装包期望的相对位置**。
3. 打包/解包用**相对路径**（Git Bash 的 tar 会把 `C:\...` 当远程主机）。
4. 大文件分片上传 + sha256 比对。
5. 别清宝塔的 `proxy_cache_dir`；用 `proxy_cache off` + 公网/直连 ETag 比对验证。
6. 别整份 `source backend.env`（引号会被吞），只取所需变量。
7. sqlite 一律 `?mode=ro` 打开，否则会静默建一个空库。
8. 宝塔的 location 必须放 `extension/` 目录，改 vhost 会被面板覆盖。

### 13.8 长期约束

**不要给后端加 worker**：并发计数、试次闸门、配额库锁都在单进程内存里，加 worker 会让这些限额各算各的。

---

## 14. 验证方法

### 14.1 四层

| 层 | 工具 | 验什么 |
| --- | --- | --- |
| 单测 | `python -m unittest`（`backend/.venv`）、`npm test` | 纯逻辑、不变量、迁移、生成物同步 |
| 生成器自检 | `npm run theme:report` | 色表、可疑映射、色相出界 |
| 浏览器验收 | 无头 Chrome + CDP（临时脚本，不入库） | 真实计算样式、对比度、动画是否真的在动、首屏、持久化、作用域 |
| 基线/往返比对 | 同上 | 亮色逐元素计算样式比对；亮→暗→亮往返必须无损 |

浏览器脚本要点：`getComputedStyle` 取真实值而不是读 CSS 文本；对比度按"文字色 vs 最近的不透明祖先背景"算；作用域用"非桌面页面的面板 token 是否仍是亮色"验证；并发上限必须用**会占住槽位**的假路由测。

### 14.2 这一轮靠它逮到的真问题

| 现象 | 根因 | 修法 |
| --- | --- | --- |
| 取消会让并发槽位永久泄漏 | 判定在 `to_thread` 里，取消对它无效 | 槽位等判定落地后再摘 |
| 老协议正文增量不过遮蔽 | 遮蔽只包了 v2 路径 | 两条路都逐块遮 |
| 非 POST 白扣额度 | 中间件不看方法 | 非 POST 交给路由 |
| 活动窗口标题栏在暗色下失效 | 优先级抬高 + 只引用 token 的变体规则被跳过 | 补发 token 副本（+20 条） |
| 悬停/按下反馈看不见 | 亮色只差 4%–5% 亮度，压暗后挤成一条 | 交互态填充走更陡的映射 |
| 斜面暗边落到屏幕底之上 | 屏幕底压得更黑后暗边反而更亮 | 重算 `shadow` 下半段 |
| 便签分隔线变成金线 | "饱和+中间明度"判指示灯太宽 | 只有填充算指示灯 |
| 中/粗两档看着一样 | 两档都是 2px 线宽，只差密度 | 按线宽单调递增 + 守卫测试 |
| 焦点圈在暗色下几乎不可见 | 按边线映射会掉到 12% 亮度 | 按强调色走 |
| 次要文字对比度 3.83:1 | 映射下限太低 | 抬高下限 |
| React 水合警告 | 主题属性写在 hydrate 之前 | `<html>` 加 `suppressHydrationWarning` |
| 暗色整套覆盖扫描线 `background` | 手写规则覆盖范围过大 | 只覆盖 `--scan-ink` |

### 14.3 给新改动补验证的清单

1. 纯逻辑抽成不依赖 DOM 的模块（能进单测）。
2. 至少一条**能失败**的测试：把修复回退掉确认它挂——不能只"跑绿了"。
3. 涉及样式的改动跑 `npm run theme:report`，三块体检必须为零。
4. 涉及暗色的改动跑一次浏览器验收：对比度、有无中间灰、亮色往返无损。
5. 改了亮色 CSS 记得 `npm run theme:dark`（忘了会被 `npm test` 的同步测试逮住）。

---

## 15. 关键决策记录

| 决策 | 取舍 | 理由 |
| --- | --- | --- |
| 暗色由生成器产出，不手写 | 多一个生成步骤 + 同步测试 | 432 个色值写不全，漏一条就是一块浅斑 |
| 亮色一个字节不动 | 暗色改版要重算 | 访客看到的就是原来那台机器 |
| 主题写在 `<html>` 上 | 需要 `suppressHydrationWarning` | 首屏不闪米白 |
| 反白只给纯文字行 | 带图标的行仍是暗绿条 | 图标是光栅画，不跟 `currentColor` |
| 扫描线用 `transform` | 要多一个周期的溢出与裁剪 | `background-position` 每帧重绘一整屏 |
| 扫描线三档按线宽 | 少一个自由度 | 只变密度人眼分不出来（返工过一次） |
| 换歌单自列 50 首 | 多一点请求 | 官方外链播放器固定只给 10 首 |
| 唯一 iframe + 槽位几何 | 需要测量与裁剪逻辑 | iframe 永不 reparent，切页不断音 |
| 慢消费者直接 503 | 会损失一次回复 | 无界堆积只会在内存告警时被发现 |
| 满了直接 429，不做队列 | 峰值体验略差 | 队列只是把等待搬进后端内存 |
| 限额只在 production 生效 | 本地开发不覆盖限流路径 | 开发时不撞额度；单测显式开 production |
| 数据库故障不回退 JSON | 少一条退路 | 避免静默降级门禁 |
| 不采纳伴侣彩蛋线 | 少一部分对照分支功能 | 与本产品定位不符 |

---

## 16. 文件索引

### 16.1 顶层

| 路径 | 职责 |
| --- | --- |
| `frontend/` | Next.js 站点、像素桌面与桌面应用 |
| `backend/` | FastAPI 与 Harness SDK 集成 |
| `agent/` | 站点专用组合补丁 + 只读工具插件 + 插件测试 |
| `scripts/` | 本地启停、访客账号维护、图标生成、暗色生成器 |
| `deployment/` | systemd 单元、nginx 配置、环境变量样例、部署与运维文档、安全清单 |
| `work/` | 运行时数据（**不进 Git、不进发布包**） |
| 根文档 | `README.md`（使用者）、`PROJECT_STRUCTURE.md`（文件地图）、`DESIGN.md`（本文） |

### 16.2 本轮的子系统落点

| 子系统 | 主要文件 |
| --- | --- |
| 主题生成器 | `scripts/desktop-theme.mjs` → `frontend/src/app/terminal/desktop-dark.css` |
| 亮色样式与扫描线 | `frontend/src/app/terminal/desktop.css` |
| 偏好模型 | `frontend/src/lib/desktop-settings.ts` |
| 设置面板 | `frontend/src/components/my-world/desktop-apps.tsx` |
| 桌面主控 | `frontend/src/components/my-world/pixel-desktop.tsx` |
| 夜泊壁纸 | `frontend/src/components/my-world/night-harbor-{animation,assets,wallpaper}.ts(x)` |
| 安全与限额 | `backend/app/security.py`、`backend/app/services/{attempt_guard,stream_buffer,runtime_manager,progressive_reply,ai_errors,harness_adapter,agent_prompt}.py` |
| 前端限流与请求链路 | `frontend/src/lib/server/chat-attempt-limiter.ts`、`frontend/src/lib/api/chat-request.ts` |

穷举的文件清单见 [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)。

---

## 17. 文档地图：其它目录里的 md

主文档只有三份，都在根目录：`README.md`（站点是什么、怎么跑、怎么用）、`PROJECT_STRUCTURE.md`（文件地图）、`DESIGN.md`（本文）。其余 md 按目录分工如下——**路径都相对本文件**。

### backend/

| 相对路径 | 是什么 | 什么时候看 |
| --- | --- | --- |
| `backend/README.md` | 后端的定位与本地启动：Python 3.11/3.12、锁定的 Harness SDK `0.1.5rc1` 自带原生 runtime、只暴露两个受限站内工具、**访客凭据从不进入模型** | 动后端之前 |
| `backend/ENV_SETUP.md` | 本地环境配置：复制 `backend/.env.example` 为 `backend/.env`、密钥填哪里、`.env` 已被 Git 忽略 | 第一次把后端跑起来 |

### deployment/（上线相关全在这里）

| 相对路径 | 是什么 | 什么时候看 |
| --- | --- | --- |
| `deployment/README.md` | 生产部署总览 + **「公共仓库边界」清单**：哪些东西永远不许提交（真 `.env`、模型密钥、内部令牌、SSH/隧道凭据、`relationship-private`、受保护的壁纸、简历原材料、日志、运行时数据库、构建产物、发布压缩包） | 部署前先读这一页 |
| `deployment/DATABASE.md` | 可选的数据库方案：什么时候需要、开 `DATABASE_ENABLED` 后与 JSON 文件怎么合并（同名直接拒绝）、断库不降级、`--db` 的全部参数规则 | 想用 SQL 管访客账号 |
| `deployment/MYSQL.md` | **从零接入 MySQL 的实操教程**：建库建号、装驱动（含 `cryptography` 这个易漏项）、配 `backend/.env`、加账号、四层验证与排错表 | 决定用 MySQL 存访客账号 |

### scripts/

| 相对路径 | 是什么 | 什么时候看 |
| --- | --- | --- |
| `scripts/LOCAL-DEV.md` | 本地开发说明：日常流程、VS Code 配置（解释器指向 `backend\.venv`）、热更新排查、`dev-win.ps1` 的 start/stop/status 与"只杀自己的进程、不会误杀别的程序" | 本地开发遇到问题 |

### frontend/

| 相对路径 | 是什么 | 什么时候看 |
| --- | --- | --- |
| `frontend/README.md` | ⚠️ **泛化的 Next.js 脚手架说明**——它教的是 Supabase + Prisma 那一套，本项目**不用**（前端不直连数据库，后端用 SQLAlchemy + 可选 DB）。别照它做，看根目录 `README.md` | 只在考古时看 |
| `frontend/docs/deployment.md` | 7 行的指针页，把部署说明指向 `deployment/README.md`（并声明旧的 Node 18 / 必需 PostgreSQL / 60 秒超时代的步骤已不适用） | 顺手一看 |
| `frontend/docs/supabase-setup.md` | 早期用 Supabase 的方案，**已不采用** | 只在考古时看 |
| `frontend/public/fonts/README.md` | 三份本地字体的来源（Fontsource 5.3.0）、OFL 许可与每个文件的 SHA-256 | 换字体或核对字体完整性时 |

### 根目录里的历史文档（可忽略）

| 相对路径 | 是什么 |
| --- | --- |
| `TYPESCRIPT_ERROR_FIX.md` | 一次类型错误修复记录 |

### 仓库外（相对 `../`）

| 相对路径 | 是什么 | 什么时候看 |
| --- | --- | --- |
| `../nekovccat_web-main v1.1/` | **对照分支**（NEKO / My World）的完整副本，含它自己的文档；其中 `../nekovccat_web-main v1.1/deployment/agent-protection.md` 是它那套 Agent 防护的说明 | 逐条对照某个实现时 |
| `../_neko-mixed-20260914/_manifest.txt` | 09-14 那批误入本仓库、随后移出的 181 个文件的清单 | 想知道"某个文件当时从哪来" |

### 这些 md 之外、但改东西时会用到的

- `deployment/backend.env.example`、`deployment/frontend.env.example`：环境变量样例（不是 md，但改配置看这两份）。
- `work/` 下**没有任何 md**：限额库、访客账号、Agent 轨迹、日志都在那里，**不进 Git、不进发布包**（§12.5）。
- 图标的说明没有单独的 md：看 `scripts/LOCAL-DEV.md` 与 `scripts/pixel-icons.py --help`。
