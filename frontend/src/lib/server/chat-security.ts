import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { isIP } from 'node:net'
import { NextRequest, NextResponse } from 'next/server'

export const SESSION_COOKIE = 'marcus-chat-session'
const MAX_BYTES = 65536
// body 读取的截止：声明长度合法、却把 body 拖着慢慢发的客户端不能一直占着这条连接。
const MAX_BODY_READ_MS = 5000
export const guarded = () => process.env.NODE_ENV === 'production' || process.env.CHAT_PROTECTION === 'true'
export function sameSite(request: NextRequest, requireOrigin: boolean) {
  const origin = request.headers.get('origin')
  const expected = process.env.SITE_ORIGIN || request.nextUrl.origin
  const fetchSite = request.headers.get('sec-fetch-site')
  if (fetchSite && !['same-origin', 'none'].includes(fetchSite)) return false
  if (!origin) return !requireOrigin
  if (origin === expected) return true
  // Next dev reports nextUrl.origin as localhost while the browser uses 127.0.0.1. Only loopback
  // origins matching this request's own Host header may pass without SITE_ORIGIN; production sets it.
  if (process.env.SITE_ORIGIN) return false
  try {
    const url = new URL(origin)
    const loopback = ['localhost', '127.0.0.1', '[::1]', '::1'].includes(url.hostname)
    return loopback && url.host === request.headers.get('host')
  } catch { return false }
}
function sign(value: string) { return createHmac('sha256', process.env.INTERNAL_API_TOKEN || '').update(value).digest('hex') }
export function createChatSession() {
  if (guarded() && (process.env.INTERNAL_API_TOKEN || '').length < 32) return null
  const nonce = randomBytes(24).toString('hex')
  const value = `${nonce}.${Date.now() + 2 * 60 * 60 * 1000}`
  return { token: nonce, cookie: `${value}.${sign(value)}` }
}
export function checkChatSession(request: NextRequest) {
  if (!guarded()) return true
  if ((process.env.INTERNAL_API_TOKEN || '').length < 32 || !sameSite(request, true)) return false
  const cookie = request.cookies.get(SESSION_COOKIE)?.value || ''
  const match = /^([a-f0-9]{48})\.(\d{13})\.([a-f0-9]{64})$/.exec(cookie)
  if (!match || Number(match[2]) < Date.now() || Number(match[2]) > Date.now() + 2 * 60 * 60 * 1000 || request.headers.get('x-marcus-csrf') !== match[1]) return false
  return timingSafeEqual(Buffer.from(match[3], 'hex'), Buffer.from(sign(`${match[1]}.${match[2]}`), 'hex'))
}
export function chatSessionNonce(request: NextRequest) {
  const match = /^([a-f0-9]{48})\.(\d{13})\.([a-f0-9]{64})$/.exec(request.cookies.get(SESSION_COOKIE)?.value || '')
  return match?.[1] || null
}
export const DEVICE_COOKIE = 'marcus-device'
export const DEVICE_MAX_AGE_SECONDS = 24 * 60 * 60
const DEVICE_PATTERN = /^([a-f0-9]{48})\.([a-f0-9]{64})$/
/** The anonymous quota is bucketed per device; mint one only when the signed cookie is missing or stale. */
export function readDevice(request: NextRequest): string | null {
  const match = DEVICE_PATTERN.exec(request.cookies.get(DEVICE_COOKIE)?.value || '')
  if (!match) return null
  return timingSafeEqual(Buffer.from(match[2], 'hex'), Buffer.from(sign(match[1]), 'hex')) ? match[1] : null
}
/** The anonymous quota is bucketed per device; mint one only when the signed cookie is missing or stale. */
export function ensureDevice(request: NextRequest) {
  const nonce = readDevice(request) || randomBytes(24).toString('hex')
  return { nonce, cookie: `${nonce}.${sign(nonce)}` }
}
/** One identity per visitor network: an IPv6 address collapses to its /64, a mapped IPv4 to IPv4.
 *
 * 运营商给每个用户至少一整个 /64，客户端又会不停更换低 64 位（隐私扩展地址），
 * 所以按完整地址分桶等于给一个人无限多的桶，限额一换后缀就重置。
 */
