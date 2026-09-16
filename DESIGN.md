# 技术设计文档：NEKO / My World

写给**要改这个项目的人**：站点由哪些部分组成、每块为什么这么设计、实现落在哪里、不变量是什么、改完怎么验证。

| 想知道 | 看 |
| --- | --- |
| 站点是什么、怎么本地跑 | [README.md](README.md) |
| 部署、构建、上线验收 | [deployment/README.md](deployment/README.md) |
| Agent 的流量防护与额度 | [deployment/agent-protection.md](deployment/agent-protection.md) |
| **架构与设计原理（本文）** | —— |

验证入口（四条都要能跑）：

```bash
(cd backend && .venv/bin/python -m unittest discover -s tests -v)
node --test agent/tests/*.test.mjs
(cd frontend && npm run test:chat && npm run test:music)
(cd frontend && npx tsx --test tests/relationship-*.test.ts && npm run type-check)
```

---

## 1. 站点是什么

一个**多页**的个人站点，公开入口 `https://neko.origin.kim`：

| 页面 | 是什么 | 实现 |
| --- | --- | --- |
| `/` | 首页：全景背景 + 右下角 **NEKO 站内助手**（Agent / 音乐两个标签） | `app/page.tsx`、`components/layout/panorama-background.tsx` |
| `/my-world` | **可交互的像素风复古电脑**：桌面软件窗口 | `app/my-world/page.tsx`、`components/my-world/pixel-desktop.tsx` |
| `/about`、`/contact` | 旧地址，内容已并进 NEKO Browser 的栏目 | `app/about/page.tsx`、`app/contact/page.tsx` |

功能地图：

| 功能 | 一句话 | 前端入口 | 后端 |
| --- | --- | --- | --- |
| 全景首页 | Three.js 城市全景，渐进加载（先预览、空闲再建 WebGL） | `components/3d/city-scene.tsx`、`components/shared/preload-panorama.tsx` | —— |
| 像素桌面 | 窗口管理、任务栏、开始菜单、深链接 | `components/my-world/pixel-desktop.tsx` | —— |
| Neko Agent | DeepSeek Harness 驱动的站内助手，流式回复 + 执行进度 | `components/agent/`、`components/layout/` | `/api/chat`（SSE） |
| NEKO Browser | 关于 / 项目与经历 / 建筑相册 / 联系 | `components/my-world/neko-browser.tsx` | —— |
| **伴侣模式彩蛋** | 五道私人问答解锁的桌面与专属内容 | `components/relationship/relationship-mode.tsx`、`components/my-world/our-space.tsx`、`our-letter.tsx` | `/api/chat/relationship-unlock`、`/api/relationship/*` |
| **赞助 NEKO** | ETH 主网收款二维码 + 兼容钱包的原生转账 | `components/my-world/sponsor-app.tsx`、`lib/wallet.ts` | —— |
| NEKO Music | 网易云 / Spotify 官方播放器 + 收藏 | `components/my-world/music-app.tsx`、`components/music/` | —— |
| Notes / Settings / About Computer | 便签、壁纸与扫描线、桌面说明 | `components/my-world/desktop-apps.tsx` | —— |

---

## 2. 架构总览

### 2.1 设计边界

| 有 | 没有 |
| --- | --- |
| 首页全景 + 像素桌面（多页） | —— |
| 站内 Agent（Harness + 三个受限工具） | shell、文件编辑、浏览器、搜索等通用工具（补丁显式禁用） |
| 伴侣模式彩蛋（问答解锁） | **多用户账号体系**：没有访客名 / 密码，也没有按账号下发的内容 |
| 赞助（ETH 原生转账） | 任何形式的授权额度、助记词或私钥接触 |
| 便签、收藏、桌面偏好（存在当前浏览器） | 跨设备同步：没有账号，也就没有同步 |
| 每来源与全站的额度、FIFO 排队 | 多实例横向扩展：闸门与队列是进程内状态 |

两条纪律贯穿全篇：

