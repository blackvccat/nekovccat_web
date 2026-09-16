'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { PROFILE } from '@/content/profile'
import { SHOWCASE_GALLERY, SHOWCASE_URL, showcaseLink } from '@/content/showcase'
import { BROWSER_PAGES, type BrowserPage } from '@/lib/desktop-links'
import './desktop-software.css'

export default function MarcusBrowser({ initialPage = 'about', launch = 0 }: { initialPage?: BrowserPage; launch?: number }) {
  const [history, setHistory] = useState<BrowserPage[]>([initialPage])
  const [index, setIndex] = useState(0)
  const [kind, setKind] = useState<'all' | 'video' | 'image'>('all')
  const [notice, setNotice] = useState('')
  const content = useRef<HTMLDivElement>(null)
  const selected = history[index]
  const pieces = SHOWCASE_GALLERY.filter(piece => kind === 'all' || piece.kind === kind)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- A desktop deep link opens its requested document.
    setHistory([initialPage]); setIndex(0)
  }, [initialPage, launch])
  useEffect(() => { content.current?.scrollTo(0, 0) }, [selected])
  function navigate(page: BrowserPage) {
    if (page === selected) return
    setNotice('')
    const next = [...history.slice(0, index + 1), page].slice(-40)
    setHistory(next); setIndex(next.length - 1)
  }
  async function copy(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setNotice(`${label}已复制。`) }
    catch { setNotice('复制未成功，请选中文字手动复制。') }
  }
  return <div className="marcus-browser">
    <div className="browser-menubar"><span>File</span><span>View</span><span>Bookmarks</span><span>MARCUS Navigator / 01</span></div>
    <div className="browser-toolbar"><button className="pixel-button" aria-label="后退" disabled={index === 0} onClick={() => setIndex(index - 1)}>←</button><button className="pixel-button" aria-label="前进" disabled={index === history.length - 1} onClick={() => setIndex(index + 1)}>→</button><span className="browser-address inset-panel" aria-label="当前站内地址">marcus://{selected}</span><span className="browser-online" title="本站内容">●</span></div>
    <nav className="browser-tabs" aria-label="浏览器栏目">{BROWSER_PAGES.map(page => <button key={page.id} type="button" aria-current={selected === page.id ? 'page' : undefined} onClick={() => navigate(page.id)}>{page.label}</button>)}</nav>
    <div className="browser-document" ref={content}>
      {selected === 'about' && <article>
        <div className="browser-kicker">PERSONAL HOMEPAGE / EST. MARCUS</div>
        <header className="profile-hero"><div className="profile-stamp"><Image unoptimized src="/images/marcus-avatar.jpg" width={87} height={93} alt="MARCUS 的头像" /></div><div><p className="profile-alias">HELLO, I&apos;M</p><h1>MARCUS</h1><p>{PROFILE.role} · {PROFILE.callsign}<br />{PROFILE.location}</p></div></header>
        <p className="profile-intro">{PROFILE.intro}</p>
        <div className="profile-callout">「{PROFILE.quote}」<br /><small>{PROFILE.motto}</small></div>
        <div className="profile-directory"><button onClick={() => navigate('projects')}><span>01 / WORK</span><strong>轨迹与探索 ↗</strong><small>研究、工程与商业交付</small></button><button onClick={() => navigate('gallery')}><span>02 / GALLERY</span><strong>长廊 ↗</strong><small>主站「共鸣」展厅的一部分画框</small></button></div>
        <section className="browser-section"><h2>我的工具箱 <small>THINGS I WORK WITH</small></h2><div className="profile-tags">{PROFILE.skills.map(skill => <span key={skill}>{skill}</span>)}</div></section>
        <p className="profile-education">{PROFILE.education}</p>
        <div className="profile-actions"><button className="pixel-button" onClick={() => navigate('contact')}>给 MARCUS 留个招呼 ↗</button><a className="pixel-button" href={PROFILE.github} target="_blank" rel="noopener noreferrer">我的 GitHub ↗</a></div>
      </article>}
      {selected === 'projects' && <article><div className="browser-kicker">FULL-STACK × EMBEDDED</div><h1>轨迹与探索<span className="document-subtitle">把问题想清楚，把东西做出来。</span></h1><section className="browser-section"><h2>经历 <small>EXPERIENCE</small></h2>{PROFILE.experiences.map(job => <div className="profile-job" key={job.company}><time>{job.date}</time><h3>{job.company}</h3><p className="job-role">{job.role}</p><p>{job.description}</p><div className="profile-tags">{job.tags.map(tag => <span key={tag}>{tag}</span>)}</div></div>)}</section><section className="browser-section"><h2>项目与探索 <small>SELECTED PROJECT</small></h2>{PROFILE.projects.map(project => <div className="profile-project" key={project.name}><h3>{project.name}</h3><p>{project.description}</p><small>{project.tags}</small><a href={project.href} target="_blank" rel="noopener noreferrer">阅读全文 ↗</a></div>)}</section><p className="profile-education">{PROFILE.education}</p></article>}
      {selected === 'gallery' && <article>
        <div className="browser-kicker">RESONANCE / 共鸣 · 长廊</div>
        <h1>长廊<span className="document-subtitle">把光、声音和影子，一起镶进墙上的画框。</span></h1>
        <p>主站 example.com 的「共鸣」展厅里放着翻弹、影像与飞行记录。这里只留其中一部分画框，点开任意一幅，到主站看完整的原作。</p>
        <div className="gallery-filters" aria-label="长廊分类">{[['all', '全部'], ['video', '影像'], ['image', '图像']].map(([id, title]) => <button className="pixel-button" key={id} aria-pressed={kind === id} onClick={() => setKind(id as 'all' | 'video' | 'image')}>{title}</button>)}<small>{pieces.length} 幅画框</small></div>
        <div className="gallery-wall">{pieces.map(piece => <a key={piece.id} className="gallery-frame" href={showcaseLink(piece)} target="_blank" rel="noopener noreferrer" aria-label={`在主站打开 ${piece.title}`}>
          <span className="frame-mat"><Image unoptimized src={piece.thumbnail} width={piece.width} height={piece.height} loading="lazy" alt={piece.title} /></span>
          <span className="frame-plate"><b>{piece.num}</b><strong>{piece.title}</strong><small>{piece.ratio}</small><em>{piece.desc}</em><span className="frame-open">打开原作 ↗</span></span>
        </a>)}</div>
        <p className="gallery-note">画框中的作品来自主站 example.com 的「共鸣」展厅，点开会在新标签页播放或展示。</p>
        <a className="pixel-button" href={SHOWCASE_URL} target="_blank" rel="noopener noreferrer">查看完整共鸣展厅 ↗</a></article>}
      {selected === 'contact' && <article><div className="browser-kicker">SAY HELLO / CONNECTIONS</div><h1>来聊聊天<span className="document-subtitle">软件、硬件、无线电，或一件还没调完的机器。</span></h1><p>项目合作、技术交流、无线电通联，或者想聊聊「共鸣」展厅里的某件作品，都可以从这里找到我。</p><div className="contact-card"><span>EMAIL / 邮箱</span><strong>{PROFILE.email}</strong><div><a className="pixel-button" href={`mailto:${PROFILE.email}`}>写邮件 ↗</a><button className="text-button" onClick={() => copy(PROFILE.email, '邮箱')}>复制邮箱</button></div></div><div className="contact-card"><span>GITHUB / 代码</span><strong>your-handle</strong><div><a className="pixel-button" href={PROFILE.github} target="_blank" rel="noopener noreferrer">打开 GitHub ↗</a><button className="text-button" onClick={() => copy(PROFILE.github, 'GitHub 地址')}>复制链接</button></div></div><p role="status">{notice}</p></article>}
      <footer className="browser-page-footer">HANDMADE ON THE INTERNET <span>MARCUS © 2026</span></footer>
    </div><div className="browser-status"><span>✓ 本站文档</span><span>{BROWSER_PAGES.find(page => page.id === selected)?.label}</span></div>
  </div>
}
