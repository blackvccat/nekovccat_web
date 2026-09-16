import assert from 'node:assert/strict'
import test from 'node:test'
import { DEFAULT_SETTINGS, SCANLINE_WIDTHS, WALLPAPERS, WALLPAPER_MOTIONS, readDesktopSettings, resolveScanlineWidth } from '../src/lib/desktop-settings'

test('a fresh browser gets the defaults', () => {
  assert.deepEqual(readDesktopSettings(null), DEFAULT_SETTINGS)
  assert.deepEqual(readDesktopSettings(undefined), DEFAULT_SETTINGS)
})

test('a save written before a later setting existed keeps the older choices and gains the defaults', () => {
  // 旧存档缺 theme 与 wallpaperMotion：读完必须补齐，否则设置面板会一个档位都不选中。
  assert.deepEqual(readDesktopSettings({ wallpaper: 'island', scanlines: true }), {
    theme: 'light', wallpaper: 'island', wallpaperMotion: 'auto', scanlines: true, scanlineWidth: 'auto',
  })
  assert.deepEqual(readDesktopSettings({ wallpaper: 'night-harbor', scanlines: false }), {
    theme: 'light', wallpaper: 'night-harbor', wallpaperMotion: 'auto', scanlines: false, scanlineWidth: 'auto',
  })
})

test('an explicit static choice survives persistence and unknown keys are dropped', () => {
  const saved = JSON.parse('{"wallpaper":"night-harbor","wallpaperMotion":"off","scanlines":false,"extra":1}')
  assert.deepEqual(readDesktopSettings(saved), { theme: 'light', wallpaper: 'night-harbor', wallpaperMotion: 'off', scanlines: false, scanlineWidth: 'auto' })
})

test('one corrupt field does not throw away the visitor\u2019s other choices', () => {
  assert.deepEqual(readDesktopSettings({ wallpaper: 'night-harbor', wallpaperMotion: ['on'], scanlines: 'false' }), {
    theme: 'light', wallpaper: 'night-harbor', wallpaperMotion: 'auto', scanlines: false, scanlineWidth: 'auto',
  })
  assert.deepEqual(readDesktopSettings({ wallpaper: ['island'], wallpaperMotion: 'off', scanlines: true, theme: 'dark' }), {
    theme: 'dark', wallpaper: DEFAULT_SETTINGS.wallpaper, wallpaperMotion: 'off', scanlines: true, scanlineWidth: 'auto',
  })
})

test('nothing from storage can become a wallpaper class or a motion flag', () => {
  assert.deepEqual(readDesktopSettings({ wallpaper: 'unknown' }).wallpaper, DEFAULT_SETTINGS.wallpaper)
  assert.deepEqual(readDesktopSettings({ wallpaper: '../visitor' }).wallpaper, DEFAULT_SETTINGS.wallpaper)
  assert.deepEqual(readDesktopSettings('night-harbor').wallpaper, DEFAULT_SETTINGS.wallpaper)
  assert.equal(readDesktopSettings({ wallpaper: 'cloud', wallpaperMotion: 'always' }).wallpaperMotion, 'auto')
})

test('scanline width defaults to auto and resolves per theme', () => {
  // 明亮默认细、暗色默认中（就是原来那组 2px / 4px）：1px 的细线压在近黑屏上看不见，
  // 但也不必一上来就用最粗的一档——粗留给想更明显的场合。
  assert.equal(DEFAULT_SETTINGS.scanlineWidth, 'auto')
  assert.equal(resolveScanlineWidth({ scanlineWidth: 'auto', theme: 'light' }), 'thin')
  assert.equal(resolveScanlineWidth({ scanlineWidth: 'auto', theme: 'dark' }), 'medium')
  for (const width of ['thin', 'medium', 'coarse'] as const) {
    assert.equal(resolveScanlineWidth({ scanlineWidth: width, theme: 'light' }), width)
    assert.equal(resolveScanlineWidth({ scanlineWidth: width, theme: 'dark' }), width)
  }
})

test('a save from before the width option existed keeps the rest and gains auto', () => {
  assert.deepEqual(readDesktopSettings({ theme: 'dark', scanlines: true }), {
    theme: 'dark', wallpaper: DEFAULT_SETTINGS.wallpaper, wallpaperMotion: 'auto', scanlines: true, scanlineWidth: 'auto',
  })
  assert.equal(readDesktopSettings({ scanlineWidth: 'fat' }).scanlineWidth, 'auto')
  assert.equal(readDesktopSettings({ scanlineWidth: ['coarse'] }).scanlineWidth, 'auto')
  for (const width of SCANLINE_WIDTHS) assert.equal(readDesktopSettings({ scanlineWidth: width.value }).scanlineWidth, width.value)
})

test('every offered wallpaper is accepted back and every id is unique', () => {
  // 清单是设置面板与读盘校验的唯一来源：两边共用一份，才不会出现「选了但存不回来」。
  const ids = WALLPAPERS.map(wallpaper => wallpaper.value)
  assert.equal(new Set(ids).size, ids.length)
  for (const id of ids) assert.equal(readDesktopSettings({ wallpaper: id }).wallpaper, id)
  assert.ok(ids.includes('night-harbor'))
  for (const wallpaper of WALLPAPERS) {
    assert.ok(wallpaper.title.length > 0 && wallpaper.caption.length > 0, `${wallpaper.value} is missing display copy`)
  }
  assert.ok(WALLPAPER_MOTIONS.some(motion => motion.value === 'auto'))
  assert.ok(ids.includes(DEFAULT_SETTINGS.wallpaper), 'the default must be one of the offered wallpapers')
  assert.ok(WALLPAPER_MOTIONS.some(motion => motion.value === DEFAULT_SETTINGS.wallpaperMotion))
})