1. **私有内容不进前端**——彩蛋答案与专属壁纸只存在于服务器，经需要授权的接口下发（§4）；
2. **能花钱的请求要在三层各挡一道**——边缘（Cloudflare 限速规则）/ Next（读 body 之前的试次闸门）/ 后端（令牌、额度、并发、排队），见 §7。

### 2.2 进程与目录

```
浏览器
  └─ Cloudflare Tunnel（专属，neko.origin.kim）
       └─ Next（frontend/，standalone server.js，3010）
            ├─ 页面 /：首页 + 右下角助手面板
            ├─ 页面 /my-world：像素桌面与桌面软件
            ├─ /api/chat[...]：代理 + 会话凭证 + CSRF + body 前置校验 + 廉价限流
            └─ /api/relationship[...]：彩蛋解锁状态、私有正文与专属壁纸
                 └─ FastAPI（backend/，uvicorn 8010，单 worker）
                      ├─ app/security.py：令牌、身份归一、额度、并发、队列、试次闸门（中间件）
                      ├─ app/services/quota_store.py：SQLite 配额（专用线程事务）
                      ├─ app/services/relationship_access.py：彩蛋授权
                      └─ DeepSeek Harness 子进程（agent/ 的站点工具插件 + 组合补丁）
```

### 2.3 一次聊天请求的链路

| 层 | 职责 | 限额/防护 | 代码 |
| --- | --- | --- | --- |
| 浏览器 | 输入、流式渲染、等待态与停止 | 前端试次闸门 | `lib/server/chat-attempt-limiter.ts`、`lib/api/chat-request.ts` |
| Next | 会话 nonce、CSRF、来源校验、body 前置校验 | 读 body 截止 2s、长度上限 | `lib/server/chat-security.ts`、`app/api/chat/route.ts` |
| 后端中间件 | 令牌 → 身份归一 → 路径归一 → body 校验 → 试次闸门 → 额度 → 准入排队 | 见 §7.5 | `backend/app/security.py` |
| 后端服务 | Agent 运行时、事件流、投影与遮蔽 | 并发 3、通知/正文上限、流缓冲水位 | `services/ai_service.py`、`stream_buffer.py` |
| Harness 子进程 | 模型循环、站内工具 | 工具白名单执行前二次校验 | `agent/website-tools.mjs` |

### 2.4 前端外壳与 Provider 层级

`app/layout.tsx:45-56` 由外到内：**`MusicSessionProvider` → `RelationshipModeProvider` → `AgentSessionProvider`**。

- 音乐最外：根部只渲染**一个** `PersistentMusicPlayer` iframe，它必须跨路由存活（首页 ↔ My World ↔ 助手面板），所以 provider 在最外层；
- 彩蛋在中间：它要在桌面与 Agent 之间共享解锁状态，且不影响音乐；
- Agent 最内：桌面窗口与右下角面板都要用；
- `SiteMusic`（右下角面板）在每个页面常驻，内含 Agent / Music 两个 tab。

---

## 3. 前端：首页全景与像素桌面

### 3.1 首页全景的渐进加载

首页不做"先转圈再出画面"。顺序是：**静态预览**先呈现 → 解码完成、字体与首屏绘制就绪 → 桌面端利用空闲时间加载 Three.js → 完整纹理解码好之后才创建 WebGL 画布。

| 场景 | 行为 |
| --- | --- |
| 桌面端 | 空闲时加载 Three.js，纹理就绪后建画布 |
| 手机 / 低功耗 | 先展示静态风景；**触摸背景**才请求较小的互动纹理 |
| 减少动态效果 / 省流量 / 2G | 不通过这类隐式手势加载全景；键盘聚焦仍能找到主动开启入口 |
| 标签页隐藏 | 停止绘制 |
| 离开页面 | 取消未完成下载并释放纹理 |
| 加载失败 | 保留预览并提供重试 |

暂停旋转后按需绘制。资源可由 `node scripts/prepare-panorama.mjs` 从保留的原图重新生成，**资源清单与带内容哈希的文件名会同步更新**（`public/images/panorama-assets.json` + `panorama-{preview,desktop,mobile}-<hash>.webp`）。

