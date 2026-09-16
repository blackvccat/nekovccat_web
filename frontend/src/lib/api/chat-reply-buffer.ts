/** Coalesce streamed text snapshots into at most one React render per animation frame.
 *
 * 传输层给的是"到目前为止的全文"，所以这里只需要保存最新快照、每帧发布一次：
 * 逐字回调不再逐个触发 setState 与一次全量 localStorage 序列化。
 */
export function createReplyBuffer(
  publish: (content: string) => void,
  schedule: (callback: () => void) => number = requestAnimationFrame,
  unschedule: (handle: number) => void = cancelAnimationFrame,
) {
  let frame: number | null = null
  let pending = ''
  let published = ''
  let disposed = false

  const flush = () => {
    if (frame !== null) { unschedule(frame); frame = null }
    if (disposed || pending === published) return
    published = pending
    publish(pending)
  }

  return {
    /** `final` 永不等帧：收尾那一帧必须立刻落到界面上。 */
    push(content: string, final = false) {
      if (disposed) return
      pending = content
      if (final) { flush(); return }
      if (frame === null) frame = schedule(() => { frame = null; flush() })
    },
    flush,
    dispose() {
      disposed = true
      if (frame !== null) { unschedule(frame); frame = null }
      pending = ''
    },
  }
}
