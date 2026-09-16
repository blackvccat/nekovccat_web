# 项目文件结构说明

这份文档说明每个文件夹、每个文件是做什么的，以及**想改某个东西时该去哪个文件**。

- 技术栈：Next.js 16（前端 + 服务端接口）、FastAPI / Python 3.12（AI 后端）、DeepSeek Harness（Agent）
- 本地地址：网站 `http://127.0.0.1:3010`，后端 `http://127.0.0.1:8010`
- 启动方式：双击 `scripts\dev-win.bat`，详见 [scripts/LOCAL-DEV.md](scripts/LOCAL-DEV.md)

---

## 一、顶层总览

```text
nekovccat_web-main/
├── frontend/      网站本体（Next.js）：页面、样式、像素桌面、服务端接口
├── backend/       AI 后端（Python / FastAPI）：负责 Agent 对话
├── agent/         给 AI 用的工具插件，决定 AI 能做什么、不能做什么
├── deployment/    上线到服务器用的配置模板（systemd 服务 + 环境变量示例）
├── scripts/       本地启动与管理脚本
├── work/          运行时数据：日志、访客名单、受保护正文、AI 运行轨迹（不进 Git）
├── .vscode/       VS Code 配置：启动任务、调试、推荐扩展
└── *.md           文档（大部分是历史记录，见文末）
```

三者的关系：

```text
浏览器  →  frontend（Next.js，能看能点的部分）
              ↓ /api/chat 同源转发
           backend（FastAPI，校验、限流、起 AI 子进程）
              ↓
           agent（只读站内工具）+ DeepSeek 模型
```

**frontend 是你看到的一切，backend 是会思考的大脑，agent 是大脑被允许使用的工具箱。**

---

## 二、frontend/ —— 网站本体

### 2.1 网址与文件的对应关系

Next.js 用**文件夹路径决定网址**（和 PHP 的写法不同）：

| 网址 | 对应文件 |
| --- | --- |
| `/terminal` | `frontend/src/app/terminal/page.tsx`（唯一的页面，虚拟电脑桌面） |
| `/my-world` | 没有页面文件：`next.config.ts` 的 `redirects()` 307 跳到 `/terminal`，查询参数原样保留（旧地址） |
| `/about` | 同上，307 跳到 `/terminal?app=explorer&tab=about`（旧地址） |
| `/contact` | 同上，307 跳到 `/terminal?app=explorer&tab=contact`（旧地址） |
| `/api/chat` | `frontend/src/app/api/chat/route.ts` |
| `/api/health` | `frontend/src/app/api/health/route.ts` |

规律：`app` 目录下**一个文件夹 = 一个网址**，文件夹里的 `page.tsx` 就是这个网页。站点只有 `/terminal` 一个页面，旧地址由 `redirects()` 统一跳转。线上域名的根路径 `/` 属于主站，应用不接管它，所以本地打开 `http://127.0.0.1:3010/` 是 404，直接访问 `/terminal`。

### 2.2 目录树

