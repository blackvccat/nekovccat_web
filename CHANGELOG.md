# 更新日志

记录**从「桌面应用插件系统 + 访客应用真实应用架构」这一版开始**的变化，倒序排列，按天分节。每条写清三件事：
改了什么 / 为什么 / 怎么验证的。

- 文件路径都相对仓库根。
- 访客账号、私有素材、服务器环境等内容都在本地运行目录里，随机器不同而不同，本文不记。

## 现状

| 项 | 状态 |
| --- | --- |
| 后端测试 | **110 条通过**（`cd backend && .venv/Scripts/python.exe -m unittest discover -s tests`，Linux 用 `.venv/bin/python`） |
| 前端测试 | **154 条通过**（`cd frontend && npm test`） |
| 类型与构建 | `npx tsc --noEmit` 0 错；`npm run build` 通过（路由表只有 `/terminal` + 本站 API，含 `/api/visitor/app-proxy/[...path]`） |
| 桌面应用 | **插件式**：`frontend/apps/<id>/` + `registry.json`，构建期装配；新增应用 = 复制文件夹 + 登记 + 重新构建 |
| 访客应用 | **一个应用一个文件夹**：`work/visitor-apps/<id>/`（`app.json` 的 `entry` 指向 HTML），登录后由服务器下发 |

---

## 2026-09-20 · 安全加固：app-proxy 写操作同源校验 / 上传体积上限 / 歌单限流

**改了什么**
- **受控转发口的写操作要求同源**（`frontend/src/app/api/visitor/app-proxy/[...path]/route.ts`）：`PUT/POST/DELETE` 现在会先过一遍 `sameSite()`（`Origin` / `Sec-Fetch-Site`）。访客 Cookie 是 `SameSite=strict`，但**同站**的其它页面仍会带上它——这条校验把同站的跨站写挡在外面。读（GET）不受影响。
- **上传体积在两层都设了上限**：转发口流式读取请求体，声明长度或累计字节超过 8MB 直接 `413`，不再把大 body 读进 Node 内存；后端 `PUT /api/visitor/apps/{id}/files/{name}` 也改成流式限量（`request.stream()`）。nginx 侧给 `/api/visitor` 加 `client_max_body_size 10m`（默认 1m 会把 8MB 的上传先挡掉）。
- **`/api/music/playlist` 纳入限流**：前端加了一把独立的进程内桶（每地址 20 次/分钟），后端在安全中间件里给 `/api/music` 加了按身份的窗口（30 次/分钟、300 次/小时，走**独立的 `music_hits` 表**，绝不占用聊天的日额度）。后端这层**不挂**聊天那把试次闸门（burst 只有 4），否则正常用户连点几个歌单就会在第 5 发被冷却。

**为什么**：前两条是安全审计发现的两个中/低风险点（同站 CSRF 面、上传没有前置上限）；第三条是「歌单接口没有限流」——它每次都拿服务器 IP 去打第三方。

**怎么验证**：后端 **111 条通过**（新增歌单窗口一条：两次放行、第三次 429，且 `requests` 表不增行）；前端 **156 条通过**（新增转发口写操作一条、歌单桶一条）；`tsc --noEmit` 0 错、`eslint` 0 问题、`npm run build` 通过。

---

## 2026-09-20 · 移动端修复：番茄钟设置打不开 + 音乐歌单扩展窗布局

**改了什么**
- **番茄钟**（`frontend/apps/tomato/app.css`）：窄屏媒体查询里原本是 `.tomato-panel { display: none }`——点「设置」把 `panelOpen` 置真、面板却仍被隐藏，看起来就是按钮没反应。改成与便签、音乐一致的「窄屏不分栏」：`panel-open` 时隐藏主视图，设置面板整屏显示（`flex: 1`、去掉左边框），时长按钮加高到 38px 便于点按。
- **音乐歌单扩展窗**（`frontend/src/components/my-world/music-app.css`）：窄屏下歌单落在下半屏，但歌单头部会随曲目滚走，「收起」点不到；两栏之间也没有间距。现在下半屏 46% → 55%（上半屏保底 96px，不会被压没）、两栏间 `row-gap: 8px`、歌单头部 `position: sticky` 固定在自己的滚动区顶部（背景取窗口底色，暗色主题由生成器自动映射）。

