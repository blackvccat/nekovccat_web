'use client'

import { useState } from 'react'
import PixelIcon from './harbor-pixel-icon'
import { NIGHT_HARBOR_ASSETS } from './night-harbor-assets'
import { useRelationshipMode } from '@/components/relationship/relationship-mode'

import { DEFAULT_SETTINGS, DESKTOP_APPS, type DesktopSettings } from './desktop-config'
export { DEFAULT_SETTINGS, DESKTOP_APPS, type DesktopSettings, type DesktopAppId } from './desktop-config'

export function NotesApp() {
  // This window mounts when the visitor opens it, after the desktop has hydrated.
  const [note, setNote] = useState(() => {
    try { return localStorage.getItem('neko-desktop-note') || '' } catch { return '' }
  })
  const [saved, setSaved] = useState(true)
  return <div className="notes-app"><div className="app-menubar"><span>UNTITLED.TXT</span><span>{saved ? '保存在此浏览器' : '仅本次保留'}</span></div><label className="sr-only" htmlFor="desktop-notes">我的便签</label><textarea id="desktop-notes" className="notes-paper" value={note} placeholder={'今天有什么想记下来的？\n\n一个念头、一段文字，或下一次想问 NEKO 的问题。'} onChange={event => {
    const value = event.target.value
    setNote(value)
    try { localStorage.setItem('neko-desktop-note', value); setSaved(true) } catch { setSaved(false) }
  }} /><div className="notes-footer"><span>{note.length} 字符</span><span>{saved ? '✓ 已自动保存' : '浏览器存储不可用'}</span></div></div>
}

export function SettingsApp({ settings, onChange }: { settings: DesktopSettings; onChange: (settings: DesktopSettings) => void }) {
  const { isGirlfriend, isUnlocked, activateGirlfriend, leaveGirlfriend } = useRelationshipMode()
  const wallpapers = [
    { value: 'night-harbor', title: '夜泊', caption: '猫尾轻摆，港城微光' },
    { value: 'island', title: '猫咪小岛', caption: '海风与落日' },
    { value: 'dusk', title: '暮色', caption: '日落之后' },
    { value: 'sage', title: '鼠尾草绿', caption: '简单一点' },
  ] as const
  const motionOptions = [
    { value: 'auto', title: '自动' },
    { value: 'on', title: '开启' },
    { value: 'off', title: '关闭' },
  ] as const
  return <div className="settings-app">
    <div className="app-section-title"><h2>Make yourself at home.</h2><p>把小小桌面，调成喜欢的样子。</p></div>
    {isUnlocked && <section className="relationship-setting"><div><PixelIcon name="our-space" size={28} /><span><strong>{isGirlfriend ? '伴侣模式' : '伴侣模式已解锁'}</strong><small>{isGirlfriend ? '退出后会恢复下面选中的普通壁纸。' : '彩蛋内容已由服务器授权。'}</small></span></div><button type="button" className="pixel-button" onClick={isGirlfriend ? leaveGirlfriend : () => { void activateGirlfriend() }}>{isGirlfriend ? '回到普通桌面' : '回到伴侣模式'}</button></section>}
    <fieldset>
      <legend>{isGirlfriend ? '普通模式壁纸' : '桌面壁纸'}</legend>
      <div className="wallpaper-options">
        {wallpapers.map(wallpaper => <button type="button" key={wallpaper.value} className={`wallpaper-option ${settings.wallpaper === wallpaper.value ? 'selected' : ''}`} aria-pressed={settings.wallpaper === wallpaper.value} onClick={() => onChange({ ...settings, wallpaper: wallpaper.value })}>
          <span className={`wallpaper-preview wallpaper-${wallpaper.value}`} style={wallpaper.value === 'night-harbor' ? { backgroundImage: `url("${NIGHT_HARBOR_ASSETS.thumbnail}")` } : undefined} />
          <strong>{wallpaper.title}</strong><small>{wallpaper.caption}</small>
        </button>)}
      </div>
      {isGirlfriend && <p className="wallpaper-mode-note">伴侣模式固定使用双猫壁纸；这里的选择会留给普通桌面。</p>}
    </fieldset>
    <fieldset className="wallpaper-motion-settings" disabled={isGirlfriend || settings.wallpaper !== 'night-harbor'} aria-describedby="wallpaper-motion-hint">
      <legend>壁纸动画</legend>
      <div className="wallpaper-motion-options">{motionOptions.map(option => <button type="button" key={option.value} className={`pixel-button ${settings.wallpaperMotion === option.value ? 'pressed' : ''}`} aria-pressed={settings.wallpaperMotion === option.value} onClick={() => onChange({ ...settings, wallpaperMotion: option.value })}>{option.title}</button>)}</div>
      <p id="wallpaper-motion-hint">{settings.wallpaper !== 'night-harbor' ? '选择夜泊，开启猫尾、灯光与水面倒影。' : '自动模式在手机和节省流量时保持静态。系统开启“减少动态效果”时，壁纸始终静止。'}</p>
    </fieldset>
    <label className="scanline-setting"><span><strong>CRT 扫描线</strong><small>一点老显示器的味道，保持静态。</small></span><input type="checkbox" checked={settings.scanlines} onChange={event => onChange({ ...settings, scanlines: event.target.checked })} /></label>
    <div className="settings-footer"><span>设置仅保存在这个浏览器中。</span><button type="button" className="pixel-button" onClick={() => onChange(DEFAULT_SETTINGS)}>恢复默认</button></div>
  </div>
}

export function AboutComputer() {
  const { isGirlfriend } = useRelationshipMode()
  return <div className="about-computer"><PixelIcon name="about" size={76} /><div className="eyebrow">WELCOME TO MY LITTLE INTERNET CORNER.</div><h2>NEKO OS<span>{isGirlfriend ? 'special edition' : 'personal edition'}</span></h2><p>一台装着好奇心的小电脑。<br />把个人网站、站内向导、音乐和随手便签，放进熟悉的像素桌面里。</p><div className="computer-specs inset-panel"><span>桌面应用<strong>{DESKTOP_APPS.length - (isGirlfriend ? 0 : 1)} 个</strong></span><span>本地保存<strong>对话 · 音乐收藏 · 便签 · 偏好</strong></span><span>操作提示<strong>拖动标题栏，点击任务栏切换</strong></span></div><p className="about-footnote">MADE FOR WANDERING. STAY A WHILE.</p></div>
}