### 3.2 窗口管理器（`components/my-world/pixel-desktop.tsx`）

窗口打开 / 聚焦 / 拖动 / 方向键移动 / 最大化 / 最小化 / 关闭，任务栏恢复，开始菜单，深链接（`?app=<id>`）。**拖动按动画帧更新位置**；打开、收起、关闭都有键盘焦点接续。

### 3.3 桌面软件清单（`components/my-world/desktop-config.ts`）

| id | 标题 | 说明 |
| --- | --- | --- |
| `agent` | NEKO Agent | 站内 AI 向导 |
| `our-space` | 我们的小窝 | **彩蛋解锁后可见** |
| `explorer` | NEKO Browser | 关于、作品、建筑与联系 |
| `sponsor` | 赞助 NEKO | ETH 收款与转账 |
| `music` | NEKO Music | 官方播放器 |
| `notes` / `settings` / `about` | Notes / Settings / About Computer | 便签、外观、说明 |

### 3.4 移动端与无障碍

窄屏是**单窗口布局**；系统开启「减少动态效果」时减少动画；全景、相册与桌面窗口都保留键盘可达路径（焦点能落到控件上，而不是只能触摸）。

---

## 4. 伴侣模式彩蛋

这是本项目最有特色、也最容易改坏的一块：**内容是私有的，机制是公开的**。

### 4.1 五道问答

首页与欢迎语会直接告诉访客"这个网站还有彩蛋模式"。用户在 Agent 里点「开启彩蛋模式」，或直接说「我想开启伴侣模式」，然后依次回答五道关于 NEKO 的问题。工具负责**验证已提供的答案并返回下一题**：

- 多值题：答中配置的任意一个即可；
- 日期题：支持常见日期格式；
- 英文答案不区分大小写；
- 答错可重试，**Agent 不会主动公布答案**。

**只有整轮请求成功**（工具全部通过 + 模型那一轮正常结束）才会由后端发出受限的桌面事件，浏览器再应用主题。普通聊天、失败、取消、或仅在文字里"宣称成功"的回复都不触发。

### 4.2 授权与私有内容

五题通过后，后端签发**绑定当前聊天会话**的短时凭证；Next 校验后写入签名的 `HttpOnly` 授权 Cookie（有效期 30 天）。

私有资料的位置与边界：

| 内容 | 位置 | 下发方式 |
| --- | --- | --- |
| 答案配置 | 服务器私有目录（`RELATIONSHIP_PRIVATE_PATH`，默认 `work/relationship-private.json`） | 只传给工具运行时，**不进模型工具描述** |
| 彩蛋正文与日期 | 同上 | 只经需要授权 Cookie 的接口返回 |
| 专属壁纸 | `work/relationship-private/couple-wallpaper.webp` | `GET /api/relationship/wallpaper`，无 Cookie 一律 403 |

**不变量**：改 `localStorage`、伪造前端事件、直接访问资源地址都拿不到内容；这些内容不进前端源码、不进静态包、不进公开仓库。访客自己的愿望清单仍只存在当前浏览器，**Agent 无权读取**。

### 4.3 这套机制不要往别处套用

「签名 HttpOnly Cookie + 后端复核」是一个通用做法，但**它在本项目的语义是"彩蛋解锁"**：站级、二值（解锁 / 未解锁）、没有身份。如果将来要按人区分内容（每人看到不同的东西），那需要的是账号体系与逐条授权，不是把这里的问答再加几道——两者在凭据、粒度与名单三处都不同，混用会让"谁看到了什么"变得说不清楚。

---

## 5. 后端：结构与接口

