import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, createChatSession, guarded, sameSite, securityError } from '@/lib/server/chat-security'

export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  if (!sameSite(request, false)) return securityError('请从本站打开 Agent。', 403)
  const session = createChatSession()
  if (!session) return securityError('站内 Agent 正在维护，请稍后再试。', 503)
  const response = NextResponse.json({ token: session.token }, { headers: { 'Cache-Control': 'no-store' } })
  response.cookies.set(SESSION_COOKIE, session.cookie, { httpOnly: true, secure: guarded(), sameSite: 'strict', path: '/api/chat', maxAge: 7200 })
  return response
}
