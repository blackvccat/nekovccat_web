import { NextRequest, NextResponse } from 'next/server'
import { chatSessionNonce, clientAddress, sameSite, securityError } from '@/lib/server/chat-security'
import { VISITOR_COOKIE, verifyVisitorAccess } from '@/lib/server/visitor-security'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ path: string[] }>
}

function upstreamUrl() {
  return (process.env.PYTHON_API_URL || 'http://127.0.0.1:8011').replace(/\/$/, '')
}

async function proxy(request: NextRequest, context: RouteContext, write: boolean) {
  const ip = clientAddress(request)
  if (!ip) return securityError('请从本站公网入口访问访客模式。', 403)
  const username = verifyVisitorAccess(request.cookies.get(VISITOR_COOKIE)?.value)
  if (!username) return securityError('请先登录访客模式。', 401)
  if (write && !sameSite(request, true)) return securityError('请从本站访客应用发起请求。', 403)

  const { path } = await context.params
  const encoded = path.map(segment => encodeURIComponent(segment)).join('/')
  const upstream = `${upstreamUrl()}/api/visitor/${encoded}${request.nextUrl.search}`
  const headers = new Headers({
    'X-Neko-Internal-Token': process.env.INTERNAL_API_TOKEN || '',
    'X-Neko-Visitor': username,
    'X-Neko-Client-IP': ip,
  })
  const nonce = chatSessionNonce(request)
  if (nonce) headers.set('X-Neko-Session-ID', nonce)
  const contentType = request.headers.get('content-type')
  if (contentType) headers.set('Content-Type', contentType)
  const range = request.headers.get('range')
  if (range) headers.set('Range', range)

  let body: ArrayBuffer | undefined
  if (write) {
    try {
      body = await request.arrayBuffer()
    } catch {
      return securityError('请求体读取失败。', 400)
    }
  }

  let response: Response
  try {
    response = await fetch(upstream, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
      signal: request.signal,
    })
  } catch {
    return securityError('访客服务暂不可用，请稍后再试。', 503)
  }

  const headersOut = new Headers({ 'Cache-Control': 'no-store' })
  for (const key of ['content-type', 'content-disposition', 'content-security-policy', 'x-content-type-options', 'accept-ranges', 'content-range']) {
    const value = response.headers.get(key)
    if (value) headersOut.set(key, value)
  }
  return new Response(response.body, { status: response.status, headers: headersOut })
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxy(request, context, false)
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxy(request, context, true)
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxy(request, context, true)
}
