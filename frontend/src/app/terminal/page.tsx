'use client'

import { Suspense } from 'react'
import AgentApp from '@/components/agent/agent-app'
import PixelDesktop from '@/components/my-world/pixel-desktop'
import './desktop.css'
import './desktop-dark.css'

/* 首屏之前先把明暗定下来。设置存在 localStorage，等 React 挂载再切的话，
   暗色用户每次进桌面都会先看到一屏米白再跳成暗色。这段脚本在桌面标记之前解析执行，
   所以第一次绘制就已是正确的主题；挂载后由 pixel-desktop 的 effect 继续跟随切换。
   它只读一个字段、只写一个属性，失败就退回亮色。 */
const THEME_BOOT = `try{var s=JSON.parse(localStorage.getItem('marcus-desktop-settings')||'null');document.documentElement.dataset.theme=s&&s.theme==='dark'?'dark':'light'}catch(e){document.documentElement.dataset.theme='light'}`

export default function Terminal() {
  return <>
    <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
    <Suspense fallback={<div className="marcus-desktop-page">正在打开 MARCUS 桌面…</div>}><PixelDesktop agent={<AgentApp />} /></Suspense>
  </>
}
