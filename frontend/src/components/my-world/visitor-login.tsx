'use client'

import { useState, type FormEvent } from 'react'
import { useVisitorMode } from '@/components/visitor/visitor-mode'
import PixelIcon from './pixel-icon'

/** 桌面上的访客模式登录窗：密码只在这一个请求里出现，绝不落到浏览器存储。 */
export default function VisitorLogin() {
  const { unlock, isReady } = useVisitorMode()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy || !isReady || !username.trim() || !password) return
    setBusy(true)
    setError('')
    const message = await unlock(username, password)
    setBusy(false)
    setPassword('')
    if (message) setError(message)
  }

  return <div className="visitor-login">
    <div className="visitor-login-heading">
      <span className="visitor-login-plate"><PixelIcon name="visitor" size={44} /></span>
      <div><span className="eyebrow">VISITOR MODE</span><h2>访客模式</h2></div>
      <span className="visitor-login-tag">INVITE<br />ONLY</span>
    </div>
    <p className="visitor-login-note">这里是留给受邀访客的入口。请输入 Marcus 给你的访客名与密码；登录后进入你自己的访客页，可用应用由服务器按账号授权。</p>
    <form className="visitor-login-form" onSubmit={submit}>
      <span className="visitor-login-legend">凭据 / CREDENTIALS</span>
      <div className="visitor-login-field">
        <label htmlFor="visitor-name"><span>访客名</span><small>GUEST NAME</small></label>
        <input id="visitor-name" className="inset-panel" value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" maxLength={64} disabled={!isReady || busy} />
      </div>
      <div className="visitor-login-field">
        <label htmlFor="visitor-password"><span>密码</span><small>PASSPHRASE</small></label>
        <input id="visitor-password" type="password" className="inset-panel" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" maxLength={200} disabled={!isReady || busy} />
      </div>
      <button type="submit" className="pixel-button visitor-login-submit" disabled={!isReady || busy || !username.trim() || !password}>{busy ? '正在验证…' : '登 录'}</button>
    </form>
    {/* 出错时用提示条替换页脚说明，提示条才不会被挤出窗口。 */}
    {error ? <p className="visitor-login-error" role="alert">{error}</p> : <p className="visitor-login-footnote">密码只在提交时交给服务器校验，不会保存在这个浏览器里；忘记凭据请联系 Marcus。</p>}
  </div>
}
