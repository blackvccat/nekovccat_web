import { NextRequest, NextResponse } from 'next/server'
import { sameSite, securityError } from '@/lib/server/chat-security'
import { VISITOR_COOKIE } from '@/lib/server/visitor-access'

export const dynamic = 'force-dynamic'

/** Dropping the cookie is all a logout needs: the backend never keeps a session. */
export async function POST(request: NextRequest) {
  if (!sameSite(request, true)) return securityError('请从本站桌面退出访客模式。', 403)
  const response = NextResponse.json({ unlocked: false }, { headers: { 'Cache-Control': 'no-store' } })
  response.cookies.set(VISITOR_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })
  return response
}
