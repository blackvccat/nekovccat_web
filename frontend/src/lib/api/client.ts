/**
 * API 客户端工具
 * 默认使用同源 Next.js API 路由；静态托管可显式配置外部后端。
 */

const getApiBaseUrl = (): string => {
  return (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '')
}

/**
 * 获取聊天 API 端点
 */
export const getChatApiUrl = (stream: boolean = false): string => {
  const baseUrl = getApiBaseUrl()
  
  if (!baseUrl) {
    return `/api/chat${stream ? '?stream=true' : ''}`
  }
  
  // 显式外部地址使用 FastAPI 的路由格式。
  return `${baseUrl}/api/chat/${stream ? '?stream=true' : ''}`
}

/**
 * 获取健康检查 API 端点
 */
export const getHealthApiUrl = (): string => {
  const baseUrl = getApiBaseUrl()
  
  if (!baseUrl) {
    return '/api/health'
  }
  
  return `${baseUrl}/api/health`
}
