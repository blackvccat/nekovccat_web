'use client'

import { useEffect, useId, useRef, useState } from 'react'
import PixelIcon from './pixel-icon'
import { MUSIC_PROVIDERS as PROVIDERS, MusicPlayerSlot, useMusicSession } from '@/components/music/music-session'
import { marcusFavorites } from '@/lib/music/favorites'
import { PLAYLIST_TRACK_LIMIT, fetchPlaylist, formatDuration, playlistSongUrl, type PlaylistPage } from '@/lib/music/playlist'
import './music-app.css'
import './desktop-software.css'

/** 歌单是构建时从 marcus-favorites.json 读进来的静态数据，不需要请求后端。 */
const MARCUS_SONGS = marcusFavorites()

type PlaylistState = { status: 'idle' | 'loading' | 'ready' | 'error'; data: PlaylistPage | null; message: string }

/** 取网易云歌单的前 N 首：换歌单时取消上一次请求，避免旧结果盖住新列表。 */
function usePlaylist(playlistId: string | null): PlaylistState {
  const [state, setState] = useState<PlaylistState>({ status: 'idle', data: null, message: '' })
  useEffect(() => {
    if (!playlistId) return
    const controller = new AbortController()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 换歌单先回到「加载中」，不要让上一个歌单的曲目留在屏幕上。
    setState({ status: 'loading', data: null, message: '' })
    fetchPlaylist(playlistId, controller.signal)
      .then(data => setState({ status: 'ready', data, message: '' }))
      .catch(error => {
        if (controller.signal.aborted) return
        setState({ status: 'error', data: null, message: error instanceof Error ? error.message : '暂时拿不到这个歌单。' })
      })
    return () => controller.abort()
  }, [playlistId])
  return state
}

