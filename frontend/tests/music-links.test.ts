import assert from 'node:assert/strict'
import test from 'node:test'
import { parseMusicLink, restoreMusicItems } from '../src/lib/music/links'

const spotifyId = '4cOdK2wGLETKBW3PvgPWqT'

test('Spotify share, locale, embed and URI links produce the same private-data-free source', () => {
  const expected = parseMusicLink(`https://open.spotify.com/track/${spotifyId}`)
  for (const value of [
    `https://open.spotify.com/intl-zh/track/${spotifyId}?si=secret&utm_source=copy-link`,
    `https://open.spotify.com/embed/track/${spotifyId}?theme=1#irrelevant`,
    `https://open.spotify.com/intl-en/embed/track/${spotifyId}/?user=private`,
    `spotify:track:${spotifyId}`,
    `推荐一首歌：https://open.spotify.com/track/${spotifyId}。快来听！`,
    `Listen here (https://open.spotify.com/track/${spotifyId}).`,
  ]) assert.deepEqual(parseMusicLink(value), expected)
  assert.equal(expected.embedUrl, `https://open.spotify.com/embed/track/${spotifyId}?theme=0`)
  assert.equal(expected.height, 152)
  assert.equal(expected.label, 'Spotify 歌曲 · …vgPWqT')
})

test('all supported Spotify media receive the right player height', () => {
  for (const type of ['track', 'album', 'playlist', 'artist', 'episode', 'show']) {
    const item = parseMusicLink(`spotify:${type}:${spotifyId}`)
    assert.equal(item.type, type)
    assert.equal(item.height, ['track', 'episode'].includes(type) ? 152 : 352)
    assert.equal(item.url, `https://open.spotify.com/${type}/${spotifyId}`)
  }
})

test('NetEase desktop, fragment, mobile and share sentences canonicalize safely', () => {
  const expected = parseMusicLink('https://music.163.com/song?id=1901371647')
  for (const value of [
    'http://music.163.com/song?id=1901371647&userid=private',
    'https://www.music.163.com/#/song?id=1901371647&app_version=9',
    'https://y.music.163.com/m/song?id=1901371647&uct2=secret',
    '分享歌曲： https://music.163.com/#/song?id=1901371647 （来自网易云音乐）',
    'https://music.163.com/song?id=0001901371647',
  ]) assert.deepEqual(parseMusicLink(value), expected)
  assert.equal(expected.url, 'https://music.163.com/song?id=1901371647')
  assert.equal(expected.embedUrl, 'https://music.163.com/outchain/player?type=2&id=1901371647&auto=0&height=66')
  assert.equal(expected.height, 86)
  assert.equal(expected.label, '网易云 歌曲 · 1901371647')
  const playlist = parseMusicLink('https://music.163.com/#/playlist?id=12345678901234567890')
  assert.equal(playlist.type, 'playlist')
  assert.equal(playlist.embedUrl, 'https://music.163.com/outchain/player?type=0&id=12345678901234567890&auto=0&height=430')
  assert.equal(playlist.height, 450)
})

test('unresolved short links explain how to get a full platform link', () => {
  for (const url of ['https://spotify.link/abcdef', 'http://163cn.tv/abcd', 'https://www.163cn.tv/abcd']) {
    assert.throws(() => parseMusicLink(url), /短链接.*完整链接/)
  }
})

