'use client'

import { useEffect, useRef } from 'react'

/** Keep a panel above an on-screen keyboard without rerendering its conversation. */
export function useVisualViewport<T extends HTMLElement>(enabled = true) {
  const target = useRef<T>(null)
  useEffect(() => {
    const element = target.current
    if (!enabled || !element) return
    const viewport = window.visualViewport
    let frame = 0
    const update = () => {
      frame = 0
      // Pinch zoom should magnify the interface, rather than relayout it.
      const ordinaryScale = !viewport || Math.abs(viewport.scale - 1) < 0.05
      const height = ordinaryScale ? viewport?.height ?? window.innerHeight : window.innerHeight
      const inset = ordinaryScale ? Math.max(0, window.innerHeight - height - (viewport?.offsetTop ?? 0)) : 0
      element.style.setProperty('--visible-height', `${height}px`)
      element.style.setProperty('--keyboard-inset', `${inset}px`)
      element.dataset.keyboardOpen = String(inset > 120)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    viewport?.addEventListener('resize', schedule)
    viewport?.addEventListener('scroll', schedule)
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      viewport?.removeEventListener('resize', schedule)
      viewport?.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [enabled])
  return target
}