export function canonicalClientAddress(ip: string): string | null {
  if (isIP(ip) === 4) return ip
  if (isIP(ip) !== 6 || ip.includes('%')) return null
  try {
    // WHATWG URL parsing canonicalizes IPv6 spelling and an embedded IPv4 suffix first.
    const normalized = new URL(`http://[${ip}]/`).hostname.slice(1, -1)
    const [left, right] = normalized.split('::')
    const start = left ? left.split(':') : []
    const end = right ? right.split(':') : []
    const words = (right === undefined ? start : [...start, ...Array(8 - start.length - end.length).fill('0'), ...end]).map(word => parseInt(word, 16))
    if (words.slice(0, 5).every(word => word === 0) && words[5] === 0xffff) {
      return [words[6] >> 8, words[6] & 255, words[7] >> 8, words[7] & 255].join('.')
    }
    return new URL(`http://[${words.slice(0, 4).map(word => word.toString(16)).join(':')}::]/`).hostname.slice(1, -1)
  } catch { return null }
}
export function clientAddress(request: NextRequest): string | null {
  if (process.env.TRUST_CLOUDFLARE === 'true') {
    return canonicalClientAddress(request.headers.get('cf-connecting-ip') || '')
  }
  // 自建反向代理（nginx）自己终结 TLS 时用这个：只认代理覆写过的 x-real-ip。
  // 前提和 TRUST_CLOUDFLARE 一样——应用只能经该代理访问（只绑回环），且代理用
  // proxy_set_header X-Real-IP $remote_addr; 覆写，而不是把客户端给的值透传进来。
  if (process.env.TRUST_PROXY_IP === 'true') {
    return canonicalClientAddress(request.headers.get('x-real-ip') || '')
  }
  // Never accept visitor-controlled Forwarded / X-Forwarded-For headers.
  return 'local'
}
export async function readChatBody(request: NextRequest): Promise<unknown> {
  if (Number(request.headers.get('content-length') || 0) > MAX_BYTES) throw new Error('too-large')
  const reader = request.body?.getReader()
  if (!reader) throw new Error('invalid')
  const chunks: Uint8Array[] = []; let total = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  let stopRead: () => void = () => {}
  // 两种收场都要把 reader 放掉：浏览器断开时（aborted）和服务端等的太久时（too-slow）。
  const deadline = new Promise<never>((_resolve, reject) => {
    stopRead = () => { reject(new Error('aborted')); void reader.cancel().catch(() => undefined) }
    timer = setTimeout(() => { reject(new Error('too-slow')); void reader.cancel().catch(() => undefined) }, MAX_BODY_READ_MS)
    request.signal.addEventListener('abort', stopRead, { once: true })
    if (request.signal.aborted) stopRead()
  })
  try {
    while (true) {
      const { value, done } = await Promise.race([reader.read(), deadline])
      if (done) break
      total += value.byteLength
      if (total > MAX_BYTES) { void reader.cancel().catch(() => undefined); throw new Error('too-large') }
      chunks.push(value)
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } finally {
    clearTimeout(timer)
    request.signal.removeEventListener('abort', stopRead)
    reader.releaseLock()
  }
}
export function validChatBody(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).join() !== 'messages' || !('messages' in value) || !Array.isArray(value.messages)) return false
  const messages = value.messages
  return messages.length > 0 && messages.length <= 40 && messages.at(-1)?.role === 'user' && messages.every(message => message && typeof message === 'object' && Object.keys(message).every(key => ['role', 'content'].includes(key)) && ['user', 'assistant'].includes(message.role) && typeof message.content === 'string' && message.content.trim().length > 0 && message.content.length <= 6000) && messages.reduce((sum, message) => sum + message.content.length, 0) <= 24000
}
export function securityError(message: string, status: number) { return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } }) }
