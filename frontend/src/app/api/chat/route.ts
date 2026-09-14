import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { chatSessionNonce, checkChatSession, clientAddress, guarded, readChatBody, securityError, validChatBody } from '@/lib/server/chat-security'
import { chatAttemptError } from '@/lib/server/chat-attempt-limiter'

export const dynamic = 'force-dynamic'

function budget(name: string, fallback: number) {
  const value = Number(process.env[name])
  return Number.isFinite(value) && value > 0 ? value : fallback
}

/** Preserve JSON/SSE bytes, with a bounded upstream lifetime and cancellation. */
export async function POST(request: NextRequest) {
  // Generate at the public boundary; a visitor cannot inject arbitrary log IDs.
  const requestId = randomUUID()
  const withId = <T extends Response>(response: T): T => { response.headers.set('X-Request-ID', requestId); return response }
  const ip = clientAddress(request)
  if (!ip) return withId(securityError('请从本站公网入口访问 Agent。', 403))
  const limited = chatAttemptError(ip, 'chat')
  if (limited) return withId(limited)
  if (!checkChatSession(request)) return withId(securityError('聊天会话已过期，请刷新页面后重试。', 403))
  const sessionNonce = chatSessionNonce(request) || (guarded() ? null : '0'.repeat(48))
  if (!sessionNonce) return withId(securityError('请从本站公网入口访问 Agent。', 403))
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return withId(securityError('请求格式不支持。', 415))
  let body: unknown
  try { body = await readChatBody(request) }
  catch (error) {
    if (error instanceof Error && error.message === 'aborted') return withId(new Response(null, { status: 499 }))
    if (error instanceof Error && error.message === 'too-slow') return withId(securityError('消息上传超时，请检查网络后重试。', 408))
    return withId(securityError('消息太长或格式无效，请缩短后重试。', error instanceof Error && error.message === 'too-large' ? 413 : 400))
  }
  if (!validChatBody(body)) return withId(securityError('请缩短消息，或开启新对话后重试。', 422))

  const stream = request.nextUrl.searchParams.get('stream') === 'true'
  // Opt in per request so already-open clients keep their append-only protocol.
  const progressive = stream && request.nextUrl.searchParams.get('protocol') === 'v2'
  const pythonApiUrl = (process.env.PYTHON_API_URL || 'http://127.0.0.1:8010').replace(/\/$/, '')
  // Whole-turn budget includes queueing, the backend's 180s run, and bounded cleanup.
  // Streaming headers include the backend's bounded queue wait; JSON waits for the whole turn.
  const totalMs = budget('CHAT_PROXY_TIMEOUT_MS', 215000)
  const headerMs = stream ? Math.min(totalMs, budget('CHAT_PROXY_HEADER_TIMEOUT_MS', 15000)) : totalMs
  const idleMs = budget('CHAT_PROXY_IDLE_TIMEOUT_MS', 45000)
  const upstream = new AbortController()
  const started = performance.now()
  let status = 503
  let finished = false
  let abortReason: 'cancelled' | 'timeout' | null = null
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null
  let output: ReadableStreamDefaultController<Uint8Array> | null = null
  let idleTimer: ReturnType<typeof setTimeout> | undefined

  function finish(outcome: string) {
    if (finished) return
    finished = true
    clearTimeout(headerTimer); clearTimeout(totalTimer); clearTimeout(idleTimer)
    request.signal.removeEventListener('abort', onBrowserAbort)
    console.info(JSON.stringify({ event: 'chat_proxy', request_id: requestId, status, outcome, duration_ms: Math.round(performance.now() - started) }))
  }
  function abort(reason: 'cancelled' | 'timeout') {
    if (finished) return
    abortReason = reason
    if (!output) status = reason === 'timeout' ? 504 : 499
    upstream.abort()
    void cancelReader()
    output?.error(new Error(reason === 'timeout' ? '聊天服务响应超时，请稍后重试。' : '请求已取消。'))
    finish(reason)
  }
  async function cancelReader() {
    if (!reader) return
    await reader.cancel().catch(() => undefined)
    reader.releaseLock()
  }
  function onBrowserAbort() { abort('cancelled') }
  function resetIdle() {
    clearTimeout(idleTimer)
    idleTimer = setTimeout(() => abort('timeout'), idleMs)
  }

  request.signal.addEventListener('abort', onBrowserAbort, { once: true })
  const totalTimer = setTimeout(() => abort('timeout'), totalMs)
  const headerTimer = setTimeout(() => abort('timeout'), headerMs)
  if (request.signal.aborted) abort('cancelled')
  try {
    const response = await fetch(`${pythonApiUrl}/api/chat/?stream=${stream}${progressive ? '&protocol=v2' : ''}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Neko-Internal-Token': process.env.INTERNAL_API_TOKEN || '', 'X-Neko-Client-IP': ip, 'X-Neko-Session-ID': sessionNonce, 'X-Request-ID': requestId },
      body: JSON.stringify(body), signal: upstream.signal, cache: 'no-store',
    })
    if (upstream.signal.aborted) throw new Error('aborted')
    clearTimeout(headerTimer)
    status = response.status
    const contentType = response.headers.get('content-type') || ''
    const isSSE = contentType.includes('text/event-stream') && response.ok
    const isJSON = contentType.includes('application/json')
    const headers = new Headers({ 'X-Request-ID': requestId, 'Cache-Control': isSSE ? 'no-cache, no-transform' : 'no-store' })
    const retryAfter = response.headers.get('retry-after')
    if (retryAfter) headers.set('Retry-After', retryAfter)
    if ((!isSSE && !isJSON) || !response.body) {
      await response.body?.cancel()
      finish('invalid_response')
      return NextResponse.json({ error: '聊天服务返回了无效响应，请稍后重试。' }, { status: response.ok ? 502 : response.status, headers })
    }
    headers.set('Content-Type', isSSE ? 'text/event-stream; charset=utf-8' : contentType)
    if (isSSE) headers.set('X-Accel-Buffering', 'no')
    reader = response.body.getReader()
    const downstream = new ReadableStream<Uint8Array>({
      start(controller) { output = controller; resetIdle() },
      async pull(controller) {
        if (finished) return
        try {
          const item = await reader!.read()
          if (finished) return
          if (item.done) {
            finish('completed')
            reader!.releaseLock()
            controller.close()
          } else {
            resetIdle()
            controller.enqueue(item.value)
          }
        } catch {
          if (finished) return
          upstream.abort()
          void cancelReader()
          finish('upstream_error')
          controller.error(new Error('聊天连接已中断，请稍后重试。'))
        }
      },
      async cancel() {
        upstream.abort()
        finish('cancelled')
        await cancelReader()
      },
    })
    return new Response(downstream, { status: response.status, headers })
  } catch {
    finish(abortReason || 'unavailable')
    if (abortReason === 'cancelled' || request.signal.aborted) return withId(new Response(null, { status: 499 }))
    if (abortReason === 'timeout') return withId(NextResponse.json({ error: '聊天服务响应超时，请稍后重试。' }, { status: 504 }))
    return withId(NextResponse.json({ error: 'Backend service unavailable', message: '聊天服务暂不可用，请稍后重试。' }, { status: 503 }))
  }
}