```text
frontend/
├── src/
│   ├── app/                                  页面与服务端接口
│   │   ├── layout.tsx                        全站外壳：字体、元信息，挂载 Agent / 音乐 / 访客模式三个全局状态
│   │   ├── globals.css                       全站基础样式
│   │   ├── loading.tsx                       页面加载占位
│   │   ├── error.tsx                         出错页面
│   │   ├── not-found.tsx                     404 页面
│   │   ├── favicon.ico                       浏览器标签页图标
│   │   ├── terminal/
│   │   │   ├── page.tsx                      ★ 唯一的页面：虚拟电脑桌面（含首屏明暗引导脚本）
│   │   │   ├── desktop.css                   亮色桌面样式：窗口、任务栏、壁纸、图标
│   │   │   └── desktop-dark.css              暗色覆盖表【生成物】：由 scripts/desktop-theme.mjs 算出，别手改
│   │   └── api/                              ★ 只在服务器运行的接口（类似 PHP 的角色）
│   │       ├── chat/route.ts                 把聊天请求转发给后端 Python
│   │       ├── chat/session/route.ts         签发聊天会话凭证，防伪造
│   │       ├── chat/visitor-login/           校验访客名与密码，签发短时授权
│   │       ├── music/playlist/route.ts      网易云歌单曲目列表（转发给后端，浏览器不直连第三方）
│   │       ├── health/route.ts               健康检查
│   │       ├── visitor/app/route.ts        应用视图（未授权/未授权应用 403）
│   │       ├── visitor/asset/route.ts      应用私有素材（壁纸、图标）
│   │       ├── visitor/status/route.ts     访客身份与该账号被授权的应用元数据
│   │       └── visitor/logout/route.ts     退出访客模式（清 Cookie）
│   │
│   ├── components/                           界面积木，按功能分目录
│   │   ├── my-world/                         像素桌面的一切（文件夹沿用旧名）
│   │   │   ├── pixel-desktop.tsx             ★ 桌面主控：窗口打开/聚焦/拖动/最大化/最小化、任务栏
│   │   │   ├── desktop-apps.tsx              各桌面软件的注册表（开始菜单用）
│   │   │   ├── desktop-software.css          软件窗口样式
│   │   │   ├── marcus-browser.tsx            站内复古浏览器（关于 MARCUS / 项目与探索 / 长廊 / 联系）
│   │   │   ├── music-app.tsx  music-app.css  桌面里的 MARCUS Music
│   │   │   ├── visitor-login.tsx             ★ 访客模式登录窗（访客名 + 密码）
│   │   │   │   ├── visitor-login.tsx             ★ 访客模式登录窗（访客名 + 密码）
│   │   │   ├── pixel-icon.tsx                像素图标组件
│   │   │   ├── night-harbor-wallpaper.tsx     ★ 壁纸「夜泊」的动画层：canvas 逐帧画猫尾、灯光与水面倒影
│   │   │   ├── night-harbor-wallpaper.css    动画层与海报的定位样式
│   │   │   ├── night-harbor-animation.ts     精灵图清单校验、cover 几何、帧调度（纯函数，可单测）
│   │   │   ├── night-harbor-assets.ts        夜泊素材地址（文件名带内容哈希）
│   │   │   └── retro-computer.tsx            【未使用】
│   │   ├── agent/
│   │   │   ├── agent-app.tsx                 Agent 聊天窗口界面
│   │   │   └── agent-session.tsx             ★ 全站共用的对话状态（草稿、历史、进行中的请求）
│   │   ├── music/
│   │   │   ├── site-music.tsx                全站音乐播放器
│   │   │   ├── music-session.tsx             音乐状态（收藏、当前曲目）
│   │   │   └── site-music.css                播放器样式
│   │   ├── visitor/
│   │   │   ├── visitor-mode.tsx              ★ 访客模式状态：身份、授权应用、主题
│   │   │   ├── visitor-home.tsx              用户页：列出被授权的应用 + 退出访客模式
│   │   │   ├── visitor-app.tsx               应用窗口：打开时才向 /api/visitor/app 取视图
│   │   │   ├── visitor-blocks.tsx            通用区块渲染器（不含任何应用文案）
│   │   │   └── visitor-icon.tsx              中性占位图标
│   │   ├── shared/
│   │   │   ├── loading.tsx                   加载动画
│   │   │   ├── devtools-error-suppressor.tsx 屏蔽无关的开发工具报错
│   │   │   ├── loading-screen.tsx            【未使用】
│   │   │   └── error-boundary.tsx            【未使用】
│   │   └── ui/                               通用小组件（按钮等）【未使用】
│   │
│   ├── lib/                                  工具函数，不直接显示界面
│   │   ├── api/                              调用后端的封装
│   │   │   ├── chat-history.ts               浏览器里的对话历史
│   │   │   ├── chat-stream.ts                流式接收回复（v2 渐进协议 + 老协议回退）
│   │   │   ├── chat-reply-buffer.ts          正文按动画帧合并后再进 state
│   │   │   ├── chat-request.ts               一条消息的完整请求链路（会话 nonce → v2 → 两条解析路），fetcher 可注入
│   │   │   ├── chat-activity.ts              进度面板的步骤记录（只有工具名、固定文案与状态）
│   │   │   ├── chat-errors.ts                上游报错转成可以直接显示的中文
│   │   │   ├── client.ts                     通用请求封装
│   │   │   └── site-links.ts                 站内链接
│   │   ├── server/                           ★ 只在服务端运行的安全代码
│   │   │   ├── chat-security.ts              会话签名、CSRF、来源校验、客户端 IP、body 读取截止
│   │   │   ├── chat-attempt-limiter.ts       进程内试次闸门：读 body 与连后端之前先挡洪水
│   │   │   ├── visitor-access.ts             访客授权 Cookie 的签名与校验
│   │   │   └── visitor-backend.ts            访客接口的服务端转发
│   │   ├── music/                            音乐链接解析、几何动画、歌单数据
│   │   ├── utils/                            通用工具（常量、校验）
│   │   ├── db/index.ts                       数据库客户端【当前未启用】
│   │   ├── visitor-view.ts                   应用视图协议的类型定义
│   │   ├── date-since.ts                     「自某天起」的日期计算（东八区）
│   │   ├── desktop-links.ts                  桌面深链接解析
│   │   ├── desktop-notes.ts                  便签保存列表的本地数据校验
│   │   ├── desktop-settings.ts               ★ 桌面偏好的唯一登记处：明暗、壁纸清单、动效档位、扫描线粗细、读盘校验（旧存档逐字段兜底）
│   │   └── client-id.ts                      浏览器匿名标识
│   │
│   ├── content/                              ★ 你的个人资料（改文案常来）
│   │   ├── profile.ts                        关于我、工作经历、项目、技能、联系方式
│   │   └── showcase.ts                       长廊：主站「共鸣」展厅的画框与链接
│   │
│   ├── hooks/use-debounce.ts                 防抖 hook【未使用】
│   └── types/index.ts                        全局 TypeScript 类型
│
├── public/                                   静态资源，按路径直接访问
│   ├── images/
│   │   ├── cloud.jpg                          桌面默认壁纸「云端」（desktop.css 使用）
│   │   ├── my-world-pixel-wallpaper.webp       桌面壁纸「猫咪小岛」（像素画，可切换）
│   │   ├── marcus-night-harbor/               桌面壁纸「夜泊」的 4 张图 + 精灵图清单（文件名带内容哈希 → next.config.ts 给了 immutable）
│   │   │                                      wallpaper 海报 225KB / mobile 89KB / ambience 精灵图 496KB / thumbnail 26KB / manifest 8KB
│   │   ├── marcus-avatar.jpg                 站内浏览器里 About 栏目的头像
│   │   └── showcase/                         长廊的 8 张本地画框缩略图（WebP）
│   ├── icons-svg/                           桌面与访客应用的图标（★ 由 scripts/pixel-icons.py sync 从 work/icons-svg 同步）
│   ├── fonts/                                Geist / Geist Mono / Jersey 25 字体与授权文件
│   └── *.svg                                 图标素材【未使用，Next.js 脚手架残留】
│
├── tests/                                    25 个测试：聊天、音乐、访客模式、日期、便签、桌面偏好、壁纸动画、明暗主题、图标文件
├── prisma/schema.prisma                      数据库表结构【当前未启用】
├── docs/                                     两份历史文档
│   ├── deployment.md                         已废弃，指向 deployment/README.md
│   └── supabase-setup.md                     早期用 Supabase 的方案，已不用
│
├── next.config.ts                            ★ Next 配置：安全响应头（CSP）、独立打包模式
├── package.json                              依赖清单与命令
├── tsconfig.json                             TypeScript 配置（`@/` 指向 `src/`）
├── postcss.config.mjs                        Tailwind CSS 配置
├── eslint.config.mjs                         代码风格检查规则
├── next-env.d.ts                             自动生成的类型声明
└── package-lock.json                         依赖版本锁定
```

