import { NextResponse } from 'next/server'

/**
 * 健康检查 API
 * GET /api/health
 */
export async function GET() {
  try {
    // 可以在这里添加数据库连接检查
    // await prisma.$queryRaw`SELECT 1`

    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