| 模块 | 职责 |
| --- | --- |
| `app/main.py` | FastAPI 入口；lifespan 里准备只读配置并管理运行时 |
| `app/security.py` | 中间件：令牌、客户端地址归一、路径归一、body 校验、试次闸门、额度、并发、排队 |
| `app/services/quota_store.py` | SQLite 配额库：按来源与全站的滚动窗口在**专用线程事务**里检查，不阻塞事件循环 |
| `app/services/runtime_manager.py` | Harness 运行时的准备、租约与回收 |
| `app/services/ai_service.py` | 一轮对话的编排：SDK 调用、通知投影、流缓冲 |
| `app/services/progressive_reply.py` + `progressive_bridge.mjs` | `protocol=v2` 的真实正文增量 |
| `app/services/agent_prompt.py` | 固定的站内人设与边界（只称 NEKO、不透露真实姓名） |
| `app/services/relationship_access.py` | 彩蛋授权签发与复核 |
| `app/api/routes/chat.py` | 聊天（SSE）、会话、彩蛋解锁 |
| `app/api/routes/health.py` | `/health`（进程存活）与 `/api/ready`（四项就绪，不调付费模型） |

接口协议见 [backend/README.md](backend/README.md)：`POST /api/chat/` 收 `{messages:[...]}`，历史按 `previous_context` 传递、本轮问题独立放在 `input`；`?stream=true` 返回 SSE。

---

## 6. Agent

### 6.1 Harness 组合与工具白名单

使用官方 `sdk-minimal` profile，通过 `agent/website.patch.yml` 定制组合，**不修改 Harness 源码**。补丁显式禁用默认的 shell 及其执行基础设施：

```
persistent-bash / persistent-pwsh / terminal-bash / terminal-pwsh / pty / subprocess / sandbox / sandbox-policy / jobs   → disabled
tools.mode = native
insert: nekovccat-website-tools（name 由后端在运行时替换成模块的绝对路径）
```

保留 `session-projection`——它是官方 agent loop 的必需依赖。这套组合**不加载**文件编辑、浏览器、搜索等通用工具；插件自身还会阻止所有非站内工具执行。

### 6.2 三个站内工具（`agent/website-tools.mjs`）

| 工具 | 用途 |
| --- | --- |
| `site_info` | 查询站内公开栏目、描述、桌面深链接及助手入口 |
| `desktop_apps` | 查询桌面软件的用途与能力范围，以及 Agent、音乐在其它页面的使用方式 |
| `girlfriend_mode` | 在用户明确寻找彩蛋时验证问答；**答案配置只传给工具运行时** |

它**不读取**本机文件、便签或外部网站。公开内容由 NEKO Browser 展示；Agent 使用整理后的公开资料，不读取原始简历，只称作者 NEKO，不透露、确认或猜测真实姓名。

### 6.3 流式协议

`protocol=v2` 接收**真实正文增量**，按动画帧批量显示、完成时以最终答案校准——不是把整段回复延迟播放。每条回复内可展开真实处理状态与工具进度；用户向上翻看时停止自动跟随。

原始推理内容、工具参数与工具返回**不显示**为处理过程。已打开的旧页面继续走原 SSE 协议（协议通过查询参数选择，不破坏老客户端）。

当前官方 Python SDK `0.1.5rc1` 未对外转发逐 token 通知，因此**工具状态实时更新，回答生成完毕后整段显示**；页面没有人工模拟打字效果。

### 6.4 运行时管理

每个请求使用**独立 SDK 运行时与随机会话 ID**。取消、客户端断开、超时或失败都会关闭对应的运行时子进程；SSE 带注释心跳，发送与整轮请求都有超时预算。Harness 的 JSONL 轨迹落在 `work/deepseek-harness-home`，没有跨设备账户或聊天同步。

---

## 7. 限额、防洪与安全

完整策略与实测边界见 [deployment/agent-protection.md](deployment/agent-protection.md)，这里是设计要点。

### 7.1 三层结构

| 层 | 拦什么 | 代价 |
| --- | --- | --- |
| 边缘（Cloudflare 限速规则，**需另行配置**） | 体量型攻击，在流量到达隧道前丢弃 | 源码里改不动它；要在 Cloudflare 侧核对规则事件 |
| Next（前端试次闸门） | 连打与刷请求，在**读 body 之前** | 进程内存，重启即清 |
| 后端中间件 | 令牌、身份、body、试次、额度、并发、排队 | 见下 |

