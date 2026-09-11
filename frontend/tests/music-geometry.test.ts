import assert from 'node:assert/strict'
import test from 'node:test'
import { clipPlayerRect, type Rect } from '../src/lib/music/geometry'

test('an unclipped slot preserves the iframe dimensions and position', () => {
  const frame = { left: 40, top: 80, width: 530, height: 450 }
  const expected = { ...frame, offsetLeft: 0, offsetTop: 0, frameWidth: 530, frameHeight: 450 }
  assert.deepEqual(clipPlayerRect(frame, []), expected)
  assert.deepEqual(clipPlayerRect(frame, [{ left: 0, top: 0, width: 1000, height: 1000 }]), expected)
})

test('scrolling clips the container and offsets the original iframe without resizing it', () => {
  assert.deepEqual(clipPlayerRect(
    { left: 110, top: 20, width: 530, height: 450 },
    [{ left: 100, top: 180, width: 550, height: 200 }],
  ), {
    left: 110, top: 180, width: 530, height: 200,
    offsetLeft: 0, offsetTop: -160, frameWidth: 530, frameHeight: 450,
  })
})

test('the viewport clips negative coordinates on both axes', () => {
  assert.deepEqual(clipPlayerRect(
    { left: -60, top: -100, width: 530, height: 450 },
    [{ left: 0, top: 0, width: 390, height: 844 }],
  ), {
    left: 0, top: 0, width: 390, height: 350,
    offsetLeft: -60, offsetTop: -100, frameWidth: 530, frameHeight: 450,
  })
})

test('all nested clipping containers contribute to the visible intersection', () => {
  const frame = { left: 20, top: 40, width: 530, height: 450 }
  const clips = [
    { left: 30, top: 60, width: 490, height: 420 },
    { left: 10, top: 90, width: 600, height: 320 },
    { left: 0, top: 0, width: 390, height: 844 },
  ]
  const expected = {
    left: 30, top: 90, width: 360, height: 320,
    offsetLeft: -10, offsetTop: -50, frameWidth: 530, frameHeight: 450,
  }
  assert.deepEqual(clipPlayerRect(frame, clips), expected)
  assert.deepEqual(clipPlayerRect(frame, [...clips].reverse()), expected)
  assert.deepEqual(clipPlayerRect(frame, [...clips, clips[0]]), expected)
})

test('a fully hidden slot or an intersection with no area has no visible player', () => {
  const frame = { left: 100, top: 100, width: 200, height: 200 }
  for (const clip of [
    { left: 400, top: 100, width: 200, height: 200 },
    { left: 100, top: 400, width: 200, height: 200 },
    { left: 300, top: 100, width: 200, height: 200 },
    { left: 100, top: 300, width: 200, height: 200 },
    { left: 0, top: 0, width: 100, height: 100 },
  ]) assert.equal(clipPlayerRect(frame, [clip]), null)
  assert.equal(clipPlayerRect(frame, [
    { left: 100, top: 100, width: 200, height: 100 },
    { left: 100, top: 200, width: 200, height: 100 },
  ]), null)
})

test('invalid frame or clipping coordinates cannot produce invalid CSS geometry', () => {
  const valid = { left: 0, top: 0, width: 530, height: 450 }
  const invalid: Rect[] = []
  for (const key of ['left', 'top', 'width', 'height']) {
    for (const value of [NaN, Infinity, -Infinity]) invalid.push({ ...valid, [key]: value })
  }
  for (const key of ['width', 'height']) {
    for (const value of [0, -1]) invalid.push({ ...valid, [key]: value })
  }
  invalid.push({ ...valid, left: Number.MAX_VALUE, width: Number.MAX_VALUE })
  invalid.push({ ...valid, top: Number.MAX_VALUE, height: Number.MAX_VALUE })
  for (const rect of invalid) {
    assert.equal(clipPlayerRect(rect, []), null)
    assert.equal(clipPlayerRect(valid, [rect]), null)
  }
})

test('fractional layout coordinates retain their precision without mutating inputs', () => {
  const frame = Object.freeze({ left: 10.25, top: 20.5, width: 530.5, height: 450.25 })
  const clip = Object.freeze({ left: 12.5, top: 24.25, width: 400.25, height: 200.5 })
  const clips = [clip]
  assert.deepEqual(clipPlayerRect(frame, clips), {
    left: 12.5, top: 24.25, width: 400.25, height: 200.5,
    offsetLeft: -2.25, offsetTop: -3.75, frameWidth: 530.5, frameHeight: 450.25,
  })
  assert.deepEqual(clips, [clip])
})
