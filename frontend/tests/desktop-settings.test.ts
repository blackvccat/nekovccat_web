import assert from 'node:assert/strict'
import test from 'node:test'
import { DEFAULT_SETTINGS, readDesktopSettings } from '../src/components/my-world/desktop-config'

test('new visitors get Night Harbor with automatic motion', () => {
  assert.deepEqual(readDesktopSettings(null), { wallpaper: 'night-harbor', wallpaperMotion: 'auto', scanlines: false })
})

test('legacy saved wallpaper and scanlines survive the added motion preference', () => {
  assert.deepEqual(readDesktopSettings({ wallpaper: 'island', scanlines: true }), {
    wallpaper: 'island', wallpaperMotion: 'auto', scanlines: true,
  })
})

test('explicit static mode survives persistence and restores only supported fields', () => {
  assert.deepEqual(readDesktopSettings(JSON.parse('{"wallpaper":"night-harbor","wallpaperMotion":"off","scanlines":false,"extra":1}')), {
    wallpaper: 'night-harbor', wallpaperMotion: 'off', scanlines: false,
  })
})

test('invalid preference shapes cannot become wallpaper classes or motion flags', () => {
  assert.deepEqual(readDesktopSettings({ wallpaper: ['island'], wallpaperMotion: ['on'], scanlines: 'false' }), DEFAULT_SETTINGS)
  assert.deepEqual(readDesktopSettings({ wallpaper: 'unknown', wallpaperMotion: true }), DEFAULT_SETTINGS)
})
