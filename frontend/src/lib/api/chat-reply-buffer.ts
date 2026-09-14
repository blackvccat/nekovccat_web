/** Coalesce real transport snapshots into one paint; final text never waits in a queue. */
export function createReplyBuffer(
  publish: (content: string) => void,
  schedule: (callback: FrameRequestCallback) => number = requestAnimationFrame,
  unschedule: (id: number) => void = cancelAnimationFrame,
) {
  let frame: number | null = null
  let pending: string | null = null
  let published: string | null = null
  let disposed = false
  const flush = () => {
    if (frame !== null) unschedule(frame)
    frame = null
    if (disposed || pending === null) return
    const content = pending
    pending = null
    if (content !== published) { published = content; publish(content) }
  }
  return {
    push(content: string, final = false) {
      if (disposed) return
      pending = content
      if (final) flush()
      else if (frame === null) frame = schedule(flush)
    },
    flush,
    dispose() {
      disposed = true
      if (frame !== null) unschedule(frame)
      frame = null
      pending = null
    },
  }
}
