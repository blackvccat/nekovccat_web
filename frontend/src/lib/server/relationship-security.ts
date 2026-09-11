import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

export const RELATIONSHIP_COOKIE = 'neko-relationship-access'
const secret = () => process.env.INTERNAL_API_TOKEN || ''
const sign = (purpose: string, value: string) => createHmac('sha256', secret()).update(`${purpose}:${value}`).digest('hex')
const equal = (left: string, right: string) => /^[a-f0-9]{64}$/.test(left) && timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'))

export function verifyUnlockProof(proof: unknown, sessionNonce: string, now = Math.floor(Date.now() / 1000)) {
  if (typeof proof !== 'string' || secret().length < 32) return false
  const match = /^v1\.([a-f0-9]{48})\.(\d{10})\.([a-f0-9]{64})$/.exec(proof)
  if (!match || match[1] !== sessionNonce || Number(match[2]) < now || Number(match[2]) > now + 120) return false
  return equal(match[3], sign('relationship-unlock', `v1.${match[1]}.${match[2]}`))
}

export function createRelationshipAccess(now = Math.floor(Date.now() / 1000)) {
  const payload = `v1.${now + 30 * 86400}.${randomBytes(24).toString('hex')}`
  return `${payload}.${sign('relationship-access', payload)}`
}

export function verifyRelationshipAccess(value: string | undefined, now = Math.floor(Date.now() / 1000)) {
  if (!value || secret().length < 32) return false
  const match = /^v1\.(\d{10})\.([a-f0-9]{48})\.([a-f0-9]{64})$/.exec(value)
  if (!match || Number(match[1]) < now || Number(match[1]) > now + 30 * 86400) return false
  return equal(match[3], sign('relationship-access', `v1.${match[1]}.${match[2]}`))
}