export default function MusicApp({ playerLayer = 80, active = true, onActivate, playlistOpen = false, onTogglePlaylist }: {
  playerLayer?: number; active?: boolean; onActivate?: () => void
  playlistOpen?: boolean; onTogglePlaylist?: (next: boolean) => void
}) {
  const { provider, input, current, favoriteName, error, notice, library, ready, setInput, setFavoriteName,
    load, stop, switchProvider, saveFavorite, removeFavorite } = useMusicSession()
  const instance = useId()
  const shareId = `${instance}-music-share-link`
  const favoriteId = `${instance}-music-favorite-name`
  const playlistId = `${instance}-music-playlist`
  const appRef = useRef<HTMLDivElement>(null)
  const [playlistSource, setPlaylistSource] = useState<{ id: string; name: string } | null>(null)
  const playlist = usePlaylist(playlistSource?.id ?? null)
  // 网易云歌单：曲目由我们自己列，就不加载官方播放器（它只列 10 首）；列表拿不到时才退回官方播放器。
  const showEmbed = !(current?.provider === 'netease' && current.type === 'playlist') || playlist.status === 'error'

  useEffect(() => {
    // 从歌单里点歌之后 current 会变成单曲，但来源歌单要记住，列表才不会跟着消失。
    if (current?.provider === 'netease' && current.type === 'playlist') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 记住来源歌单，点进单曲后列表仍然留着。
      setPlaylistSource({ id: current.id, name: current.label })
    }
  }, [current])

  /** 点一首歌之后把播放器挪进视野：只滚最近的滚动容器，不整页跳。 */
  const revealPlayer = () => requestAnimationFrame(() => {
    const slot = appRef.current?.querySelector<HTMLElement>('.music-player-slot')
    if (!slot) return
    for (let node = slot.parentElement; node; node = node.parentElement) {
      const style = getComputedStyle(node)
      if (!/(auto|scroll)/.test(`${style.overflowX} ${style.overflowY}`)) continue
      const box = node.getBoundingClientRect()
      const own = slot.getBoundingClientRect()
      if (own.bottom > box.bottom) node.scrollTop += own.bottom - box.bottom
      else if (own.top < box.top) node.scrollTop += own.top - box.top
      return
    }
  })

  return <div ref={appRef} className={`music-app ${playlistOpen ? 'playlist-open' : ''}`}>
    <div className="music-main">
      <div className="music-heading">
        <PixelIcon name="music" size={48} />
        <div><span className="eyebrow">A SOUNDTRACK FOR YOUR LITTLE WORLD.</span><h2>MARCUS mixtape<span>VOL. 01</span></h2></div>
        <div className="music-heading-side">
          <span className="music-stereo" aria-hidden="true">STEREO<br />▂ ▄ ▆ ▄ ▂</span>
          {/* 只有桌面窗口会传 onTogglePlaylist：没有窗口可以撑宽的宿主（站内浮动面板）就不显示这个开关。 */}
          {onTogglePlaylist && <button type="button" className="pixel-button music-playlist-toggle" aria-expanded={playlistOpen} aria-controls={playlistId} onClick={() => onTogglePlaylist(!playlistOpen)}>
            {playlistOpen ? '▤ 收起歌单' : `▤ 歌单 · ${MARCUS_SONGS.length}`}
          </button>}
        </div>
      </div>

      <div className="music-sources" aria-label="音乐平台">{(['netease', 'spotify'] as const).map(source => <button type="button" key={source} className={`pixel-button music-source ${provider === source ? 'pressed' : ''}`} aria-pressed={provider === source} onClick={() => switchProvider(source)}><span className={`music-provider-dot ${source}`} />{PROVIDERS[source].name}</button>)}</div>

      <section className="music-account-entry" aria-label="音乐账户登录"><a className="pixel-button" href={provider === 'netease' ? 'https://music.163.com/' : 'https://accounts.spotify.com/login'} target="_blank" rel="noopener noreferrer">登录我的{PROVIDERS[provider].name}账户 ↗</a><p>在平台官方页面完成登录。本站不接收密码或登录 Cookie；官方嵌入播放器不保证继承会员权限，会员歌曲请在原平台播放。</p></section>

      <form className="music-link-form" onSubmit={event => { event.preventDefault(); load(input); revealPlayer() }}>
        <label htmlFor={shareId}>{provider === 'netease' ? '粘贴网易云歌曲或歌单的分享链接' : '粘贴 Spotify 歌曲、专辑、歌单或播客链接'}</label>
        <div className="music-input-row"><input id={shareId} type="text" inputMode="url" autoComplete="off" spellCheck={false} value={input} placeholder={PROVIDERS[provider].placeholder} onChange={event => setInput(event.target.value)} /><button type="submit" className="pixel-button" disabled={!ready || !input.trim()}>加载 ↵</button></div>
        <div className="music-source-help"><span>{provider === 'netease' ? '网易云支持歌曲、歌单完整链接' : 'Spotify 支持歌曲、专辑、歌单和播客'}</span><a href={PROVIDERS[provider].url} target="_blank" rel="noopener noreferrer">去找音乐 ↗</a></div>
      </form>

      {error && <p className="music-error" role="alert">{error}</p>}

      {current ? <section className="music-player-panel" aria-label={showEmbed ? `${PROVIDERS[current.provider].name}播放器` : '歌单曲目'}>
        <div className="music-player-caption"><span><span className={`music-provider-dot ${current.provider}`} />{PROVIDERS[current.provider].name} · {showEmbed ? '官方播放器' : '歌单'}</span><button type="button" className="text-button" onClick={stop}>{showEmbed ? '停止播放' : '清空'}</button></div>
        <a className="music-open-original pixel-button" href={current.url} target="_blank" rel="noopener noreferrer">在{PROVIDERS[current.provider].name}打开 ↗</a>
        {showEmbed && <div className={`music-frame ${current.provider}`}>
          <MusicPlayerSlot height={current.height} layer={playerLayer} active={active} onActivate={onActivate} />
        </div>}
        <form className="music-save-form" onSubmit={event => { event.preventDefault(); saveFavorite() }}><label htmlFor={favoriteId}>收藏名称</label><div className="music-input-row"><input id={favoriteId} maxLength={60} value={favoriteName} onChange={event => setFavoriteName(event.target.value)} /><button type="submit" className="pixel-button" disabled={!ready}>☆ 收藏</button></div></form>
      </section> : <div className="music-empty inset-panel">
        <div className="pixel-cassette" aria-hidden="true"><div className="cassette-label"><span>MARCUS / SIDE A</span><span>MY FAVORITE SONGS</span></div><div className="cassette-reels"><i /><span /><i /></div><div className="cassette-bottom" /></div>
        <h3>把喜欢的音乐，带进这个小世界。</h3>
        <p>从原平台复制分享链接，粘贴到上面就可以加载。桌面上的 MARCUS Music 还能点开右边那份歌单。</p>
        <div className="music-example-actions">{provider === 'netease' ? <button type="button" className="pixel-button" onClick={() => { load('https://music.163.com/playlist?id=3778678', '网易云热歌榜'); revealPlayer() }}>试试网易云热歌榜 ↗</button> : <button type="button" className="pixel-button" onClick={() => { load('https://open.spotify.com/playlist/3cEYpjA9oz9GiPac4AsH4n', 'Spotify 示例歌单'); revealPlayer() }}>试试 Spotify 示例歌单 ↗</button>}</div>
      </div>}

      {playlist.status !== 'idle' && <section className="music-tracks" aria-label="歌单曲目">
        <div className="music-tracks-head">
          <h3>歌单曲目<span>{playlist.data ? `前 ${playlist.data.tracks.length} 首 · 歌单共 ${playlist.data.total} 首` : ''}</span></h3>
          <small>网易云播放器自己只列 10 首，这里补到 {PLAYLIST_TRACK_LIMIT} 首：点哪首就用官方播放器播哪首。</small>
        </div>
        {playlist.status === 'loading' && <p className="music-tracks-empty">正在取歌单曲目…</p>}
        {playlist.status === 'error' && <p className="music-tracks-empty">{playlist.message}</p>}
        {playlist.status === 'ready' && playlist.data && (playlist.data.tracks.length ? <ol className="music-tracks-list">{playlist.data.tracks.map((track, index) => {
          const playing = current?.type === 'song' && current.id === track.id
          return <li key={track.id} className={playing ? 'selected' : ''}>
            <button type="button" className="music-tracks-item" aria-current={playing ? 'true' : undefined} onClick={() => { load(playlistSongUrl(track.id), track.name, true); revealPlayer() }}>
              <span className="music-tracks-index">{String(index + 1).padStart(2, '0')}</span>
              <span className="music-tracks-text"><strong>{track.name}</strong><small>{track.artists}{track.album ? ` · ${track.album}` : ''}</small></span>
              <span className="music-tracks-time">{playing ? '▶' : formatDuration(track.durationMs)}</span>
            </button>
          </li>
        })}</ol> : <p className="music-tracks-empty">这个歌单没有公开曲目：私密、付费或已下架的歌单拿不到列表，请到原平台播放。</p>)}
      </section>}

      <p className="music-notice" role="status">{notice || '站内切页、收起面板或最小化，音乐都会保留。'}</p>

      <section className="music-library" aria-label="音乐收藏">
        <div className="music-library-heading"><h3>MY COLLECTION <span>常听收藏</span></h3><span>{library.length} / 20</span></div>
        {library.length ? <ul>{library.map(saved => <li key={saved.item.url} className={current?.url === saved.item.url ? 'selected' : ''}><button type="button" className="music-library-load" onClick={() => { load(saved.item.url, saved.name); revealPlayer() }} aria-label={`加载收藏 ${saved.name}`}><PixelIcon name="music" size={25} /><span><strong>{saved.name}</strong><small>{PROVIDERS[saved.item.provider].name}</small></span><span aria-hidden="true">↗</span></button><button type="button" className="music-remove" aria-label={`移除收藏 ${saved.name}`} onClick={() => removeFavorite(saved.item.url)}>×</button></li>)}</ul> : <p className="music-library-empty">还没有收藏。加载一首歌后，把它留在这里。</p>}
      </section>
      <p className="music-platform-note">播放范围由平台版权、地区及登录状态决定。若播放器空白或无法播放，请在原平台打开。</p>
    </div>

    {playlistOpen && <aside id={playlistId} className="music-playlist" aria-label="歌单">
      <div className="music-playlist-head">
        <div><span className="eyebrow">MARCUS&apos;S PICKS</span><h3>歌单</h3></div>
        <button type="button" className="text-button" onClick={() => onTogglePlaylist?.(false)}>收起 ◂</button>
      </div>
      {MARCUS_SONGS.length ? <ul>{MARCUS_SONGS.map((song, index) => {
        const playing = current?.url === song.item.url
        return <li key={song.item.url} className={playing ? 'selected' : ''}>
          <button type="button" className="music-playlist-song" aria-current={playing ? 'true' : undefined} onClick={() => { load(song.item.url, song.name, true); revealPlayer() }}>
            <span className="music-playlist-index">{String(index + 1).padStart(2, '0')}</span>
            <span className="music-playlist-text"><strong>{song.name}</strong><small>{PROVIDERS[song.item.provider].name}{song.note ? ` · ${song.note}` : ''}</small></span>
            {playing ? <span className="music-playlist-playing" aria-hidden="true">▶</span> : <span className={`music-provider-dot ${song.item.provider}`} aria-hidden="true" />}
          </button>
        </li>
      })}</ul> : <p className="music-playlist-empty">歌单还是空的：在 marcus-favorites.json 里写几首歌，刷新页面就有。</p>}
    </aside>}
  </div>
}
