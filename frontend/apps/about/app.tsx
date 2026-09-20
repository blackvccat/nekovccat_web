'use client'

/** About Computer —— 第一个住在 `apps/` 里的桌面应用。
 *
 *  它只 import `@/app-kit`（公开契约），不碰宿主的任何内部模块：整份文件夹复制到另一个
 *  同架构的站点、在 `apps/registry.json` 里登记 `"about"`，就能在那里显示并运行。
 */
import type { AppProps } from '@/app-kit'

export default function AboutComputer({ host }: AppProps) {
  return <div className="about-computer">
    {/* 图标是应用自带的素材，经 host.asset() 落到 /apps/about/about.svg */}
    {/* eslint-disable-next-line @next/next/no-img-element -- 自己画的像素素材，走 next/image 没有收益 */}
    <img className="pixel-icon" src={host.asset('about.svg')} width={76} height={76} alt="" aria-hidden="true" draggable={false} />
    <div className="eyebrow">WELCOME TO MY LITTLE INTERNET CORNER.</div>
    <h2>MARCUS OS<span>personal edition</span></h2>
    <p>一台装着好奇心的小电脑。<br />把个人网站、站内向导、音乐和随手便签，放进熟悉的像素桌面里。</p>
    <div className="computer-specs inset-panel">
      <span>桌面应用<strong>{host.appCount} 个</strong></span>
      <span>本地保存<strong>对话 · 音乐收藏 · 便签 · 偏好</strong></span>
      <span>操作提示<strong>拖动标题栏，点击任务栏切换</strong></span>
    </div>
    <p className="about-footnote">MADE FOR WANDERING. STAY A WHILE.</p>
  </div>
}
