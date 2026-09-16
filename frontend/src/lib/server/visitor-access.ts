import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

export const VISITOR_COOKIE = 'marcus-visitor-access'
export const ACCESS_MAX_AGE_SECONDS = 30 * 86400
// The signed cookie carries the visitor's identity and the app ids the backend granted, so the
// desktop can draw the right entries without shipping any app material before login.
const ID_PATTERN = '[a-z0-9][a-z0-9-]{0,31}'
const ENCODED_PATTERN = '[A-Za-z0-9_-]{1,344}'

export interface VisitorIdentity { username: string; name: string; apps: string[] }

const secret = () => process.env.INTERNAL_API_TOKEN || ''
const sign = (purpose: string, value: string) => createHmac('sha256', secret()).update(`${purpose}:${value}`).digest('hex')
const equal = (left: string, right: string) => /^[a-f0-9]{64}$/.test(left) && timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'))
const encode = (value: string) => Buffer.from(value, 'utf8').toString('base64url')

function decode(value: string, maxBytes: number): string | null {
  const bytes = Buffer.from(value, 'base64url')
  if (!bytes.length || bytes.length > maxBytes || bytes.toString('base64url') !== value) return null
  return bytes.toString('utf8')
}

/** Only the backend can mint this: it signs the browser's own chat-session nonce. */
export function verifyUnlockProof(proof: unknown, sessionNonce: string, now = Math.floor(Date.now() / 1000)) {
  if (typeof proof !== 'string' || secret().length < 32) return false
  const match = /^v1\.([a-f0-9]{48})\.(\d{10})\.([a-f0-9]{64})$/.exec(proof)
  if (!match || match[1] !== sessionNonce || Number(match[2]) < now || Number(match[2]) > now + 120) return false
  return equal(match[3], sign('visitor-unlock', `v1.${match[1]}.${match[2]}`))
}

export function createVisitorAccess(identity: VisitorIdentity, now = Math.floor(Date.now() / 1000)) {
  const apps = identity.apps.join(',')
  const payload = `v3.${now + ACCESS_MAX_AGE_SECONDS}.${encode(identity.username)}.${encode(identity.name)}.${apps}.${randomBytes(24).toString('hex')}`
  return `${payload}.${sign('visitor-access', payload)}`
}

export function verifyVisitorAccess(value: string | undefined, now = Math.floor(Date.now() / 1000)): VisitorIdentity | null {
  if (!value || secret().length < 32) return null
  const pattern = new RegExp(`^v3\\.(\\d{10})\\.(${ENCODED_PATTERN})\\.(${ENCODED_PATTERN})\\.([a-z0-9,-]*)\\.([a-f0-9]{48})\\.([a-f0-9]{64})$`)
  const match = pattern.exec(value)
  if (!match || Number(match[1]) < now || Number(match[1]) > now + ACCESS_MAX_AGE_SECONDS) return null
  if (!equal(match[6], sign('visitor-access', `v3.${match[1]}.${match[2]}.${match[3]}.${match[4]}.${match[5]}`))) return null
  const username = decode(match[2], 128)
  const name = decode(match[3], 256)
  const appIds = match[4] ? match[4].split(',') : []
  if (!username || !name || appIds.some(id => !new RegExp(`^${ID_PATTERN}$`).test(id))) return null
  return { username, name, apps: appIds }
}
