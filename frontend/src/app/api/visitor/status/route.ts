import { NextRequest, NextResponse } from 'next/server'
import { ACCESS_MAX_AGE_SECONDS, VISITOR_COOKIE, createVisitorAccess, verifyVisitorAccess } from '@/lib/server/visitor-access'
import { passthroughError, visitorBackend } from '@/lib/server/visitor-backend'

export const dynamic = 'force-dynamic'

/** App metadata only: titles and flags the desktop needs, never content. */
export async function GET(request: NextRequest) {
  const visitor = verifyVisitorAccess(request.cookies.get(VISITOR_COOKIE)?.value)
  if (!visitor) return NextResponse.json({ unlocked: false, name: null, username: null, apps: [] }, { headers: { 'Cache-Control': 'no-store' } })
  try {
    const response = await visitorBackend('/api/visitor/apps', visitor.username, { signal: request.signal })
    if (!response.ok) return passthroughError(response, '访客应用暂时不可用，请稍后再试。')
    const data: unknown = await response.json()
    const payload = data && typeof data === 'object' ? data as Record<string, unknown> : {}
    const apps = Array.isArray(payload.apps) ? payload.apps : []
    const result = NextResponse.json(
      { unlocked: true, name: visitor.name, username: visitor.username, apps },
      { headers: { 'Cache-Control': 'no-store' } },
    )
    // 授权会变（比如刚给这位访客开了新应用）：把 Cookie 里的列表更新成后端刚返回的那份，
    // 否则这次会话会一直拿旧列表把新应用挡在门外。后端对每个请求仍按账号复核授权。
    const granted = apps.flatMap(app => app && typeof app === 'object' && typeof (app as { id?: unknown }).id === 'string' ? [(app as { id: string }).id] : [])
    if (granted.length && granted.join(',') !== visitor.apps.join(',')) {
      result.cookies.set(VISITOR_COOKIE, createVisitorAccess({ username: visitor.username, name: visitor.name, apps: granted }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: ACCESS_MAX_AGE_SECONDS,
      })
    }
    return result
  } catch {
    if (request.signal.aborted) return new Response(null, { status: 499 })
    return NextResponse.json({ error: '访客应用暂时不可用，请稍后再试。' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
