'use client'

import { useCallback, useEffect, useState } from 'react'
import { useVisitorMode } from '@/components/visitor/visitor-mode'
import VisitorBlocks from './visitor-blocks'
import type { VisitorAction, VisitorAppView } from '@/lib/visitor-view'

/** 一个访客应用的窗口内容：视图数据在打开时才向后端索取。 */
export default function VisitorApp({ appId, onShowWallpaper }: { appId: string; onShowWallpaper: () => void }) {
  const { apps, username, lock, setThemedAppId } = useVisitorMode()
  const meta = apps.find(app => app.id === appId)
  const [state, setState] = useState<{ status: 'loading' | 'ready' | 'error'; view?: VisitorAppView; message?: string }>({ status: 'loading' })

  const theme = meta?.hasWallpaper ? appId : null
  useEffect(() => { setThemedAppId(theme); return () => setThemedAppId(null) }, [theme, setThemedAppId])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const response = await fetch(`/api/visitor/app?app=${encodeURIComponent(appId)}`, { cache: 'no-store' })
        if (!response.ok) {
          let message = '应用内容暂时不可用，请稍后再试。'
          try {
            const data: unknown = await response.json()
            const detail = data && typeof data === 'object' ? (data as Record<string, unknown>).error : null
            if (typeof detail === 'string' && detail) message = detail
          } catch { /* Keep the fallback. */ }
          if (!cancelled) setState({ status: 'error', message })
          return
        }
        const view: unknown = await response.json()
        if (!cancelled && view && typeof view === 'object') setState({ status: 'ready', view: view as VisitorAppView })
        else if (!cancelled) setState({ status: 'error', message: '应用内容格式无效。' })
      } catch {
        if (!cancelled) setState({ status: 'error', message: '应用内容暂时不可用，请稍后再试。' })
      }
    })()
    return () => { cancelled = true }
  }, [appId, username])

  const onAction = useCallback((action: VisitorAction) => {
    if (action.kind === 'wallpaper') onShowWallpaper()
    else if (action.kind === 'link' && action.href) window.open(action.href, '_blank', 'noopener,noreferrer')
    else if (action.kind === 'logout') void lock()
  }, [lock, onShowWallpaper])

  if (state.status === 'loading') return <div className="visit-app-status">正在安全地加载应用内容…</div>
  if (state.status === 'error') return <div className="visit-app-status visit-app-error" role="alert">{state.message}</div>
  return <div className="visit-app">
    <VisitorBlocks blocks={state.view?.view ?? []} onAction={onAction} onShowWallpaper={onShowWallpaper} />
  </div>
}
