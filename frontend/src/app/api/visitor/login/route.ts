import { NextRequest, NextResponse } from 'next/server'
import {
  chatSessionNonce,
  checkChatSession,
  clientAddress,
  guarded,
  readChatBody,
  securityError,
} from '@/lib/server/chat-security'
import { chatAttemptError } from '@/lib/server/chat-attempt-limiter'
import { createVisitorAccess, VISITOR_COOKIE, verifyVisitorProof } from '@/lib/server/visitor-security'

export const dynamic = 'force-dynamic'

function upstreamUrl() {
  return (process.env.PYTHON_API_URL || 'http://127.0.0.1:8011').replace(/\/$/, '')
}

export async function POST(request: NextRequest) {
  const ip = clientAddress(request)
  if (!ip) return securityError('请从本站公网入口访问访客模式。', 403)
  const limited = chatAttemptError(ip, 'unlock')
  if (limited) return limited
  if (!checkChatSession(request)) return securityError('聊天会话已过期，请刷新页面后重试。', 403)
  const nonce = chatSessionNonce(request)
  if (!nonce) return securityError('请从本站打开访客模式。', 403)
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return securityError('请求格式不支持。', 415)
  }

  let body: unknown
  try {
    body = await readChatBody(request)
  } catch (error) {
    if (error instanceof Error && error.message === 'too-slow') return securityError('上传超时，请重试。', 408)
    return securityError('请求格式无效。', error instanceof Error && error.message === 'too-large' ? 413 : 400)
  }
  const username = body && typeof body === 'object' ? (body as Record<string, unknown>).username : null
  const password = body && typeof body === 'object' ? (body as Record<string, unknown>).password : null
  if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
    return securityError('请输入访客名和密码。', 422)
  }

  let upstream: Response
  try {
    upstream = await fetch(`${upstreamUrl()}/api/visitor/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Neko-Internal-Token': process.env.INTERNAL_API_TOKEN || '',
        'X-Neko-Client-IP': ip,
        'X-Neko-Session-ID': nonce,
      },
      body: JSON.stringify({ username, password }),
      cache: 'no-store',
      signal: request.signal,
    })
  } catch {
    return securityError('访客服务暂不可用，请稍后再试。', 503)
  }
  const data: unknown = await upstream.json().catch(() => null)
  if (!upstream.ok || !data || typeof data !== 'object') {
    const detail = data && typeof data === 'object' && typeof (data as Record<string, unknown>).detail === 'string'
      ? String((data as Record<string, unknown>).detail) : '访客名或密码不正确。'
    const headers = new Headers({ 'Cache-Control': 'no-store' })
    const retryAfter = upstream.headers.get('retry-after')
    if (retryAfter) headers.set('Retry-After', retryAfter)
    return NextResponse.json({ error: detail }, { status: upstream.status, headers })
  }
  const result = data as Record<string, unknown>
  if (result.ok !== true || typeof result.username !== 'string' || typeof result.name !== 'string'
      || !Array.isArray(result.apps) || !verifyVisitorProof(result.proof, nonce)) {
    return securityError('访客授权校验失败，请重试。', 503)
  }

  const response = NextResponse.json({
    ok: true,
    name: result.name,
    username: result.username,
    apps: result.apps.filter((app): app is string => typeof app === 'string'),
  }, { headers: { 'Cache-Control': 'no-store' } })
  response.cookies.set(VISITOR_COOKIE, createVisitorAccess(result.username), {
    httpOnly: true,
    secure: guarded(),
    sameSite: 'strict',
    path: '/',
    maxAge: 30 * 86400,
  })
  return response
}
