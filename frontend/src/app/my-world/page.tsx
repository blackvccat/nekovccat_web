'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import PixelDesktop from '@/components/my-world/pixel-desktop'
import './desktop.css'
import './harbor-theme.css'
import '@/components/my-world/desktop-software.css'
import './harbor-fonts.css'
import './night-harbor-theme.css'

const AgentApp = dynamic(() => import('@/components/agent/agent-app'), { loading: () => <p className="desktop-app-loading" role="status">正在打开 Agent…</p> })

export default function MyWorld() {
  return <Suspense fallback={<div className="neko-desktop-page">正在打开 NEKO 桌面…</div>}><PixelDesktop agent={<AgentApp />} /></Suspense>
}
