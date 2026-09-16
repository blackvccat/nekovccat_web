import { NextRequest, NextResponse } from 'next/server'
import { chatAttemptError } from '@/lib/server/chat-attempt-limiter'
import { clientAddress, DEVICE_COOKIE, DEVICE_MAX_AGE_SECONDS, SESSION_COOKIE, createChatSession, ensureDevice, guarded, sameSite, securityError } from '@/lib/server/chat-security'

export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  if (!sameSite(request, false)) return securityError('请从本站打开 Agent。', 403)
  // 这个路由每次发消息都会被调到（取 CSRF nonce），所以它也按 IP 限一发，
  // 免得有人拿它当廉价入口刷 HMAC。上限与后端 BURST_PER_MINUTE 同量级（12/分）。
  const ip = clientAddress(request)
  const limited = ip ? chatAttemptError(ip, 'session') : null
  if (limited) return limited
  const session = createChatSession()
  if (!session) return securityError('站内 Agent 正在维护，请稍后再试。', 503)
  const device = ensureDevice(request)
  const response = NextResponse.json({ token: session.token }, { headers: { 'Cache-Control': 'no-store' } })
  response.cookies.set(SESSION_COOKIE, session.cookie, { httpOnly: true, secure: guarded(), sameSite: 'strict', path: '/api/chat', maxAge: 7200 })
  // 匿名额度按设备分桶。这个路由每次发消息都会被调到，所以续期让同一个人始终落在同一个桶里；
  // 签名有效时沿用原值，凭空造一个只会给自己换一个新桶（后端另有按地址的聚合上限兜底）。
  response.cookies.set(DEVICE_COOKIE, device.cookie, { httpOnly: true, secure: guarded(), sameSite: 'strict', path: '/api/chat', maxAge: DEVICE_MAX_AGE_SECONDS })
  return response
}
