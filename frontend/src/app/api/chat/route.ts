import { NextRequest, NextResponse } from 'next/server'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Agent 聊天 API - 代理到 Python 后端
 * POST /api/chat
 * 支持流式响应（通过 ?stream=true 参数）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const stream = searchParams.get('stream') === 'true'

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    // Python 后端 URL（从环境变量获取，默认 localhost:8000）
    const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000'

    // 转发到 Python 后端
    const response = await fetch(`${pythonApiUrl}/api/chat/?stream=${stream}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    // 如果是流式响应，直接转发流
    if (stream) {
      // 先检查 Content-Type，决定处理方式
      const contentType = response.headers.get('content-type') || ''
      
      // 如果后端返回 JSON 而不是流式响应，按 JSON 处理
      if (contentType.includes('application/json')) {
        if (!response.ok) {
          let errorDetail = 'Unknown error'
          try {
            const errorData = await response.json()
            // 尝试多种可能的错误字段
            errorDetail = errorData.detail || errorData.message || errorData.error || errorDetail
            // 如果有更多信息，添加到错误消息中
            if (errorData.message && errorData.message !== errorDetail) {
              errorDetail = `${errorDetail} (${errorData.message})`
            }
          } catch (e) {
            // 如果无法解析 JSON，尝试读取文本
            try {
              const errorText = await response.text()
              if (errorText) {
                errorDetail = errorText
              }
            } catch {
              // 忽略，使用默认错误消息
            }
          }
          throw new Error(
            `Python API error: ${response.status} ${response.statusText} - ${errorDetail}`
          )
        }
        const data = await response.json()
        return NextResponse.json(data)
      }
      
      // 检查响应状态（对于流式响应）
      if (!response.ok) {
        // 对于流式响应，如果出错，尝试读取错误信息
        try {
          const errorText = await response.text()
          let errorData: any = {}
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData.detail = errorText
          }
          throw new Error(
            `Python API error: ${response.status} ${response.statusText} - ${errorData.detail || errorText || 'Unknown error'}`
          )
        } catch (e) {
          if (e instanceof Error && e.message.includes('Python API error')) {
            throw e
          }
          throw new Error(
            `Python API error: ${response.status} ${response.statusText}`
          )
        }
      }
      
      // 如果是流式响应，转发流
      if (!contentType.includes('text/event-stream')) {
        console.warn(`Unexpected content-type for streaming: ${contentType}, treating as stream`)
      }
      
      if (!response.body) {
        throw new Error('No response body for streaming')
      }
      
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // 非流式响应
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

