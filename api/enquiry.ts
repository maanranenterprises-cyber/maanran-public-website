// POST /api/enquiry → stores a customer enquiry (from the form or just before WhatsApp opens) in the private
// enquiries database, for the admin's Enquiries inbox. Public, so guarded like the feedback form.
// The page also emails the enquiry through Formspree, so either one failing does not lose it.
import { addEnquiry, type Enquiry } from './_lib/enquiries.js'
import { clean, looksLikeBot, rateLimiter, visitorIp } from './_lib/guard.js'
import { handle, HttpError, json, readJson, requireSameOrigin } from './_lib/http.js'

const limiter = rateLimiter(10)
const short = [0, 120] as const

export function POST(request: Request) {
  return handle(async () => {
    requireSameOrigin(request)
    const body = await readJson<Record<string, unknown>>(request)
    if (looksLikeBot(body)) return json({ ok: true })
    const ip = visitorIp(request)
    if (limiter.tooMany(ip)) throw new HttpError(429, 'Thank you, we have your enquiries. Please call or WhatsApp us if it is urgent.')

    const phone = clean(body.phone, [8, 20], 'phone number')
    if (!/^[+\d][\d\s-]{7,19}$/.test(phone)) throw new HttpError(400, 'Please enter a valid phone number.')
    const email = clean(body.email ?? '', [0, 120], 'email')
    if (email && !/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, 'Please enter a valid email.')

    const enquiry: Enquiry = {
      id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      at: new Date().toISOString(),
      channel: body.channel === 'whatsapp' ? 'whatsapp' : 'form',
      page: clean(body.page ?? '', [0, 200], 'page'),
      name: clean(body.name, [2, 80], 'name'),
      phone,
      email,
      city: clean(body.city ?? '', short, 'city'),
      interest: clean(body.interest ?? '', short, 'interest'),
      quantity: clean(body.quantity ?? '', short, 'quantity'),
      message: clean(body.message ?? '', [0, 2000], 'message'),
      product: clean(body.product ?? '', [0, 200], 'product'),
      status: 'new',
      note: '',
    }
    await addEnquiry(enquiry)
    limiter.record(ip)
    return json({ ok: true })
  })
}
