import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { chatAttemptError } from '@/lib/server/chat-attempt-limiter'
import { chatSessionNonce, checkChatSession, clientAddress, guarded, readChatBody, readDevice, validChatBody } from '@/lib/server/chat-security'
import { VISITOR_COOKIE, verifyVisitorAccess } from '@/lib/server/visitor-access'

export const dynamic = 'force-dynamic'

/** 三段预算：代理自己必须兜住上游卡死，否则一个请求能一直占着后端槽位（并发只有 3）。
 *
 *  - 首字节：等响应头的时间（SSE 与 JSON 都算）。
 *  - 空闲：两帧之间没有字节的时间。后端每 15 秒发一条注释心跳，所以长工具调用不会误触。
 *  - 整轮：无论有没有数据，一轮的总时限。
 *
 * 改这些预算时要一起看后端：整轮 > 准入 + 模型执行 + 清理，空闲 > 后端最长合法静默。
 */
const positive = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

type StopReason = '' | 'client' | 'header' | 'idle' | 'total'

/** Pump the upstream SSE without buffering it, bounded by the idle budget. */
function streamBody(readable: ReadableStream<Uint8Array>, idleMs: number, stop: (reason: StopReason) => void, reason: () => StopReason, settled: () => void) {
  const reader = readable.getReader()
  let idle: ReturnType<typeof setTimeout> | null = null
  let done = false
  const clearIdle = () => { if (idle) { clearTimeout(idle); idle = null } }
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const bump = () => { clearIdle(); idle = setTimeout(() => stop('idle'), idleMs) }
      const settle = (error?: Error) => {
        if (done) return
        done = true
        clearIdle()
        settled()
        // 消费者可能已经取消，这时候再动 controller 会抛；那正是我们要的结果。
        try { if (error) controller.error(error); else controller.close() } catch { /* already cancelled */ }
      }
      bump()
      void (async () => {
        try {
          for (;;) {
            const { value, done: ended } = await reader.read()
            if (ended) break
            bump()
            controller.enqueue(value)
          }
          settle()
        } catch {
          // 中止上游之后把 reader 也放掉：真实 fetch 会自己报错，手写的流则靠这一步释放。
          void reader.cancel().catch(() => {})
          settle(new Error(reason() === 'client' ? '请求已取消。' : '聊天连接已中断，请稍后重试。'))
        }
      })()
    },
    cancel() {
      if (done) return
      done = true
      clearIdle()
      stop('client')
      settled()
      void reader.cancel().catch(() => {})
    },
  })
}

