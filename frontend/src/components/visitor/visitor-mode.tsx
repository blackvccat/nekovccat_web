'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { VisitorAppMeta } from '@/lib/visitor-view'

interface VisitorState { unlocked: boolean; name: string | null; username: string | null; apps: VisitorAppMeta[] }
const EMPTY: VisitorState = { unlocked: false, name: null, username: null, apps: [] }

interface VisitorMode extends VisitorState {
  /** True once the stored access cookie has been checked; the desktop waits for it. */
  isReady: boolean
  /** True when the server accepted a visitor login. */
  isUnlocked: boolean
  /** The app whose theme is on the desktop right now. */
  themedAppId: string | null
  setThemedAppId: (appId: string | null) => void
  /** Resolves to an error message, or null when the visitor is in. */
  unlock: (username: string, password: string) => Promise<string | null>
  /** Ends the visit locally and on the server. */
  lock: () => Promise<void>
}

const VisitorModeContext = createContext<VisitorMode | null>(null)

/** Visitor access is decided by the server cookie; this mirrors it for the desktop. */
export function VisitorModeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<VisitorState>(EMPTY)
  const [themedAppId, setThemedAppId] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const response = await fetch('/api/visitor/status', { cache: 'no-store' })
        const data: unknown = await response.json()
        const value = data && typeof data === 'object' ? data as Record<string, unknown> : {}
        if (value.unlocked === true) {
          setState({
            unlocked: true,
            name: typeof value.name === 'string' ? value.name : null,
            username: typeof value.username === 'string' ? value.username : null,
            apps: Array.isArray(value.apps) ? value.apps as VisitorAppMeta[] : [],
          })
        }
      } catch { /* Locked is the safe fallback. */ }
      finally { if (!cancelled) setIsReady(true) }
    })()
    return () => { cancelled = true }
  }, [])

  const unlock = useCallback(async (username: string, password: string): Promise<string | null> => {
    try {
      // Login rides on the chat session so the backend only signs a proof for this browser.
      const session = await fetch('/api/chat/session', { cache: 'no-store' })
      if (!session.ok) return '暂时无法建立登录会话，请刷新页面后重试。'
      const sessionData: unknown = await session.json()
      const token = sessionData && typeof sessionData === 'object' ? (sessionData as Record<string, unknown>).token : null
      if (typeof token !== 'string' || !token) return '暂时无法建立登录会话，请刷新页面后重试。'

      const response = await fetch('/api/chat/visitor-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Marcus-CSRF': token },
        body: JSON.stringify({ username, password }),
      })
      if (!response.ok) {
        let message = '访客名或密码不正确。'
        try {
          const data: unknown = await response.json()
          const detail = data && typeof data === 'object' ? (data as Record<string, unknown>).error : null
          if (typeof detail === 'string' && detail) message = detail
        } catch { /* Keep the generic message for non-JSON failures. */ }
        return message
      }
      const status = await fetch('/api/visitor/status', { cache: 'no-store' })
      const data: unknown = await status.json()
      const value = data && typeof data === 'object' ? data as Record<string, unknown> : {}
      setState({
        unlocked: true,
        name: typeof value.name === 'string' ? value.name : null,
        username: typeof value.username === 'string' ? value.username : null,
        apps: Array.isArray(value.apps) ? value.apps as VisitorAppMeta[] : [],
      })
      setThemedAppId(null)
      return null
    } catch {
      return '登录服务暂不可用，请稍后再试。'
    }
  }, [])

  const lock = useCallback(async () => {
    try { await fetch('/api/visitor/logout', { method: 'POST' }) } catch { /* The cookie may already be gone. */ }
    setState(EMPTY)
    setThemedAppId(null)
  }, [])

  const value = useMemo<VisitorMode>(() => ({ ...state, isReady, isUnlocked: state.unlocked, themedAppId, setThemedAppId, unlock, lock }),
    [state, isReady, themedAppId, unlock, lock])

  return <VisitorModeContext.Provider value={value}>{children}</VisitorModeContext.Provider>
}

export function useVisitorMode(): VisitorMode {
  const mode = useContext(VisitorModeContext)
  if (!mode) throw new Error('Visitor mode requires VisitorModeProvider')
  return mode
}
