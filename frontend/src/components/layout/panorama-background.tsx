'use client'

import { Suspense, useRef, useEffect, useState, useMemo, memo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useTexture, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

// 全局纹理缓存和加载状态缓存
const textureCache = new Map<string, THREE.Texture>()
const imageLoadCache = new Map<string, boolean>() // 记录图片是否已加载

// 全景图球体组件 - 使用 memo 优化
const PanoramaSphere = memo(({ imageSrc }: { imageSrc: string }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = useTexture(imageSrc)

  // 确保纹理正确映射并优化，并缓存纹理
  useEffect(() => {
    if (texture && !textureCache.has(imageSrc)) {
      texture.mapping = THREE.EquirectangularReflectionMapping
      texture.needsUpdate = true
      // 设置纹理格式优化
      texture.format = THREE.RGBAFormat
      texture.flipY = true // 全景图需要翻转Y轴以正确显示
      
      // 对于大图片，限制纹理尺寸以节省内存
      const maxTextureSize = 4096 // 限制最大纹理尺寸为 4096x4096
      if (texture.image) {
        const img = texture.image as HTMLImageElement
        if (img.width > maxTextureSize || img.height > maxTextureSize) {
          // 如果图片太大，创建缩小的 canvas
          const canvas = document.createElement('canvas')
          const scale = Math.min(maxTextureSize / img.width, maxTextureSize / img.height)
          canvas.width = Math.floor(img.width * scale)
          canvas.height = Math.floor(img.height * scale)
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          texture.image = canvas
          texture.needsUpdate = true
        }
      }
      
      // 纹理过滤优化 - 降低各向异性以提高性能
      texture.anisotropy = 8 // 从 16 降低到 8，减少内存占用
      texture.generateMipmaps = true // 生成 mipmap 以提高性能
      texture.minFilter = THREE.LinearMipmapLinearFilter // 使用线性过滤
      texture.magFilter = THREE.LinearFilter
      
      // 缓存纹理（克隆以避免被 Three.js 自动释放）
      textureCache.set(imageSrc, texture.clone())
    } else if (texture && textureCache.has(imageSrc)) {
      // 如果缓存中有纹理，使用缓存的设置
      const cached = textureCache.get(imageSrc)!
      texture.mapping = cached.mapping
      texture.flipY = cached.flipY
      texture.anisotropy = cached.anisotropy
      texture.minFilter = cached.minFilter
      texture.magFilter = cached.magFilter
    }
  }, [texture, imageSrc])

  // 将纹理映射到球体内部
  // 降低球体几何体复杂度以提高性能（从 60x40 降低到 48x32）
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[500, 48, 32]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  )
})

PanoramaSphere.displayName = 'PanoramaSphere'

// 相机控制器 - 允许鼠标拖动查看和自动旋转
const PanoramaControls = memo(({ 
  enableAutoRotate = true, 
  autoRotateSpeed = 12 
}: { 
  enableAutoRotate?: boolean
  autoRotateSpeed?: number // 度/秒
}) => {
  const { camera } = useThree()
  const isDragging = useRef(false)
  const previousMousePosition = useRef({ x: 0, y: 0 })
  const rotation = useRef({ x: 0, y: 0 })

  useFrame((state, delta) => {
    // 自动旋转（只在没有拖动时）
    if (enableAutoRotate && !isDragging.current) {
      const rotationAngle = (autoRotateSpeed * Math.PI / 180) * delta // 转换为弧度
      rotation.current.x += rotationAngle // 水平旋转
    }

    // 应用旋转到相机
    const euler = new THREE.Euler(rotation.current.y, rotation.current.x, 0, 'YXZ')
    camera.quaternion.setFromEuler(euler)
  })

  useEffect(() => {
    // 使用节流优化鼠标移动事件
    let rafId: number | null = null
    
    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true
      previousMousePosition.current = { x: e.clientX, y: e.clientY }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return

      // 使用 requestAnimationFrame 节流，避免过度渲染
      if (rafId !== null) return
      
      rafId = requestAnimationFrame(() => {
        const deltaX = e.clientX - previousMousePosition.current.x
        const deltaY = e.clientY - previousMousePosition.current.y

        // 更新旋转角度
        rotation.current.x += deltaX * 0.002
        rotation.current.y += deltaY * 0.002

        // 限制垂直旋转角度
        rotation.current.y = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotation.current.y))

        previousMousePosition.current = { x: e.clientX, y: e.clientY }
        rafId = null
      })
    }

    const handleMouseUp = () => {
      isDragging.current = false
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    }

    const handleWheel = (e: WheelEvent) => {
      // 缩放功能（可选）
      e.preventDefault()
    }

    window.addEventListener('mousedown', handleMouseDown, { passive: true })
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mouseup', handleMouseUp, { passive: true })
    window.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('wheel', handleWheel)
    }
  }, [])

  return null
})

