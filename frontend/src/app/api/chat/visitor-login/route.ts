import { NextRequest, NextResponse } from 'next/server'
import { chatAttemptError } from '@/lib/server/chat-attempt-limiter'
import { chatSessionNonce, checkChatSession, clientAddress, securityError } from '@/lib/server/chat-security'
import { ACCESS_MAX_AGE_SECONDS, createVisitorAccess, VISITOR_COOKIE, verifyUnlockProof } from '@/lib/server/visitor-access'

export const dynamic = 'force-dynamic'

/** Holds the password for exactly one hop: the backend verifies it and returns a signed proof. */
export async function POST(request: NextRequest) {
  // 撞密码的第一道闸门放在最前面：读 body、连后端之前就挡掉，与聊天的两条路由同一套做法。
  // 它用的是独立的桶，所以「刚聊过几条就来登录」不会被这里的冷却误伤。
  const ip = clientAddress(request)
  const limited = ip ? chatAttemptError(ip, 'login') : null
  if (limited) return limited
  if (!checkChatSession(request)) return securityError('登录会话已过期，请刷新页面后重试。', 403)
  const nonce = chatSessionNonce(request)
  if (!nonce || !ip) return securityError('请从本站桌面登录访客模式。', 403)

  let body: unknown
  try { body = await request.json() } catch { return securityError('登录信息格式无效。', 400) }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return securityError('登录信息格式无效。', 422)
  const value = body as Record<string, unknown>
  if (Object.keys(value).some(key => key !== 'username' && key !== 'password')) return securityError('登录信息格式无效。', 422)
  const username = typeof value.username === 'string' ? value.username.trim() : ''
  const password = typeof value.password === 'string' ? value.password : ''
  if (!username || username.length > 64 || !password || password.length > 200) return securityError('请填写访客名与密码。', 422)

  const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000'
  try {
    const response = await fetch(`${pythonApiUrl}/api/visitor/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Marcus-Internal-Token': process.env.INTERNAL_API_TOKEN || '',
        'X-Marcus-Client-IP': ip,
        'X-Marcus-Session-ID': nonce,
      },
      body: JSON.stringify({ username, password }),
      signal: request.signal,
      cache: 'no-store',
    })
    if (!response.ok) {
      // The backend decides the wording: wrong credentials, lockout or maintenance.
      let message = '访客名或密码不正确。'
      try {
        const parsed: unknown = await response.json()
        const detail = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>).detail : null
        if (typeof detail === 'string' && detail) message = detail
      } catch { /* Keep the generic message for non-JSON failures. */ }
      const retryAfter = response.headers.get('retry-after')
      return NextResponse.json({ error: message }, {
        status: response.status,
        headers: { 'Cache-Control': 'no-store', ...(retryAfter ? { 'Retry-After': retryAfter } : {}) },
      })
    }
    const data: unknown = await response.json()
    const payload = data && typeof data === 'object' ? data as Record<string, unknown> : {}
    const identity = {
      username: typeof payload.username === 'string' ? payload.username : '',
      name: typeof payload.name === 'string' ? payload.name : '',
      apps: Array.isArray(payload.apps) ? payload.apps.filter((id): id is string => typeof id === 'string') : [],
    }
    if (payload.ok !== true || !identity.username || !identity.name || !verifyUnlockProof(payload.proof, nonce)) {
      return securityError('访客授权未能完成，请重试。', 502)
    }
    const result = NextResponse.json({ unlocked: true, name: identity.name, username: identity.username, apps: identity.apps }, { headers: { 'Cache-Control': 'no-store' } })
    result.cookies.set(VISITOR_COOKIE, createVisitorAccess(identity), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: ACCESS_MAX_AGE_SECONDS,
    })
    return result
  } catch {
    if (request.signal.aborted) return new Response(null, { status: 499 })
    return securityError('登录服务暂不可用，请稍后再试。', 503)
  }
}
