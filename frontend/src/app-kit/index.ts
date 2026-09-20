/** 桌面应用的公开契约 —— 插件应用唯一允许 import 的宿主路径（`@/app-kit`）。
 *
 *  设计目标：应用文件夹能在「底层架构相同」的站点之间直接搬运。所以：
 *  1. 插件只依赖这里定义的宿主能力，**不要** import `@/components/*` 或 `@/lib/*` 内部模块；
 *  2. 宿主与插件用 `apiVersion` 对齐，版本对不上时桌面会跳过该应用而不是崩溃；
 *  3. 需要新增宿主能力时只在这里**追加**，不改已有字段的含义。
 *
 *  应用自己的界面、文案、样式、素材全部放在 `frontend/apps/<id>/` 里，搬走时一起带走。
 */
import type { ComponentType } from 'react'
import type { DesktopSettings } from '@/lib/desktop-settings'

/** 契约版本。宿主与插件都必须写这个值；不相等时插件不会被加载。 */
export const APP_API_VERSION = 1

/** 访客应用窗口的 id 前缀：`host.openApp('visitor-app:<appId>')`。 */
export const VISITOR_APP_PREFIX = 'visitor-app:'

export type AppTheme = 'light' | 'dark'

/** 宿主提供给每个应用窗口的能力。插件只能用这里的接口。 */
export interface DesktopAppHost {
  /** 当前窗口的应用 id（访客应用窗口除外）。 */
  appId: string
  /** 窗口层级（z-index）；需要贴合窗口的持久元素会用到。 */
  layer: number
  /** 是否是当前活动窗口。 */
  active: boolean
  /** 是否最大化。 */
  maximized: boolean
  /** 侧栏（manifest 里声明了 `window.panelWidth` 才有）是否展开。 */
  panelOpen: boolean
  /** 当前明暗主题。 */
  theme: AppTheme
  /** 桌面上已注册的应用总数（内置 + 插件，不含访客应用）。 */
  appCount: number
  /** 当前桌面偏好。插件应优先用 readPreference/writePreference 存自己的状态。 */
  settings: DesktopSettings
  updateSettings(patch: Partial<DesktopSettings>): void
  /** 打开或聚焦另一个桌面应用（含访客应用：用 `visitor-app:<id>`）。 */
  openApp(id: string): void
  /** 把当前窗口提到最前。 */
  focusSelf(): void
  /** 关闭当前窗口。 */
  closeSelf(): void
  /** 展开/收起自己的侧栏。 */
  setPanel(open: boolean): void
  /** 注册「窗口被关闭」的回调；返回注销函数，组件卸载时请调用它。 */
  onClose(handler: () => void): () => void
  /** 最小化全部窗口，露出桌面。 */
  showDesktop(): void
  /** 应用自带素材的地址：`asset('cover.webp')` → `/apps/<id>/cover.webp`。 */
  asset(file: string): string
  /** 读取应用自己的偏好（按应用隔离，存在当前浏览器）。 */
  readPreference<T>(key: string, fallback: T): T
  /** 写入应用自己的偏好。 */
  writePreference(key: string, value: unknown): void
  /** 站内浏览器的深链接目标，目前只有 MARCUS Browser 使用；其它应用忽略即可。 */
  browse: { page: string; key: number }
}

/** 窗口几何。没写的字段按宿主默认值处理。 */
export interface AppWindowSpec {
  width: number
  height: number
  /** 点窗口空白处后向右展开的宽度；不写就不提供侧栏。 */
  panelWidth?: number
  /** 夹回可视区时右侧至少保留的边距；`narrow` 用于窄舞台，`wide` 用于 `>= wideFrom`。 */
  visibleMargin?: { narrow: number; wide: number; wideFrom: number; minX?: number }
  /** 追加到窗口根节点的类名（第一方窗口用，插件一般不需要）。 */
  className?: string
}

export interface AppManifest {
  apiVersion: number
  /** 唯一 id，必须等于文件夹名：小写字母、数字与连字符，最长 32 位。 */
  id: string
  title: string
  subtitle: string
  /** 相对应用 `assets/` 的图标文件名；以 `/` 开头则按站点绝对路径使用。 */
  icon: string
  /** 窗口状态栏左侧文案，默认 `MARCUS OS`。 */
  statusText?: string
  /** 标题栏里跟在应用名后的小字。 */
  titleSuffix?: string
  window: AppWindowSpec
  /** 第一方系统窗口标记；插件请勿使用。 */
  system?: 'visitor'
  /** 可选的版本说明，纯展示用途。 */
  version?: string
}

export interface AppProps {
  host: DesktopAppHost
}

export interface AppModule {
  manifest: AppManifest
  Component: ComponentType<AppProps>
}

/** 图标地址：相对名落到 `/apps/<id>/`，绝对路径原样使用（内置应用用后者）。 */
export function resolveAppIcon(manifest: Pick<AppManifest, 'id' | 'icon'>): string {
  return manifest.icon.startsWith('/') ? manifest.icon : `/apps/${manifest.id}/${manifest.icon}`
}