**为什么**：手机上的侧栏是点按交互，面板被 `display: none` 或被滚动带走就等于功能不可用。

**怎么验证**：`npm run theme:dark` 重新生成暗色表（273 → 274 规则），`theme:report` 可疑映射为零、色相自检通过；前端 154 测试、`tsc --noEmit` 0 错、`eslint` 0 问题、`npm run build` 通过。

---

## 2026-09-20 · 删除区块协议：访客应用全部改为「服务器下发的真实应用」+ 补齐三个缺口

**改了什么**：彻底移除旧的区块应用（`view` 与 10 种区块），访客应用一律是「服务器在登录后下发的 HTML」。

- 后端 `visitor_apps.py`：删掉区块校验与 `view` 字段，`entry` 改为**必填**；`view` 现在是未知字段、会被拒绝。移除 `GET /apps/{id}`（区块视图接口）。
- 前端：删除 `components/visitor/visitor-blocks.tsx`、区块类型、`/api/visitor/app` 路由；`VisitorApp` 一律渲染同源 iframe；转发口透传后端 CSP。
- 数据：`work/visitor-apps/` 里的应用逐一手工转成入口 HTML 的真实应用。
- 清理：删掉 `desktop.css` 里区块专用的 `.visit-*` 样式（暗色表同步重新生成）与不再使用的 `lib/date-since.ts`（及其测试）。
- 迁移脚本 `migrate-visitor-apps.py` 同步：只搬元数据，遇到只有区块的旧应用会提示必须先改成 HTML。

**三个已知缺口一并修掉**：

1. **第三方内嵌按应用收口**：后端在 shell 响应里带 `Content-Security-Policy: frame-src 'self' <embeds>; frame-ancestors 'self'`，转发口原样透传。全局 CSP 是宽松的 `'self' https:`，两条 CSP 取交集（必须同时放行），于是只有该应用 `embeds` 里列出的源能嵌进来。
2. **主题同步进 iframe**：宿主在 iframe 载入与主题切换（`MutationObserver` 监听 `<html data-theme>`）时，把 `--app-*` 变量与 `data-theme` 写进 iframe 的 `documentElement`，并 `postMessage({type:'marcus:theme'})`。应用 CSS 直接写 `var(--app-surface)` 即随明暗。
3. **内联下载**：`GET .../files/{name}` 默认 `attachment`；带 `?inline=1` 时不写 `Content-Disposition`，交给浏览器内联显示。

**为什么**：区块数据做不出上传、数据库读写与第三方嵌入；两条路线并存还要维护两套渲染与测试。现在只有一条路线，能力更强，前端产物里依然没有任何应用界面。

**怎么验证**：后端 **110 条通过**、前端 **154 条通过**（含改写后的「应用标识不进前端」守卫、转发口 CSP 透传测试）、`tsc` 0 错、`eslint` 0 问题、`npm run build` 通过（路由表里已无 `/api/visitor/app`）；`theme:report` 可疑映射为零。

---

## 2026-09-20 · 访客应用支持「真实应用」（上传 / 数据 / 第三方嵌入）

**改了什么**：给访客应用加了一条**运行时**路线：`app.json` 里写 `entry` 指向应用自己的 HTML，界面在登录后由服务器下发，宿主用同源 iframe 承载。

- 清单：`entry`（HTML 入口）、`permissions`（`files` / `data`）、`embeds`（允许内嵌的第三方源）。
- 后端：`GET /apps/{id}/shell`（下发 HTML）、`GET /apps/{id}/{path}`（应用自带静态文件，禁止 `app.json` 与路径穿越）、键值数据 `GET/PUT/DELETE /apps/{id}/data[/{key}]`、文件 `GET/PUT/GET/DELETE /apps/{id}/files[/{name}]`（请求体即文件字节，不引入 multipart）。数据存独立 SQLite（`work/visitor-app-data.sqlite`），文件存 `work/visitor-app-files/<id>/<访客>/`。
- 前端：受控转发口 `/api/visitor/app-proxy/[...path]`（只转发到后端 `/api/visitor/apps/<id>/…`，凭据只留宿主 HttpOnly Cookie）；`VisitorApp` 对 `entry` 应用改用同源 iframe 承载；安全头把 `frame-ancestors` 从 `none` 放宽到 `self`、`X-Frame-Options` 从 `DENY` 放宽到 `SAMEORIGIN`、`frame-src` 放宽到 `'self' https:`（自嵌 + 第三方嵌入）。
- 示例：`docs/visitor-app-example/`（Notebook：写数据 + 上传/下载/删除文件）。
- 上限：值 ≤ 64KB、keys ≤ 200 / 应用 / 访客；文件 ≤ 8MB、≤ 200 个 / 应用 / 访客。

