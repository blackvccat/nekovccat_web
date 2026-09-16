/** Adapt the runtime's real transient assistant frames to its SDK stdio channel. */
export function publicFrame(frame) {
  if (!frame || typeof frame.attemptId !== 'string' || frame.attemptId.length > 256) return null
  if (frame.type === 'start') return { type: 'start', attemptId: frame.attemptId, turn: frame.turn, step: frame.step }
  if (frame.type === 'end') return { type: 'end', attemptId: frame.attemptId }
  if (frame.type !== 'chunk' || !Number.isSafeInteger(frame.index) || frame.index < 0) return null
  const chunk = frame.chunk
  if (chunk?.type === 'text-delta' && typeof chunk.text === 'string' && chunk.text) {
    return { type: 'text', attemptId: frame.attemptId, index: frame.index, text: chunk.text }
  }
  // Reasoning, tool arguments, signatures and provider diagnostics never cross
  // this live bridge. A genuine reasoning notification produces only a marker.
  if (chunk?.type === 'reasoning-delta' && typeof chunk.text === 'string' && chunk.text) {
    return { type: 'analyzing', attemptId: frame.attemptId, index: frame.index }
  }
  return null
}

export function apply(ctx) {
  if (process.env.MARCUS_PROGRESSIVE_STREAM !== '1') return
  let analyzedAttempt = ''
  ctx.on('agent/assistant-stream', ({ agent, frame }) => {
    const projected = publicFrame(frame)
    if (!projected) return
    if (projected.type === 'analyzing') {
      if (analyzedAttempt === projected.attemptId) return
      analyzedAttempt = projected.attemptId
    }
    const params = { sessionId: String(agent.session.id), frame: projected }
    // The pinned SDK server omits transient frames. Use a distinct notification
    // method rather than inventing durable session events. One write = one line.
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', method: 'site.assistant', params }) + '\n')
  }, { global: true })
}
