# 应用开发与部署教程

本项目里「应用」有两种，**运行方式完全不同**。先看这张表决定做哪种：

| | **系统应用**（桌面软件） | **访客应用** |
| --- | --- | --- |
| 谁用 | 所有人（打开 `/terminal` 就能看到） | 只有登录「访客模式」的受邀访客 |
| 代码在哪 | 仓库里：`frontend/apps/<id>/` | 服务器上：`work/visitor-apps/<id>/`（或生产机的 `VISITOR_APPS_DIR`） |
| 界面形态 | React 组件（编译进前端） | 服务器在**登录后下发**的 HTML/JS |
| 能访问 | 桌面宿主能力（窗口、偏好、打开别的应用……） | 自己的键值数据 + 上传文件 + 第三方内嵌 |
| 加一个要 | 复制文件夹 + 改 `registry.json` + **重新构建** | 复制文件夹到服务器 + 给账号授权，**不用构建、不用重启** |
| 登录前前端有没有它 | 有（它就是前端的一部分） | **完全没有**（含素材、文案、界面） |
| 范例 | `frontend/apps/about/`、`frontend/apps/tomato/` | `docs/visitor-app-example/`（Notebook） |

一句话：**给所有人用的桌面软件 → 系统应用；只给特定访客、还可能要存数据/传文件 → 访客应用。**

---

# 第一部分：系统应用（桌面软件）

## A1. 它是什么

一个应用 = `frontend/apps/<id>/` 一个文件夹。应用只 import 公开契约 `@/app-kit`，由构建期的生成器接进桌面。

```
frontend/apps/<id>/
├── manifest.json      元数据（必填）
├── app.tsx            默认导出 React 组件（必填）
├── app.css            样式（可选）
└── assets/            图标与图片（manifest.icon 是相对路径时必填一个图标）
```

构建流程：`scripts/apps-registry.mjs` 读 `frontend/apps/registry.json` 的 `enabled` → 校验 manifest → 把 `assets/` 复制到 `frontend/public/apps/<id>/` → 生成 `frontend/src/app-kit/generated.tsx`（静态 import）。生成器已挂在 `predev` / `prebuild`，**`npm run dev` / `npm run build` 会自动跑**。

## A2. `manifest.json`

```jsonc
{
  "apiVersion": 1,              // 必填，必须等于宿主（见 src/app-kit/index.ts 的 APP_API_VERSION）
  "id": "tomato",               // 必填，必须等于文件夹名：^[a-z0-9][a-z0-9-]{0,31}$
  "title": "Tomato Timer",      // 必填
  "subtitle": "专注一小会儿",    // 必填
  "icon": "tomato.svg",         // 必填；相对 assets/ 的文件名，或 / 开头的站点绝对路径
  "statusText": "PLUGIN",       // 可选：窗口状态栏左侧文案（默认 MARCUS OS）
  "titleSuffix": " / 计时器",    // 可选：标题栏里跟在应用名后的小字
  "version": "1.0.0",           // 可选，纯展示
  "window": {
    "width": 560,               // 必填
    "height": 480,              // 必填
    "panelWidth": 760           // 可选：点窗口空白处向右展开的宽度；不写就没有侧栏
  }
}
```

> `window.visibleMargin`、`window.className`、`system` 是给**第一方**应用用的，插件不要写。

## A3. `app.tsx`：只依赖 `@/app-kit`

```tsx
'use client'
import { useEffect, useState } from 'react'
import type { AppProps } from '@/app-kit'
import './app.css'

export default function MyApp({ host }: AppProps) {
  const [count, setCount] = useState(() => host.readPreference('count', 0))
  useEffect(() => host.onClose(() => host.writePreference('count', count)), [host, count])
  return <button onClick={() => { const next = count + 1; setCount(next); host.writePreference('count', next) }}>
    点我：{count}
  </button>
}
```

宿主能力（完整见 `frontend/src/app-kit/index.ts`）：

