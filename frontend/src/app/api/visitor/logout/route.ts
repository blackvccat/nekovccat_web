import { NextResponse } from 'next/server'
import { guarded } from '@/lib/server/chat-security'
import { VISITOR_COOKIE } from '@/lib/server/visitor-security'

export const dynamic = 'force-dynamic'

export async function POST() {
  const response = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  response.cookies.set(VISITOR_COOKIE, '', {
    httpOnly: true,
    secure: guarded(),
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })
  return response
}
