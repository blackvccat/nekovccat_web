'use client'

import { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

export function FirstPersonControls() {
  const { camera } = useThree()
  const moveForward = useRef(false)
  const moveBackward = useRef(false)
  const moveLeft = useRef(false)
  const moveRight = useRef(false)
  const moveUp = useRef(false)
  const moveDown = useRef(false)
  const velocity = useRef(new THREE.Vector3())
  const direction = useRef(new THREE.Vector3())
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const PI_2 = Math.PI / 2
  const [isLocked, setIsLocked] = useState(true) // 默认启用控制
  const [savedPositions, setSavedPositions] = useState<Array<{name: string, position: [number, number, number], rotation: [number, number, number], timestamp: string}>>([])
  const [isAutoRotating, setIsAutoRotating] = useState(true) // 默认开启自动旋转
  const autoRotateSpeed = useRef(12) // 旋转速度：360度 / 30秒 = 12度/秒

  // 键盘事件处理
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          moveForward.current = true
          break
        case 'KeyS':
        case 'ArrowDown':
          moveBackward.current = true
          break
        case 'KeyA':
        case 'ArrowLeft':
          moveLeft.current = true
          break
        case 'KeyD':
        case 'ArrowRight':
          moveRight.current = true
          break
        case 'Space':
          moveUp.current = true
          break
        case 'ShiftLeft':
          moveDown.current = true
          break
        case 'KeyR':
          // 按 R 键记录当前位置
          if (!event.repeat) {
            saveCurrentPosition.current()
          }
          break
        case 'KeyT':
          // 按 T 键切换自动旋转
          if (!event.repeat) {
            setIsAutoRotating(prev => !prev)
          }
          break
      }
    }

    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          moveForward.current = false
          break
        case 'KeyS':
        case 'ArrowDown':
          moveBackward.current = false
          break
        case 'KeyA':
        case 'ArrowLeft':
          moveLeft.current = false
          break
        case 'KeyD':
        case 'ArrowRight':
          moveRight.current = false
          break
        case 'Space':
          moveUp.current = false
          break
        case 'ShiftLeft':
          moveDown.current = false
          break
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  // 移动逻辑（暂时禁用自由移动）
  // 优化：只在需要时执行旋转计算
  useFrame((state, delta) => {
    // 只保留自动旋转功能
    if (isAutoRotating && isLocked) {
      // 只在Y轴（垂直轴）上旋转，保持水平旋转
      const rotationAngle = (autoRotateSpeed.current * Math.PI / 180) * delta // 转换为弧度
      euler.current.setFromQuaternion(camera.quaternion)
      euler.current.y += rotationAngle // 只旋转Y轴
      camera.quaternion.setFromEuler(euler.current)
    }

    // 暂时禁用所有移动功能
    // 相机保持在固定位置，只进行旋转
  })

  const lastMousePosition = useRef({ x: 0, y: 0 })

  // 保存当前位置的函数引用
  const saveCurrentPosition = useRef<() => void>(() => {})

  // 更新 saveCurrentPosition 函数以使用最新的 savedPositions
  useEffect(() => {
    saveCurrentPosition.current = () => {
      const position: [number, number, number] = [
        camera.position.x,
        camera.position.y,
        camera.position.z
      ]
      
      const rotation = new THREE.Euler().setFromQuaternion(camera.quaternion)
      const rotationArray: [number, number, number] = [
        rotation.x,
        rotation.y,
        rotation.z
      ]

      const timestamp = new Date().toLocaleString('zh-CN')
      const positionData = {
        name: `位置 ${savedPositions.length + 1}`,
        position,
        rotation: rotationArray,
        timestamp
      }

      const newPositions = [...savedPositions, positionData]
      setSavedPositions(newPositions)

      // 保存到 localStorage
      try {
        const existing = localStorage.getItem('cameraPositions')
        const allPositions = existing ? JSON.parse(existing) : []
        allPositions.push(positionData)
        localStorage.setItem('cameraPositions', JSON.stringify(allPositions))
      } catch (error) {
        console.error('Failed to save position to localStorage:', error)
      }

      // 在控制台输出
      console.log('📍 已保存位置:', {
        name: positionData.name,
        position: position.map(v => v.toFixed(2)),
        rotation: rotationArray.map(v => v.toFixed(4)),
        timestamp
      })

      // 显示提示
      alert(`位置已保存: ${positionData.name}\n坐标: (${position.map(v => v.toFixed(2)).join(', ')})\n时间: ${timestamp}`)
    }
  }, [camera, savedPositions])

  // 设置默认初始位置
  useEffect(() => {
    // 设置相机初始位置
    camera.position.set(50.57, -44.15, 104.12)
    // 重置相机旋转为默认朝向
    camera.rotation.set(0, 0, 0)
  }, [camera])

  // 加载保存的位置
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cameraPositions')
      if (saved) {
        const positions = JSON.parse(saved)
        setSavedPositions(positions)
        console.log('📚 已加载保存的位置:', positions.length, '个')
      }
    } catch (error) {
      console.error('Failed to load positions from localStorage:', error)
    }
  }, [])

  useEffect(() => {
    // 尝试使用 Pointer Lock API，如果失败则使用备用方案
    const handlePointerLockChange = () => {
      const locked = document.pointerLockElement !== null
      setIsLocked(locked)
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (!isLocked) return

      let movementX = 0
      let movementY = 0

      // 优先使用 movementX/Y（Pointer Lock 模式下可用）
      if (event.movementX !== undefined && event.movementX !== 0) {
        movementX = event.movementX
        movementY = event.movementY || 0
      } else {
        // 备用方案：使用鼠标位置差值
        const currentX = event.clientX
        const currentY = event.clientY
        movementX = currentX - lastMousePosition.current.x
        movementY = currentY - lastMousePosition.current.y
        lastMousePosition.current = { x: currentX, y: currentY }
      }

      // 如果正在自动旋转，不响应鼠标移动
      if (!isAutoRotating) {
        euler.current.setFromQuaternion(camera.quaternion)
        euler.current.y -= movementX * 0.002
        euler.current.x -= movementY * 0.002
        euler.current.x = Math.max(-PI_2, Math.min(PI_2, euler.current.x))
        camera.quaternion.setFromEuler(euler.current)
      }
    }

    const handlePointerLockError = () => {
      // 如果 Pointer Lock 失败，自动启用鼠标控制
      setIsLocked(true)
    }

    document.addEventListener('pointerlockchange', handlePointerLockChange)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('pointerlockerror', handlePointerLockError)

    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('pointerlockerror', handlePointerLockError)
    }
  }, [isLocked, camera, isAutoRotating])

  // 不渲染 PointerLockControls，使用自定义控制
  return null
}

