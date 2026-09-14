'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { BackSide, Euler, LinearFilter, LinearMipmapLinearFilter, PerspectiveCamera, SRGBColorSpace, Texture } from 'three'

interface PanoramaBackgroundProps {
  imageSrc: string
  enableInteraction?: boolean
  enableAutoRotate?: boolean
  autoRotateSpeed?: number
  visible: boolean
  lowPower: boolean
  onReady: () => void
  onError: () => void
}

function PanoramaScene({ texture, enableInteraction, enableAutoRotate, autoRotateSpeed, visible, onReady, onError }: PanoramaBackgroundProps & { texture: Texture }) {
  const { camera, gl, invalidate, size } = useThree()
  const rotation = useRef({ x: 0, y: 0 })
  const euler = useRef(new Euler(0, 0, 0, 'YXZ'))
  const dragging = useRef(false)
  const reportedReady = useRef(false)

  useLayoutEffect(() => {
    if (!(camera instanceof PerspectiveCamera) || !size.height) return
    // Match the 16:9 poster's object-cover framing, including ultrawide windows.
    // Both representations start at the same angle, so activation does not jump.
    // eslint-disable-next-line react-hooks/immutability -- Three.js cameras are imperative renderer objects; resize updates their projection in place.
    camera.fov = 2 * Math.atan(Math.tan(75 * Math.PI / 360) * Math.min(1, (16 / 9) / (size.width / size.height))) * 180 / Math.PI
    camera.updateProjectionMatrix()
    invalidate()
  }, [camera, size.width, size.height, invalidate])

  useEffect(() => {
    const canvas = gl.domElement
    const lost = (event: Event) => { event.preventDefault(); onError() }
    canvas.addEventListener('webglcontextlost', lost)
    return () => canvas.removeEventListener('webglcontextlost', lost)
  }, [gl, onError])

  useFrame((_, delta) => {
    if (!visible || !texture) return
    if (enableAutoRotate && !dragging.current) rotation.current.x += (autoRotateSpeed || 0) * Math.PI / 180 * Math.min(delta, 0.05)
    euler.current.set(rotation.current.y, rotation.current.x, 0, 'YXZ')
    camera.quaternion.setFromEuler(euler.current)
  })

  useEffect(() => {
    if (!enableInteraction || !visible) return
    const canvas = gl.domElement
    const oldTouchAction = canvas.style.touchAction
    canvas.style.setProperty('touch-action', 'none')
    let pointer: number | null = null
    let previous = { x: 0, y: 0 }
    const down = (event: PointerEvent) => {
      if (!event.isPrimary || event.button !== 0 || pointer !== null) return
      pointer = event.pointerId
      dragging.current = true
      previous = { x: event.clientX, y: event.clientY }
      canvas.setPointerCapture(event.pointerId)
    }
    const move = (event: PointerEvent) => {
      if (event.pointerId !== pointer) return
      rotation.current.x += (event.clientX - previous.x) * 0.002
      rotation.current.y = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotation.current.y + (event.clientY - previous.y) * 0.002))
      previous = { x: event.clientX, y: event.clientY }
      // R3F coalesces camera invalidations into the next frame without a React update.
      invalidate()
    }
    const stop = () => {
      const previousPointer = pointer
      pointer = null
      dragging.current = false
      if (previousPointer !== null && canvas.hasPointerCapture(previousPointer)) canvas.releasePointerCapture(previousPointer)
    }
    const up = (event: PointerEvent) => { if (event.pointerId === pointer) stop() }
    canvas.addEventListener('pointerdown', down, { passive: true })
    canvas.addEventListener('pointermove', move, { passive: true })
    canvas.addEventListener('lostpointercapture', up, { passive: true })
    window.addEventListener('pointerup', up, { passive: true })
    window.addEventListener('pointercancel', up, { passive: true })
    window.addEventListener('blur', stop)
    return () => {
      stop()
      canvas.style.setProperty('touch-action', oldTouchAction)
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('lostpointercapture', up)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      window.removeEventListener('blur', stop)
    }
  }, [enableInteraction, visible, gl, invalidate])

  return <mesh onAfterRender={() => {
    if (!reportedReady.current) { reportedReady.current = true; onReady() }
  }}>
    <sphereGeometry args={[500, 48, 32]} />
    <meshBasicMaterial map={texture} side={BackSide} toneMapped={false} />
  </mesh>
}

export default function PanoramaBackground(props: PanoramaBackgroundProps) {
  const { imageSrc, lowPower, onError, onReady } = props
  const [decoded, setDecoded] = useState<{ src: string; lowPower: boolean; texture: Texture } | null>(null)
  const [paintedTexture, setPaintedTexture] = useState<string | null>(null)
  // A capability or source change must unmount the old canvas before its
  // effect releases the old texture. Never render a disposed previous value.
  const texture = decoded?.src === imageSrc && decoded.lowPower === lowPower ? decoded.texture : null
  const painted = texture !== null && paintedTexture === texture.uuid
  const reportPainted = useCallback(() => {
    if (texture) { setPaintedTexture(texture.uuid); onReady() }
  }, [texture, onReady])

  useEffect(() => {
    const controller = new AbortController()
    let bitmap: ImageBitmap | null = null
    let element: HTMLImageElement | null = null
    let objectUrl: string | null = null
    let owned: Texture | null = null
    void (async () => {
      try {
        // Fetch and decode before creating a WebGL context. Navigation aborts
        // the request, and a decode completing after cancellation is released.
        const response = await fetch(imageSrc, { signal: controller.signal, cache: 'force-cache' })
        if (!response.ok) throw new Error('Panorama unavailable')
        const blob = await response.blob()
        if (controller.signal.aborted) return
        if (typeof createImageBitmap === 'function') {
          bitmap = await createImageBitmap(blob, { imageOrientation: 'flipY' })
          if (controller.signal.aborted) { bitmap.close(); bitmap = null; return }
          owned = new Texture(bitmap)
          owned.flipY = false // ImageBitmap was flipped during decode.
        } else {
          objectUrl = URL.createObjectURL(blob)
          element = new Image()
          element.decoding = 'async'
          element.src = objectUrl
          await element.decode()
          if (controller.signal.aborted) return
          owned = new Texture(element)
        }
        owned.colorSpace = SRGBColorSpace
        owned.anisotropy = lowPower ? 1 : 2
        owned.generateMipmaps = !lowPower
        owned.minFilter = lowPower ? LinearFilter : LinearMipmapLinearFilter
        owned.magFilter = LinearFilter
        owned.needsUpdate = true
        setDecoded({ src: imageSrc, lowPower, texture: owned })
      } catch {
        if (!controller.signal.aborted) onError()
      } finally {
        if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null }
      }
    })()
    return () => {
      controller.abort()
      owned?.dispose()
      bitmap?.close()
      if (element) element.removeAttribute('src')
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [imageSrc, lowPower, onError])

  // Keep an existing context paused while hidden; never create a new hidden one.
  if (!texture || (!props.visible && !painted)) return null
  return <Canvas
    key={texture.uuid}
    frameloop={!props.visible ? 'never' : painted && props.enableAutoRotate ? 'always' : 'demand'}
    dpr={props.lowPower ? 1 : [1, 1.5]}
    gl={{ antialias: false, alpha: true, powerPreference: 'low-power', stencil: false, depth: false }}
    camera={{ position: [0, 0, 0], fov: 75 }}
    fallback={null}
  ><PanoramaScene {...props} texture={texture} onReady={reportPainted} /></Canvas>
}
