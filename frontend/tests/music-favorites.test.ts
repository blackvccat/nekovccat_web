import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { marcusFavorites } from '../src/lib/music/favorites'
import { parseMusicLink } from '../src/lib/music/links'

const file = new URL('../src/lib/music/marcus-favorites.json', import.meta.url)
const source = JSON.parse(readFileSync(file, 'utf8')) as { songs?: Array<{ name?: unknown; url?: unknown; note?: unknown }> }

test('歌单文件里的每一行都能解析成官方播放器地址', () => {
  assert.ok(Array.isArray(source.songs), 'marcus-favorites.json 需要一个 songs 数组')
  assert.ok(source.songs!.length > 0 && source.songs!.length <= 40)
  const seen = new Set<string>()
  for (const song of source.songs!) {
    assert.equal(typeof song.url, 'string', `这一行缺少 url：${JSON.stringify(song)}`)
    // 写错的链接在这里就报错，不用等页面上一声不响地少一行。
    const item = parseMusicLink(song.url as string)
    assert.equal(typeof song.name, 'string')
    assert.ok(Array.from((song.name as string).trim()).length > 0, 'name 不能为空')
    assert.ok(Array.from(song.name as string).length <= 60)
    assert.ok(song.note === undefined || Array.from(song.note as string).length <= 60)
    assert.ok(item.embedUrl.startsWith('https://'), '播放地址必须是 https')
    assert.ok(!seen.has(item.url), `重复的歌：${item.url}`)
    seen.add(item.url)
  }
})

test('marcusFavorites 去掉坏行与重复项，缺名字时用平台标签兜底', () => {
  const songs = marcusFavorites([
    null, 'x', 3, [], {},
    { url: 'javascript:alert(1)', name: '坏链接' },
    { url: 'https://example.com/song?id=1', name: '站外链接' },
    { url: 'https://music.163.com/song?id=000123' },
    { url: 'https://music.163.com/song?id=123', name: '  重复  ' },
    { url: 'spotify:track:4cOdK2wGLETKBW3PvgPWqT', name: '  🎵 晚安  ', note: '  夜里听  ' },
  ])
  assert.deepEqual(songs.map(song => song.name), ['网易云 歌曲 · 123', '🎵 晚安'])
  assert.equal(songs[1].note, '夜里听')
  assert.equal(songs[1].item.provider, 'spotify')
  assert.deepEqual(marcusFavorites({ songs: [] }), [], '不是数组就当空歌单')
  assert.deepEqual(marcusFavorites('nope'), [])
  assert.equal(marcusFavorites().length, source.songs!.length, '默认读的就是 marcus-favorites.json')
})

test('点歌单用的是自动播放地址，粘贴链接的地址保持不变', () => {
  const song = parseMusicLink('https://music.163.com/song?id=28191836')
  assert.equal(song.embedUrl, 'https://music.163.com/outchain/player?type=2&id=28191836&auto=0&height=66')
  assert.equal(song.autoplayUrl, 'https://music.163.com/outchain/player?type=2&id=28191836&auto=1&height=66')
  const playlist = parseMusicLink('https://music.163.com/playlist?id=3778678')
  assert.match(playlist.autoplayUrl, /^https:\/\/music\.163\.com\/outchain\/player\?type=0&id=3778678&auto=1&height=430$/)
  const spotify = parseMusicLink('spotify:playlist:3cEYpjA9oz9GiPac4AsH4n')
  assert.equal(spotify.autoplayUrl, 'https://open.spotify.com/embed/playlist/3cEYpjA9oz9GiPac4AsH4n?theme=0&autoplay=1')
  assert.equal(spotify.embedUrl, 'https://open.spotify.com/embed/playlist/3cEYpjA9oz9GiPac4AsH4n?theme=0')
})
