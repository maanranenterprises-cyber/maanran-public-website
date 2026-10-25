// Customer feedback form (/feedback). Saves the feedback for review in the admin, then emails the company,
// including contact details, which are never stored on the website.
import { useRef, useState, type FormEvent } from 'react'
import { CheckCircle2, Loader2, Star } from 'lucide-react'
import { pages, site } from '../lib/content'

const STARS = [1, 2, 3, 4, 5]
const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent']

export default function FeedbackForm() {
  const startedAt = useRef(Date.now())
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const get = (k: string) => String(f.get(k) ?? '').trim()
    if (!rating) return setError('Please choose a star rating.')
    setStatus('sending')
    setError('')
    const feedback = { name: get('name'), designation: get('designation'), text: get('text'), rating, consent: f.get('consent') === 'on' }
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...feedback, startedAt: startedAt.current, website: get('website') }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Sorry, your feedback could not be sent. Please try again.')
      // Email alert for the team; failure here does not affect the saved feedback
      fetch(site.contact.formEndpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: `New customer feedback from ${feedback.name} (awaiting review)`,
          name: feedback.name,
          'role and company': feedback.designation || undefined,
          rating: `${rating} / 5`,
          feedback: feedback.text,
          contact: get('contact') || undefined,
          note: 'Review and approve it in the website admin: Testimonials → Awaiting review.',
        }),
      }).catch(() => {})
      setStatus('sent')
    } catch (err) {
      setError((err as Error).message)
      setStatus('idle')
    }
  }

  if (status === 'sent')
    return (
      <div role="status" className="flex flex-col items-center gap-3 py-10 text-center">
        <CheckCircle2 className="size-12 text-green-600" />
        <p className="max-w-md text-lg font-bold">{pages.feedback.thanks}</p>
      </div>
    )

  const field = 'field mt-1'
  const shown = hover || rating
  return (
    <form onSubmit={submit} className="grid gap-5">
      <fieldset>
        <legend className="text-sm font-medium">
          Your rating <span className="text-brand">*</span>
        </legend>
        <div className="mt-2 flex items-center gap-3">
          <div role="radiogroup" aria-label="Star rating" className="flex gap-1" onMouseLeave={() => setHover(0)}>
            {STARS.map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} star${n > 1 ? 's' : ''}: ${LABELS[n]}`}
                onClick={() => (setRating(n), setError(''))}
                onMouseEnter={() => setHover(n)}
                // Standard radio group keys: arrows move to the next or previous star and select it
                tabIndex={rating ? (rating === n ? 0 : -1) : n === 1 ? 0 : -1}
                onKeyDown={(e) => {
                  const step = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0
                  if (!step) return
                  e.preventDefault()
                  const to = Math.min(5, Math.max(1, n + step))
                  setRating(to)
                  setError('')
                  ;(e.currentTarget.parentElement?.children[to - 1] as HTMLElement | undefined)?.focus()
                }}
                className="rounded p-0.5 focus-visible:outline-2 focus-visible:outline-blue"
              >
                <Star className={`size-8 transition ${n <= shown ? 'fill-accent text-accent' : 'text-line'}`} />
              </button>
            ))}
          </div>
          <span className="text-sm font-semibold text-muted" aria-hidden="true">
            {LABELS[shown]}
          </span>
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Your name <span className="text-brand">*</span>
          <input name="name" required minLength={2} maxLength={60} autoComplete="name" className={field} />
        </label>
        <label className="block text-sm font-medium">
          Role and company
          <input name="designation" maxLength={80} placeholder="e.g. Principal, ABC School" className={field} />
        </label>
      </div>
      <label className="block text-sm font-medium">
        Your feedback <span className="text-brand">*</span>
        <textarea name="text" required minLength={10} maxLength={800} rows={5} placeholder="What did you like? How was the delivery and installation?" className={`${field} min-h-32`} />
      </label>
      <label className="block text-sm font-medium">
        Phone or email
        <span className="ml-1 font-normal text-muted">(optional, only for our team, never shown)</span>
        <input name="contact" maxLength={80} className={field} />
      </label>
      {/* Left empty by people; bots that fill every field are ignored */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] size-px opacity-0" />
      <label className="flex items-start gap-3 text-sm">
        <input name="consent" type="checkbox" required className="mt-0.5 size-4 accent-brand" />
        <span>
          I agree that {site.name} may show my name, role and feedback on its website. <span className="text-brand">*</span>
        </span>
      </label>
      {error && (
        <p role="alert" className="text-sm font-medium text-brand">
          {error}
        </p>
      )}
      <button type="submit" disabled={status === 'sending'} className="btn-primary justify-self-start px-8 py-3">
        {status === 'sending' && <Loader2 className="size-4 animate-spin" />} Send feedback
      </button>
    </form>
  )
}