`public/images/marcus-avatar.jpg` 在网页上的地址就是 `/images/marcus-avatar.jpg`——`public/` 里的文件夹结构直接对应网址。

---

## 三、backend/ —— AI 后端（Python）

```text
backend/
├── app/
│   ├── main.py                  FastAPI 入口：注册路由、CORS、限流中间件
│   ├── config.py                读取 backend/.env 的所有配置项
│   ├── security.py              聊天限流：匿名按设备 20 条/12 小时 + 按地址 100 条兜底、登录按账号 100 条、全站硬顶与防并发；另有廉价试次闸门与 body 前置校验
│   ├── observability.py         结构化日志与请求 id（被拒的请求也记账）
│   ├── database.py              数据库连接【当前关闭，但导入时仍会加载 asyncpg】
│   ├── api/routes/
│   │   ├── chat.py              聊天接口 POST /api/chat/
│   │   ├── health.py            健康检查 GET /api/health
│   │   ├── music.py             歌单曲目 GET /api/music/netease/playlist/{id}
│   │   └── visitor.py           访客登录、应用视图与私有素材
│   ├── services/
│   │   ├── ai_service.py        ★ 核心：每请求启动一个 DeepSeek Harness 子进程跑 Agent
│   │   ├── runtime_manager.py    运行时管理：补丁准备一次、租约式收尾、按存活并发再压一道
│   │   ├── agent_prompt.py       站内助手的人设与边界（提示词单独一份，避开循环导入）
│   │   ├── stream_buffer.py      出站队列：水位有界（满了整轮 503）与逐帧合并
│   │   ├── attempt_guard.py      廉价试次闸门：内存令牌桶 + 冷却翻倍，被拒也计入
│   │   ├── harness_adapter.py    SDK 管道收尾 workaround（只关 stdin 的那个 bug）
│   │   ├── ai_errors.py          错误分类与状态码映射
│   │   ├── progressive_reply.py  v2 渐进协议投影与跨增量密钥遮蔽
│   │   ├── progressive_bridge.mjs 从 SDK 子进程桥出逐 token 帧（挂给子进程的补丁）
│   │   ├── chat_service.py      编排一轮对话
│   │   ├── visitor_access.py      访客凭证的 HMAC 签名
│   │   ├── visitor_accounts.py    访客名单与 PBKDF2 密码校验（文件或数据库）
│   │   ├── visitor_apps.py        访客应用注册表：区块校验、授权、私有素材解析
│   │   ├── netease_music.py       网易云公开歌单的前 N 首（外链播放器只给 10 首，这里自己取）
│   │   └── visitor_throttle.py    按访客名的失败锁定
│   ├── models/ schemas/         数据模型与请求校验（基本未启用）
│   └── utils/
├── tests/                       单元测试
├── requirements.txt             依赖清单（Python 3.11 / 3.12）
├── .env                         ★ 你的 DeepSeek 密钥等本地配置（不进 Git）
├── .env.example                 配置模板
├── Dockerfile                   Docker 镜像（当前未用）
├── ENV_SETUP.md / README.md     后端文档
└── .venv/                       虚拟环境（已装好，不进 Git）
```