| `host` 成员 | 作用 |
| --- | --- |
| `appId` / `layer` / `active` / `maximized` / `panelOpen` / `theme` | 当前窗口与主题状态 |
| `appCount` | 桌面上已注册的应用数 |
| `settings` / `updateSettings` | 桌面偏好（建议优先用下面的偏好接口） |
| `openApp(id)` | 打开/聚焦另一个应用；访客应用用 `visitor-app:<id>` |
| `focusSelf()` / `closeSelf()` | 把自己置顶 / 关闭 |
| `setPanel(open)` | 展开/收起自己的侧栏（需 `window.panelWidth`） |
| `onClose(fn)` | 注册「关窗时」的回调，**返回注销函数**，在 `useEffect` 里 return 它 |
| `showDesktop()` | 最小化全部窗口 |
| `asset(file)` | 自带素材地址：`asset('cover.webp')` → `/apps/<id>/cover.webp` |
| `readPreference(k, fallback)` / `writePreference(k, v)` | 应用自己的偏好，按应用隔离存在浏览器 |
| `browse` | 站内浏览器深链接目标（只有 MARCUS Browser 用得到） |

**禁止** import `@/components/*` 或 `@/lib/*`（`frontend/tests/apps-registry.test.ts` 会扫描并判失败）。

## A4. 样式：只用主题 token

应用 CSS 只能用宿主在明暗两套里定义的 `--app-*` 变量，这样切主题会自动跟随，也能搬到别的同架构站点：

```css
.my-app { background: var(--app-surface); color: var(--app-ink); border: 1px solid var(--app-edge); }
```

可用 token：`--app-surface`、`--app-surface-raised`、`--app-panel`、`--app-ink`、`--app-ink-muted`、`--app-edge`、`--app-bevel-light`、`--app-bevel-dark`、`--app-accent`、`--app-accent-ink`、`--app-title`（定义在 `frontend/src/app/terminal/app-tokens.css`）。

测试会禁止 `app.css` 出现写死的颜色。

## A5. 安装 / 卸载

**安装**（例如别人发给你的应用）：

```bash
# 1. 复制文件夹
cp -r <对方的应用文件夹> frontend/apps/<id>/

# 2. 登记
#    编辑 frontend/apps/registry.json： { "enabled": ["about", "tomato", "<id>"] }

# 3. 构建（会自动跑生成器；也可先单独跑 npm run app:registry 看结果）
cd frontend && npm run build
```

**卸载**：从 `registry.json` 的 `enabled` 删掉 id（或删文件夹）→ 重新构建；`public/apps/` 里的旧素材副本会在下次生成时自动清掉。

## A6. 部署（系统应用要重新构建）

系统应用是前端产物的一部分，**必须重新构建并发布前端**：

```bash
cd frontend
npm run build                 # 生成 + 构建（output: standalone）
# 然后把 public/ 与 .next/static 拷进 .next/standalone/ 打包、上传服务器
```

完整发布步骤见 [`deployment/README.md`](../deployment/README.md)。生产环境**不需要**为系统应用加任何环境变量。

## A7. 想改成「可搬运」的内置应用？

`agent` / `visitor` / `explorer` / `music` / `notes` / `settings` 目前是**内置**应用（登记在 `frontend/src/app-kit/builtin.tsx`，实现留在 `src/components/`，因为它们要用宿主的 Provider）。要把其中一个变成 `apps/` 里的可搬运应用：把实现移进 `frontend/apps/<id>/`（只 import `@/app-kit`），再从 `builtin.tsx` 删掉即可，宿主不用改。

## A8. 校验

```bash
cd frontend
npm run app:registry          # 只跑生成器（含校验）
node ../scripts/apps-registry.mjs --check   # 校验生成物是否与 registry.json 同步
npm test                      # 含“生成物同步 / 可搬运性 / token”三条守卫
npx tsc --noEmit && npm run lint && npm run build
```

---

