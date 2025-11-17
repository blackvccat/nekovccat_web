import { z } from 'zod'

/**
 * 常用验证 Schema
 */

// 邮箱验证
export const emailSchema = z.string().email('请输入有效的邮箱地址')

// 密码验证（至少8位，包含字母和数字）
export const passwordSchema = z
  .string()
  .min(8, '密码至少需要8个字符')
  .regex(/[A-Za-z]/, '密码必须包含字母')
  .regex(/[0-9]/, '密码必须包含数字')

// 用户注册 Schema
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(2, '姓名至少需要2个字符').optional(),
})

// 用户登录 Schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, '请输入密码'),
})

