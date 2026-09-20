'use client'

/** 第一方（内置）应用的模块表。
 *
 *  它们和 `apps/` 里的插件应用走**同一套** AppModule / AppHost 机制，只是实现留在仓库内部、
 *  可以自由使用宿主的 Provider 与组件。需要把某个内置应用也变成可搬运的，就把它的实现移进
 *  `apps/<id>/`（只用 `@/app-kit`），再从这张表里删掉即可。
 */
import { useEffect } from 'react'
import { VISITOR_APP_PREFIX, type AppModule, type AppProps } from './index'
import AgentApp from '@/components/agent/agent-app'
import MarcusBrowser from '@/components/my-world/marcus-browser'
import MusicApp from '@/components/my-world/music-app'
import { NotesApp, SettingsApp } from '@/components/my-world/desktop-apps'
import VisitorLogin from '@/components/my-world/visitor-login'
import VisitorHome from '@/components/visitor/visitor-home'
import { useMusicSession } from '@/components/music/music-session'
import { useVisitorMode } from '@/components/visitor/visitor-mode'
import type { BrowserPage } from '@/lib/desktop-links'

function AgentWindow() { return <AgentApp /> }

function ExplorerWindow({ host }: AppProps) {
  return <MarcusBrowser initialPage={host.browse.page as BrowserPage} launch={host.browse.key} />
}

function MusicWindow({ host }: AppProps) {
  const { stop } = useMusicSession()
  // 关窗时停止播放：旧版写在桌面里的特判，现在由应用自己登记。
  useEffect(() => host.onClose(stop), [host, stop])
  return <MusicApp playerLayer={host.layer} active={host.active} onActivate={host.focusSelf} playlistOpen={host.panelOpen} onTogglePlaylist={host.setPanel} />
}

function NotesWindow({ host }: AppProps) {
  return <NotesApp listOpen={host.panelOpen} onToggleList={host.setPanel} />
}

function SettingsWindow({ host }: AppProps) {
  return <SettingsApp settings={host.settings} onChange={next => host.updateSettings(next)} />
}

function VisitorWindow({ host }: AppProps) {
  const { isUnlocked } = useVisitorMode()
  return isUnlocked
    ? <VisitorHome onOpenApp={id => host.openApp(`${VISITOR_APP_PREFIX}${id}`)} onShowDesktop={host.showDesktop} />
    : <VisitorLogin />
}

export const BUILTIN_APPS: AppModule[] = [
  {
    manifest: {
      apiVersion: 1, id: 'agent', title: 'MK Agent', subtitle: '你的站内 AI 向导', icon: '/icons-svg/agent.svg',
      statusText: '● TERMINAL', titleSuffix: ' / 你的站内向导',
      window: { width: 740, height: 610, className: 'agent-window', visibleMargin: { narrow: 16, wide: 160, wideFrom: 600, minX: 140 } },
    },
    Component: AgentWindow,
  },
  {
    manifest: {
      apiVersion: 1, id: 'visitor', title: 'SIGNED IN', subtitle: '需要访客名与密码', icon: '/icons-svg/login.svg',
      window: { width: 430, height: 516 }, system: 'visitor',
    },
    Component: VisitorWindow,
  },
  {
    manifest: {
      apiVersion: 1, id: 'explorer', title: 'MARCUS Browser', subtitle: '关于、探索、长廊与联系', icon: '/icons-svg/explorer.svg',
      window: { width: 800, height: 660 },
    },
    Component: ExplorerWindow,
  },
  {
    manifest: {
      apiVersion: 1, id: 'music', title: 'MARCUS Music', subtitle: '给小世界配一首歌', icon: '/icons-svg/music.svg',
      window: { width: 660, height: 640, panelWidth: 1010 },
    },
    Component: MusicWindow,
  },
  {
    manifest: {
      apiVersion: 1, id: 'notes', title: 'Notes', subtitle: '留下一点想法', icon: '/icons-svg/notes.svg',
      window: { width: 560, height: 500, panelWidth: 900 },
    },
    Component: NotesWindow,
  },
  {
    manifest: {
      apiVersion: 1, id: 'settings', title: 'Settings', subtitle: '布置你的桌面', icon: '/icons-svg/settings.svg',
      window: { width: 570, height: 520 },
    },
    Component: SettingsWindow,
  },
]
