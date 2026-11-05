// Protection for the public forms (feedback, enquiries): bots fill hidden fields and submit instantly,
// so those are quietly ignored; each visitor (IP) may send only a few per hour.
import { HttpError } from './http.js'

export const MIN_FILL_MS = 3000

export const visitorIp = (request: Request) => request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'

// True when the submission looks automated (filled the hidden field, or sent within 3 seconds of opening the form).
// The time is measured in the visitor's browser (`elapsed`): their clock may differ from ours by minutes.
// `startedAt` is what pages built before that change send.
export function looksLikeBot(body: Record<string, unknown>) {
  const elapsed = body.elapsed !== undefined ? Number(body.elapsed) : Date.now() - Number(body.startedAt)
  return Boolean(body.website) || !Number.isFinite(elapsed) || elapsed < MIN_FILL_MS
}

// Per-visitor counts, kept in memory, so per server instance: a speed bump rather than a hard guarantee
export function rateLimiter(perHour: number) {
  const recent = new Map<string, number[]>()
  return {
    tooMany(ip: string) {
      const hourAgo = Date.now() - 3600_000
      const times = (recent.get(ip) ?? []).filter((t) => t > hourAgo)
      recent.set(ip, times)
      return times.length >= perHour
    },
    record(ip: string) {
      recent.set(ip, [...(recent.get(ip) ?? []), Date.now()])
    },
  }
}

// Collapses spaces and checks the length; `label` is used in the message shown to the visitor
export function clean(v: unknown, [min, max]: readonly [number, number], label: string) {
  const s = typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : ''
  if (s.length < min) throw new HttpError(400, min > 2 ? `Please write at least ${min} characters for ${label}.` : `Please enter your ${label}.`)
  if (s.length > max) throw new HttpError(400, `Please keep ${label} under ${max} characters.`)
  return s
}
