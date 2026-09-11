import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { isIP } from 'node:net'
import { NextRequest, NextResponse } from 'next/server'

export const SESSION_COOKIE = 'neko-chat-session'
const MAX_BYTES = 65536
export const guarded = () => process.env.NODE_ENV === 'production' || process.env.CHAT_PROTECTION === 'true'
export function sameSite(request: NextRequest, requireOrigin: boolean) {
  const origin = request.headers.get('origin')
  const expected = process.env.SITE_ORIGIN || request.nextUrl.origin
  const fetchSite = request.headers.get('sec-fetch-site')
  return (!requireOrigin && !origin || origin === expected) && (!fetchSite || ['same-origin', 'none'].includes(fetchSite))
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
  if (!match || Number(match[2]) < Date.now() || Number(match[2]) > Date.now() + 2 * 60 * 60 * 1000 || request.headers.get('x-neko-csrf') !== match[1]) return false
  return timingSafeEqual(Buffer.from(match[3], 'hex'), Buffer.from(sign(`${match[1]}.${match[2]}`), 'hex'))
}
export function chatSessionNonce(request: NextRequest) {
  const match = /^([a-f0-9]{48})\.(\d{13})\.([a-f0-9]{64})$/.exec(request.cookies.get(SESSION_COOKIE)?.value || '')
  return match?.[1] || null
}
export function clientAddress(request: NextRequest): string | null {
  if (process.env.TRUST_CLOUDFLARE === 'true') {
    const ip = request.headers.get('cf-connecting-ip') || ''
    return isIP(ip) ? ip : null
  }
  // Never accept visitor-controlled Forwarded / X-Forwarded-For headers.
  return 'local'
}
export async function readChatBody(request: NextRequest): Promise<unknown> {
  if (Number(request.headers.get('content-length') || 0) > MAX_BYTES) throw new Error('too-large')
  const reader = request.body?.getReader()
  if (!reader) throw new Error('invalid')
  const chunks: Uint8Array[] = []; let total = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > MAX_BYTES) { await reader.cancel(); throw new Error('too-large') }
      chunks.push(value)
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } finally { reader.releaseLock() }
}
export function validChatBody(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).join() !== 'messages' || !('messages' in value) || !Array.isArray(value.messages)) return false
  const messages = value.messages
  return messages.length > 0 && messages.length <= 40 && messages.at(-1)?.role === 'user' && messages.every(message => message && typeof message === 'object' && Object.keys(message).every(key => ['role', 'content'].includes(key)) && ['user', 'assistant'].includes(message.role) && typeof message.content === 'string' && message.content.trim().length > 0 && message.content.length <= 6000) && messages.reduce((sum, message) => sum + message.content.length, 0) <= 24000
}
export function securityError(message: string, status: number) { return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } }) }
