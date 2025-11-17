'use client'

import { Suspense, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Environment, PerspectiveCamera } from '@react-three/drei'
import { FogExp2 } from 'three'
import City from '@/models/city'
import { FirstPersonControls } from './first-person-controls'
import { ControlsHint } from './controls-hint'

// 组件：设置场景的雾效果
function FogEffect() {
  const { scene } = useThree()
  
  useEffect(() => {
    // 添加体积雾效果
    // 使用指数雾（FogExp2）可以实现更自然的体积雾效果
    scene.fog = new FogExp2(0xcccccc, 0.0008) // 颜色和密度
    
    return () => {
      scene.fog = null
    }
  }, [scene])
  
  return null
}

// 组件：确保雾材质正确渲染
function FogMaterialFix() {
  const { scene } = useThree()
  
  useEffect(() => {
    // 延迟执行，确保模型完全加载
    const timer = setTimeout(() => {
      // 遍历场景中的所有材质，确保雾材质使用正确的混合模式
      scene.traverse((object: any) => {
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          
          materials.forEach((material: any) => {
            // 检查是否是雾材质（通过材质名称或材质对象中的属性）
            const isFogMaterial = 
              (material.name && (material.name.toLowerCase().includes('fog'))) ||
              (object.name && object.name.toLowerCase().includes('fog'))
            
            if (isFogMaterial) {
              // 设置透明度
              material.transparent = true
              // 保持原有透明度或设置为合适的值
              if (material.opacity === undefined || material.opacity === 1) {
                material.opacity = 0.05 // 调整这个值来控制雾的密度
              }
              
              // 设置混合模式以实现体积雾效果
              // 2 = NormalBlending, 5 = AdditiveBlending (更亮的雾)
              material.blending = 2
              material.depthWrite = false // 雾材质通常不需要写入深度
              material.side = 2 // THREE.DoubleSide (双面渲染)
              
              // 确保材质更新
              material.needsUpdate = true
            }
          })
        }
      })
    }, 1000) // 延迟1秒，确保模型加载完成
    
    return () => clearTimeout(timer)
  }, [scene])
  
  return null
}

function CityScene() {
  // 组件加载时自动尝试请求指针锁定
  useEffect(() => {
    // 延迟一点时间确保 Canvas 已渲染
    const timer = setTimeout(() => {
      const canvas = document.querySelector('canvas')
      if (canvas) {
        const requestPointerLock = 
          canvas.requestPointerLock || 
          (canvas as any).mozRequestPointerLock || 
          (canvas as any).webkitRequestPointerLock
        
        if (requestPointerLock) {
          requestPointerLock.call(canvas).catch((err) => {
            // 如果 Pointer Lock 失败，静默处理（备用方案会自动启用）
            console.log('Using fallback mouse control')
          })
        }
      }
    }, 500) // 延迟500ms

    return () => clearTimeout(timer)
  }, [])

  const handleCanvasClick = () => {
    // 点击 Canvas 容器时尝试请求指针锁定
    // 如果不支持或失败，会使用备用鼠标控制方案
    const canvas = document.querySelector('canvas')
    if (canvas) {
      const requestPointerLock = 
        canvas.requestPointerLock || 
        (canvas as any).mozRequestPointerLock || 
        (canvas as any).webkitRequestPointerLock
      
      if (requestPointerLock) {
        requestPointerLock.call(canvas).catch((err) => {
          // 如果 Pointer Lock 失败，静默处理（备用方案会自动启用）
          console.log('Using fallback mouse control')
        })
      }
    }
  }

  return (
    <div className="w-full h-full relative">
      <div 
        className="absolute inset-0 z-10" 
        onClick={handleCanvasClick} 
        onMouseDown={(e) => {
          // 确保点击事件能传递到 Canvas
          handleCanvasClick()
        }}
        style={{ cursor: 'pointer' }}
      >
        <Canvas
          onClick={(e) => {
            // 也处理 Canvas 本身的点击
            e.stopPropagation()
            handleCanvasClick()
          }}
        shadows
        gl={{ 
          antialias: true, 
          alpha: true,
          // 启用透明度和混合模式以支持体积雾
          premultipliedAlpha: false,
          preserveDrawingBuffer: true,
          // 性能优化设置
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        dpr={[1, 2]} // 根据设备像素比自适应
        performance={{ min: 0.5 }} // 性能监控，低于50%时自动降级
        camera={{ position: [50.57, -44.15, 104.12], fov: 50 }}
      >
        <Suspense fallback={null}>
          {/* 雾效果 */}
          <FogEffect />
          
          {/* 环境光 - 增强以显示雾效果 */}
          <ambientLight intensity={0.7} />
          
          {/* 定向光 */}
          <directionalLight
            position={[10, 10, 5]}
            intensity={1.2}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          
          {/* 环境 */}
          <Environment preset="sunset" />
          
          {/* 城市模型 */}
          <City scale={0.5} position={[0, -50, 0]} />
          
          {/* 雾材质修复 */}
          <FogMaterialFix />
          
          {/* 第一人称控制器 */}
          <FirstPersonControls />
          
          {/* 相机 */}
          <PerspectiveCamera makeDefault position={[50.57, -44.15, 104.12]} />
        </Suspense>
      </Canvas>
      </div>
    </div>
  )
}

export default CityScene

