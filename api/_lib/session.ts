// Admin login: one shared password (ADMIN_PASSWORD) and a signed session cookie (SESSION_SECRET).
// The cookie holds the editor's name and an expiry, signed with HMAC so it cannot be forged or edited.
import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { env, HttpError } from './http.js'

const COOKIE = 'maanran_admin'
const MAX_AGE = 7 * 24 * 60 * 60 // seconds

export type Session = { name: string; exp: number }

const sign = (payload: string) => createHmac('sha256', env('SESSION_SECRET')).update(payload).digest('base64url')

// Compares hashes so the check takes the same time whatever the input (no length or timing hints).
// Spaces and line breaks at either end are ignored: they easily sneak in when pasting the value into Vercel.
export function passwordMatches(input: string) {
  const a = createHash('sha256').update(input.trim()).digest()
  const b = createHash('sha256').update(env('ADMIN_PASSWORD').trim()).digest()
  return timingSafeEqual(a, b)
}

export function sessionCookie(name: string) {
  const payload = Buffer.from(JSON.stringify({ name, exp: Math.floor(Date.now() / 1000) + MAX_AGE } satisfies Session)).toString('base64url')
  return `${COOKIE}=${payload}.${sign(payload)}; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=${MAX_AGE}`
}

export const clearedCookie = `${COOKIE}=; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=0`

export function readSession(request: Request): Session | null {
  const raw = request.headers
    .get('cookie')
    ?.split(/;\s*/)
    .find((c) => c.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1)
  if (!raw) return null
  const [payload, signature] = raw.split('.')
  if (!payload || !signature) return null
  const expected = Buffer.from(sign(payload))
  const given = Buffer.from(signature)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Session
    return session.exp > Date.now() / 1000 && typeof session.name === 'string' ? session : null
  } catch {
    return null
  }
}

export function requireSession(request: Request) {
  const session = readSession(request)
  if (!session) throw new HttpError(401, 'Please log in again.')
  return session
}
