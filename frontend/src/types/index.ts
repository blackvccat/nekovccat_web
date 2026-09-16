/**
 * 全局类型定义
 */

// 示例：用户类型
export interface User {
  id: string
  email: string
  name: string | null
  createdAt: Date
  updatedAt: Date
}

// API 响应类型
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 分页类型
export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

