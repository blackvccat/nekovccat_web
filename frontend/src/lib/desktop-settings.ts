/** 桌面偏好的唯一登记处：明暗、壁纸清单、动效档位、扫描线粗细与读盘校验。
 *  保存的值来自 localStorage，可能是上一个版本写的，所以每个字段单独兜底，
 *  而不是整份作废——旧存档里没有 theme / wallpaperMotion / scanlineWidth 时，其余选择必须活下来。 */

export const WALLPAPERS = [
  { value: 'cloud', title: '云端', caption: 'Above the little world' },
  { value: 'pixelcloud', title: '像素云', caption: 'Clouds, pixel by pixel' },
  { value: 'one-seagull', title: '一只海鸥', caption: 'One seagull, wide sky' },
  { value: 'island', title: '猫咪小岛', caption: 'A quiet little world' },
  { value: 'night-harbor', title: '夜泊', caption: 'Cat tail, harbor lights' },
  { value: 'dusk', title: '暮色', caption: 'After the sunset' },
  { value: 'sage', title: '鼠尾草绿', caption: 'Keep it simple' },
] as const

export type Wallpaper = (typeof WALLPAPERS)[number]['value']

export const WALLPAPER_MOTIONS = [
  { value: 'auto', title: '自动' },
  { value: 'on', title: '开启' },
  { value: 'off', title: '关闭' },
] as const

export type WallpaperMotion = (typeof WALLPAPER_MOTIONS)[number]['value']

export const THEMES = [
  { value: 'light', title: '明亮', caption: '米白面板，像白天那台机器' },
  { value: 'dark', title: '暗色', caption: '深色玻璃配荧光绿，像老终端' },
] as const

export type DesktopTheme = (typeof THEMES)[number]['value']

/** 扫描线粗细。三档按**线宽**单调递增：细 1px、中 2px、粗 3px（曾经把中与粗都做成 2px，
 *  只差密度，看着几乎一样——档位必须能让眼睛分出来）。
 *  `auto` 按明暗给：明亮细（1px 线在米白屏上刚好）、暗色中（细线压在近黑屏上等于没有，
 *  而中就是原来那组 2px / 4px 的观感）。 */
export const SCANLINE_WIDTHS = [
  { value: 'auto', title: '自动' },
  { value: 'thin', title: '细' },
  { value: 'medium', title: '中' },
  { value: 'coarse', title: '粗' },
] as const

export type ScanlineWidth = (typeof SCANLINE_WIDTHS)[number]['value']

export interface DesktopSettings {
  theme: DesktopTheme
  wallpaper: Wallpaper
  wallpaperMotion: WallpaperMotion
  scanlines: boolean
  scanlineWidth: ScanlineWidth
}

export const DEFAULT_SETTINGS: DesktopSettings = { theme: 'light', wallpaper: 'cloud', wallpaperMotion: 'auto', scanlines: false, scanlineWidth: 'auto' }

/** `auto` 落到具体档位：明亮细、暗色粗。CSS 只认 thin/medium/coarse，不再自己判断主题。 */
export function resolveScanlineWidth(settings: Pick<DesktopSettings, 'scanlineWidth' | 'theme'>): Exclude<ScanlineWidth, 'auto'> {
  if (settings.scanlineWidth !== 'auto') return settings.scanlineWidth
  return settings.theme === 'dark' ? 'medium' : 'thin'
}

const isWallpaper = (value: unknown): value is Wallpaper => WALLPAPERS.some(wallpaper => wallpaper.value === value)
const isMotion = (value: unknown): value is WallpaperMotion => WALLPAPER_MOTIONS.some(motion => motion.value === value)
const isTheme = (value: unknown): value is DesktopTheme => THEMES.some(theme => theme.value === value)
const isScanlineWidth = (value: unknown): value is ScanlineWidth => SCANLINE_WIDTHS.some(width => width.value === value)

export function readDesktopSettings(value: unknown): DesktopSettings {
  const saved = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  return {
    theme: isTheme(saved.theme) ? saved.theme : DEFAULT_SETTINGS.theme,
    wallpaper: isWallpaper(saved.wallpaper) ? saved.wallpaper : DEFAULT_SETTINGS.wallpaper,
    wallpaperMotion: isMotion(saved.wallpaperMotion) ? saved.wallpaperMotion : DEFAULT_SETTINGS.wallpaperMotion,
    scanlines: typeof saved.scanlines === 'boolean' ? saved.scanlines : DEFAULT_SETTINGS.scanlines,
    scanlineWidth: isScanlineWidth(saved.scanlineWidth) ? saved.scanlineWidth : DEFAULT_SETTINGS.scanlineWidth,
  }
}
