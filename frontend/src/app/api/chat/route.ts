import { NextRequest, NextResponse } from 'next/server'
import { chatSessionNonce, checkChatSession, clientAddress, guarded, readChatBody, securityError, validChatBody } from '@/lib/server/chat-security'

export const dynamic = 'force-dynamic'

/** Keep the backend's JSON/SSE protocol intact, including cancellation and errors. */
export async function POST(request: NextRequest) {
  if (!checkChatSession(request)) return securityError('聊天会话已过期，请刷新页面后重试。', 403)
  const ip = clientAddress(request)
  const sessionNonce = chatSessionNonce(request) || (guarded() ? null : '0'.repeat(48))
  if (!ip || !sessionNonce) return securityError('请从本站公网入口访问 Agent。', 403)
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return securityError('请求格式不支持。', 415)
  let body: unknown
  try { body = await readChatBody(request) }
  catch (error) { return securityError('消息太长或格式无效，请缩短后重试。', error instanceof Error && error.message === 'too-large' ? 413 : 400) }
  if (!validChatBody(body)) return securityError('请缩短消息，或开启新对话后重试。', 422)

  const stream = request.nextUrl.searchParams.get('stream') === 'true'
  const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000'
  try {
    const response = await fetch(`${pythonApiUrl}/api/chat/?stream=${stream}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Neko-Internal-Token': process.env.INTERNAL_API_TOKEN || '', 'X-Neko-Client-IP': ip, 'X-Neko-Session-ID': sessionNonce },
      body: JSON.stringify(body),
      signal: request.signal,
      cache: 'no-store',
    })
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('text/event-stream') && response.ok && response.body) {
      return new Response(response.body, {
        status: response.status,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'X-Accel-Buffering': 'no',
        },
      })
    }
    // JSON responses include the legacy ChatResponse and backend validation errors.
    if (contentType.includes('application/json')) {
      return new Response(response.body, { status: response.status, headers: { 'Content-Type': contentType, 'Cache-Control': 'no-store' } })
    }
    return NextResponse.json({ error: '聊天服务返回了无效响应，请稍后重试。' }, { status: response.ok ? 502 : response.status })
  } catch {
    if (request.signal.aborted) return new Response(null, { status: 499 })
    return NextResponse.json({ error: 'Backend service unavailable', message: '聊天服务暂不可用，请稍后重试。' }, { status: 503 })
  }
}
