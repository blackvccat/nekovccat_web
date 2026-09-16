export type BrowserPage = 'about' | 'projects' | 'gallery' | 'contact'
export const BROWSER_PAGES: { id: BrowserPage; label: string }[] = [
  { id: 'about', label: '关于 MARCUS' }, { id: 'projects', label: '项目/探索与经历' },
  { id: 'gallery', label: '长廊' }, { id: 'contact', label: '联系我' },
]
export function browserPage(value: string | null): BrowserPage {
  return BROWSER_PAGES.some(page => page.id === value) ? value as BrowserPage : 'about'
}
export function desktopLink(page: BrowserPage) { return `/terminal?app=explorer&tab=${page}` }
