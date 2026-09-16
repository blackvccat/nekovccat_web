import { NextRequest, NextResponse } from 'next/server'
import { VISITOR_COOKIE, verifyVisitorAccess } from '@/lib/server/visitor-access'
import { passthroughError, visitorBackend } from '@/lib/server/visitor-backend'

export const dynamic = 'force-dynamic'

/** One application's view data, only for a visitor the backend granted it to. */
export async function GET(request: NextRequest) {
  const visitor = verifyVisitorAccess(request.cookies.get(VISITOR_COOKIE)?.value)
  const appId = request.nextUrl.searchParams.get('app') || ''
  if (!visitor) return NextResponse.json({ error: '未登录访客模式' }, { status: 403, headers: { 'Cache-Control': 'no-store' } })
  if (!/^[a-z0-9][a-z0-9-]{0,31}$/.test(appId) || !visitor.apps.includes(appId)) {
    return NextResponse.json({ error: '这个应用没有对你开放。' }, { status: 403, headers: { 'Cache-Control': 'no-store' } })
  }
  try {
    const response = await visitorBackend(`/api/visitor/apps/${appId}`, visitor.username, { signal: request.signal })
    if (!response.ok) return passthroughError(response, '应用内容暂时不可用，请稍后再试。')
    return new NextResponse(await response.text(), {
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' },
    })
  } catch {
    if (request.signal.aborted) return new Response(null, { status: 499 })
    return NextResponse.json({ error: '应用内容暂时不可用，请稍后再试。' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
