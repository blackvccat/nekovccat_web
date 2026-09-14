'use client'

import { useId } from 'react'
import PixelIcon from './harbor-pixel-icon'
import { MUSIC_PROVIDERS as PROVIDERS, MusicPlayerSlot, useMusicSession } from '@/components/music/music-session'
import './music-app.css'
import './desktop-software.css'

export default function MusicApp({ playerLayer = 80, active = true, onActivate }: { playerLayer?: number; active?: boolean; onActivate?: () => void }) {
  const { provider, input, current, favoriteName, error, notice, library, ready, setInput, setFavoriteName,
    load, stop, switchProvider, saveFavorite, removeFavorite, playerStatus, reloadPlayer } = useMusicSession()
  const instance = useId()
  const shareId = `${instance}-music-share-link`
  const favoriteId = `${instance}-music-favorite-name`

  return <div className="music-app">
    <div className="music-heading">
      <PixelIcon name="music" size={48} />
      <div><span className="eyebrow">A SOUNDTRACK FOR YOUR LITTLE WORLD.</span><h2>NEKO mixtape<span>VOL. 01</span></h2></div>
      <span className="music-stereo" aria-hidden="true">STEREO<br />▂ ▄ ▆ ▄ ▂</span>
    </div>

    <div className="music-sources" aria-label="音乐平台">{(['netease', 'spotify'] as const).map(source => <button type="button" key={source} className={`pixel-button music-source ${provider === source ? 'pressed' : ''}`} aria-pressed={provider === source} onClick={() => switchProvider(source)}><span className={`music-provider-dot ${source}`} />{PROVIDERS[source].name}</button>)}</div>

    <section className="music-account-entry" aria-label="音乐账户登录"><a className="pixel-button" href={provider === 'netease' ? 'https://music.163.com/' : 'https://accounts.spotify.com/login'} target="_blank" rel="noopener noreferrer">登录我的{PROVIDERS[provider].name}账户 ↗</a><p>在平台官方页面完成登录。本站不接收密码或登录 Cookie；官方嵌入播放器不保证继承会员权限，会员歌曲请在原平台播放。</p></section>

    <form className="music-link-form" onSubmit={event => { event.preventDefault(); load(input) }}>
      <label htmlFor={shareId}>{provider === 'netease' ? '粘贴网易云歌曲或歌单的分享链接' : '粘贴 Spotify 歌曲、专辑、歌单或播客链接'}</label>
      <div className="music-input-row"><input id={shareId} type="text" inputMode="url" autoComplete="off" spellCheck={false} value={input} placeholder={PROVIDERS[provider].placeholder} onChange={event => setInput(event.target.value)} /><button type="submit" className="pixel-button" disabled={!ready || !input.trim()}>加载 ↵</button></div>
      <div className="music-source-help"><span>{provider === 'netease' ? '网易云支持歌曲、歌单完整链接' : 'Spotify 支持歌曲、专辑、歌单和播客'}</span><a href={PROVIDERS[provider].url} target="_blank" rel="noopener noreferrer">去找音乐 ↗</a></div>
    </form>

    {error && <p className="music-error" role="alert">{error}</p>}

    {current ? <section className="music-player-panel" aria-label={`${PROVIDERS[current.provider].name}播放器`}>
      <div className="music-player-caption"><span><span className={`music-provider-dot ${current.provider}`} />{PROVIDERS[current.provider].name} · 官方播放器</span><button type="button" className="text-button" onClick={stop}>停止播放</button></div>
      <a className="music-open-original pixel-button" href={current.url} target="_blank" rel="noopener noreferrer">在{PROVIDERS[current.provider].name}打开 ↗</a>
      <div className="music-player-status" role="status" aria-live="polite">
        {playerStatus === 'loading' && <span>正在打开官方播放器…</span>}
        {playerStatus === 'loaded' && <span>官方播放器页面已载入，请使用其中的播放按钮。</span>}
        {playerStatus === 'slow' && <><span>播放器加载较慢，可以重新加载或在原平台打开。</span><button type="button" className="text-button" onClick={reloadPlayer}>重新加载</button></>}
      </div>
      <div className={`music-frame ${current.provider}`}>
        <MusicPlayerSlot height={current.height} layer={playerLayer} active={active} onActivate={onActivate} />
      </div>
      <form className="music-save-form" onSubmit={event => { event.preventDefault(); saveFavorite() }}><label htmlFor={favoriteId}>收藏名称</label><div className="music-input-row"><input id={favoriteId} maxLength={60} value={favoriteName} onChange={event => setFavoriteName(event.target.value)} /><button type="submit" className="pixel-button" disabled={!ready}>☆ 收藏</button></div></form>
    </section> : <div className="music-empty inset-panel">
      <div className="pixel-cassette" aria-hidden="true"><div className="cassette-label"><span>NEKO / SIDE A</span><span>MY FAVORITE SONGS</span></div><div className="cassette-reels"><i /><span /><i /></div><div className="cassette-bottom" /></div>
      <h3>把喜欢的音乐，带进这个小世界。</h3>
      <p>从原平台复制分享链接，粘贴到上面就可以加载。</p>
      <div className="music-example-actions">{provider === 'netease' ? <button type="button" className="pixel-button" onClick={() => load('https://music.163.com/playlist?id=3778678', '网易云热歌榜')}>试试网易云热歌榜 ↗</button> : <button type="button" className="pixel-button" onClick={() => load('https://open.spotify.com/playlist/3cEYpjA9oz9GiPac4AsH4n', 'Spotify 示例歌单')}>试试 Spotify 示例歌单 ↗</button>}</div>
    </div>}

    <p className="music-notice" role="status">{notice || '站内切页、收起面板或最小化，音乐都会保留。'}</p>

    <section className="music-library" aria-label="音乐收藏">
      <div className="music-library-heading"><h3>MY COLLECTION <span>常听收藏</span></h3><span>{library.length} / 20</span></div>
      {library.length ? <ul>{library.map(saved => <li key={saved.item.url} className={current?.url === saved.item.url ? 'selected' : ''}><button type="button" className="music-library-load" onClick={() => load(saved.item.url, saved.name)} aria-label={`加载收藏 ${saved.name}`}><PixelIcon name="music" size={25} /><span><strong>{saved.name}</strong><small>{PROVIDERS[saved.item.provider].name}</small></span><span aria-hidden="true">↗</span></button><button type="button" className="music-remove" aria-label={`移除收藏 ${saved.name}`} onClick={() => removeFavorite(saved.item.url)}>×</button></li>)}</ul> : <p className="music-library-empty">还没有收藏。加载一首歌后，把它留在这里。</p>}
    </section>
    <p className="music-platform-note">播放范围由平台版权、地区及登录状态决定。若播放器空白或无法播放，请在原平台打开。</p>
  </div>
}
