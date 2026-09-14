'use client'

import { useEffect, useRef } from 'react'
import { NIGHT_HARBOR_ASSETS } from './night-harbor-assets'
import {
  allowsHarborMotion, harborCoverPlane, harborFrameAt, parseHarborManifest,
  type HarborManifest, type HarborMotion,
} from './night-harbor-animation'
import './night-harbor-wallpaper.css'

interface DataConnection extends EventTarget { saveData?: boolean }
interface HarborPatch { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D; frame: number }

export default function NightHarborWallpaper({ motion }: { motion: HarborMotion }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const posterRef = useRef<HTMLImageElement>(null)
  const planeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current, poster = posterRef.current, plane = planeRef.current
    if (!root || !poster || !plane || motion === 'off') return

    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    const narrow = matchMedia('(max-width: 700px)')
    const coarse = matchMedia('(pointer: coarse)')
    const connection = (navigator as Navigator & { connection?: DataConnection }).connection
    let disposed = false, enabled = false, failed = false, loading = false, pageSuspended = false
    let manifest: HarborManifest | null = null
    let atlas: HTMLImageElement | null = null
    let patches: HarborPatch[] = []
    let timer: number | null = null, idle: number | null = null, idleFallback: number | null = null
    let abort: AbortController | null = null
    let objectUrl: string | null = null
    let elapsed = 0, startedAt: number | null = null
    let generation = 0

    function stopClock() {
      if (timer !== null) window.clearTimeout(timer)
      timer = null
      if (startedAt !== null) elapsed += Math.max(0, performance.now() - startedAt)
      startedAt = null
    }

    function cancelIdle() {
      if (idle !== null) window.cancelIdleCallback(idle)
      if (idleFallback !== null) window.clearTimeout(idleFallback)
      idle = idleFallback = null
    }

    function release() {
      stopClock()
      cancelIdle()
      generation += 1
      abort?.abort()
      abort = null
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      objectUrl = null
      if (atlas) atlas.removeAttribute('src')
      atlas = null
      manifest = null
      patches = []
      plane!.replaceChildren()
      elapsed = 0
      loading = false
    }

    function align() {
      if (!manifest) return
      const geometry = harborCoverPlane(root!.clientWidth, root!.clientHeight, manifest.width, manifest.height)
      if (!geometry) return
      Object.assign(plane!.style, {
        width: `${geometry.width}px`, height: `${geometry.height}px`,
        left: `${geometry.left}px`, top: `${geometry.top}px`,
      })
    }

    function tick() {
      timer = null
      if (disposed || !enabled || document.hidden || pageSuspended || !manifest || !atlas) return
      const now = performance.now()
      const time = elapsed + (startedAt === null ? 0 : Math.max(0, now - startedAt))
      let nextChange = Infinity
      try {
        manifest.regions.forEach((region, index) => {
          const selected = harborFrameAt(region, time)
          nextChange = Math.min(nextChange, selected.delay)
          const patch = patches[index]
          if (patch.frame === selected.index) return
          const frame = region.frames[selected.index]
          patch.context.clearRect(0, 0, region.width, region.height)
          patch.context.drawImage(atlas!, frame.x, frame.y, frame.width, frame.height, 0, 0, region.width, region.height)
          patch.frame = selected.index
        })
        // Round up fractional waits so timers cannot repeatedly fire before the frame boundary.
        timer = window.setTimeout(tick, Math.max(1, Math.ceil(nextChange)))
      } catch {
        failed = true
        release()
      }
    }

    async function load() {
      idle = idleFallback = null
      if (disposed || !enabled || document.hidden || pageSuspended) return
      loading = true
      const version = generation
      const controller = new AbortController()
      abort = controller
      try {
        const response = await fetch(NIGHT_HARBOR_ASSETS.manifest, { signal: controller.signal, credentials: 'omit' })
        if (!response.ok) throw new Error('Wallpaper manifest unavailable')
        const parsed = parseHarborManifest(await response.json())
        const imageUrl = new URL(parsed.image, new URL(NIGHT_HARBOR_ASSETS.manifest, location.href))
        if (imageUrl.origin !== location.origin) throw new Error('Wallpaper atlas origin mismatch')
        const imageResponse = await fetch(imageUrl.href, { signal: controller.signal, credentials: 'omit' })
        if (!imageResponse.ok) throw new Error('Wallpaper atlas unavailable')
        const blob = await imageResponse.blob()
        if (disposed || version !== generation) return
        const image = new Image()
        image.decoding = 'async'
        objectUrl = URL.createObjectURL(blob)
        atlas = image
        image.src = objectUrl
        await image.decode()
        if (disposed || version !== generation) return
        URL.revokeObjectURL(objectUrl)
        objectUrl = null
        for (const region of parsed.regions) {
          if (region.frames.some(frame => frame.x + frame.width > image.naturalWidth || frame.y + frame.height > image.naturalHeight)) {
            throw new Error('Wallpaper frame outside atlas')
          }
        }
        const fragment = document.createDocumentFragment()
        patches = parsed.regions.map(region => {
          const canvas = document.createElement('canvas')
          canvas.className = 'night-harbor-wallpaper__patch'
          canvas.dataset.region = region.id
          canvas.width = region.width
          canvas.height = region.height
          Object.assign(canvas.style, {
            left: `${region.x / parsed.width * 100}%`, top: `${region.y / parsed.height * 100}%`,
            width: `${region.width / parsed.width * 100}%`, height: `${region.height / parsed.height * 100}%`,
          })
          const context = canvas.getContext('2d', { alpha: true })
          if (!context) throw new Error('Wallpaper canvas unavailable')
          context.imageSmoothingEnabled = false
          fragment.append(canvas)
          return { canvas, context, frame: -1 }
        })
        manifest = parsed
        plane!.replaceChildren(fragment)
        align()
        loading = false
        refresh()
      } catch {
        if (!disposed && version === generation) {
          failed = true
          release()
        }
      }
    }

    function refresh() {
      if (disposed) return
      const allowed = allowsHarborMotion(motion, {
        reduced: reduced.matches, narrow: narrow.matches, coarse: coarse.matches, saveData: Boolean(connection?.saveData),
      })
      if (allowed !== enabled) {
        enabled = allowed
        failed = false
        if (!enabled) release()
      }
      if (!enabled) return
      if (document.hidden || pageSuspended || !poster!.complete || !poster!.naturalWidth) {
        stopClock()
        cancelIdle()
        return
      }
      if (manifest && atlas) {
        if (timer === null) {
          startedAt = performance.now()
          tick()
        }
      } else if (!failed && !loading && idle === null && idleFallback === null) {
        if (typeof window.requestIdleCallback === 'function') idle = window.requestIdleCallback(() => void load(), { timeout: 1800 })
        else idleFallback = window.setTimeout(() => void load(), 200)
      }
    }

    function pageHide() {
      pageSuspended = true
      stopClock()
      cancelIdle()
    }

    function pageShow() {
      pageSuspended = false
      refresh()
    }

    const resize = new ResizeObserver(align)
    resize.observe(root)
    for (const query of [reduced, narrow, coarse]) query.addEventListener('change', refresh)
    connection?.addEventListener('change', refresh)
    document.addEventListener('visibilitychange', refresh)
    poster.addEventListener('load', refresh)
    window.addEventListener('pagehide', pageHide)
    window.addEventListener('pageshow', pageShow)
    refresh()
    return () => {
      disposed = true
      release()
      resize.disconnect()
      for (const query of [reduced, narrow, coarse]) query.removeEventListener('change', refresh)
      connection?.removeEventListener('change', refresh)
      document.removeEventListener('visibilitychange', refresh)
      poster.removeEventListener('load', refresh)
      window.removeEventListener('pagehide', pageHide)
      window.removeEventListener('pageshow', pageShow)
    }
  }, [motion])

  return (
    <div ref={rootRef} className="night-harbor-wallpaper" aria-hidden="true" data-motion={motion}>
      <picture className="night-harbor-wallpaper__poster">
        {motion !== 'on' && <source media="(max-width: 700px)" srcSet={NIGHT_HARBOR_ASSETS.mobile} />}
        {/* Keep the authored pixels and let picture select one download without an image optimizer. */}
        <img ref={posterRef} src={NIGHT_HARBOR_ASSETS.wallpaper} alt="" width={1536} height={1024} decoding="async" fetchPriority="high" draggable={false} />
      </picture>
      <div ref={planeRef} className="night-harbor-wallpaper__plane" />
    </div>
  )
}
