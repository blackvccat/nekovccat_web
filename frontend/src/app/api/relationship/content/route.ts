import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextRequest, NextResponse } from 'next/server'
import { RELATIONSHIP_COOKIE, verifyRelationshipAccess } from '@/lib/server/relationship-security'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!verifyRelationshipAccess(request.cookies.get(RELATIONSHIP_COOKIE)?.value)) {
    return NextResponse.json({ error: '未解锁' }, { status: 403, headers: { 'Cache-Control': 'no-store' } })
  }
  try {
    const privatePath = process.env.RELATIONSHIP_PRIVATE_PATH || path.join(process.cwd(), '..', 'work', 'relationship-private.json')
    const data: unknown = JSON.parse(await readFile(/* turbopackIgnore: true */ privatePath, 'utf8'))
    const content = data && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>).content : null
    if (!content || typeof content !== 'object' || Array.isArray(content)) throw new Error('invalid')
    return NextResponse.json(content, { headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } })
  } catch {
    return NextResponse.json({ error: '彩蛋内容暂不可用' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
