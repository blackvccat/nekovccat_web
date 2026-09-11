import { NextRequest, NextResponse } from 'next/server'
import { RELATIONSHIP_COOKIE, verifyRelationshipAccess } from '@/lib/server/relationship-security'

export async function GET(request: NextRequest) {
  const unlocked = verifyRelationshipAccess(request.cookies.get(RELATIONSHIP_COOKIE)?.value)
  return NextResponse.json({ unlocked }, { headers: { 'Cache-Control': 'no-store' } })
}