**安全要点**：`DEEPSEEK_API_KEY` 只存在于 `backend/.env`，由服务端传给 AI 运行时，**永远不会出现在前端代码或浏览器里**。

---

## 四、agent/ —— AI 的能力边界

只有三个文件，但这是安全设计的核心：

| 文件 | 作用 |
| --- | --- |
| `website.patch.yml` | 关闭 AI 的 shell、终端、文件读写、浏览器、搜索等全部通用工具 |
| `website-tools.mjs` | 只注册 2 个受控工具：查站内栏目（`site_info`）、查桌面软件（`desktop_apps`）；访客凭据从不进入模型 |
| `tests/website-tools.test.mjs` | 插件测试 |

AI 因此**读不到你电脑上的文件、便签和外部网站**，只能回答站内问题。

---

## 五、deployment/ —— 上线模板

| 文件 | 作用 |
| --- | --- |
| `README.md` | 服务器部署步骤、构建命令、验收命令、回滚方法 |
| `DATABASE.md` | 访客账号存数据库：表结构、合并规则、`--db` 全部命令与参数规则、加新应用的步骤、验证手段与已知坑 |
| `nginx-example.com.conf` | nginx 直接反代本站的 location 清单（不走 Cloudflare 时用） |
| `nginx-marcusweb-proxy.conf` | 上面那份 location 引用的共用反代头（存成 `/etc/nginx/snippets/` 里的文件） |
| `marcusweb-backend.service` | 后端 systemd 服务模板 |
| `marcusweb-frontend.service` | 前端 systemd 服务模板 |
| `marcusweb-tunnel.service` | Cloudflare Tunnel 服务模板 |
| `backend.env.example` | 后端生产环境变量模板 |
| `frontend.env.example` | 前端生产环境变量模板 |

