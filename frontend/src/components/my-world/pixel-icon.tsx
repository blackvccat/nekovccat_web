export type PixelIconName = 'agent' | 'explorer' | 'music' | 'notes' | 'settings' | 'about' | 'home' | 'visitor' | 'visitor-app'

/**
 * 图标本体是 frontend/public/icons-svg 下的独立 SVG 文件（画稿放在 work/icons-svg，
 * 用 scripts/pixel-icons.py sync 同步过来），组件里只留这张「名字 → 文件」的表。
 * 改名或换图标就改文件；新增名字要同时加进 PixelIconName 和这张表。
 */
const ICON_FILES: Record<PixelIconName, string> = {
  agent: 'agent.svg', explorer: 'explorer.svg', music: 'music.svg', notes: 'notes.svg',
  settings: 'settings.svg', about: 'about.svg', home: 'home.svg',
  visitor: 'login.svg', 'visitor-app': 'visitor-app.svg',
}

/** 名字 → 图标文件地址；访客应用的地址不在这里，由后端授权后下发。 */
export function iconFile(name: PixelIconName): string {
  return `/icons-svg/${ICON_FILES[name]}`
}

/** 统一按文件渲染；访客应用的图标地址由后端下发，所以这里也接受一个完整地址。 */
export function PixelImage({ file, size = 36 }: { file: string; size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element -- 自己画的 24×24 像素 SVG，走 next/image 没有收益。
  return <img className="pixel-icon" src={file} width={size} height={size} alt="" aria-hidden="true" draggable={false} />
}

export default function PixelIcon({ name, size = 36 }: { name: PixelIconName; size?: number }) {
  return <PixelImage file={iconFile(name)} size={size} />
}
