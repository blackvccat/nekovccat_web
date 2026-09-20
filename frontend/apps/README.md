# 桌面应用目录

这个目录是**装/卸桌面软件的地方**。每个应用是一个独立文件夹，自带界面、样式与素材；只要把它复制进来、在 `registry.json` 里登记，重新构建后就会出现在像素桌面上。**不需要改宿主的任何底层代码**（不用碰 `pixel-desktop.tsx`、图标表或类型定义）。

```
apps/
├── registry.json         ← 唯一要手改的文件：列出启用的应用 id
├── about/                ← 已启用的示例（原来的 About Computer 搬进来了）
│   ├── manifest.json
│   ├── app.tsx
│   └── assets/about.svg
└── tomato/               ← 示例：默认**关闭**，加进 registry.json 就能看到
    ├── manifest.json
    ├── app.tsx
    ├── app.css
    └── assets/tomato.svg
```

## 装一个应用（例如别人发给你的）

1. 把整个应用文件夹复制到 `frontend/apps/` 下；
2. 打开 `frontend/apps/registry.json`，把它的 id 加进 `enabled`：

   ```json
   { "enabled": ["about", "tomato"] }
   ```

3. 构建（`npm run dev` / `npm run build` 会自动先跑注册表生成）：

   ```bash
   cd frontend
   npm run app:registry   # 生成 src/app-kit/generated.tsx 并复制素材；dev/build 已自动调用
   npm run build
   ```

**卸载**：从 `enabled` 里删掉 id（或删掉文件夹）再构建即可。目录里剩下的旧素材副本会被自动清掉。

## 自己写一个应用

应用文件夹的样子（id 必须等于文件夹名：小写字母/数字/连字符，≤32 位）：

```
apps/<id>/
├── manifest.json     元数据（必填）
├── app.tsx           export default function App({ host })（必填）
├── app.css           样式（可选）
└── assets/           图标与图片（manifest.icon 是相对路径时必填）
```

### `manifest.json`

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `apiVersion` | ✅ | 契约版本，目前固定 `1`。与宿主不一致时应用会被跳过而不是崩溃 |
| `id` | ✅ | 必须等于文件夹名 |
| `title` / `subtitle` | ✅ | 桌面图标、开始菜单、窗口标题用的名字与说明 |
| `icon` | ✅ | 相对 `assets/` 的文件名；以 `/` 开头则当作站点绝对路径（内置应用才这么用） |
| `window.width` / `height` | ✅ | 窗口初始尺寸 |
| `window.panelWidth` | | 点窗口空白处展开侧栏后的宽度；不写就没有侧栏 |
| `window.visibleMargin` | | 夹回可视区时右侧至少留的边距（`narrow` / `wide` / `wideFrom`） |
| `statusText` | | 窗口状态栏左侧文案，默认 `MARCUS OS` |
| `titleSuffix` | | 标题栏里跟在应用名后的小字 |
| `version` | | 纯展示 |

### `app.tsx` 的宿主接口

应用是普通 React 组件，只从 **`@/app-kit`** 取类型。**不要** import `@/components/*` 或 `@/lib/*`——那会让应用绑死在某一份宿主实现上，搬到别处就编译不过。

```tsx
'use client'
import type { AppProps } from '@/app-kit'

export default function MyApp({ host }: AppProps) {
  return <button onClick={() => host.openApp('notes')}>打开 Notes</button>
}
```

| `host` 成员 | 作用 |
| --- | --- |
| `appId` / `layer` / `active` / `maximized` / `panelOpen` / `theme` | 当前窗口与主题状态 |
| `appCount` | 桌面上已注册的应用数 |
| `settings` / `updateSettings` | 桌面偏好（**建议优先用下面的偏好接口**，别依赖宿主内部模型） |
| `openApp(id)` | 打开/聚焦另一个应用；访客应用用 `visitor-app:<id>` |
| `focusSelf()` / `closeSelf()` | 把自己置顶 / 关闭 |
| `setPanel(open)` | 展开或收起自己的侧栏（需 `window.panelWidth`） |
| `onClose(handler)` | 注册「关窗时」的回调，返回注销函数；在 `useEffect` 里返回它即可 |
| `showDesktop()` | 最小化全部窗口 |
| `asset(file)` | 自带素材地址：`asset('cover.webp')` → `/apps/<id>/cover.webp` |
| `readPreference(key, fallback)` / `writePreference(key, value)` | 应用自己的偏好，按应用隔离存在当前浏览器 |
| `browse` | 站内浏览器深链接目标，只有 MARCUS Browser 用得到 |

### 样式：只用主题 token

插件 CSS 进不了宿主的暗色生成器，所以约定：**只用 `--app-*` 变量**，宿主在明暗两套里各定义一次（`frontend/src/app/terminal/app-tokens.css`）。这样应用搬到另一个同架构站点时，样式会自动跟随那边的主题。

```css
.my-app { background: var(--app-surface); color: var(--app-ink); border: 1px solid var(--app-edge); }
```

可用 token：`--app-surface`、`--app-surface-raised`、`--app-panel`、`--app-ink`、`--app-ink-muted`、`--app-edge`、`--app-bevel-light`、`--app-bevel-dark`、`--app-accent`、`--app-accent-ink`、`--app-title`。

## 跨站点搬运的约定

- **契约版本化**：宿主与插件都写 `apiVersion`；版本对不上时插件被跳过并在控制台说明。
- **只依赖 `@/app-kit`**：这是唯一稳定的公开接口；内部实现改动不会影响插件。
- **素材走 `host.asset()`**：不要写死 `/icons-svg/...` 这类宿主路径。
- **样式走 token**：不要写死颜色。
- 这三条都有测试守着：`frontend/tests/apps-registry.test.ts`。

## 内置应用去哪了

`agent`、`visitor`、`explorer`、`music`、`notes`、`settings` 仍是**内置应用**（实现留在 `src/components/`，因为它们要用宿主的 Provider）。它们和插件应用走同一套 `AppModule` / `AppHost` 机制，登记在 `frontend/src/app-kit/builtin.tsx`。想把其中某个也变成可搬运的，就把它的实现移进 `apps/<id>/`（只用 `@/app-kit`），再从 `builtin.tsx` 删掉即可。

## 相关文件

| 文件 | 作用 |
| --- | --- |
| `frontend/src/app-kit/index.ts` | 公开契约（`AppManifest` / `DesktopAppHost` / `AppModule`） |
| `frontend/src/app-kit/builtin.tsx` | 内置应用的登记表 |
| `frontend/src/app-kit/registry.ts` | 内置 + 插件的合并注册表与查询 |
| `frontend/src/app-kit/generated.tsx` | **【生成物，勿手改】** 由脚本产出 |
| `scripts/apps-registry.mjs` | 生成器：校验 → 复制素材 → 生成注册表；`--check` 供测试 |
| `frontend/src/app/terminal/app-tokens.css` | 插件的主题 token |
