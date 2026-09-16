/** 访客应用的视图协议：前端只认这些通用区块，应用自身的文案与素材全部来自后端。 */
export interface VisitorAppMeta {
  id: string
  title: string
  subtitle: string
  watermark: string
  hasIcon: boolean
  hasWallpaper: boolean
}

/** 应用图标的地址：应用自带图标就向后端要（登录后才取得到），否则用公开目录里的中性占位图。 */
export function visitorAppIcon(app: { id: string; hasIcon: boolean }): string {
  return app.hasIcon ? `/api/visitor/asset?app=${encodeURIComponent(app.id)}&kind=icon` : '/icons-svg/visitor-app.svg'
}

/** 下载列表里的一条记录：名称、可选说明与大小，以及后端给出的地址。 */
export interface VisitorFile {
  name: string
  note: string | null
  size: string | null
  href: string
}

export interface VisitorAction {
  label: string
  kind: 'wallpaper' | 'link' | 'logout'
  href?: string
}

export type VisitorBlock =
  | { type: 'heading'; eyebrow: string | null; title: string; action: VisitorAction | null }
  | { type: 'text'; title: string | null; lines: string[] }
  | { type: 'letter'; buttonLabel: string; title: string; summary: string | null; toolbar: string | null; paragraphs: string[] }
  | {
      type: 'counter'
      since: string
      title: string
      dayUnit: string
      sinceLabel: string | null
      anniversaryLabel: string | null
      anniversaryToday: string | null
      anniversaryRemaining: string | null
      anniversaryUnit: string | null
      monthUnit: string | null
      yearUnit: string | null
    }
  | {
      type: 'checklist'
      title: string
      intro: string | null
      defaults: string[]
      addPlaceholder: string | null
      addLabel: string | null
      storageKey: string
      maxItems: number
      maxLength: number
    }
  | { type: 'files'; title: string; intro: string | null; note: string | null; items: VisitorFile[] }
  | { type: 'notice'; text: string; note: string | null }
  | { type: 'footer'; text: string; action: VisitorAction | null }
  | { type: 'link'; action: VisitorAction }
  | { type: 'image'; src: string; caption: string | null }

export interface VisitorAppView {
  app: VisitorAppMeta
  view: VisitorBlock[]
}
