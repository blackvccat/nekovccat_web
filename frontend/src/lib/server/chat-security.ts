import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { isIP } from 'node:net'
import { NextRequest, NextResponse } from 'next/server'

export const SESSION_COOKIE = 'neko-chat-session'
const MAX_BYTES = 65536
const MAX_BODY_READ_MS = 5000
const SESSION_MS = 2 * 60 * 60 * 1000
export const guarded = () => process.env.NODE_ENV === 'production' || process.env.CHAT_PROTECTION === 'true'
export function sameSite(request: NextRequest, requireOrigin: boolean) {
  const origin = request.headers.get('origin')
  const expected = process.env.SITE_ORIGIN || request.nextUrl.origin
  const fetchSite = request.headers.get('sec-fetch-site')
  return (!requireOrigin && !origin || origin === expected) && (!fetchSite || ['same-origin', 'none'].includes(fetchSite))
}
function sign(value: string) { return createHmac('sha256', process.env.INTERNAL_API_TOKEN || '').update(value).digest('hex') }
function authenticatedSession(request: NextRequest) {
  if (guarded() && (process.env.INTERNAL_API_TOKEN || '').length < 32) return null
  const cookie = request.cookies.get(SESSION_COOKIE)?.value || ''
  const match = /^([a-f0-9]{48})\.(\d{13})\.([a-f0-9]{64})$/.exec(cookie)
  const now = Date.now()
  if (!match || Number(match[2]) <= now || Number(match[2]) > now + SESSION_MS) return null
  if (!timingSafeEqual(Buffer.from(match[3], 'hex'), Buffer.from(sign(`${match[1]}.${match[2]}`), 'hex'))) return null
  return { token: match[1], cookie, expiresAt: Number(match[2]) }
}
export function createChatSession(request?: NextRequest) {
  if (guarded() && (process.env.INTERNAL_API_TOKEN || '').length < 32) return null
  const existing = request && authenticatedSession(request)
  if (existing) return existing
  const nonce = randomBytes(24).toString('hex')
  const expiresAt = Date.now() + SESSION_MS
  const value = `${nonce}.${expiresAt}`
  return { token: nonce, cookie: `${value}.${sign(value)}`, expiresAt }
}
export function checkChatSession(request: NextRequest) {
  if (!guarded()) return true
  if ((process.env.INTERNAL_API_TOKEN || '').length < 32 || !sameSite(request, true)) return false
  const session = authenticatedSession(request)
  return !!session && request.headers.get('x-neko-csrf') === session.token
}
export function chatSessionNonce(request: NextRequest) {
  return authenticatedSession(request)?.token || null
}
/** IPv6 visitors share their /64; alternate spellings and mapped IPv4 cannot reset limits. */
export function canonicalClientAddress(ip: string): string | null {
  if (isIP(ip) === 4) return ip
  if (isIP(ip) !== 6 || ip.includes('%')) return null
  // WHATWG URL parsing canonicalizes IPv4 suffixes and IPv6 spelling first.
  const normalized = new URL(`http://[${ip}]/`).hostname.slice(1, -1)
  const [left, right] = normalized.split('::')
  const start = left ? left.split(':') : []
  const end = right ? right.split(':') : []
  const words = (right === undefined ? start : [...start, ...Array(8 - start.length - end.length).fill('0'), ...end]).map(word => parseInt(word, 16))
  if (words.slice(0, 5).every(word => word === 0) && words[5] === 0xffff) {
    return [words[6] >> 8, words[6] & 255, words[7] >> 8, words[7] & 255].join('.')
  }
  return new URL(`http://[${words.slice(0, 4).map(word => word.toString(16)).join(':')}::]/`).hostname.slice(1, -1)
}
export function clientAddress(request: NextRequest): string | null {
  if (process.env.TRUST_CLOUDFLARE === 'true') {
    const ip = request.headers.get('cf-connecting-ip') || ''
    return canonicalClientAddress(ip)
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
  } finally { clearTimeout(timer); request.signal.removeEventListener('abort', stopRead); reader.releaseLock() }
}
export function validChatBody(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).join() !== 'messages' || !('messages' in value) || !Array.isArray(value.messages)) return false
  const messages = value.messages
  return messages.length > 0 && messages.length <= 40 && messages.at(-1)?.role === 'user' && messages.every(message => message && typeof message === 'object' && Object.keys(message).every(key => ['role', 'content'].includes(key)) && ['user', 'assistant'].includes(message.role) && typeof message.content === 'string' && message.content.trim().length > 0 && message.content.length <= 6000) && messages.reduce((sum, message) => sum + message.content.length, 0) <= 24000
}
export function securityError(message: string, status: number) { return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } }) }