# 第二部分：访客应用

## B1. 它是什么

一个应用 = 服务器上一个文件夹，登录且被授权后才由后端下发界面。前端产物里**没有任何**它的界面、文案或素材。

```
work/visitor-apps/<id>/          # 生产机上是 VISITOR_APPS_DIR
├── app.json         元数据与能力声明（必填）
├── index.html       入口 HTML（entry 指向它，必填）
├── app.js / app.css / 其它它引用的文件
└── assets/          图标与壁纸（登录后经授权下发）
```

运行方式：宿主在桌面窗口里放一个**同源 iframe**，`src` 指向 `/api/visitor/app-proxy/apps/<id>/shell`；应用页面用相对路径访问自己的数据与文件。凭据（访客 Cookie）只在宿主，应用拿不到。

## B2. `app.json`

```jsonc
{
  "apiVersion": 1,                 // 必填，必须等于后端 APP_API_VERSION
  "id": "notebook",                // 必填，必须等于文件夹名
  "title": "Notebook",             // 必填
  "subtitle": "上传与数据示例",      // 可选
  "watermark": "PRIVATE DESKTOP",   // 可选：有壁纸时桌面右下角水印
  "icon": "icon.svg",              // 可选：相对 assets/ 的图标
  "wallpaper": "wall.jpg",         // 可选：相对 assets/ 的壁纸（打开/聚焦时铺在桌面）
  "window": { "width": 640, "height": 560 },   // 可选，默认 560×580（范围 320×320 ~ 1600×1200）
  "entry": "index.html",           // 必填：入口 HTML
  "permissions": ["files", "data"],// 可选：申请的能力，不写就都没有
  "embeds": ["https://example.com"]// 可选：允许内嵌的第三方源（https origin）
}
```

## B3. 应用能用的接口（相对 shell 地址）

shell 地址是 `/api/visitor/app-proxy/apps/<id>/shell`，所以相对路径都落在同一前缀下，直接 `fetch` 即可：

| 相对路径 | 方法 | 作用 |
| --- | --- | --- |
| `data` | GET | 读回全部键值：`{ "data": { key: value } }` |
| `data/<key>` | PUT / DELETE | 写 / 删一个键（PUT 请求体是 JSON） |
| `files` | GET | 列出已上传文件：`{ "files": [{name, size, updatedAt}] }` |
| `files/<name>` | PUT | 上传（**请求体就是文件字节**，不是 multipart） |
| `files/<name>` | GET | 下载；加 `?inline=1` 则不写 `Content-Disposition`，浏览器内联显示（图片/PDF 预览） |
| `files/<name>` | DELETE | 删除 |

只有 `permissions` 里申请了 `files` / `data` 才能用对应接口，否则 403。

**限额**：单个数据值 ≤ 64 KB、每应用每访客 ≤ 200 键；单个文件 ≤ 8 MB、每应用每访客 ≤ 200 个；文件名只允许字母、数字、点、下划线、空格、连字符。

示例（保存一条笔记 + 上传一个文件）：

```js
await fetch('data/note', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify('hello') })
await fetch('files/photo.png', { method: 'PUT', body: file })   // file 来自 <input type="file">
```

## B4. 主题与第三方内嵌

- **主题**：宿主在 iframe 载入与主题切换时，把 `--app-*` 变量和 `data-theme` 写进 iframe 的 `documentElement`，并 `postMessage({ type: 'marcus:theme', theme })`。应用 CSS 直接写 `var(--app-surface)` 就会跟随明暗；想手动监听可以 `window.addEventListener('message', ...)`。
- **第三方内嵌**：在 `embeds` 里列出源，然后在 HTML 里正常写 `<iframe src="https://…">`。后端会为这个应用下发一条 `frame-src 'self' <embeds>` 的 CSP，没列出的源会被浏览器拦下。

## B5. 安装 / 卸载

**安装**（开发机示例）：

