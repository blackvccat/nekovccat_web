import type { PixelIconName } from './pixel-icon'

export type DesktopAppId = Exclude<PixelIconName, 'home'>
export type WallpaperMotion = 'auto' | 'on' | 'off'
export interface DesktopSettings {
  wallpaper: 'night-harbor' | 'island' | 'dusk' | 'sage'
  wallpaperMotion: WallpaperMotion
  scanlines: boolean
}
export const DEFAULT_SETTINGS: DesktopSettings = { wallpaper: 'night-harbor', wallpaperMotion: 'auto', scanlines: false }

// Older saved themes remain the visitor's choice; only new preferences use defaults.
export function readDesktopSettings(value: unknown): DesktopSettings {
  const saved = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  return {
    wallpaper: typeof saved.wallpaper === 'string' && ['night-harbor', 'island', 'dusk', 'sage'].includes(saved.wallpaper)
      ? saved.wallpaper as DesktopSettings['wallpaper'] : DEFAULT_SETTINGS.wallpaper,
    wallpaperMotion: typeof saved.wallpaperMotion === 'string' && ['auto', 'on', 'off'].includes(saved.wallpaperMotion)
      ? saved.wallpaperMotion as WallpaperMotion : DEFAULT_SETTINGS.wallpaperMotion,
    scanlines: typeof saved.scanlines === 'boolean' ? saved.scanlines : DEFAULT_SETTINGS.scanlines,
  }
}
export const DESKTOP_APPS: { id: DesktopAppId; title: string; subtitle: string; width: number; height: number }[] = [
  { id: 'agent', title: 'NEKO Agent', subtitle: '你的站内 AI 向导', width: 660, height: 548 },
  { id: 'our-space', title: '我们的小窝', subtitle: '已解锁的彩蛋', width: 380, height: 552 },
  { id: 'explorer', title: 'NEKO Browser', subtitle: '关于、作品、建筑与联系', width: 700, height: 610 },
  { id: 'sponsor', title: '赞助 NEKO', subtitle: '给下一次创造一点支持', width: 490, height: 600 },
  { id: 'music', title: 'NEKO Music', subtitle: '给小世界配一首歌', width: 576, height: 596 },
  { id: 'notes', title: 'Notes', subtitle: '留下一点想法', width: 450, height: 410 },
  { id: 'settings', title: 'Settings', subtitle: '布置你的桌面', width: 510, height: 600 },
  { id: 'about', title: 'About Computer', subtitle: '关于这台小电脑', width: 460, height: 390 },
]
