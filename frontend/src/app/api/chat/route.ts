import { NextRequest, NextResponse } from 'next/server'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Agent 聊天 API - 代理到 Python 后端
 * POST /api/chat
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    // Python 后端 URL（从环境变量获取，默认 localhost:8000）
    const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000'

    // 转发到 Python 后端
    const response = await fetch(`${pythonApiUrl}/api/chat/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `Python API error: ${response.status} ${response.statusText} - ${errorData.detail || 'Unknown error'}`
      )
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Chat API proxy error:', error)
    
    // 如果 Python 后端不可用，返回友好的错误信息
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        {
          error: 'Backend service unavailable',
          message: 'The chat service is currently unavailable. Please try again later.',
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