**为什么**：区块数据做不出上传、数据库读写与第三方嵌入。真实应用要做到这些，同时保持「登录前前端零文件」——唯一的办法就是登录后由服务器下发界面代码。

**怎么验证**：后端 **118 条通过**（新增真实应用的 shell / 静态 / 数据 / 上传、权限门、fail-closed）；前端 **160 条通过**、`tsc` 0 错、`eslint` 0 问题、`npm run build` 通过（新增路由 `/api/visitor/app-proxy/[...path]`）。

**边界**：目前只支持**站点主人自己写**的访客应用（同源 iframe + `allow-same-origin`），所以应用与前端同权；要接受他人提交的应用必须改成独立源 + `postMessage` 过桥的强隔离。

---

## 2026-09-20 · 访客应用改成「一个应用一个文件夹」

**改了什么**：访客应用从「所有应用挤在一个 JSON + 共用素材目录」改成与桌面 `frontend/apps/` 同构的**文件夹包**：

```
work/visitor-apps/<id>/
├── app.json      { apiVersion, id, title, subtitle?, watermark?, icon?, wallpaper?, window?, entry, embeds?, permissions? }
├── index.html    入口 HTML（及它引用的 js/css/图片）
└── assets/       该应用自己的图标 / 壁纸（登录后经后端下发）
```

- 后端 `visitor_apps.py`：`load_apps()` 扫描 `VISITOR_APPS_DIR` 下每个子目录的 `app.json`；素材只在该应用自己的 `assets/` 里解析（`app_asset`）。一个应用坏掉仍整份 fail closed，但 **`apiVersion` 对不上的应用只跳过并记日志**（把一个新版本应用复制到旧站点不会连带打死别的应用）。新增 `window`（窗口尺寸随服务器下发）。
- 配置：`VISITOR_APPS_PATH` + `VISITOR_ASSETS_DIR` → 单个 `VISITOR_APPS_DIR`（`work/visitor-apps`）。
- 前端：`VisitorAppMeta` 增加可选 `window`，桌面按它开访客应用窗口（缺失退回 560×580）。仍遵守「登录前前端零访客应用文件」——尺寸也是登录后下发。
- 脚本：`pixel-icons.py sync` 把私有图标写进对应应用的 `assets/`；`add-visitor.py` 从目录读应用 id；新增 `scripts/migrate-visitor-apps.py`（把旧 JSON + 共用素材拆成文件夹）。

**为什么**：旧格式加一个应用要在一个大 JSON 里插条目、素材混在共用目录里，没法「一包一包」地移植。现在移植一个访客应用 = 复制整个 `<id>/` 文件夹 + 给对方账号授权该 id，不改代码、不重新编译、前端零改动。

**怎么验证**：`scripts/migrate-visitor-apps.py --dry-run` 然后 `--archive`；`backend` 单测通过（含目录式注册表、版本跳过、按应用素材解析）；前端通过、`tsc` 0 错、`eslint` 0 问题、`npm run build` 通过；迁移后 `load_apps()` 直接读通（应用与素材命中）；`pixel-icons.py` / `add-visitor.py` 导入自检能读到新目录。

**边界**：应用素材只在该应用自己的 `assets/` 内解析，`../` 之类越界会被拒。

---

## 2026-09-20 · 桌面应用插件系统（`frontend/apps/`）

**改了什么**：桌面应用从「写死在宿主里」改成「构建期装配的插件」。

