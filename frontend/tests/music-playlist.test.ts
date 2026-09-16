import assert from 'node:assert/strict'
import test from 'node:test'
import { PLAYLIST_TRACK_LIMIT, fetchPlaylist, formatDuration, playlistSongUrl, restorePlaylistTracks } from '../src/lib/music/playlist'
import { parseMusicLink } from '../src/lib/music/links'

const track = (over: Record<string, unknown> = {}) => ({ id: '1000', name: '歌名', artists: '歌手', album: '专辑', durationMs: 210461, ...over })

test('曲目列表只留下干净的形状，坏条目整条丢掉', () => {
  const tracks = restorePlaylistTracks([
    null, 'x', 7, [], {},
    track({ id: 1000 }),                          // id 必须是字符串
    track({ id: '10a' }),                          // 非纯数字：会被拼进播放器地址，直接丢
    track({ id: 'https://evil.test/x' }),
    track({ name: '   ' }),                        // 没名字
    track({ id: '1001', name: '  晚风  ', artists: 'A / B', durationMs: -5 }),
    track({ id: '1001', name: '重复的 id' }),
    track({ id: '1002', name: '第三首', durationMs: Number.POSITIVE_INFINITY }),
  ])
  assert.equal(tracks.length, 2)
  assert.deepEqual(tracks[0], { id: '1001', name: '晚风', artists: 'A / B', album: '专辑', durationMs: 0 })
  assert.equal(tracks[1].durationMs, 0)
  assert.equal(restorePlaylistTracks({ tracks: [] }).length, 0)
})

test('曲目数封顶 50，超长文字被截断', () => {
  const many = restorePlaylistTracks(Array.from({ length: 80 }, (_, index) => track({ id: String(index + 1), name: `第 ${index + 1} 首` })))
  assert.equal(many.length, PLAYLIST_TRACK_LIMIT)
  const long = restorePlaylistTracks([track({ name: '长'.repeat(400) })])
  assert.equal(Array.from(long[0].name).length, 120)
})

test('时长显示成 m:ss', () => {
  assert.equal(formatDuration(210461), '3:30')
  assert.equal(formatDuration(59000), '0:59')
  assert.equal(formatDuration(0), '--:--')
  assert.equal(formatDuration(Number.NaN), '--:--')
})

test('列表里的歌拼出来的地址能通过链接校验', () => {
  const item = parseMusicLink(playlistSongUrl('1901371647'))
  assert.equal(item.provider, 'netease')
  assert.equal(item.type, 'song')
  assert.equal(item.height, 86)
})

test('取歌单：成功返回列表，失败给出可以直接显示的原因', async () => {
  const original = globalThis.fetch
  const calls: string[] = []
  const stub = (handler: () => Response) => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      calls.push(String(input))
      return handler()
    }) as typeof fetch
  }
  try {
    stub(() => new Response(JSON.stringify({ id: '3778678', name: '热歌榜', total: 200, tracks: [track()] }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    const page = await fetchPlaylist('3778678')
    assert.equal(page.name, '热歌榜')
    assert.equal(page.total, 200)
    assert.equal(page.tracks.length, 1)
    assert.match(calls[0], /^\/api\/music\/playlist\?id=3778678&limit=50$/)

    stub(() => new Response(JSON.stringify({ detail: '暂时拿不到这个歌单，请稍后再试。' }), { status: 503 }))
    await assert.rejects(() => fetchPlaylist('3778678'), /暂时拿不到这个歌单/)

    stub(() => new Response('<html>502</html>', { status: 502 }))
    await assert.rejects(() => fetchPlaylist('3778678'), /暂时拿不到这个歌单/)

    stub(() => { throw new TypeError('Failed to fetch') })
    await assert.rejects(() => fetchPlaylist('3778678'), /fetch/)
  } finally {
    globalThis.fetch = original
  }
})