应用层的闸门**挡不住**体量型流量——它挡的是"花得掉模型钱与资源"的那类请求。

### 7.2 FIFO 队列

3 个执行名额（`CHAT_MAX_CONCURRENT=3`）占满时，请求进入**最多 12 位、最长 8 秒的 FIFO 队列**（`CHAT_QUEUE_MAX_SIZE` / `CHAT_QUEUE_WAIT_SECONDS`），队列满则立即拒绝。

- **同一来源只能有一个执行中或等待中的请求**：再发一条不能占第二个位置；
- 队列等待发生在发送响应头之前，且**不承诺**队列位置或一定执行；
- 等待中取消/断开即移除；body 非法、重复请求、队列拒绝与排队超时**都不消耗额度**；
- 后端在**真正获准执行前**原子复核持久额度，避免多个等待者同时花掉最后一格。

### 7.3 额度会计

| 维度 | 默认 |
| --- | --- |
| 每来源（IPv4 或 IPv6 /64） | 6 次/分钟、30 次/小时、60 次/滚动 24 小时 |
| 全站 | 400 次/滚动 24 小时 |
| 会话接口 | 12 次/分钟（独立冷却） |
| 公开聊天试次 | 每来源 3 次/10 秒；溢出进静默冷却，冷却按连续溢出次数翻倍 |

**滚动窗口，不是 0 点重置**。额度错误按对应请求的过期时间报告"最早可重试时间"。刷新、开新会话、轮换 cookie、重启应用都**不会清除** SQLite 里的历史。

**一旦获准执行就计次**，之后模型失败、超时或取消都仍计次——取消不是获取无限免费算力的方法。计数是请求数，不是 token 数，也不是精确的货币预算。

### 7.4 客户端地址

受信来源是 IPv4 地址或 IPv6 的 **/64 网段**；IPv6 的不同写法与 IPv4-mapped IPv6 归一到同一身份。**匿名会话 cookie 不是身份**，也不是绕过额度的手段——共用 NAT 或 /64 的访客共享这些限制。

`TRUST_CLOUDFLARE=true` 只有在"不受信客户端无法直连源站、也无法经其它代理注入 `cf-connecting-ip`"时才安全。`Forwarded` 与 `X-Forwarded-For` 都不构成身份。

### 7.5 部署纪律

**保持一个前端进程、一个后端 worker**：试次闸门与 FIFO 队列都是进程内状态，重启即清（SQLite 额度是持久的）。多实例需要先把准入做成共享服务——只共享 SQLite 不行，队列位置与内存冷却不会跟着共享。

日志只记结构化的固定字段（拒绝原因、排队时长、活跃/等待数），**不写聊天正文、cookie、模型密钥、原始地址或私人彩蛋内容**。额度打满本身不能指认攻击者，要看带时间戳的事件与边缘记录。

---

## 8. 赞助 NEKO（ETH）

| 项 | 设计 |
| --- | --- |
| 展示 | `public/images/neko-ethereum-qr.png` 二维码 + 地址文本 |
| 连接 | 兼容浏览器钱包（`window.ethereum`），`0x1` 主网 |
| 转账 | 用户确认后发**原生 ETH**：`eth_sendTransaction`（`from` / `to` / `value` / `chainId`） |
| 金额换算 | `lib/wallet.ts` 的 `ethToHex()` |
| 回执 | 未确认不显示成功；**不自动重发** |
| 与钱包的边界 | 只请求转账，**不请求授权额度**，不接触助记词与私钥 |

收款地址是 `lib/wallet.ts` 里的 `SPONSOR_ADDRESS` 常量。**改动它等于改动收款方**，属于需要明确确认的操作；本文不复述该字面量，避免它在别处被复制成第二份真相。

---

## 9. 桌面外观：壁纸主题与静态扫描线

