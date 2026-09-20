'use client'

/** Tomato Timer —— 一个「别人写的」示例应用，用来证明可搬运性。
 *
 *  它只依赖 `@/app-kit` 的公开契约：窗口能力（setPanel / onClose / closeSelf）、
 *  自己的偏好存储（readPreference / writePreference）、自带素材（asset）与主题 token。
 *  默认在 registry.json 里是**关闭**的；把它加进 `enabled` 就会出现在桌面上。
 */
import { useEffect, useRef, useState } from 'react'
import type { AppProps } from '@/app-kit'
import './app.css'

type Mode = 'work' | 'break'
const WORK_CHOICES = [15, 25, 50]
const BREAK_CHOICES = [5, 10]
const DEFAULT_WORK = 25
const DEFAULT_BREAK = 5

function clock(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function TomatoTimer({ host }: AppProps) {
  const [workMinutes, setWorkMinutes] = useState(() => host.readPreference('workMinutes', DEFAULT_WORK))
  const [breakMinutes, setBreakMinutes] = useState(() => host.readPreference('breakMinutes', DEFAULT_BREAK))
  const [mode, setMode] = useState<Mode>('work')
  const [remaining, setRemaining] = useState(() => host.readPreference('workMinutes', DEFAULT_WORK) * 60)
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(() => host.readPreference('completed', 0))

  const total = (mode === 'work' ? workMinutes : breakMinutes) * 60
  const progress = total > 0 ? 1 - remaining / total : 0

  /** 计时只在 running 时走；归零后的阶段切换放在计时器回调里，而不是 effect 体里。 */
  const remainingRef = useRef(remaining)
  useEffect(() => { remainingRef.current = remaining }, [remaining])

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      if (remainingRef.current > 1) { setRemaining(remainingRef.current - 1); return }
      if (mode === 'work') {
        setCompleted(value => { const next = value + 1; host.writePreference('completed', next); return next })
        setMode('break')
        setRemaining(breakMinutes * 60)
      } else {
        setMode('work')
        setRemaining(workMinutes * 60)
      }
    }, 1000)
    return () => window.clearInterval(id)
  }, [running, mode, breakMinutes, workMinutes, host])

  // 关窗时把当前进度落盘：下次打开接着走。
  useEffect(() => host.onClose(() => host.writePreference('remaining', remaining)), [host, remaining])

  const chooseWork = (minutes: number) => {
    setWorkMinutes(minutes)
    host.writePreference('workMinutes', minutes)
    if (mode === 'work') { setRunning(false); setRemaining(minutes * 60) }
  }
  const chooseBreak = (minutes: number) => {
    setBreakMinutes(minutes)
    host.writePreference('breakMinutes', minutes)
    if (mode === 'break') { setRunning(false); setRemaining(minutes * 60) }
  }
  const reset = () => { setRunning(false); setRemaining(total) }
  const skip = () => {
    setRunning(false)
    if (mode === 'work') { setMode('break'); setRemaining(breakMinutes * 60) }
    else { setMode('work'); setRemaining(workMinutes * 60) }
  }

  return <div className={`tomato-app ${host.panelOpen ? 'panel-open' : ''}`}>
    <div className="tomato-main">
      <div className="tomato-heading">
        {/* eslint-disable-next-line @next/next/no-img-element -- 自己画的像素素材，走 next/image 没有收益 */}
        <img className="pixel-icon" src={host.asset('tomato.svg')} width={44} height={44} alt="" aria-hidden="true" draggable={false} />
        <div><span className="eyebrow">A SMALL TIMER FOR BIG IDEAS.</span><h2>番茄钟<span>{mode === 'work' ? '专注中' : '休息一下'}</span></h2></div>
        <button type="button" className="pixel-button tomato-panel-toggle" aria-expanded={host.panelOpen} onClick={() => host.setPanel(!host.panelOpen)}>
          {host.panelOpen ? '▤ 收起设置' : '▤ 设置'}
        </button>
      </div>

      <div className={`tomato-dial ${mode}`} role="timer" aria-live="polite">
        <strong>{clock(remaining)}</strong>
        <div className="tomato-bar" aria-hidden="true"><span style={{ width: `${Math.round(progress * 100)}%` }} /></div>
        <small>{mode === 'work' ? '专注' : '休息'} · 本浏览器已完成 {completed} 段</small>
      </div>

      <div className="tomato-actions">
        <button type="button" className="pixel-button" onClick={() => setRunning(value => !value)}>{running ? '暂停' : '开始'}</button>
        <button type="button" className="pixel-button" onClick={reset}>重置</button>
        <button type="button" className="pixel-button" onClick={skip}>跳过 →</button>
      </div>
      <p className="tomato-note">计时只在这个窗口里进行；关掉窗口会停止，但进度与已完成段数会留在本浏览器。</p>
    </div>

    {host.panelOpen && <aside className="tomato-panel" aria-label="番茄钟设置">
      <div className="tomato-panel-head">
        <div><span className="eyebrow">TIMER SETTINGS</span><h3>时长</h3></div>
        <button type="button" className="text-button" onClick={() => host.setPanel(false)}>收起 ▸</button>
      </div>
      <section>
        <h4>专注时长</h4>
        <div className="tomato-choices">{WORK_CHOICES.map(minutes => <button type="button" key={minutes} className={`pixel-button ${workMinutes === minutes ? 'pressed' : ''}`} aria-pressed={workMinutes === minutes} onClick={() => chooseWork(minutes)}>{minutes} 分钟</button>)}</div>
      </section>
      <section>
        <h4>休息时长</h4>
        <div className="tomato-choices">{BREAK_CHOICES.map(minutes => <button type="button" key={minutes} className={`pixel-button ${breakMinutes === minutes ? 'pressed' : ''}`} aria-pressed={breakMinutes === minutes} onClick={() => chooseBreak(minutes)}>{minutes} 分钟</button>)}</div>
      </section>
      <div className="tomato-panel-foot">
        <p>已完成 <strong>{completed}</strong> 段专注。</p>
        <button type="button" className="text-button" onClick={() => { setCompleted(0); host.writePreference('completed', 0) }}>清空记录</button>
        <button type="button" className="pixel-button" onClick={host.closeSelf}>关闭窗口</button>
      </div>
    </aside>}
  </div>
}
