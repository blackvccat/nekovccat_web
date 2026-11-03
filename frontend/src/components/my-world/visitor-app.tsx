'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import './visitor-app.css'

interface VisitorAppMeta {
  id: string
  title: string
  subtitle: string
  watermark: string
  hasIcon: boolean
  hasWallpaper: boolean
  window?: { width?: number; height?: number }
}

interface AppsResponse {
  name: string
  apps: VisitorAppMeta[]
}

export default function VisitorApp() {
  const [status, setStatus] = useState<'loading' | 'login' | 'ready'>('loading')
  const [name, setName] = useState('')
  const [apps, setApps] = useState<VisitorAppMeta[]>([])
  const [selected, setSelected] = useState<VisitorAppMeta | null>(null)
  const [reload, setReload] = useState(0)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const loadApps = useCallback(async () => {
    try {
      const response = await fetch('/api/visitor/apps', { cache: 'no-store' })
      if (response.status === 401) {
        setStatus('login')
        return
      }
      if (!response.ok) throw new Error('访客服务暂时不可用。')
      const data = await response.json() as AppsResponse
      setApps(Array.isArray(data.apps) ? data.apps : [])
      setName(data.name || '访客')
      setStatus('ready')
    } catch {
      setStatus('login')
      setError('访客服务暂时不可用，请稍后再试。')
    }
  }, [])

  useEffect(() => { void loadApps() }, [loadApps])

  const login = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const session = await fetch('/api/chat/session', { cache: 'no-store' })
      if (!session.ok) throw new Error('无法建立访客会话，请刷新页面后重试。')
      const csrf = (await session.json() as { token?: string }).token
      if (!csrf) throw new Error('无法建立访客会话，请刷新页面后重试。')
      const response = await fetch('/api/visitor/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Neko-CSRF': csrf },
        body: JSON.stringify({ username, password }),
      })
      const data = await response.json().catch(() => null) as { error?: string; name?: string; apps?: VisitorAppMeta[] } | null
      if (!response.ok || !data) throw new Error(data?.error || '访客名或密码不正确。')
      setPassword('')
      await loadApps()
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : '登录失败，请重试。')
    } finally {
      setBusy(false)
    }
  }

  const logout = async () => {
    await fetch('/api/visitor/logout', { method: 'POST' }).catch(() => undefined)
    setStatus('login')
    setApps([])
    setSelected(null)
    setName('')
    setPassword('')
    setUsername('')
    setError('')
  }

  if (status === 'loading') {
    return <div className="visitor-app visitor-centered" role="status">正在读取访客空间…</div>
  }

  if (status === 'login') {
    return <div className="visitor-app visitor-login">
      <div className="visitor-login-card">
        <span className="visitor-kicker">PRIVATE DESKTOP</span>
        <h2>访客模式</h2>
        <p>输入 NEKO 给你的访客名和密码。登录后只会看到授权给你的应用。</p>
        <form onSubmit={login}>
          <label>访客名<input value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" maxLength={64} required /></label>
          <label>密码<input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" maxLength={200} required /></label>
          {error && <p className="visitor-error" role="alert">{error}</p>}
          <button type="submit" className="pixel-button" disabled={busy}>{busy ? '验证中…' : '进入访客空间'}</button>
        </form>
        <small>密码只发送给本站后端校验，不保存在浏览器。</small>
      </div>
    </div>
  }

  return <div className="visitor-app visitor-shell">
    <header className="visitor-header">
      <div><span className="visitor-kicker">VISITOR DESKTOP</span><strong>{name}</strong></div>
      <div className="visitor-header-actions">
        <button type="button" className="pixel-button" onClick={() => void loadApps()}>刷新</button>
        <button type="button" className="pixel-button" onClick={() => void logout()}>退出</button>
      </div>
    </header>
    {error && <p className="visitor-error" role="alert">{error}</p>}
    {selected ? <div className="visitor-runner">
      <div className="visitor-runner-bar">
        <button type="button" className="pixel-button" onClick={() => setSelected(null)}>← 应用列表</button>
        <span>{selected.title}</span>
        <button type="button" className="pixel-button" onClick={() => setReload(value => value + 1)}>重新载入</button>
      </div>
      <iframe key={`${selected.id}-${reload}`} title={selected.title} src={`/api/visitor/apps/${encodeURIComponent(selected.id)}/shell`} />
    </div> : <div className="visitor-apps">
      {apps.length === 0 && <p className="visitor-empty">这个访客还没有被授权任何应用。</p>}
      {apps.map(app => <button type="button" className="visitor-app-card" key={app.id} onClick={() => setSelected(app)}>
        <span className="visitor-app-icon">{app.hasIcon ? <img src={`/api/visitor/apps/${encodeURIComponent(app.id)}/assets/icon`} alt="" /> : app.title.slice(0, 1)}</span>
        <strong>{app.title}</strong>
        <small>{app.subtitle || '访客应用'}</small>
        <span className="visitor-open">打开 ›</span>
      </button>)}
    </div>}
  </div>
}
