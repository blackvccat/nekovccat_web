'use client'

import Image from 'next/image'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { PROFILE } from '@/content/profile'
import gallery from '@/content/minecraft-gallery.json'
import { BROWSER_PAGES, type BrowserPage } from '@/lib/desktop-links'
import './desktop-software.css'

export default function NekoBrowser({ initialPage = 'about', launch = 0, onSponsor }: { initialPage?: BrowserPage; launch?: number; onSponsor: () => void }) {
  const [history, setHistory] = useState<BrowserPage[]>([initialPage])
  const [index, setIndex] = useState(0)
  const [category, setCategory] = useState('all')
  const [photo, setPhoto] = useState<number | null>(null)
  const [notice, setNotice] = useState('')
  const content = useRef<HTMLDivElement>(null)
  const viewer = useRef<HTMLElement>(null)
  const photoTrigger = useRef<HTMLButtonElement | null>(null)
  const photoTriggerTop = useRef(0)
  const viewerWasOpen = useRef(false)
  const galleryScroll = useRef(0)
  const restoreGallery = useRef(false)
  const scrollPositions = useRef<Partial<Record<BrowserPage, number>>>({})
  const selected = history[index]
  const images = gallery.filter(item => category === 'all' || item.category === category)
  const activePhoto = gallery.find(item => item.id === photo)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- A desktop deep link opens its requested document.
    setHistory([initialPage]); setIndex(0); setPhoto(null)
  }, [initialPage, launch])
  useLayoutEffect(() => { content.current?.scrollTo(0, scrollPositions.current[selected] || 0) }, [selected])
  useLayoutEffect(() => {
    if (photo !== null && viewer.current && content.current) {
      if (!viewerWasOpen.current) viewer.current.focus({ preventScroll: true })
      viewerWasOpen.current = true
      content.current.scrollTo(0, content.current.scrollTop + viewer.current.getBoundingClientRect().top - content.current.getBoundingClientRect().top - 8)
    } else {
      viewerWasOpen.current = false
      if (restoreGallery.current) {
        restoreGallery.current = false
        if (content.current && photoTrigger.current?.isConnected) {
          content.current.scrollTop += photoTrigger.current.getBoundingClientRect().top - content.current.getBoundingClientRect().top - photoTriggerTop.current
          photoTrigger.current.focus({ preventScroll: true })
        } else content.current?.scrollTo(0, galleryScroll.current)
      }
    }
  }, [photo])
  function rememberScroll() {
    scrollPositions.current[selected] = photo !== null ? galleryScroll.current : content.current?.scrollTop || 0
  }
  function travel(nextIndex: number) {
    rememberScroll(); setIndex(nextIndex); setPhoto(null)
  }
  function closePhoto() { restoreGallery.current = true; setPhoto(null) }
  function stepPhoto(direction: number) {
    const currentIndex = images.findIndex(item => item.id === photo)
    if (currentIndex < 0 || images.length < 2) return
    setPhoto(images[(currentIndex + direction + images.length) % images.length].id)
  }
  function navigate(page: BrowserPage) {
    if (page === selected) return
    rememberScroll()
    setNotice('')
    const next = [...history.slice(0, index + 1), page].slice(-40)
    setHistory(next); setIndex(next.length - 1); setPhoto(null)
  }
  async function copy(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setNotice(`${label}已复制。`) }
    catch { setNotice('复制未成功，请选中文字手动复制。') }
  }
  return <div className="neko-browser" onKeyDown={event => {
    if (photo !== null && event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closePhoto() }
  }}>
    <div className="browser-menubar"><span>File</span><span>View</span><span>Bookmarks</span><span>NEKO Navigator / 01</span></div>
    <div className="browser-toolbar"><button className="pixel-button" aria-label="后退" disabled={index === 0} onClick={() => travel(index - 1)}>←</button><button className="pixel-button" aria-label="前进" disabled={index === history.length - 1} onClick={() => travel(index + 1)}>→</button><span className="browser-address inset-panel" aria-label="当前站内地址">neko://{selected}</span><span className="browser-online" title="本站内容">●</span></div>
    <nav className="browser-tabs" aria-label="浏览器栏目">{BROWSER_PAGES.map(page => <button key={page.id} type="button" aria-current={selected === page.id ? 'page' : undefined} onClick={() => navigate(page.id)}>{page.label}</button>)}</nav>
    <div className="browser-document" ref={content}>
      {selected === 'about' && <article>
        <div className="browser-kicker">PERSONAL HOMEPAGE / EST. NEKO</div>
        <header className="profile-hero"><div className="profile-stamp" aria-hidden="true">N<span>猫猫在线</span></div><div><p className="profile-alias">HELLO, I&apos;M</p><h1>NEKO</h1><p>{PROFILE.role}</p></div></header>
        <p className="profile-intro">{PROFILE.intro}</p>
        <div className="profile-callout">在屏幕里写代码，也在方块间搭建世界。<br />这里收着我的作品、经历，和一些舍不得丢掉的好奇心。</div>
        <div className="profile-directory"><button onClick={() => navigate('projects')}><span>01 / WORK</span><strong>把想法做出来 ↗</strong><small>产品、工程与 AI 项目</small></button><button onClick={() => navigate('minecraft')}><span>02 / WORLD</span><strong>在方块之间散步 ↗</strong><small>我的 Minecraft 服务器建筑档案</small></button></div>
        <section className="browser-section"><h2>我的工具箱 <small>THINGS I WORK WITH</small></h2><div className="profile-tags">{PROFILE.skills.map(skill => <span key={skill}>{skill}</span>)}</div></section>
        <p className="profile-education">{PROFILE.education}</p>
        <button className="pixel-button" onClick={() => navigate('contact')}>给 NEKO 留个招呼 ↗</button>
      </article>}
      {selected === 'projects' && <article><div className="browser-kicker">PRODUCT × ENGINEERING</div><h1>做过的事<span className="document-subtitle">把问题想清楚，把产品做出来。</span></h1><section className="browser-section"><h2>经历 <small>EXPERIENCE</small></h2>{PROFILE.experiences.map(job => <div className="profile-job" key={job.company}><time>{job.date}</time><h3>{job.company}</h3><p className="job-role">{job.role}</p><p>{job.description}</p><div className="profile-tags">{job.tags.map(tag => <span key={tag}>{tag}</span>)}</div></div>)}</section><section className="browser-section"><h2>项目 <small>SELECTED PROJECTS</small></h2>{PROFILE.projects.map(project => <div className="profile-project" key={project.name}><h3>{project.name}</h3><p>{project.description}</p><small>{project.tags}</small><a href={project.href} target="_blank" rel="noopener noreferrer">查看代码 ↗</a></div>)}</section><p className="profile-education">{PROFILE.education}</p></article>}
      {selected === 'minecraft' && <article><div className="browser-kicker">MINECRAFT / WORLD ARCHIVE</div><h1>在方块之间<span className="document-subtitle">一座城，一片山野，还有许多个慢慢搭建的日子。</span></h1><p>这里是我的 Minecraft 服务器影像档案。沿着街道走过广场、庭院与塔楼，把那些值得停下来的风景留在这里。</p><div className="gallery-filters" aria-label="建筑档案分类">{[['all', '全部'], ['city', '城市漫游'], ['garden', '山野与庭院'], ['architecture', '建筑手记']].map(([id, title]) => <button className="pixel-button" key={id} aria-pressed={category === id} onClick={() => { setCategory(id); setPhoto(null) }}>{title}</button>)}<small>{images.length} 帧</small></div>
        {activePhoto && <section ref={viewer} tabIndex={-1} className="gallery-viewer" aria-label="查看建筑大图" onKeyDown={event => {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); event.stopPropagation(); stepPhoto(event.key === 'ArrowLeft' ? -1 : 1) }
        }}><div className="gallery-viewer-controls"><button type="button" className="pixel-button" onClick={() => stepPhoto(-1)} disabled={images.length < 2} aria-label="上一张建筑图片">← 上一张</button><span role="status">{images.findIndex(item => item.id === photo) + 1} / {images.length}</span><button type="button" className="pixel-button" onClick={() => stepPhoto(1)} disabled={images.length < 2} aria-label="下一张建筑图片">下一张 →</button><button type="button" className="text-button" onClick={closePhoto}>收起大图 ×</button></div><Image unoptimized src={activePhoto.src} width={activePhoto.width} height={activePhoto.height} alt={activePhoto.title} /><p>{activePhoto.title}</p></section>}
        <div className="minecraft-grid">{images.map(item => <button key={item.id} className="minecraft-photo" onClick={event => {
          photoTrigger.current = event.currentTarget
          photoTriggerTop.current = event.currentTarget.getBoundingClientRect().top - (content.current?.getBoundingClientRect().top || 0)
          if (photo === null) galleryScroll.current = content.current?.scrollTop || 0
          setPhoto(item.id)
        }} aria-label={`查看 ${item.title}`}>
          <Image unoptimized src={item.thumbnail} width={item.width} height={item.height} loading="lazy" alt={item.title} /><span>{item.title}<b>↗</b></span>
        </button>)}</div><p className="gallery-note">影像来自 NEKO 提供的服务器宣传档案，保留原图中的署名。想来逛逛，或聊聊建筑？</p><button className="pixel-button" onClick={() => navigate('contact')}>联系 NEKO，了解加入方式 ↗</button></article>}
      {selected === 'contact' && <article><div className="browser-kicker">SAY HELLO / CONNECTIONS</div><h1>来聊聊天<span className="document-subtitle">关于 AI、产品、代码，或一座还没建好的城。</span></h1><p>项目合作、技术交流，或者想了解我的 Minecraft 服务器，都可以从这里找到我。</p><div className="contact-card"><span>EMAIL / 邮箱</span><strong>{PROFILE.email}</strong><div><a className="pixel-button" href={`mailto:${PROFILE.email}`}>写邮件 ↗</a><button className="text-button" onClick={() => copy(PROFILE.email, '邮箱')}>复制邮箱</button></div></div><div className="contact-card"><span>GITHUB / 开源</span><strong>blackvccat</strong><a className="pixel-button" href={PROFILE.github} target="_blank" rel="noopener noreferrer">打开 GitHub ↗</a></div><div className="contact-card"><span>WECHAT / 微信</span><strong>{PROFILE.wechat}</strong><button className="pixel-button" onClick={() => copy(PROFILE.wechat, '微信号')}>复制微信号</button></div><p role="status">{notice}</p><div className="profile-callout">喜欢这个小世界？你也可以给 NEKO 一点支持。<br /><button className="text-button" onClick={onSponsor}>打开「赞助 NEKO」 ↗</button></div></article>}
      <footer className="browser-page-footer">HANDMADE ON THE INTERNET <span>NEKO © 2026</span></footer>
    </div><div className="browser-status"><span>✓ 本站文档</span><span>{BROWSER_PAGES.find(page => page.id === selected)?.label}</span></div>
  </div>
}
