export type Rect = {
  left: number
  top: number
  width: number
  height: number
}

export type ClippedPlayerRect = Rect & {
  offsetLeft: number
  offsetTop: number
  frameWidth: number
  frameHeight: number
}

function isValidRect(rect: Rect): boolean {
  return [rect.left, rect.top, rect.width, rect.height, rect.left + rect.width, rect.top + rect.height]
    .every(Number.isFinite) && rect.width > 0 && rect.height > 0
}

/** Position a persistent iframe inside the visible portion of its page slot. */
export function clipPlayerRect(frame: Rect, clips: Rect[]): ClippedPlayerRect | null {
  if (!isValidRect(frame)) return null

  let left = frame.left
  let top = frame.top
  let right = frame.left + frame.width
  let bottom = frame.top + frame.height

  for (const clip of clips) {
    if (!isValidRect(clip)) return null
    left = Math.max(left, clip.left)
    top = Math.max(top, clip.top)
    right = Math.min(right, clip.left + clip.width)
    bottom = Math.min(bottom, clip.top + clip.height)
    if (right <= left || bottom <= top) return null
  }

  return {
    left,
    top,
    width: right - left,
    height: bottom - top,
    offsetLeft: frame.left - left,
    offsetTop: frame.top - top,
    frameWidth: frame.width,
    frameHeight: frame.height,
  }
}