test('rejects HTML, off-platform hosts, credentials, ports and URL normalization attacks', () => {
  for (const value of [
    `<iframe src="https://open.spotify.com/track/${spotifyId}"></iframe>`,
    `javascript:https://open.spotify.com/track/${spotifyId}`,
    `data:text/plain,https://open.spotify.com/track/${spotifyId}`,
    `https://evil.test/?https://open.spotify.com/track/${spotifyId}`,
    `https://open.spotify.com.evil.test/track/${spotifyId}`,
    `https://evil-open.spotify.com/track/${spotifyId}`,
    `https://open.spotify.com@evil.test/track/${spotifyId}`,
    `https://user:pass@open.spotify.com/track/${spotifyId}`,
    `https://open.spotify.com:8080/track/${spotifyId}`,
    `https://open.spotify.com./track/${spotifyId}`,
    `https://%6fpen.spotify.com/track/${spotifyId}`,
    `https://open.spotify.com/a/../track/${spotifyId}`,
    `https://open.spotify.com/%74rack/${spotifyId}`,
    `https://open.spotify.com/track/${spotifyId}/extra`,
    `https://open.spotify.com\\@evil.test/track/${spotifyId}`,
    `http://open.spotify.com/track/${spotifyId}`,
    `https://open.spotify.com/track/${spotifyId.slice(1)}`,
    'spotify:user:some-user',
    '//music.163.com/song?id=1',
    'https://music.163.com.evil.test/song?id=1',
    'https://music.163.com/a/../song?id=1',
    'https://music.163.com/%73ong?id=1',
    'https://music.163.com/song/extra?id=1',
    'https://music.163.com/outchain/player?type=2&id=1',
    'https://music.163.com/song?id=1 https://music.163.com/song?id=2',
  ]) assert.throws(() => parseMusicLink(value), Error, value)
})

test('NetEase IDs cannot be absent, ambiguous, encoded or nonpositive', () => {
  for (const suffix of [
    '', '?foo=1', '?id=', '?id=0', '?id=000', '?id=-1', '?id=1.5', '?id=1e9',
    '?id=123456789012345678901', '?id=1&id=2', '?id=1&id=1', '?id=%31',
    '?%69d=1', '?id=1&%69d=2', '?id=1=2', '?id=1%26other=2',
  ]) assert.throws(() => parseMusicLink(`https://music.163.com/song${suffix}`), Error, suffix)
  for (const url of [
    'https://music.163.com/song?id=1#/playlist?id=2',
    'https://music.163.com/?id=1#/playlist?id=2',
    'https://music.163.com/#/song?id=1#/playlist?id=2',
  ]) assert.throws(() => parseMusicLink(url), Error, url)
})

test('stored libraries rebuild allowlisted players, deduplicate canonical URLs and ignore malformed entries', () => {
  const result = restoreMusicItems([
    null, false, 1, {}, [], { url: 'javascript:alert(1)' },
    { url: `spotify:track:${spotifyId}`, name: '  我喜欢的歌  ', provider: 'evil', embedUrl: 'https://evil.test/player', height: 99999 },
    { url: `https://open.spotify.com/intl-zh/track/${spotifyId}?si=secret`, name: 'duplicate' },
    { url: 'https://music.163.com/song?id=000123', name: '   ' },
    { url: 'https://music.163.com/song?id=123', name: 'duplicate' },
    { url: 'https://music.163.com/playlist?id=456', name: 999 },
  ])
  assert.equal(result.length, 3)
  assert.equal(result[0].name, '我喜欢的歌')
  assert.equal(result[0].item.provider, 'spotify')
  assert.equal(result[0].item.height, 152)
  assert.ok(result[0].item.embedUrl.startsWith('https://open.spotify.com/embed/track/'))
  assert.equal(result[1].name, '网易云 歌曲 · 123')
  assert.equal(result[2].name, '网易云 歌单 · 456')
})

test('stored libraries are bounded and names preserve Unicode characters within 60 characters', () => {
  for (const value of [null, undefined, {}, '[]', 3]) assert.deepEqual(restoreMusicItems(value), [])
  const result = restoreMusicItems(Array.from({ length: 100 }, (_, index) => ({
    url: `https://music.163.com/song?id=${index + 1}`,
    name: '\u0000' + '🎵'.repeat(70),
  })))
  assert.equal(result.length, 20)
  assert.equal(result[0].name, '🎵'.repeat(60))
  assert.equal(result[19].item.id, '20')
})