---

## 六、scripts/ —— 本地脚本

| 文件 | 作用 |
| --- | --- |
| `dev-win.bat` | ★ 双击入口，只负责转交给 PowerShell（刻意只写英文，因为 cmd 解析含中文的批处理会出错） |
| `dev-win.ps1` | ★ 真正的逻辑：启动 / 停止 / 查状态，中文提示都在这里 |
| `LOCAL-DEV.md` | 中文使用说明：日常流程、VS Code 配置、热更新排查、必填的两项内容 |
| `dev.py` | 原作者的 macOS / Linux 版本（用了 `lsof`，Windows 上跑不了） |
| `add-visitor.py` | 维护访客账号：添加、改密码、授权应用、停用，可写 JSON 文件或（`--db`）直接写数据库 |
| `pixel-icons.py` | 桌面图标的代码 ↔ 24×24 PNG 往返工具：`export` / `build` / `preview`，见 [scripts/LOCAL-DEV.md](scripts/LOCAL-DEV.md) |
| `desktop-theme.mjs` | ★ 桌面暗色主题（深色玻璃 + 荧光绿强调）生成器：读四份亮色 CSS，按角色把颜色换算成暗色，产出 `frontend/src/app/terminal/desktop-dark.css`。`npm run theme:dark` 重新生成，`--report` 看色表与自检，`--check` 校验是否同步（`npm test` 里有一条测试做同样的事） |

---

## 七、work/ —— 运行时数据（不进 Git）

```text
work/
├── marcus-backend.log                     后端日志（服务窗口里的内容同步写入这里）
├── marcus-frontend.log                    前端日志
├── visitor-accounts.json               ★ 访客名、密码哈希与每人可用的应用（用 scripts/add-visitor.py 维护）
├── visitor-apps.json                   ★ 各访客应用的视图数据与主题（后端持有，需要你填真实内容）
├── visitor-apps.parked.json            暂时停用的窗口内容（区块）；后端不读这个文件，恢复时粘回 visitor-apps.json 里对应应用的 view
├── visitor-assets/
│   └── couple-wallpaper.webp           ★ 应用私有素材，例如壁纸（需要你替换）
├── icons/                              桌面图标的 PNG 工作副本（scripts/pixel-icons.py export 生成，删掉可复原）
├── icons-svg/                          桌面图标的独立 SVG 文件 + index.html（scripts/pixel-icons.py svg 生成）
└── icons-preview.html                  图标对照页（scripts/pixel-icons.py preview 生成，只用于自己看）
```

`work/` 同时还会存放 AI 的运行轨迹（`deepseek-harness-home`）和限流数据库。

**注意**：这些只影响访客模式，不影响聊天。访客名单或应用注册表缺失/格式不对时，访客接口返回「尚未配置 / 暂不可用」（503）；素材文件缺失只让对应应用的壁纸/图标返回 404。

