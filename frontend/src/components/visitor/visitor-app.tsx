'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useVisitorMode } from '@/components/visitor/visitor-mode'
import { VISITOR_APP_THEME_TOKENS } from '@/lib/visitor-view'

type Theme = 'light' | 'dark'

function hostTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

/** 把宿主的明暗同步进同源 iframe：设 data-theme、注入 --app-* token，再补一条 postMessage 方便应用监听。 */
function syncTheme(iframe: HTMLIFrameElement | null) {
  const doc = iframe?.contentDocument
  if (!iframe || !doc?.documentElement || !doc.head) return
  const theme = hostTheme()
  doc.documentElement.dataset.theme = theme
  doc.documentElement.style.colorScheme = theme
  let style = doc.getElementById('marcus-app-tokens') as HTMLStyleElement | null
  if (!style) {
    style = doc.createElement('style')
    style.id = 'marcus-app-tokens'
    doc.head.append(style)
  }
  const rule = (selector: string, tokens: Record<string, string>) =>
    `${selector}{${Object.entries(tokens).map(([name, value]) => `${name}:${value}`).join(';')}}`
  style.textContent = rule(':root', VISITOR_APP_THEME_TOKENS.light)
    + rule(':root[data-theme="dark"]', VISITOR_APP_THEME_TOKENS.dark)
  iframe.contentWindow?.postMessage({ type: 'marcus:theme', theme }, window.location.origin)
}

/**
 * 一个访客应用的窗口内容：界面是服务器登录后下发的 HTML，用**同源 iframe** 承载。
 *
 * 前端产物里没有任何应用界面——iframe 的内容也来自受控转发口 `/api/visitor/app-proxy`（带访客 Cookie），
 * 后端每次都按账号复核授权。宿主只在载入/主题变化时把主题变量写进 iframe 文档。
 */
export default function VisitorApp({ appId }: { appId: string }) {
  const { apps, setThemedAppId } = useVisitorMode()
  const meta = apps.find(app => app.id === appId)
  const frameRef = useRef<HTMLIFrameElement>(null)

  const theme = meta?.hasWallpaper ? appId : null
  useEffect(() => { setThemedAppId(theme); return () => setThemedAppId(null) }, [theme, setThemedAppId])

  const sync = useCallback(() => syncTheme(frameRef.current), [])
  useEffect(() => {
    // 桌面的明暗写在 <html data-theme> 上：它一变就把 iframe 里的文档也切过去。
    const observer = new MutationObserver(sync)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [sync])

  return <iframe
    ref={frameRef}
    className="visit-app-frame"
    title={meta?.title ?? '访客应用'}
    src={`/api/visitor/app-proxy/apps/${encodeURIComponent(appId)}/shell`}
    sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin allow-downloads"
    onLoad={sync}
  />
}
