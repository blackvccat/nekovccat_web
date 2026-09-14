'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { RelationshipContent } from '@/lib/relationship-content'

interface ModeState { unlocked: boolean; active: boolean }
interface RelationshipMode {
  isGirlfriend: boolean
  isUnlocked: boolean
  isReady: boolean
  content: RelationshipContent | null
  activateGirlfriend: (proof?: string, csrf?: string, signal?: AbortSignal) => Promise<boolean>
  leaveGirlfriend: () => void
}

const RelationshipModeContext = createContext<RelationshipMode | null>(null)

/** A local desktop Easter egg preference, never an account or identity check. */
export function RelationshipModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ModeState>({ unlocked: false, active: false })
  const [content, setContent] = useState<RelationshipContent | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const status = await fetch('/api/relationship/status', { cache: 'no-store' })
        const data = await status.json()
        if (data.unlocked === true) {
          const response = await fetch('/api/relationship/content', { cache: 'no-store' })
          if (response.ok && !cancelled) {
            setContent(await response.json())
            setMode({ unlocked: true, active: true })
          }
        }
      } catch { /* Locked mode is the safe fallback. */ }
      finally { if (!cancelled) setIsReady(true) }
    })()
    return () => { cancelled = true }
  }, [])

  const activateGirlfriend = useCallback(async (proof?: string, csrf?: string, signal?: AbortSignal) => {
    if (signal?.aborted) return false
    if (mode.unlocked && content) { setMode({ unlocked: true, active: true }); return true }
    if (!proof || !csrf) return false
    try {
      const unlock = await fetch('/api/chat/relationship-unlock', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Neko-CSRF': csrf }, body: JSON.stringify({ proof }), signal })
      if (!unlock.ok || signal?.aborted) return false
      const response = await fetch('/api/relationship/content', { cache: 'no-store', signal })
      if (!response.ok || signal?.aborted) return false
      const nextContent = await response.json()
      if (signal?.aborted) return false
      setContent(nextContent)
      setMode({ unlocked: true, active: true })
      return true
    } catch { return false }
  }, [mode.unlocked, content])
  const leaveGirlfriend = useCallback(() => setMode(previous => ({ ...previous, active: false })), [])
  const value = useMemo(() => ({
    isGirlfriend: mode.unlocked && mode.active,
    isUnlocked: mode.unlocked,
    isReady,
    content,
    activateGirlfriend,
    leaveGirlfriend,
  }), [mode, isReady, content, activateGirlfriend, leaveGirlfriend])

  return <RelationshipModeContext.Provider value={value}>{children}</RelationshipModeContext.Provider>
}

export function useRelationshipMode(): RelationshipMode {
  const mode = useContext(RelationshipModeContext)
  if (!mode) throw new Error('Relationship mode requires RelationshipModeProvider')
  return mode
}
