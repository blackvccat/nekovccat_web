import { createHmac, timingSafeEqual } from 'node:crypto'

export const VISITOR_COOKIE = 'neko-visitor-access'
const secret = () => process.env.INTERNAL_API_TOKEN || ''
const sign = (purpose: string, value: string) => createHmac('sha256', secret()).update(`${purpose}:${value}`).digest('hex')
const equal = (left: string, right: string) =>
  /^[a-f0-9]{64}$/.test(left) && timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'))

export function createVisitorAccess(username: string, now = Math.floor(Date.now() / 1000)) {
  const encoded = Buffer.from(username, 'utf8').toString('base64url')
  const payload = `v1.${encoded}.${now + 30 * 86400}`
  return `${payload}.${sign('visitor-access', payload)}`
}

export function verifyVisitorAccess(value: string | undefined, now = Math.floor(Date.now() / 1000)): string | null {
  if (!value || secret().length < 32) return null
  const match = /^v1\.([A-Za-z0-9_-]+)\.(\d{10})\.([a-f0-9]{64})$/.exec(value)
  if (!match || Number(match[2]) < now || Number(match[2]) > now + 30 * 86400) return null
  if (!equal(match[3], sign('visitor-access', `v1.${match[1]}.${match[2]}`))) return null
  try {
    const username = Buffer.from(match[1], 'base64url').toString('utf8')
    return username && username.length <= 64 ? username : null
  } catch {
    return null
  }
}

/** Verify the short-lived proof returned by the Go visitor login endpoint. */
export function verifyVisitorProof(proof: unknown, sessionNonce: string, now = Math.floor(Date.now() / 1000)) {
  if (typeof proof !== 'string' || secret().length < 32) return false
  const match = /^v1\.([a-f0-9]{48})\.(\d{10})\.([a-f0-9]{64})$/.exec(proof)
  if (!match || match[1] !== sessionNonce || Number(match[2]) < now || Number(match[2]) > now + 120) return false
  return equal(match[3], sign('visitor-unlock', `v1.${match[1]}.${match[2]}`))
}
