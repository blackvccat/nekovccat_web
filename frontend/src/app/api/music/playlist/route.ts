import { NextRequest, NextResponse } from 'next/server'
import { chatAttemptError } from '@/lib/server/chat-attempt-limiter'
import { clientAddress } from '@/lib/server/chat-security'

export const dynamic = 'force-dynamic'

const PLAYLIST_ID = /^\d{1,20}$/
const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100
const noStore = { 'Cache-Control': 'no-store' }

/** 网易云歌单的曲目列表：浏览器跨域直连不了，只经这个代理向后端要。 */
export async function GET(request: NextRequest) {
  // 每次请求都会让服务器拿自己的 IP 去打第三方，所以先过一道便宜的按地址限流。
  const ip = clientAddress(request)
  const limited = ip ? chatAttemptError(ip, 'music') : null
  if (limited) return limited
  const id = request.nextUrl.searchParams.get('id') || ''
  if (!PLAYLIST_ID.test(id)) return NextResponse.json({ detail: '歌单地址不对。' }, { status: 400, headers: noStore })
  const requested = Number(request.nextUrl.searchParams.get('limit') || DEFAULT_LIMIT)
  const limit = Number.isFinite(requested) ? Math.min(Math.max(Math.trunc(requested), 1), MAX_LIMIT) : DEFAULT_LIMIT

  const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000'
  try {
    const response = await fetch(`${pythonApiUrl}/api/music/netease/playlist/${id}?limit=${limit}`, {
      headers: { 'X-Marcus-Internal-Token': process.env.INTERNAL_API_TOKEN || '' },
      cache: 'no-store',
    })
    const body = await response.json().catch(() => null)
    if (!response.ok) {
      const detail = body && typeof body.detail === 'string' ? body.detail : '暂时拿不到这个歌单，请稍后再试。'
      return NextResponse.json({ detail }, { status: response.status >= 500 ? 503 : response.status, headers: noStore })
    }
    return NextResponse.json(body, { headers: noStore })
  } catch {
    return NextResponse.json({ detail: '暂时拿不到这个歌单，请稍后再试。' }, { status: 503, headers: noStore })
  }
}