- 壁纸有两套主题样式：`app/my-world/harbor-theme.css` 与 `night-harbor-theme.css`，字体在 `harbor-fonts.css`（像素字体，许可与哈希见 `public/fonts/`）。
- **CRT 扫描线是静态的**（Settings 里可开关）：没有动画，也没有粗细档位。
- 没有明暗两套配色——桌面就是一套复古外观。

---

## 10. 夜泊壁纸子系统

`components/my-world/night-harbor-wallpaper.tsx` + `night-harbor-animation.ts` + `night-harbor-assets.ts` + `night-harbor-wallpaper.css`，素材在 `public/images/my-world-night-harbor/`（`wallpaper` / `mobile` / `thumbnail` / `ambience` 四张 + 一份 `manifest`，文件名带内容哈希）。

要点（三个媒体查询决定行为）：**减少动态效果**、**窄屏**、**粗指针**。素材是"画在图上的颜色"，主题化时不做映射。文件名带内容哈希，所以内容一改文件名就变，可以放心长期缓存；换素材时记得同步更新 `night-harbor-assets.ts` 里的引用。

---

## 11. 桌面偏好模型

桌面偏好（壁纸、扫描线开关等）存在**当前浏览器**，随桌面软件一起按需加载。没有账号，所以没有跨设备同步——这是设计选择，不是缺失。

---

## 12. 内容、数据与本地脚本

| 内容 | 位置 |
| --- | --- |
| 建筑相册（42 张 Minecraft 图） | `public/images/minecraft/` |
| 首页全景 | `public/images/panorama-*.webp` + `panorama-assets.json`（由脚本生成） |
| 桌面像素壁纸 | `public/images/my-world-pixel-wallpaper.webp` |
| 彩蛋私有内容 | `work/relationship-private*`（**不进 Git、不进发布包**） |
| 字体 | `public/fonts/`（含各自许可与哈希） |

脚本：

| 脚本 | 用途 |
| --- | --- |
| `scripts/dev.py` | 前后端本地服务管理（start / status / stop）；日志与 PID 在 `work/nekovccat-*` |
| `scripts/prepare-panorama.mjs` | 从保留的原图重新生成全景素材与清单（文件名带内容哈希） |
| `scripts/measure-bundle.py` | 检查生产脚本体积（排除按需加载部分） |

`measure-bundle.py` 的语义要说清：它输出的是**生产 HTML 直接引用的 JavaScript 原始体积与本地 gzip 体积**，不代替浏览器网络统计或 Web Vitals。

---

## 13. 部署与运维

- 独立生产入口 `https://neko.origin.kim`，经**专属 Cloudflare Managed Tunnel** 进入；保留原 `origin.kim` 与已有项目。
- 前后端只绑回环，系统单元是 `deployment/nekoweb-{backend,frontend,tunnel}.service`。
- 版本化发布目录 + 稳定 `current` 软链，构建成功后才切；回滚就是把软链切回上一个已验收的 release，只重启本项目的两个服务。
- 环境变量模板：`deployment/backend.env.example`、`deployment/frontend.env.example`。密钥只写在服务器的环境文件里，绝不进 Git、不进 `NEXT_PUBLIC_*`。
- **公共仓库边界**（`deployment/README.md`）：模型密钥、内部令牌、隧道/SSH 凭据、彩蛋私有内容与专属壁纸、日志、运行时数据库、构建产物一律不提交。

---

## 14. 验证方法

| 验什么 | 怎么验 |
| --- | --- |
| 后端 | `(cd backend && .venv/bin/python -m unittest discover -s tests -v)` |
| Agent 插件 | `node --test agent/tests/*.test.mjs` |
| 前端聊天 / 音乐 | `(cd frontend && npm run test:chat && npm run test:music)` |
| 彩蛋 | `(cd frontend && npx tsx --test tests/relationship-*.test.ts)` |
| 类型 | `(cd frontend && npm run type-check)` |
| 服务就绪 | `/health`（进程存活）与 `/api/ready`（Agent 配置、代理认证、配额存储、可选数据库） |
| 未授权边界 | 不带授权 Cookie 访问 `/api/relationship/*` 必须 **403** |
| 洪水与排队 | **只对隔离的后端 + 假模型**演练，绝不打公开的付费模型 |

