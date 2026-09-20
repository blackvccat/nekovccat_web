'use client'

import { Suspense } from 'react'
import PixelDesktop from '@/components/my-world/pixel-desktop'
import './desktop.css'
import './desktop-dark.css'
import './app-tokens.css'

export default function Terminal() {
  return <Suspense fallback={<div className="marcus-desktop-page">正在打开 MARCUS 桌面…</div>}><PixelDesktop /></Suspense>
}