---

## 八、.vscode/ —— 编辑器配置

| 文件 | 作用 |
| --- | --- |
| `tasks.json` | 7 个任务：启动/停止/查状态、在浏览器打开预览、构建生产版本、跑前后端测试 |
| `settings.json` | Python 解释器指向 `backend\.venv`；排除 `node_modules` / `.next` / `work` 降低 CPU 占用 |
| `launch.json` | 两个调试配置：后端可打断点、前端服务端渲染 |
| `extensions.json` | 推荐扩展清单 |

---

## 九、其他文件

| 文件 | 说明 |
| --- | --- |
| `README.md` | 项目主文档，架构说明与本地启动步骤 |
| `DESIGN.md` | ★ 技术设计文档：各子系统的设计原理、不变量、实测数字与「改哪里、怎么验证」，面向要动这些代码的人 |
| `docker-compose.yml` | 早期方案的容器编排，**已过时**：带了个不需要的 PostgreSQL，前端服务整段被注释掉了 |
| `PROJECT_STRUCTURE.md` | 本文件 |

### 可以忽略的历史文档

这些是开发过程中的记录，**不是当前有效说明**：

| 文件 | 状态 |
| --- | --- |
| `TYPESCRIPT_ERROR_FIX.md` | 历史：一次类型错误修复记录 |

### 没有引用、可以忽略的代码

全局搜索确认无任何地方引用：

- `frontend/src/components/my-world/retro-computer.tsx`
- `frontend/src/components/shared/loading-screen.tsx`
- `frontend/src/components/shared/error-boundary.tsx`
- `frontend/src/components/ui/`（`button.tsx` 和 `index.ts`，没有任何地方 import）
- `frontend/src/hooks/use-debounce.ts`
- `frontend/public/` 下的 `file.svg`、`globe.svg`、`next.svg`、`vercel.svg`、`window.svg`（Next.js 脚手架残留）

这些都是早期搭建时留下的，删掉不影响运行。

### 当前未启用的功能

| 部分 | 状态 |
| --- | --- |
| 数据库（MySQL / PostgreSQL） | `DATABASE_ENABLED=true` 时启用，存放访客账号 `visitor_accounts`（与 `visitor-accounts.json` 合并读取，同名拒绝）。`docker-compose.yml` 里的 PostgreSQL 未使用 |
| `frontend/prisma/schema.prisma` | 表结构定义，未启用 |
| `frontend/src/lib/db/index.ts` | 数据库客户端，无任何代码引用 |

---

## 十、想改东西时的速查表

