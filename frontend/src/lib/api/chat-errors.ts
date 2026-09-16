/** Turn an upstream rejection into one readable sentence, including how long to wait.
 *
 * 只有后端知道配额窗口什么时候有空位，所以等待时间以响应头为准，不自动重试：
 * 自动重试会在冷却期里反复撞同一个窗口，把限制拖得更久。
 */
export function retryAfterSeconds(value: string | null, now = Date.now()): number | null {
  if (!value) return null
  if (/^\d+$/.test(value)) {
    const seconds = Number(value)
    return seconds > 0 ? seconds : null
  }
  if (!/^[A-Za-z]{3}, .+ GMT$/.test(value)) return null
  const seconds = (Date.parse(value) - now) / 1000
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : null
}

export function waitText(seconds: number): string {
  if (seconds < 60) return `${seconds} 秒`
  if (seconds < 3600) return `${Math.ceil(seconds / 60)} 分钟`
  return `${Math.ceil(seconds / 3600)} 小时`
}

export async function responseErrorText(response: Response, fallback: string): Promise<string> {
  let detail = fallback
  try {
    const data = await response.json()
    const message = data?.message ?? data?.error ?? data?.detail
    if (typeof message === 'string' && message.trim()) detail = message
  } catch { /* 非 JSON 响应保留兜底文案。 */ }
  if (response.status !== 429 && response.status !== 503) return detail
  const seconds = retryAfterSeconds(response.headers.get('retry-after'))
  if (seconds === null) return detail
  return `${detail} 请等待 ${waitText(seconds)}后再试，期间请勿重复发送。`
}
