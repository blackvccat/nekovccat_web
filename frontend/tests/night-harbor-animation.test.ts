import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { allowsHarborMotion, harborCoverPlane, harborFrameAt, parseHarborManifest } from '../src/components/my-world/night-harbor-animation'
import { NIGHT_HARBOR_ASSETS } from '../src/components/my-world/night-harbor-assets'

const rawManifest = JSON.parse(readFileSync(new URL(`../public${NIGHT_HARBOR_ASSETS.manifest}`, import.meta.url), 'utf8'))
const manifest = parseHarborManifest(rawManifest)

test('cover plane matches the authored 3:2 image at wide desktop, exact ratio and tall mobile sizes', () => {
  assert.deepEqual(harborCoverPlane(900, 600, 1536, 1024), { width: 900, height: 600, left: 0, top: 0 })
  assert.deepEqual(harborCoverPlane(1200, 600, 1536, 1024), { width: 1200, height: 800, left: 0, top: -200 })
  assert.deepEqual(harborCoverPlane(390, 700, 1536, 1024), { width: 1050, height: 700, left: -660, top: 0 })
  for (const width of [0, -1, NaN, Infinity]) assert.equal(harborCoverPlane(width, 600, 1536, 1024), null)
})

test('right-bottom alignment keeps a patch attached during portrait to landscape resize', () => {
  for (const [width, height] of [[390, 700], [812, 440], [1536, 1024], [700, 390]]) {
    const plane = harborCoverPlane(width, height, manifest.width, manifest.height)!
    assert.equal(plane.left + plane.width, width)
    assert.equal(plane.top + plane.height, height)
    assert.ok(plane.width >= width && plane.height >= height)
    assert.equal(plane.width / plane.height, 1.5)
  }
})

test('cat tail timing preserves its long rest and short motion frames at exact boundaries', () => {
  const tail = manifest.regions.find(region => region.id === 'cat-tail')!
  assert.equal(tail.loopDuration, 6800)
  assert.deepEqual(harborFrameAt(tail, 0), { index: 0, delay: 3200 })
  assert.deepEqual(harborFrameAt(tail, 3199.5), { index: 0, delay: 0.5 })
  assert.deepEqual(harborFrameAt(tail, 3200), { index: 1, delay: 140 })
  assert.deepEqual(harborFrameAt(tail, 3340), { index: 2, delay: 140 })
  assert.deepEqual(harborFrameAt(tail, 5300), { index: 16, delay: 1500 })
  assert.deepEqual(harborFrameAt(tail, 6800), { index: 0, delay: 3200 })
  assert.deepEqual(harborFrameAt(tail, 6800 * 10000 + 3200), { index: 1, delay: 140 })
})

test('all real regions schedule their next boundary and preserve independent periods', () => {
  assert.equal(manifest.regions.length, 8)
  for (const region of manifest.regions) {
    let boundary = 0
    for (let index = 0; index < region.frames.length; index += 1) {
      assert.deepEqual(harborFrameAt(region, boundary), { index, delay: region.frames[index].duration })
      const halfway = harborFrameAt(region, boundary + region.frames[index].duration / 2)
      assert.equal(halfway.index, index)
      assert.equal(halfway.delay, region.frames[index].duration / 2)
      boundary += region.frames[index].duration
    }
    assert.equal(harborFrameAt(region, boundary).index, 0)
  }
})

test('negative phase offsets wrap without selecting an invalid frame', () => {
  const tail = { ...manifest.regions.find(region => region.id === 'cat-tail')!, offset: -100 }
  assert.deepEqual(harborFrameAt(tail, 0), { index: 16, delay: 100 })
  assert.deepEqual(harborFrameAt(tail, 100), { index: 0, delay: 3200 })
})

test('auto protects mobile, coarse pointer and save-data while on still honors reduced motion', () => {
  const normal = { reduced: false, narrow: false, coarse: false, saveData: false }
  assert.equal(allowsHarborMotion('auto', normal), true)
  assert.equal(allowsHarborMotion('off', normal), false)
  for (const setting of ['narrow', 'coarse', 'saveData'] as const) {
    assert.equal(allowsHarborMotion('auto', { ...normal, [setting]: true }), false)
    assert.equal(allowsHarborMotion('on', { ...normal, [setting]: true }), true)
  }
  for (const mode of ['auto', 'on', 'off'] as const) assert.equal(allowsHarborMotion(mode, { ...normal, reduced: true }), false)
})

test('broken manifests fail before a canvas or timer can be created', () => {
  for (const bad of [null, {}, { ...rawManifest, regions: [] }, { ...rawManifest, width: 0 }]) {
    assert.throws(() => parseHarborManifest(bad))
  }
  const clone = () => JSON.parse(JSON.stringify(rawManifest))
  const outside = clone()
  outside.regions[0].x = outside.width
  assert.throws(() => parseHarborManifest(outside))
  for (const duration of [0, -4, Infinity, NaN]) {
    const invalidTiming = clone()
    invalidTiming.regions[0].frames[0].duration = duration
    assert.throws(() => parseHarborManifest(invalidTiming))
  }
})
