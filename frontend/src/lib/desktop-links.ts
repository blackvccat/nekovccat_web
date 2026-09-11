export type BrowserPage = 'about' | 'projects' | 'minecraft' | 'contact'
export const BROWSER_PAGES: { id: BrowserPage; label: string }[] = [
  { id: 'about', label: '关于 NEKO' }, { id: 'projects', label: '项目与经历' },
  { id: 'minecraft', label: '建筑档案' }, { id: 'contact', label: '联系我' },
]
export function browserPage(value: string | null): BrowserPage {
  return BROWSER_PAGES.some(page => page.id === value) ? value as BrowserPage : 'about'
}
export function desktopLink(page: BrowserPage) { return `/my-world?app=explorer&tab=${page}` }
