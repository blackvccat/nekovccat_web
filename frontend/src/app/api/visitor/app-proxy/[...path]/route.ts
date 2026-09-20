import { NextRequest, NextResponse } from 'next/server'
import { sameSite } from '@/lib/server/chat-security'
import { VISITOR_COOKIE, verifyVisitorAccess } from '@/lib/server/visitor-access'
import { passthroughError, visitorBackend } from '@/lib/server/visitor-backend'

export const dynamic = 'force-dynamic'

const APP_ID = /^[a-z0-9][a-z0-9-]{0,31}$/
/** 应用上传的文件上限，与后端一致（8MB）。超过就不读，直接 413，别把大 body 缓进 Node 内存。 */
const MAX_WRITE_BYTES = 8 * 1024 * 1024

/** 读请求体并强制上限：声明长度超限直接拒绝；分块传输也在累计超限时中止并丢弃。 */
async function boundedBody(request: NextRequest): Promise<ArrayBuffer | null> {
  const declared = Number(request.headers.get('content-length') ?? Number.NaN)
  if (Number.isFinite(declared) && declared > MAX_WRITE_BYTES) return null
  const reader = request.body?.getReader()
  if (!reader) return new ArrayBuffer(0)
  const chunks: Uint8Array[] = []
  let total = 0
  try {
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > MAX_WRITE_BYTES) { void reader.cancel().catch(() => undefined); return null }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  const merged = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength }
  return merged.buffer
}

/**
 * 真实访客应用的**受控转发口**：应用（同源 iframe）只能经这里访问自己的数据与文件。
 *
 * - 只允许转发到后端 `/api/visitor/apps/<id>/…`，其它后端路径一律拒绝；
 * - 必须带有效的访客 Cookie，且 Cookie 的授权里包含这个 app（后端还会再按账号复核一次）；
 * - **写操作（PUT/POST/DELETE）要求同源**：Cookie 是 SameSite=strict，但同站的其它页面仍会带上它，
 *   所以再按 Origin / Sec-Fetch-Site 校验一次，挡住同站的跨站写；
 * - 请求体有硬上限（8MB），声明或实际超限都直接 413，不把大 body 读进内存；
 * - 响应原样回传（HTML / JS / 文件字节），但统一 `private, no-store`。
 *
 * 前端产物里因此没有任何访客应用的界面或数据：界面是登录后由后端下发的 HTML。
 */
async function forward(request: NextRequest, method: string, params: Promise<{ path: string[] }>) {
  const visitor = verifyVisitorAccess(request.cookies.get(VISITOR_COOKIE)?.value)
  if (!visitor) return new NextResponse(null, { status: 403 })
  const { path } = await params
  if (!Array.isArray(path) || path.length < 3 || path[0] !== 'apps' || !APP_ID.test(path[1] || '') || !visitor.apps.includes(path[1])) {
    return new NextResponse(null, { status: 403 })
  }
  const hasBody = method !== 'GET' && method !== 'HEAD'
  if (hasBody && !sameSite(request, true)) return new NextResponse(null, { status: 403 })
  let payload: ArrayBuffer | undefined
  if (hasBody) {
    const read = await boundedBody(request)
    if (read === null) return NextResponse.json({ error: '文件太大。' }, { status: 413, headers: { 'Cache-Control': 'no-store' } })
    payload = read
  }
  const target = `/api/visitor/${path.map(segment => encodeURIComponent(segment)).join('/')}${request.nextUrl.search}`
  try {
    const response = await visitorBackend(target, visitor.username, {
      method,
      body: payload,
      headers: { 'Content-Type': request.headers.get('content-type') || 'application/octet-stream' },
      signal: request.signal,
    })
    if (!response.ok || !response.body) return passthroughError(response, '应用请求失败，请稍后再试。')
    const headers = new Headers({ 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' })
    const type = response.headers.get('content-type')
    if (type) headers.set('Content-Type', type)
    const disposition = response.headers.get('content-disposition')
    if (disposition) headers.set('Content-Disposition', disposition)
    // 后端按应用收口的 shell CSP 要透传：全局 CSP 与它取交集，第三方内嵌才只认 app.json 的 embeds。
    const csp = response.headers.get('content-security-policy')
    if (csp) headers.set('Content-Security-Policy', csp)
    return new NextResponse(response.body, { status: response.status, headers })
  } catch {
    if (request.signal.aborted) return new Response(null, { status: 499 })
    return new NextResponse(null, { status: 503 })
  }
}

type Context = { params: Promise<{ path: string[] }> }
export const GET = (request: NextRequest, context: Context) => forward(request, 'GET', context.params)
export const PUT = (request: NextRequest, context: Context) => forward(request, 'PUT', context.params)
export const POST = (request: NextRequest, context: Context) => forward(request, 'POST', context.params)
export const DELETE = (request: NextRequest, context: Context) => forward(request, 'DELETE', context.params)
