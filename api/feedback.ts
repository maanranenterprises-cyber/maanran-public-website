// POST /api/feedback { name, designation, rating, text, consent, startedAt, website } → saves the customer's feedback as a
// hidden testimonial "awaiting review" in drafts. Public (no login), so it is guarded against bots and floods.
// Contact details are not taken here: the page emails them to the company separately, so they never reach the public repository.
import { collections } from '../src/lib/schema.js'
import { prepareDrafts, readContent, writeContent } from './_lib/github.js'
import { clean, looksLikeBot, rateLimiter, visitorIp } from './_lib/guard.js'
import { handle, HttpError, json, readJson, requireSameOrigin } from './_lib/http.js'

const MAX_PENDING = 30
const LIMITS = { name: [2, 60], designation: [0, 80], text: [10, 800] } as const
const limiter = rateLimiter(3)

type Testimonial = { id: string; order: number; pending?: boolean }

export function POST(request: Request) {
  return handle(async () => {
    requireSameOrigin(request)
    const body = await readJson<Record<string, unknown>>(request)
    const ip = visitorIp(request)

    // Bots get the same reply as people, so they learn nothing
    if (looksLikeBot(body)) return json({ ok: true })
    if (limiter.tooMany(ip)) throw new HttpError(429, 'Thank you! We already have your feedback. Please try again later if you want to send more.')

    const name = clean(body.name, LIMITS.name, 'name')
    const designation = clean(body.designation ?? '', LIMITS.designation, 'role and company')
    const text = clean(body.text, LIMITS.text, 'your feedback')
    const rating = Number(body.rating)
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new HttpError(400, 'Please choose a star rating.')
    if (body.consent !== true) throw new HttpError(400, 'Please tick the box to let us show your feedback.')

    await prepareDrafts()
    // Retry if an editor saves testimonials at the same moment (the file version changes under us)
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, sha } = await readContent(collections.testimonials.file)
      const list = data as Testimonial[]
      if (list.filter((t) => t.pending).length >= MAX_PENDING) throw new HttpError(503, 'We are not taking new feedback right now. Please try again later.')
      const entry = {
        id: `t-${Math.random().toString(36).slice(2, 8)}`,
        name,
        photo: '',
        text,
        rating,
        designation,
        order: Math.max(0, ...list.map((t) => t.order)) + 1,
        published: false,
        pending: true,
        submittedAt: new Date().toISOString(),
      }
      try {
        await writeContent(collections.testimonials.file, [...list, entry], sha, `New website feedback from ${name} (by website form)`)
        limiter.record(ip)
        return json({ ok: true })
      } catch (e) {
        if (!(e instanceof HttpError && e.status === 409) || attempt === 2) throw e
      }
    }
    throw new HttpError(503, 'Please try again in a moment.')
  })
}
