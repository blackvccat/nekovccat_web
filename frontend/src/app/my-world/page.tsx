'use client'

import { Suspense } from 'react'
import AgentApp from '@/components/agent/agent-app'
import PixelDesktop from '@/components/my-world/pixel-desktop'
import './desktop.css'

export default function MyWorld() {
  return <Suspense fallback={<div className="neko-desktop-page">正在打开 NEKO 桌面…</div>}><PixelDesktop agent={<AgentApp />} /></Suspense>
}
