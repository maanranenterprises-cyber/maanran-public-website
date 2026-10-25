import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { categories, site, whatsappLink } from '../lib/content'
import { WhatsAppIcon } from './Icons'

type Values = {
  name: string
  phone: string
  email: string
  city: string
  category: string
  quantity: string
  message: string
  botcheck: boolean
}

const interestOptions = ['Home & Office Interiors', ...categories.map((c) => c.name), 'Other']

function toText(v: Values, product?: string) {
  return [
    `Enquiry from ${v.name}`,
    product && `Product: ${product}`,
    `Phone: ${v.phone}`,
    v.email && `Email: ${v.email}`,
    v.city && `City: ${v.city}`,
    v.category && `Interested in: ${v.category}`,
    v.quantity && `Quantity / project size: ${v.quantity}`,
    v.message && `Message: ${v.message}`,
  ]
    .filter(Boolean)
    .join('\n')
}

// Sends the enquiry to the Formspree form in site.json; Formspree emails it to the inbox set up in the Formspree dashboard.
// Field names are what appear in that email. "email" lets Reply in the inbox answer the customer directly.
// Resolves to null when sent, or Formspree's reason when it rejects the enquiry.
async function sendEmail(v: Values, product?: string): Promise<string | null> {
  const res = await fetch(site.contact.formEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      _subject: `New website enquiry${product ? `: ${product}` : ''}`,
      name: v.name,
      phone: v.phone,
      email: v.email || undefined,
      city: v.city || undefined,
      product: product || undefined,
      'interested in': v.category || undefined,
      'quantity / project size': v.quantity || undefined,
      message: v.message || undefined,
    }),
  })
  if (res.ok) return null
  const json = await res.json().catch(() => null)
  return json?.errors?.map((e: { message: string }) => e.message).join(', ') || 'Please try again.'
}

// "Send Enquiry" emails the company; "Send on WhatsApp" opens WhatsApp with the message pre-filled.
export default function EnquiryForm({ product, onDone }: { product?: string; onDone?: () => void }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorReason, setErrorReason] = useState('')
  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<Values>({ defaultValues: { category: '' } })

  const sendWhatsApp = async () => {
    if (!(await trigger(['name', 'phone']))) return
    window.open(whatsappLink(toText(getValues(), product)), '_blank', 'noopener')
  }

  const onSubmit = async (v: Values) => {
    if (v.botcheck) return
    setStatus('sending')
    try {
      const reason = await sendEmail(v, product)
      setErrorReason(reason ?? '')
      setStatus(reason ? 'error' : 'sent')
    } catch {
      setErrorReason('Network error, please check your connection.')
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 className="size-12 text-green-600" />
        <p className="text-lg font-bold">Thank you, we have your enquiry.</p>
        <p className="text-sm text-muted">Our team will call you on the number you gave us.</p>
        {onDone && (
          <button onClick={onDone} className="btn-outline mt-2">
            Close
          </button>
        )}
      </div>
    )
  }

  const err = (msg?: string) => msg && <p className="mt-1 text-xs text-brand">{msg}</p>

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
      {product && (
        <div className="rounded-lg bg-soft px-3.5 py-2.5 text-sm sm:col-span-2">
          Enquiring about <span className="font-semibold">{product}</span>
        </div>
      )}
      <label className="block text-sm font-medium">
        Name *
        <input className="field mt-1" autoComplete="name" {...register('name', { required: 'Please enter your name' })} />
        {err(errors.name?.message)}
      </label>
      <label className="block text-sm font-medium">
        Phone *
        <input
          className="field mt-1"
          type="tel"
          autoComplete="tel"
          {...register('phone', {
            required: 'Please enter your phone number',
            pattern: { value: /^[+\d][\d\s-]{8,15}$/, message: 'Please enter a valid phone number' },
          })}
        />
        {err(errors.phone?.message)}
      </label>
      <label className="block text-sm font-medium">
        Email
        <input
          className="field mt-1"
          type="email"
          autoComplete="email"
          {...register('email', { pattern: { value: /^\S+@\S+\.\S+$/, message: 'Please enter a valid email' } })}
        />
        {err(errors.email?.message)}
      </label>
      <label className="block text-sm font-medium">
        City
        <input className="field mt-1" autoComplete="address-level2" {...register('city')} />
      </label>
      <label className="block text-sm font-medium">
        Interested in
        <select className="field mt-1" {...register('category')}>
          <option value="">Select a category</option>
          {interestOptions.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium">
        Quantity or project size
        <input className="field mt-1" placeholder="e.g. 40 desk benches" {...register('quantity')} />
      </label>
      <label className="block text-sm font-medium sm:col-span-2">
        Message
        <textarea className="field mt-1 min-h-24" {...register('message')} />
      </label>
      <input type="checkbox" className="hidden" tabIndex={-1} autoComplete="off" {...register('botcheck')} />
      {status === 'error' && (
        <p className="text-sm text-brand sm:col-span-2">
          Sorry, the form could not be sent{errorReason && ` (${errorReason})`}. Please try WhatsApp, email{' '}
          <a href={`mailto:${site.contact.email}`} className="font-semibold underline">
            {site.contact.email}
          </a>{' '}
          or call {site.contact.phoneDisplay}.
        </p>
      )}
      <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">
        <button type="submit" className="btn-primary flex-1" disabled={status === 'sending'}>
          {status === 'sending' && <Loader2 className="size-4 animate-spin" />}
          Send Enquiry
        </button>
        <button type="button" onClick={sendWhatsApp} className="btn flex-1 bg-[#25D366] text-white hover:bg-[#1ebe5b]">
          <WhatsAppIcon className="size-4" />
          Send on WhatsApp
        </button>
      </div>
    </form>
  )
}
