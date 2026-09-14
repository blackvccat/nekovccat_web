import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, clientAddress, createChatSession, guarded, sameSite, securityError } from '@/lib/server/chat-security'
import { chatAttemptError } from '@/lib/server/chat-attempt-limiter'

export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  const ip = clientAddress(request)
  if (!ip) return securityError('请从本站公网入口访问 Agent。', 403)
  const limited = chatAttemptError(ip, 'session')
  if (limited) return limited
  if (!sameSite(request, false)) return securityError('请从本站打开 Agent。', 403)
  const session = createChatSession(request)
  if (!session) return securityError('站内 Agent 正在维护，请稍后再试。', 503)
  const response = NextResponse.json({ token: session.token }, { headers: { 'Cache-Control': 'no-store' } })
  response.cookies.set(SESSION_COOKIE, session.cookie, { httpOnly: true, secure: guarded(), sameSite: 'strict', path: '/api/chat', expires: new Date(session.expiresAt) })
  return response
}
