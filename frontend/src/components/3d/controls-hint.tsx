'use client'

import { useState, useEffect } from 'react'

export function ControlsHint() {
  const [isLocked, setIsLocked] = useState(false)
  const [showHint, setShowHint] = useState(true)

  useEffect(() => {
    const handlePointerLockChange = () => {
      const locked = document.pointerLockElement !== null
      setIsLocked(locked)
      if (locked) {
        setShowHint(false)
      }
    }

    // 默认不显示提示（因为默认启用控制）
    setShowHint(false)

    document.addEventListener('pointerlockchange', handlePointerLockChange)
    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange)
    }
  }, [])

  if (!showHint || isLocked) return null

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
      <div className="bg-black/70 text-white px-8 py-6 rounded-lg backdrop-blur-sm">
        <h3 className="text-xl font-bold mb-4 text-center">第一人称控制</h3>
        <div className="space-y-2 text-sm">
          <p className="text-center mb-4">点击场景开始</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold mb-2">移动控制:</p>
              <ul className="space-y-1">
                <li><kbd className="px-2 py-1 bg-gray-700 rounded">W</kbd> 向前</li>
                <li><kbd className="px-2 py-1 bg-gray-700 rounded">S</kbd> 向后</li>
                <li><kbd className="px-2 py-1 bg-gray-700 rounded">A</kbd> 向左</li>
                <li><kbd className="px-2 py-1 bg-gray-700 rounded">D</kbd> 向右</li>
                <li><kbd className="px-2 py-1 bg-gray-700 rounded">Space</kbd> 向上</li>
                <li><kbd className="px-2 py-1 bg-gray-700 rounded">Shift</kbd> 向下</li>
                <li><kbd className="px-2 py-1 bg-gray-700 rounded">R</kbd> 保存位置</li>
                <li><kbd className="px-2 py-1 bg-gray-700 rounded">T</kbd> 切换自动旋转</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">视角控制:</p>
              <ul className="space-y-1">
                <li>鼠标移动 - 旋转视角</li>
                <li><kbd className="px-2 py-1 bg-gray-700 rounded">ESC</kbd> 退出控制</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

