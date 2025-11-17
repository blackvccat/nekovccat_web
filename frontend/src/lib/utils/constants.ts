/**
 * 应用常量定义
 */

export const APP_CONFIG = {
  name: 'Nekovccat App',
  description: '企业级 Next.js 应用',
  version: '0.1.0',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://nekovccat.origin.kim',
  domain: 'nekovccat.origin.kim',
} as const

export const API_CONFIG = {
  timeout: 30000, // 30 秒
  retryAttempts: 3,
} as const

