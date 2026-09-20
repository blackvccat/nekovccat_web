/** 访客应用的元数据：登录后由服务器按账号下发；前端登录前只知道「能打开哪些应用」。 */
export interface VisitorAppMeta {
  id: string
  title: string
  subtitle: string
  watermark: string
  hasIcon: boolean
  hasWallpaper: boolean
  /** 应用自带窗口尺寸；缺失时前端退回默认值。 */
  window?: { width: number; height: number }
}

/** 应用没声明 window 时用的默认窗口尺寸。 */
export const VISITOR_APP_FALLBACK_SIZE = { width: 560, height: 580 }

/** 应用图标的地址：应用自带图标就向后端要（登录后才取得到），否则用公开目录里的中性占位图。 */
export function visitorAppIcon(app: { id: string; hasIcon: boolean }): string {
  return app.hasIcon ? `/api/visitor/asset?app=${encodeURIComponent(app.id)}&kind=icon` : '/icons-svg/visitor-app.svg'
}

/**
 * 注入到访客应用 iframe 里的主题 token（与桌面 `app-tokens.css` 同一套值）。
 *
 * iframe 是独立文档，宿主的 CSS 变量不会跨进去，所以宿主在 iframe 载入与主题切换时把这份
 * 变量写进它的 `:root`，并设 `data-theme`。应用 CSS 直接写 `var(--app-surface)` 就能跟随明暗。
 */
export const VISITOR_APP_THEME_TOKENS: Record<'light' | 'dark', Record<string, string>> = {
  light: {
    '--app-surface': '#f5f3e7',
    '--app-surface-raised': '#faf7eb',
    '--app-panel': '#e5e1cf',
    '--app-ink': '#34423b',
    '--app-ink-muted': '#7a856f',
    '--app-edge': '#8e9683',
    '--app-bevel-light': '#fffdf1',
    '--app-bevel-dark': '#aab09d',
    '--app-accent': '#657e4e',
    '--app-accent-ink': '#fdfaf0',
    '--app-title': '#34425c',
  },
  dark: {
    '--app-surface': '#131a16',
    '--app-surface-raised': '#182c1f',
    '--app-panel': '#121915',
    '--app-ink': '#c7ecd3',
    '--app-ink-muted': '#57c77c',
    '--app-edge': '#388a54',
    '--app-bevel-light': '#437254',
    '--app-bevel-dark': '#08110b',
    '--app-accent': '#3adf71',
    '--app-accent-ink': '#08110b',
    '--app-title': '#193322',
  },
}