| 想改什么 | 去哪个文件 |
| --- | --- |
| 关于我、经历、项目、联系方式 | `frontend/src/content/profile.ts` |
| 联系页的邮箱 / GitHub 链接 | `frontend/src/content/profile.ts` 的 `email`、`github` |
| 站内浏览器各栏目的正文与标题 | `frontend/src/components/my-world/marcus-browser.tsx` |
| 长廊的画框、标题与主站链接 | `frontend/src/content/showcase.ts` |
| 长廊的本地缩略图 | `frontend/public/images/showcase/` |
| 入口与旧地址的跳转规则 | `frontend/next.config.ts` 的 `redirects()` |
| 顶栏 HOME / Terminal 链接 | `frontend/src/components/my-world/pixel-desktop.tsx` |
| AI 助手知道的站点信息 | `agent/website-tools.mjs`（改完要重启后端） |
| 页面元信息、字体、全站外壳 | `frontend/src/app/layout.tsx` |
| 桌面上的软件、窗口行为 | `frontend/src/components/my-world/pixel-desktop.tsx` |
| 桌面样式、任务栏、壁纸效果 | `frontend/src/app/terminal/desktop.css` |
| 默认壁纸图片 | `frontend/public/images/cloud.jpg`（另有 `my-world-pixel-wallpaper.webp` 等可切换） |
| 有哪些壁纸、动效档位怎么存 | `frontend/src/lib/desktop-settings.ts`（设置面板与读盘校验共用这一份清单） |
| 明暗主题切换、默认用哪套 | `frontend/src/lib/desktop-settings.ts` 的 `THEMES` 与 `DEFAULT_SETTINGS.theme` |
| 扫描线的动效与粗细 | `frontend/src/app/terminal/desktop.css` 的 `@keyframes crt-scan-*` 与 `[data-scanline]` 三档；默认档在 `desktop-settings.ts` 的 `resolveScanlineWidth` |
| 暗色调子（深色玻璃 + 荧光绿强调） | 改 `scripts/desktop-theme.mjs` 里的 `DARK_PALETTE`（各角色的明度/色相/饱和度）或 `RULE_OVERRIDES`（单条例外），再 `npm run theme:dark` |
| 哪些地方该是荧光绿 | `INTERACTIVE` 正则（悬停/当前项/选中/链接）；底子饱和度由 `DARK_PALETTE` 各角色的 `saturation` 决定 |
| 某个颜色在暗色下没变绿 / 变成金线 | 多半是被判成了「指示灯」：只有填充算；要排除就加到 `NO_ACCENT` |
| 「夜泊」壁纸的动画表现 | `frontend/src/components/my-world/night-harbor-animation.ts`（帧调度可单测）；换素材看 `public/images/marcus-night-harbor/` |
| Agent 聊天界面 | `frontend/src/components/agent/agent-app.tsx` |
| 助手的行为、共享状态 | `frontend/src/components/agent/agent-session.tsx` |
| 非桌面页面的站内面板 / 音乐播放器 | `frontend/src/components/music/site-music.tsx` |
| 访客模式登录窗 / 用户页 / 应用视图 | `frontend/src/components/my-world/visitor-login.tsx`、`frontend/src/components/visitor/` |
| AI 能做什么、不能做什么 | `agent/website-tools.mjs` |
| AI 用哪个模型、密钥、超时 | `backend/.env` |
| 聊天与访客登录的限流规则 | `backend/app/security.py`（额度、并发、body 前置校验）；`backend/app/services/attempt_guard.py`（试次闸门与冷却） |
| 聊天的洪水在第一跳就被挡 | `frontend/src/lib/server/chat-attempt-limiter.ts` |
| 聊天如何转发到后端 | `frontend/src/app/api/chat/route.ts` |
| 助手的提示词（人设与边界） | `backend/app/services/agent_prompt.py`（改完要重启后端） |
| 运行时补丁、每轮的进程与并发上限 | `backend/app/services/runtime_manager.py` |
| 出站流的体积水位与逐帧合并 | `backend/app/services/stream_buffer.py` |
| 访客名、密码哈希与授权应用 | `work/visitor-accounts.json`（或数据库 `visitor_accounts` 表） |
| 访客应用的视图与主题 | `work/visitor-apps.json` |
| 应用私有素材（壁纸等） | `work/visitor-assets/` |
| 服务器上线配置 | `deployment/README.md` |

---

## 十一、几个容易踩的点

1. **改 `frontend/next.config.ts` 或 `backend/.env` 不会热更新**，必须停止再启动服务。
2. **`frontend/src/app/api/` 下是服务端代码**，可以放密钥和读私密文件；放进 `components/` 的内容会打包给浏览器，不要放敏感信息。
3. **访客名单与应用数据（`work/visitor-*.json` 或数据库）缺失只会让访客模式不可用**，聊天照常；密码哈希用 `python scripts/add-visitor.py` 生成，别手写；应用视图区块类型见 `backend/app/services/visitor_apps.py`。
4. **前端依赖必须用 Python 3.11 / 3.12**。3.13 及以上没有锁定依赖的预编译包，`backend/app/database.py` 在导入时就会加载 asyncpg，绕不开。
5. **预览必须用普通浏览器**，不要用 VS Code 内嵌预览或 Live Server，它们不支持 Next.js 的热更新。
