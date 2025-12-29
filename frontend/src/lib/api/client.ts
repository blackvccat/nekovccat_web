/**
 * API 客户端工具
 * 在开发环境使用 Next.js API 路由，在生产环境（GitHub Pages）直接调用后端 API
 */

const getApiBaseUrl = (): string => {
  // 如果配置了后端 API URL，直接使用
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }
  
  // 开发环境使用相对路径（Next.js API 路由）
  if (process.env.NODE_ENV === 'development') {
    return ''
  }
  
  // 生产环境默认后端地址
  return 'https://nekovccat.origin.kim'
}

/**
 * 获取聊天 API 端点
 */
export const getChatApiUrl = (stream: boolean = false): string => {
  const baseUrl = getApiBaseUrl()
  
  // 开发环境使用 Next.js API 路由
  if (process.env.NODE_ENV === 'development' || !baseUrl) {
    return `/api/chat${stream ? '?stream=true' : ''}`
  }
  
  // 生产环境直接调用后端 API
  return `${baseUrl}/api/chat/${stream ? '?stream=true' : ''}`
}

/**
 * 获取健康检查 API 端点
 */
export const getHealthApiUrl = (): string => {
  const baseUrl = getApiBaseUrl()
  
  if (process.env.NODE_ENV === 'development' || !baseUrl) {
    return '/api/health'
  }
  
  return `${baseUrl}/api/health`
}