- 新增公开契约 `frontend/src/app-kit/index.ts`（`AppManifest` / `DesktopAppHost` / `AppModule` / `APP_API_VERSION` / `VISITOR_APP_PREFIX`）。
- 新增应用目录 `frontend/apps/`：`registry.json` 是唯一的启用清单，每个应用一个文件夹（`manifest.json` + `app.tsx` + 可选 `app.css` / `assets/`）。
- 新增生成器 `scripts/apps-registry.mjs`：校验 manifest、把素材复制到 `public/apps/`、生成静态 import 的 `src/app-kit/generated.tsx`；挂在 `predev` / `prebuild`，另加 `npm run app:registry` 与 `--check`。
- `pixel-desktop.tsx` 重写成通用窗口管理器：尺寸、侧栏、状态栏、标题栏后缀、关窗副作用全部读 manifest 或由应用用 `host.onClose` 登记。
- 内置应用改在 `src/app-kit/builtin.tsx` 登记（与插件同一套 `AppModule`）；`About Computer` 搬进 `apps/about/`，另附示例 `apps/tomato/`。
- 插件主题走 `src/app/terminal/app-tokens.css` 的 `--app-*` token（明暗两套），不进暗色生成器。
- 新增 `frontend/apps/README.md`（装卸与写应用的说明）、`frontend/tests/apps-registry.test.ts`（生成物同步 + 可搬运性守卫 + token 完整性）。

**为什么**：原来新增一个应用要同时改类型联合、图标表、`DESKTOP_APPS`、渲染三元链与多处特判，**无法把一个应用搬到另一个同架构站点**。改成插件后：复制文件夹 + 在 `registry.json` 加一个 id + 重新构建，桌面即可显示，且不用改任何底层代码与环境变量。

**怎么验证**：`npm run app:registry` 生成成功；`npm test` 全通过；`tsc --noEmit` 0 错；`npm run build` 通过、路由表仍只有 `/terminal` + 本站 API。开发服务器实测：`/terminal` 200 且 HTML 里出现插件应用「About Computer」；把 `tomato` 加进 `enabled` 重新生成后页面出现「Tomato Timer」、`/apps/tomato/tomato.svg` 200；再移出后 `public/apps/` 里的陈旧目录被清理、页面不再出现。

**边界**：插件与宿主共用同一份 `DesktopSettings` 类型与宿主内部构建（不接受陌生人的任意代码时无需沙箱）；契约只承诺「同架构站点之间」的可搬运性，跨架构仍需改 `@/app-kit`。

---

## 2026-09-20 · 桌面图标放不下时折成第二列（不再出现滚动条）

**改了什么**：`.desktop-icons` 从「竖排一列 + `overflow-y: auto`（矮屏出现纵向滚动条）」改成 **column + `flex-wrap`**：用 `top/bottom` 界定可用高度，图标放不下就自动折到右边第二列，列从左往右排。容器本身 `pointer-events: none`，只有图标按钮吃点击，不挡底下的窗口与壁纸。三处媒体查询（`min-width:1500`、`max-height:650`、`max-width:700`）同步改成 `left/right/top/bottom`。

**为什么**：移动端等高度不足时，原来的滚动条既不好点也割裂了图标的整块感；折列能让全部应用一眼可见。

**怎么验证**：无头 Chrome 实测——视口 `900×430`（stage 807×314）8 个图标折成 **2 列**、`overflowY: visible`、无纵向滚动；`1280×1000` 仍折 2 列；`1280×1250` 回到 **1 列**。改了亮色 CSS 后 `npm run theme:dark` 重新生成，`theme:report` 可疑映射为零；前端测试、`tsc` 0 错、`eslint` 0 问题、`npm run build` 通过。

---

## 2026-09-20 · 新增《应用开发与部署教程》（`docs/APP-DEVELOPMENT.md`）

**改了什么**：新增一份面向**写应用的人**的教程，分两部分——**系统应用**（`frontend/apps/` 的桌面插件：契约 `@/app-kit`、manifest 字段、宿主能力表、主题 token、装卸与「要重新构建」的部署）与**访客应用**（服务器侧 `work/visitor-apps/`：manifest、数据/文件接口、主题注入与第三方内嵌、授权与「不用构建不用重启」的部署），另附对照速查、验证命令与排错表。README 与 PROJECT_STRUCTURE、DESIGN 的文档地图加了入口。

**怎么验证**：文档只改路径与说明，不涉及逻辑；前端与后端测试、`tsc` 0 错、`eslint` 0 问题、`npm run build` 通过。

---

## 2026-09-20 · 热修：首屏脚本告警 + 本地后端端口

