import { NextResponse } from 'next/server'
import { guarded } from './chat-security'

interface AttemptState {
  timestamps: number[]
  blockedUntil: number
  expiresAt: number
}
interface AttemptPolicy {
  limit: number
  windowMs: number
  cooldownMs: number
  maxKeys?: number
}
type Admission = { allowed: true } | { allowed: false; retryAfter: number; capacity: boolean }

/** Cheap process-local protection before parsing or proxying. Durable usage limits live in the backend.

 * 这是洪水的第一道闸，也是唯一跑在 Node 里的那道：它挡在读 body、连后端之前，
 * 所以「1 秒 8 次」里的第 4 发起就只剩一次 Map 查找的代价。
 * 后端还有一层同样用意的内存闸门（`attempt_guard.py`），两层都在被拒时重开冷却。
 */
export class ChatAttemptLimiter {
  private readonly states = new Map<string, AttemptState>()
  private nextSweep = 0
  constructor(private readonly policy: AttemptPolicy, private readonly clock = Date.now) {}

  get size() { return this.states.size }

  take(identity: string): Admission {
    const now = this.clock()
    // One bounded sweep per interval, including under a stream of new attacker identities.
    if (now >= this.nextSweep) {
      for (const [key, state] of this.states) if (state.expiresAt <= now) this.states.delete(key)
      this.nextSweep = now + Math.min(this.policy.windowMs, 10000)
    }
    let state = this.states.get(identity)
    if (!state) {
      if (this.states.size >= (this.policy.maxKeys ?? 10000)) {
        return { allowed: false, retryAfter: Math.max(1, Math.ceil((this.nextSweep - now) / 1000)), capacity: true }
      }
      state = { timestamps: [], blockedUntil: 0, expiresAt: now + this.policy.windowMs }
      this.states.set(identity, state)
    }
    state.timestamps = state.timestamps.filter(timestamp => timestamp > now - this.policy.windowMs)
    if (state.blockedUntil > now || state.timestamps.length >= this.policy.limit) {
      // Every rejected attempt restarts the quiet period; repeated retries never reset protection.
      state.blockedUntil = now + this.policy.cooldownMs
      state.expiresAt = Math.max(state.blockedUntil, now + this.policy.windowMs)
      return { allowed: false, retryAfter: Math.ceil(this.policy.cooldownMs / 1000), capacity: false }
    }
    state.timestamps.push(now)
    state.expiresAt = now + this.policy.windowMs
    return { allowed: true }
  }
}

// 聊天与后端 BURST_PER_MINUTE=12 同量级：正常用户撞不到，脚本连发的第 4 发就被挡。
const chatAttempts = new ChatAttemptLimiter({ limit: 3, windowMs: 10000, cooldownMs: 30000 })
const sessionAttempts = new ChatAttemptLimiter({ limit: 12, windowMs: 60000, cooldownMs: 60000 })
// 凭据路径（访客登录）单独一把桶：撞密码与「聊天发得快」是两回事，
// 共用一把桶会让「刚聊过几条就去登录」直接被拦，也会让攻击者的登录尝试被聊天流量掩盖。
const loginAttempts = new ChatAttemptLimiter({ limit: 3, windowMs: 10000, cooldownMs: 30000 })

export function chatAttemptError(identity: string, scope: 'chat' | 'session' | 'login'): NextResponse | null {
  if (!guarded()) return null
  const limiter = scope === 'chat' ? chatAttempts : scope === 'session' ? sessionAttempts : loginAttempts
  const result = limiter.take(identity)
  if (result.allowed) return null
  return NextResponse.json({
    error: result.capacity ? 'Agent 访问量较大，请稍后再试。' : '短时间内请求过多，请暂停发送后再试。',
    code: result.capacity ? 'protection_busy' : 'burst_limit',
    retry_after: result.retryAfter,
  }, { status: result.capacity ? 503 : 429, headers: { 'Cache-Control': 'no-store', 'Retry-After': String(result.retryAfter) } })
}
