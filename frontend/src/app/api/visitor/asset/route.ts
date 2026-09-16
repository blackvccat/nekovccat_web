import { NextRequest, NextResponse } from 'next/server'
import { VISITOR_COOKIE, verifyVisitorAccess } from '@/lib/server/visitor-access'
import { visitorBackend } from '@/lib/server/visitor-backend'

export const dynamic = 'force-dynamic'

/** Private application assets (wallpaper, icon) streamed from the backend after an entitlement check. */
export async function GET(request: NextRequest) {
  const visitor = verifyVisitorAccess(request.cookies.get(VISITOR_COOKIE)?.value)
  const appId = request.nextUrl.searchParams.get('app') || ''
  const kind = request.nextUrl.searchParams.get('kind') || ''
  if (!visitor) return new NextResponse(null, { status: 403 })
  if (!/^[a-z0-9][a-z0-9-]{0,31}$/.test(appId) || !visitor.apps.includes(appId) || !['wallpaper', 'icon'].includes(kind)) {
    return new NextResponse(null, { status: 403 })
  }
  try {
    const response = await visitorBackend(`/api/visitor/apps/${appId}/assets/${kind}`, visitor.username, { signal: request.signal })
    if (!response.ok || !response.body) return new NextResponse(null, { status: response.status === 200 ? 502 : response.status })
    return new NextResponse(response.body, {
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    if (request.signal.aborted) return new Response(null, { status: 499 })
    return new NextResponse(null, { status: 503 })
  }
}
