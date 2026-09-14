import { NextRequest, NextResponse } from 'next/server'
import { chatSessionNonce, checkChatSession, clientAddress, readChatBody, securityError } from '@/lib/server/chat-security'
import { chatAttemptError } from '@/lib/server/chat-attempt-limiter'
import { createRelationshipAccess, RELATIONSHIP_COOKIE, verifyUnlockProof } from '@/lib/server/relationship-security'

export async function POST(request: NextRequest) {
  const ip = clientAddress(request)
  if (!ip) return securityError('请从本站公网入口访问 Agent。', 403)
  const limited = chatAttemptError(ip, 'unlock')
  if (limited) return limited
  if (!checkChatSession(request)) return securityError('聊天会话已过期，请重新完成验证。', 403)
  const nonce = chatSessionNonce(request)
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return securityError('请求格式不支持。', 415)
  let body: unknown
  try { body = await readChatBody(request) } catch (error) {
    if (error instanceof Error && error.message === 'aborted') return new Response(null, { status: 499 })
    if (error instanceof Error && error.message === 'too-slow') return securityError('解锁凭证上传超时，请检查网络后重试。', 408)
    return securityError('解锁凭证格式无效或过大。', error instanceof Error && error.message === 'too-large' ? 413 : 400)
  }
  const proof = body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>).proof : null
  if (!nonce || !verifyUnlockProof(proof, nonce)) return securityError('解锁凭证无效或已过期。', 403)
  const response = NextResponse.json({ unlocked: true }, { headers: { 'Cache-Control': 'no-store' } })
  response.cookies.set(RELATIONSHIP_COOKIE, createRelationshipAccess(), {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 30 * 86400,
  })
  return response
}