**① 首屏主题脚本从客户端页面移到服务端根布局**（`src/app/terminal/page.tsx` → `src/app/layout.tsx` 的 `<body>` 顶部）。
- 现象：开发期 Next 开发浮层报 `Encountered a script tag while rendering React component`，盖住桌面，看起来像「报错进不去」。
- 原因：Next 16 内置的 React 19 在**客户端组件重渲染**（Fast Refresh / 重挂载）时会重新创建 `<script>` 元素并报错；原来的 `THEME_BOOT` 写在 `'use client'` 的页面里。
- 修法：脚本改由 Server Component 根布局渲染，客户端不会重建它；仍早于桌面标记执行，不闪米白。
- 验证：无头 Chrome + CDP——桌面图标正常、About 素材 `/apps/about/about.svg`、点开登录窗输入可用、控制台 0 错误；`tsc` 0 错、测试通过、lint 0、build 通过。

**② 本地开发后端端口 8010 → 8110**（`scripts/dev-win.ps1`、`scripts/dev.py`、`.vscode/launch.json`、`.vscode/tasks.json` 与相关文档）。
- 现象：`无法登陆`、聊天失败；后端日志报 `WinError 10013`。
- 原因：本机 Windows 把 **7964–8063** 列为保留端口，后端要绑的 8010 正在其中（实测 8010 `EACCES`、8110 可绑）。登录/聊天都经后端，所以一起不可用。
- 修法：本地让开这一段，用 8110；**生产仍是 8010**（`deployment/*.service`、`backend.env.example` 未动）。
- 验证：`node` 实测 8110 可绑定；`scripts\dev-win.bat stop` 后再 `start` 生效（运行中的前端在启动时已固定 `PYTHON_API_URL`，只 start 会复用旧进程，必须重启）。

---

## 2026-09-20 · 热修：反向代理缺 `/apps/` 前缀，插件应用图标 404

**现象**：桌面插件应用（About Computer、Tomato）的图标不显示（图片裂开），其它应用图标正常。

**原因**：桌面插件应用的素材由构建器复制到 `public/apps/<id>/`，请求路径是 `/apps/<id>/<file>`——这是插件系统**新引入**的前缀。反向代理只转发了 `/terminal`、`/_next/`、`/images/`、`/icons-svg/`、`/fonts/`、`/favicon.ico` 与几个 `/api/*`，没有 `/apps/`，请求于是落到主站 404。内置应用走的是 `/icons-svg/`，所以只有插件应用缺图标（Next 自己在回环端口上对这两个文件是 200 的）。

**处理**：给反向代理加 `location ^~ /apps/`（含 `proxy_cache off`），校验配置后 reload；同步修 `deployment/nginx-example.com.conf` 模板的转发清单与验收命令。

**怎么验证**：`/apps/about/about.svg` 与 `/apps/tomato/tomato.svg` 公网 200 `image/svg+xml`，且与构建产物**字节一致**；`/`、`/terminal`、`/icons-svg/`、`/images/` 仍为 200。

**教训**：新增「前端对外的路径前缀」（`public/` 下的新目录、`next.config.ts` 里的新路径）时，要同时更新反向代理转发清单，漏一处线上就 404。

---

## 2026-09-20 · 本地启动不再「报红」（stderr 被 PowerShell 当成错误）

**改了什么**：`scripts/dev-win.ps1` 里后端与前端的两条启动命令改成 `cmd /c "… 2>&1"`（先让 cmd 把 stderr 并进 stdout，再交给 PowerShell 管道 `ForEach-Object | Tee-Object`），并用 **`-EncodedCommand`** 启动新窗口——直接经 `-Command` 传会把内层 `cmd /c "…"` 的引号重新解析掉，`2>&1` 又会被 PowerShell 当成自己的重定向，报红照旧。

**为什么**：uvicorn 与 npm/next 的日志都写 stderr；PowerShell 5.1 会把原生命令的 stderr 包成 `NativeCommandError` 错误记录，于是整段 INFO 日志被渲染成红色并附上「所在位置 行:1 字符:…」的排版。**后端其实一直正常运行**，只是显示误导。

**怎么验证**：`plain -> ErrorRecord`（旧写法）、`cmd /c -> String`（新写法，实测同一句 stderr 输出）；`[Parser]::ParseFile` 校验脚本语法通过。已在运行中的进程不受影响，下次 `dev-win.bat stop` 再 `start` 即得到干净窗口。