```bash
# 1. 复制应用文件夹到服务器侧目录
cp -r docs/visitor-app-example work/visitor-apps/notebook

# 2. 授权给某个访客（--apps 是整份替换，把原有的也列上）
python scripts/add-visitor.py <访客名> --apps notebook
#    只想加不想覆盖？先 --list 看现有，再一次列全；清空用 --apps none

# 3. 访客刷新登录状态即可——不用改代码、不用重启、不用构建
```

生产机上把文件夹放到 `VISITOR_APPS_DIR`（例如 `/var/lib/marcusweb-private/visitor-apps/`），再用 `add-visitor.py --apps …` 授权。

**卸载**：删掉文件夹和/或把它从账号授权里去掉即可。

## B6. 部署（访客应用不用构建）

访客应用只在服务器侧，**不需要重新构建前端、不需要重启服务**（目录每次请求重读）。需要在 `backend.env` 里配好三个绝对路径：

```dotenv
VISITOR_APPS_DIR=/var/lib/marcusweb-private/visitor-apps
VISITOR_APP_FILES_DIR=/var/lib/marcusweb-private/visitor-app-files   # 上传文件
VISITOR_APP_DATA_DB=/var/lib/marcusweb-private/visitor-app-data.sqlite  # 键值数据
```

权限：目录 `0700`、属主 `marcusweb`；数据与文件都只由后端读写，绝不进前端产物。细节见 [`deployment/DATABASE.md`](../deployment/DATABASE.md)。

## B7. 完整的可复制范例

[`docs/visitor-app-example/`](visitor-app-example/README.md)（Notebook）演示了：写数据、上传/下载/删除文件、字段表与接口。直接复制它改名即可。

---

# 附录

## C1. 两种应用对照速查

| 问题 | 系统应用 | 访客应用 |
| --- | --- | --- |
| 目录 | `frontend/apps/<id>/` | `work/visitor-apps/<id>/`（服务器侧） |
| 要重新构建吗 | 要（`npm run build`） | 不要 |
| 要重启服务吗 | 前端进程重启 | 不要 |
| 环境变量 | 无 | `VISITOR_APPS_DIR` / `VISITOR_APP_FILES_DIR` / `VISITOR_APP_DATA_DB` |
| 谁能看到 | 所有访客 | 被授权的访客账号 |
| 能用上传/数据库/内嵌吗 | 不能（没有服务器侧） | 能 |
| 登录前前端有它吗 | 有 | 没有 |

## C2. 验证命令

```bash
# 后端
cd backend && .venv/Scripts/python.exe -m unittest discover -s tests   # Windows
# 前端
cd frontend && npm test && npm run type-check && npm run lint && npm run build
# 访客应用目录能否被后端读通（开发机）
cd backend && .venv/Scripts/python.exe -c "from app.services.visitor_apps import load_apps; print(list(load_apps()))"
```

## C3. 常见问题

| 现象 | 原因 / 处理 |
| --- | --- |
| 系统应用加了但不出现 | 忘了改 `registry.json`；或 `npm run app:registry --check` 报不同步 → 重新 `npm run app:registry` 后重构建 |
| 系统应用构建失败、报某个 import | 应用 import 了 `@/components/*` 或 `@/lib/*`；插件只能用 `@/app-kit` 与自己的相对路径 |
| 访客应用打开是空白 | 看浏览器控制台：`entry` 文件不存在（404）、`permissions` 没申请对应能力（403）、或 `apiVersion` 不匹配被跳过（后端日志有 warning） |
| 访客应用数据/上传 403 | `app.json` 的 `permissions` 里没有 `files` / `data` |
| 访客应用第三方内嵌被拦 | 该源没写进 `app.json` 的 `embeds` |
| 访客应用样式不随明暗 | 用了写死颜色；改成 `var(--app-*)` token |
| 访客应用改了不生效 | 后端目录每次请求重读，一般立即生效；若你把它挪进了前端目录或加了缓存，检查一下部署方式 |
