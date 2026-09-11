import { NextRequest, NextResponse } from 'next/server'
import { chatSessionNonce, checkChatSession, securityError } from '@/lib/server/chat-security'
import { createRelationshipAccess, RELATIONSHIP_COOKIE, verifyUnlockProof } from '@/lib/server/relationship-security'

export async function POST(request: NextRequest) {
  if (!checkChatSession(request)) return securityError('聊天会话已过期，请重新完成验证。', 403)
  const nonce = chatSessionNonce(request)
  let body: unknown
  try { body = await request.json() } catch { return securityError('解锁凭证格式无效。', 400) }
  const proof = body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>).proof : null
  if (!nonce || !verifyUnlockProof(proof, nonce)) return securityError('解锁凭证无效或已过期。', 403)
  const response = NextResponse.json({ unlocked: true }, { headers: { 'Cache-Control': 'no-store' } })
  response.cookies.set(RELATIONSHIP_COOKIE, createRelationshipAccess(), {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 30 * 86400,
  })
  return response
}
