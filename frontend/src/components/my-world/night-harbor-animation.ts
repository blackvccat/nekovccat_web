export interface HarborFrame {
  x: number
  y: number
  width: number
  height: number
  duration: number
}

export interface HarborRegion {
  id: string
  x: number
  y: number
  width: number
  height: number
  offset: number
  frames: HarborFrame[]
  loopDuration: number
}

export interface HarborManifest {
  image: string
  width: number
  height: number
  regions: HarborRegion[]
}

export type HarborMotion = 'auto' | 'on' | 'off'

export function allowsHarborMotion(motion: HarborMotion, preferences: {
  reduced: boolean; narrow: boolean; coarse: boolean; saveData: boolean
}) {
  if (motion === 'off' || preferences.reduced) return false
  return motion === 'on' || (!preferences.narrow && !preferences.coarse && !preferences.saveData)
}

/** Match object-fit: cover with object-position: right bottom, even on tall screens. */
export function harborCoverPlane(width: number, height: number, sourceWidth: number, sourceHeight: number) {
  if (![width, height, sourceWidth, sourceHeight].every(value => Number.isFinite(value) && value > 0)) return null
  const scale = Math.max(width / sourceWidth, height / sourceHeight)
  const planeWidth = sourceWidth * scale
  const planeHeight = sourceHeight * scale
  return { width: planeWidth, height: planeHeight, left: width - planeWidth, top: height - planeHeight }
}

/** Returns the current atlas frame and the exact wait until its duration expires. */
export function harborFrameAt(region: HarborRegion, elapsed: number) {
  let cursor = ((elapsed + region.offset) % region.loopDuration + region.loopDuration) % region.loopDuration
  for (let index = 0; index < region.frames.length; index += 1) {
    const duration = region.frames[index].duration
    if (cursor < duration) return { index, delay: duration - cursor }
    cursor -= duration
  }
  // Floating point rounding at the loop boundary can place the cursor just past the last frame.
  return { index: 0, delay: region.frames[0].duration }
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid wallpaper manifest')
  return value as Record<string, unknown>
}

function positive(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) throw new Error('Invalid wallpaper dimensions or timing')
  return value
}

function position(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new Error('Invalid wallpaper position')
  return value
}

export function parseHarborManifest(value: unknown): HarborManifest {
  const raw = object(value)
  const width = positive(raw.width)
  const height = positive(raw.height)
  if (typeof raw.image !== 'string' || !raw.image || !Array.isArray(raw.regions) || !raw.regions.length || raw.regions.length > 32) {
    throw new Error('Invalid wallpaper manifest')
  }
  const regions = raw.regions.map((value, index) => {
    const region = object(value)
    const x = position(region.x), y = position(region.y)
    const regionWidth = positive(region.width), regionHeight = positive(region.height)
    if (x + regionWidth > width || y + regionHeight > height || !Array.isArray(region.frames) || !region.frames.length || region.frames.length > 256) {
      throw new Error('Invalid wallpaper region')
    }
    const defaultDuration = 1000 / positive(region.fps ?? raw.fps ?? 8)
    const frames = region.frames.map(value => {
      const frame = object(value)
      return {
        x: position(frame.x), y: position(frame.y),
        width: positive(frame.width ?? regionWidth), height: positive(frame.height ?? regionHeight),
        duration: positive(frame.duration ?? defaultDuration),
      }
    })
    const offset = region.offset ?? 0
    if (typeof offset !== 'number' || !Number.isFinite(offset)) throw new Error('Invalid wallpaper offset')
    return {
      id: typeof region.id === 'string' ? region.id : String(index),
      x, y, width: regionWidth, height: regionHeight, offset, frames,
      loopDuration: frames.reduce((sum, frame) => sum + frame.duration, 0),
    }
  })
  return { image: raw.image, width, height, regions }
}