`/api/health` 只报告 FastAPI 存活，**验证 AI 必须真的走一次聊天**。

---

## 15. 关键决策记录

| 决策 | 代价 | 为什么 |
| --- | --- | --- |
| 排队而不是直接拒绝 | 多 12 位 × 8 秒的内存与状态 | 峰值时让正常访客等一会儿，而不是立刻失败 |
| 队列状态放进程内 | 不能多实例横向扩 | 队列位置与冷却天然是进程内的；共享 SQLite 不足以共享它们 |
| 获准执行即计次 | 失败/取消也占额度 | 否则"制造失败"就是绕过计费 |
| 滚动窗口而非 0 点重置 | 解释成本略高 | 固定边界会让人在边界两侧各刷一轮 |
| 匿名 cookie 不算身份 | 共用出口的访客互相影响 | 清 cookie 太便宜，不能当身份用 |
| 边缘限速留在 Cloudflare | 仓库里看不到完整防护 | 应用层拦不住体量型流量 |
| 彩蛋答案只在服务器 | 改答案要动服务器 | 进了前端源码就等于公开 |

---

## 16. 文件索引

| 想知道 | 看 |
| --- | --- |
| 窗口管理器 | `frontend/src/components/my-world/pixel-desktop.tsx`、`desktop-config.ts` |
| 桌面软件 | `components/my-world/{neko-browser,music-app,sponsor-app,our-space,our-letter,desktop-apps}.tsx` |
| 首页全景 | `components/layout/panorama-background.tsx`、`components/3d/city-scene.tsx`、`components/shared/preload-panorama.tsx` |
| Agent | `components/agent/{agent-app,agent-session}.tsx`、`components/layout/` |
| 彩蛋 | `components/relationship/relationship-mode.tsx`、`lib/relationship-content.ts`、`lib/relationship-dates.ts`、`lib/server/relationship-security.ts` |
| 聊天链路 | `app/api/chat/{route,session,relationship-unlock}/route.ts`、`lib/api/chat-*.ts`、`lib/server/chat-security.ts` |
| 钱包 | `lib/wallet.ts` |
| 后端安全 | `backend/app/security.py`、`backend/app/services/{quota_store,attempt_guard}.py` |
| 后端 Agent | `backend/app/services/{ai_service,runtime_manager,progressive_reply,stream_buffer,agent_prompt,relationship_access}.py` |
| Agent 插件与补丁 | `agent/website-tools.mjs`、`agent/website.patch.yml` |

---

## 17. 文档地图：其它目录里的 md

| 相对路径 | 是什么 |
| --- | --- |
| `backend/README.md` | 后端定位、本地启动、`POST /api/chat/` 协议与 SSE 格式 |
| `backend/ENV_SETUP.md` | 本地环境配置：`backend/.env` 怎么来、密钥填哪里 |
| `deployment/README.md` | 部署总览、构建、私有内容边界、上线验收、体积复核 |
| `deployment/agent-protection.md` | Agent 流量防护的完整默认值、排队与会计语义、部署纪律 |
| `frontend/README.md` | ⚠️ 泛化的 Next.js 脚手架说明（Supabase / Prisma 那一套），本项目**不用**，别照它做 |
| `scripts/` | 没有独立 md：看 `dev.py`、`prepare-panorama.mjs`、`measure-bundle.py` 的入口注释 |
| `CLEANUP_REPORT.md`、`PROJECT_STRUCTURE_PROPOSAL.md`、`RENAME_SUMMARY.md`、`TYPESCRIPT_ERROR_FIX.md`、`DEPLOYMENT_SETUP.md` | 历史记录；`DEPLOYMENT_SETUP.md` 讲的是 GitHub Pages 静态托管，**已过时且不可用** |