/** Keep the backend's JSON/SSE protocol intact, including cancellation, timeouts and errors. */
export async function POST(request: NextRequest) {
  // 运行时读：运维调预算不用重新构建，测试也能直接改。
  const totalTimeout = positive(process.env.CHAT_PROXY_TIMEOUT_MS, 215_000)
  const headerTimeout = positive(process.env.CHAT_PROXY_HEADER_TIMEOUT_MS, 15_000)
  const idleTimeout = positive(process.env.CHAT_PROXY_IDLE_TIMEOUT_MS, 45_000)
  const requestId = randomUUID()
  const started = Date.now()
  let stopReason = '' as StopReason
  let logged = false
  const log = (status: number) => {
    if (logged) return
    logged = true
    // 结构化一行：请求 id 把这次浏览器请求、代理日志与后端日志串起来；不含正文与地址。
    console.info(JSON.stringify({ event: 'chat_proxy', request_id: requestId, status, reason: stopReason || 'ok', duration_ms: Date.now() - started }))
  }
  const reject = (message: string, status: number) => {
    log(status)
    return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store', 'X-Request-ID': requestId } })
  }

  // 第一道闸放在最前面：读 body、连后端之前就把它挡掉，洪水因此连 Node 的处理都进不来。
  const ip = clientAddress(request)
  const limited = ip ? chatAttemptError(ip, 'chat') : null
  if (limited) { log(limited.status); limited.headers.set('X-Request-ID', requestId); return limited }
  if (!checkChatSession(request)) return reject('聊天会话已过期，请刷新页面后重试。', 403)
  const sessionNonce = chatSessionNonce(request) || (guarded() ? null : '0'.repeat(48))
  if (!ip || !sessionNonce) return reject('请从本站公网入口访问 Agent。', 403)
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return reject('请求格式不支持。', 415)
  let body: unknown
  try { body = await readChatBody(request) }
  catch (error) {
    const reason = error instanceof Error ? error.message : ''
    // 中断（浏览器已经走了）回 499：这不是服务端的错，也不该记成一次失败。
    if (reason === 'aborted') { log(499); return new Response(null, { status: 499, headers: { 'X-Request-ID': requestId } }) }
    if (reason === 'too-slow') return reject('消息上传超时，请检查网络后重试。', 408)
    return reject('消息太长或格式无效，请缩短后重试。', reason === 'too-large' ? 413 : 400)
  }
  if (!validChatBody(body)) return reject('请缩短消息，或开启新对话后重试。', 422)

  const stream = request.nextUrl.searchParams.get('stream') === 'true'
  // 只把认识的值转发给后端：不认识的值保持老协议，旧页面因此不受影响。
  const progressive = request.nextUrl.searchParams.get('protocol') === 'v2'
  const pythonApiUrl = (process.env.PYTHON_API_URL || 'http://localhost:8000').replace(/\/$/, '')
  // 额度分档用的身份：匿名的桶是签名过的设备 cookie，登录的桶只在签名 cookie 有效时报出访客名；
  // 两者都由后端再核一遍（账号是否还启用），伪造 cookie 拿不到新桶。
  const device = readDevice(request)
  const visitor = verifyVisitorAccess(request.cookies.get(VISITOR_COOKIE)?.value)

  const upstream = new AbortController()
  const stop = (reason: StopReason) => { if (!stopReason && reason) { stopReason = reason; upstream.abort() } }
  const onClientAbort = () => { if (!stopReason) { stopReason = 'client'; upstream.abort() } }
  request.signal.addEventListener('abort', onClientAbort)
  const totalTimer = setTimeout(() => stop('total'), totalTimeout)
  const headerTimer = setTimeout(() => stop('header'), headerTimeout)
  let handedOff = false
  const finish = () => {
    clearTimeout(totalTimer)
    clearTimeout(headerTimer)
    request.signal.removeEventListener('abort', onClientAbort)
  }

  try {
    const response = await fetch(`${pythonApiUrl}/api/chat/?stream=${stream}${progressive ? '&protocol=v2' : ''}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Marcus-Internal-Token': process.env.INTERNAL_API_TOKEN || '',
        'X-Marcus-Client-IP': ip,
        'X-Marcus-Session-ID': sessionNonce,
        'X-Request-ID': requestId,
        ...(device ? { 'X-Marcus-Device': device } : {}),
        ...(visitor ? { 'X-Marcus-Visitor': visitor.username } : {}),
      },
      body: JSON.stringify(body),
      signal: upstream.signal,
      cache: 'no-store',
    })
    clearTimeout(headerTimer)
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('text/event-stream') && response.ok && response.body) {
      // 流式转发由 streamBody 收尾：定时器与取消监听在它结束时才清理。
      handedOff = true
      const concluded = () => { finish(); log(response.status) }
      return new Response(streamBody(response.body, idleTimeout, stop, () => stopReason, concluded), {
        status: response.status,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'X-Accel-Buffering': 'no',
          'X-Request-ID': requestId,
        },
      })
    }
    // JSON responses include the legacy ChatResponse and backend validation errors.
    // Retry-After 原样透出：配额窗口的等待时间只有后端知道，浏览器不该自己猜。
    if (contentType.includes('application/json')) {
      const retryAfter = response.headers.get('retry-after')
      log(response.status)
      return new Response(await response.arrayBuffer(), {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'no-store',
          'X-Request-ID': requestId,
          ...(retryAfter ? { 'Retry-After': retryAfter } : {}),
        },
      })
    }
    await response.body?.cancel()
    log(response.ok ? 502 : response.status)
    return NextResponse.json({ error: '聊天服务返回了无效响应，请稍后重试。' },
      { status: response.ok ? 502 : response.status, headers: { 'Cache-Control': 'no-store', 'X-Request-ID': requestId } })
  } catch {
    const status = stopReason === 'client' ? 499 : stopReason ? 504 : 503
    log(status)
    if (status === 499) return new Response(null, { status, headers: { 'X-Request-ID': requestId } })
    return NextResponse.json(
      { error: status === 504 ? '聊天服务响应超时，请稍后重试。' : '聊天服务暂不可用，请稍后重试。' },
      { status, headers: { 'Cache-Control': 'no-store', 'X-Request-ID': requestId } })
  } finally {
    // 已经在流式转发时不在这里收尾：那段流结束时才调 finish()。
    if (!handedOff) finish()
  }
}
