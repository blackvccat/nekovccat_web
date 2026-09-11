import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextRequest, NextResponse } from 'next/server'
import { RELATIONSHIP_COOKIE, verifyRelationshipAccess } from '@/lib/server/relationship-security'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!verifyRelationshipAccess(request.cookies.get(RELATIONSHIP_COOKIE)?.value)) return new NextResponse(null, { status: 403 })
  try {
    const imagePath = process.env.RELATIONSHIP_WALLPAPER_PATH || path.join(process.cwd(), '..', 'work', 'relationship-private', 'couple-wallpaper.webp')
    return new NextResponse(await readFile(/* turbopackIgnore: true */ imagePath), { headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } })
  } catch { return new NextResponse(null, { status: 503 }) }
}
