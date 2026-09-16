import { NextResponse } from 'next/server'

const base = () => process.env.PYTHON_API_URL || 'http://localhost:8000'

/**
 * Visitor endpoints on the backend only answer the proxy: the shared token proves the caller,
 * the visitor header proves which guest is asking, and the backend re-checks entitlements.
 */
export function visitorHeaders(username: string, extra: Record<string, string> = {}) {
  return {
    'X-Marcus-Internal-Token': process.env.INTERNAL_API_TOKEN || '',
    'X-Marcus-Visitor': username,
    ...extra,
  }
}

export async function visitorBackend(path: string, username: string, init: RequestInit = {}) {
  return fetch(`${base()}${path}`, { ...init, headers: visitorHeaders(username, init.headers as Record<string, string>), cache: 'no-store' })
}

/** Pass a backend error through without inventing a message. */
export async function passthroughError(response: Response, fallback: string) {
  let message = fallback
  try {
    const parsed: unknown = await response.json()
    const detail = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>).detail : null
    if (typeof detail === 'string' && detail) message = detail
  } catch { /* Keep the fallback for non-JSON failures. */ }
  return NextResponse.json({ error: message }, { status: response.status, headers: { 'Cache-Control': 'no-store' } })
}