PanoramaControls.displayName = 'PanoramaControls'

interface PanoramaBackgroundProps {
  imageSrc: string
  className?: string
  enableInteraction?: boolean
  enableAutoRotate?: boolean // 是否启用自动旋转
  autoRotateSpeed?: number // 旋转速度（度/秒），默认12度/秒（30秒一圈）
}

export default function PanoramaBackground({ 
  imageSrc, 
  className = '',
  enableInteraction = true,
  enableAutoRotate = true,
  autoRotateSpeed = 12 // 360度 / 30秒 = 12度/秒
}: PanoramaBackgroundProps) {
  // 添加加载状态和错误处理
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)

  // 检查图片是否已加载过
  const isImageCached = useMemo(() => imageLoadCache.has(imageSrc), [imageSrc])

  useEffect(() => {
    // 如果图片已经加载过，直接跳过加载过程
    if (isImageCached) {
      setIsLoading(false)
      setLoadProgress(100)
      setHasError(false)
      return
    }

    // 预加载图片以检查是否存在并显示加载进度
    const img = new Image()
    
    // 监听加载进度（通过 XMLHttpRequest 获取更准确的进度）
    const xhr = new XMLHttpRequest()
    xhr.open('GET', imageSrc, true)
    xhr.responseType = 'blob'
    
    xhr.onprogress = (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100
        setLoadProgress(Math.min(percentComplete, 95)) // 最多显示到 95%，剩余 5% 留给纹理处理
      }
    }
    
    xhr.onload = () => {
      const blob = xhr.response
      const url = URL.createObjectURL(blob)
      img.src = url
      
      img.onload = () => {
        setLoadProgress(100)
        setIsLoading(false)
        setHasError(false)
        // 标记图片已加载
        imageLoadCache.set(imageSrc, true)
        // 清理 blob URL
        setTimeout(() => URL.revokeObjectURL(url), 100)
      }
      
      img.onerror = () => {
        console.error('Panorama image failed to load:', imageSrc)
        setHasError(true)
        setIsLoading(false)
        URL.revokeObjectURL(url)
      }
    }
    
    xhr.onerror = () => {
      console.error('Panorama image failed to load:', imageSrc)
      setHasError(true)
      setIsLoading(false)
    }
    
    xhr.send()
    
    return () => {
      xhr.abort()
    }
  }, [imageSrc, isImageCached])

  // 如果图片加载失败，显示错误提示
  if (hasError) {
    return (
      <div className={`absolute inset-0 bg-black ${className} flex items-center justify-center`}>
        <div className="text-white text-center">
          <p className="text-xl mb-2">全景图加载失败</p>
          <p className="text-sm text-gray-400">路径: {imageSrc}</p>
        </div>
      </div>
    )
  }

  // 使用 useMemo 缓存 Canvas 配置，避免重复创建
  const canvasConfig = useMemo(() => ({
    gl: { 
      antialias: false, // 关闭抗锯齿以提高性能
      alpha: true,
      powerPreference: 'high-performance' as const,
      preserveDrawingBuffer: false,
      stencil: false,
      depth: true,
      // 限制纹理大小
      maxTextureSize: 4096,
    },
    camera: { position: [0, 0, 0] as [number, number, number], fov: 75 },
    dpr: [1, 1.5] as [number, number], // 降低 DPR 以提高性能
    performance: { min: 0.5 }
  }), [])

  // 使用 useMemo 缓存控制组件，避免重复创建
  const controls = useMemo(() => {
    if (enableInteraction || enableAutoRotate) {
      return (
        <PanoramaControls 
          enableAutoRotate={enableAutoRotate}
          autoRotateSpeed={autoRotateSpeed}
        />
      )
    }
    return null
  }, [enableInteraction, enableAutoRotate, autoRotateSpeed])

  return (
    <div className={`absolute inset-0 ${className}`} style={{ willChange: 'opacity' }}>
      {/* 加载进度显示 - 只在首次加载时显示 */}
      {isLoading && !isImageCached && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20 transition-opacity duration-200">
          <div className="text-center">
            <div className="text-white text-lg mb-4 font-mono">加载全景图...</div>
            <div className="w-64 h-1 bg-gray-800 border border-gray-600 rounded overflow-hidden">
              <div
                className="h-full bg-green-400 transition-all duration-200 ease-out"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
            <div className="text-gray-400 text-sm mt-2 font-mono">{Math.round(loadProgress)}%</div>
          </div>
        </div>
      )}
      
      {/* Canvas 始终渲染，避免切换时白屏 */}
      <Suspense fallback={null}>
        <Canvas
          {...canvasConfig}
        >
          <PanoramaSphere imageSrc={imageSrc} />
          {controls}
        </Canvas>
      </Suspense>
    </div>
  )
}
