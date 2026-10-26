// Customer enquiries inbox: status tabs, search, quick contact buttons, private notes, CSV export.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, Mail, MessageCircle, Phone, Search, Trash2 } from 'lucide-react'
import { api, type Enquiry, type EnquiryStatus } from './api'
import { useDrafts } from './store'
import { Button, confirm, ErrorNotice, Notice, toast } from './ui'

const STATUSES: { value: EnquiryStatus; label: string; style: string }[] = [
  { value: 'new', label: 'New', style: 'bg-brand text-white' },
  { value: 'contacted', label: 'Contacted', style: 'bg-blue/10 text-blue' },
  { value: 'quoted', label: 'Quoted', style: 'bg-accent/15 text-[#b45c00]' },
  { value: 'closed', label: 'Closed', style: 'bg-green-50 text-green-700' },
  { value: 'spam', label: 'Spam', style: 'bg-ink/10 text-ink/60' },
]
const labelOf = (s: EnquiryStatus) => STATUSES.find((x) => x.value === s)!

const when = (at: string) => new Date(at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
const digits = (phone: string) => {
  const d = phone.replace(/\D/g, '')
  return d.length === 10 ? `91${d}` : d
}

function toCsv(list: Enquiry[]) {
  const cols: [string, (e: Enquiry) => string][] = [
    ['Date', (e) => when(e.at)],
    ['Status', (e) => labelOf(e.status).label],
    ['Via', (e) => (e.channel === 'whatsapp' ? 'WhatsApp' : 'Form')],
    ['Name', (e) => e.name],
    ['Phone', (e) => e.phone],
    ['Email', (e) => e.email],
    ['City', (e) => e.city],
    ['Interested in', (e) => e.interest],
    ['Product / project', (e) => e.product],
    ['Quantity', (e) => e.quantity],
    ['Message', (e) => e.message],
    ['Page', (e) => e.page],
    ['Notes', (e) => e.note],
    ['Updated by', (e) => e.updatedBy ?? ''],
  ]
  const cell = (v: string) => `"${v.replace(/"/g, '""')}"`
  return [cols.map(([h]) => cell(h)).join(','), ...list.map((e) => cols.map(([, f]) => cell(f(e))).join(','))].join('\r\n')
}

export default function EnquiriesPage() {
  const { refreshEnquiries, enquiries: newCount } = useDrafts()
  const [data, setData] = useState<{ enquiries: Enquiry[]; counts: Record<EnquiryStatus, number> } | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [tab, setTab] = useState<EnquiryStatus | 'all'>('new')
  const [query, setQuery] = useState('')

  const load = useCallback(async () => {
    try {
      setData(await api.enquiries())
      setError(null)
    } catch (e) {
      setError(e)
    }
  }, [])
  // The menu badge and this list share one source of truth: whenever the new-enquiry count changes
  // (it is checked every minute), the list reloads too, so a "1 new" badge never shows an out-of-date list.
  useEffect(() => {
    load()
  }, [load, newCount])
  useEffect(() => {
    const onVisible = () => document.visibilityState === 'visible' && (load(), refreshEnquiries())
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [load, refreshEnquiries])

  const shown = useMemo(() => {
    const list = (data?.enquiries ?? []).filter((e) => tab === 'all' || e.status === tab)
    const q = query.trim().toLowerCase()
    return q ? list.filter((e) => [e.name, e.phone, e.email, e.city, e.product, e.interest, e.message, e.note].join(' ').toLowerCase().includes(q)) : list
  }, [data, tab, query])

  const replace = (updated: Enquiry) =>
    setData((d) => {
      if (!d) return d
      const enquiries = d.enquiries.map((e) => (e.id === updated.id ? updated : e))
      const counts = Object.fromEntries(STATUSES.map((s) => [s.value, enquiries.filter((e) => e.status === s.value).length])) as Record<EnquiryStatus, number>
      return { enquiries, counts }
    })

  const exportCsv = () => {
    const blob = new Blob([`﻿${toCsv(shown)}`], { type: 'text/csv;charset=utf-8' })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `enquiries-${new Date().toISOString().slice(0, 10)}.csv` })
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="grid grid-cols-1 gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Enquiries</h1>
          <p className="mt-1 text-sm text-muted">Every enquiry from the website, including WhatsApp ones. Only admins can see these.</p>
        </div>
        <Button onClick={exportCsv} disabled={!shown.length}>
          <Download className="size-4" /> Export CSV
        </Button>
      </div>

      {error ? (
        <ErrorNotice error={error} />
      ) : !data ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Enquiry status">
            {[...STATUSES, { value: 'all' as const, label: 'All', style: '' }].map((s) => {
              const count = s.value === 'all' ? data.enquiries.length : data.counts[s.value]
              const active = tab === s.value
              return (
                <button
                  key={s.value}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(s.value)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${active ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink/75 hover:border-ink/30'}`}
                >
                  {s.label} <span className={active ? 'text-white/70' : 'text-muted'}>({count})</span>
                </button>
              )
            })}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, phone, email, product, city or message…"
              className="w-full rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/15"
            />
          </div>
          <ul className="grid grid-cols-1 gap-3">
            {shown.map((e) => (
              <EnquiryCard key={e.id} enquiry={e} onChange={(u) => (replace(u), refreshEnquiries())} onDeleted={() => (load(), refreshEnquiries())} />
            ))}
            {!shown.length && (
              <li className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">
                {query ? 'Nothing matches your search.' : tab === 'new' ? 'No new enquiries. You are all caught up.' : 'No enquiries here.'}
              </li>
            )}
          </ul>
        </>
      )}
    </div>
  )
}

function EnquiryCard({ enquiry: e, onChange, onDeleted }: { enquiry: Enquiry; onChange: (e: Enquiry) => void; onDeleted: () => void }) {
  const [note, setNote] = useState(e.note)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const status = labelOf(e.status)

  const update = async (changes: { status?: EnquiryStatus; note?: string }, done: string) => {
    setBusy(true)
    setError(null)
    try {
      onChange((await api.updateEnquiry(e.id, changes)).enquiry)
      toast(done)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!(await confirm({ title: `Delete the enquiry from ${e.name}?`, message: 'It is removed permanently. This cannot be undone.', confirmLabel: 'Delete', danger: true }))) return
    try {
      await api.deleteEnquiry(e.id)
      toast('Enquiry deleted')
      onDeleted()
    } catch (err) {
      setError(err)
    }
  }

  const details: [string, string][] = [
    ['Interested in', e.interest],
    ['Product / project', e.product],
    ['Quantity', e.quantity],
    ['City', e.city],
  ].filter(([, v]) => v) as [string, string][]
  const hello = encodeURIComponent(`Hello ${e.name}, thank you for your enquiry${e.product ? ` about ${e.product}` : ''} with MAANRAN ENTERPRISES.`)

  return (
    <li className={`rounded-2xl border bg-white p-4 sm:p-5 ${e.status === 'new' ? 'border-brand/40 shadow-[0_0_0_3px_rgb(228_1_10/0.06)]' : 'border-line'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-bold">{e.name}</span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${status.style}`}>{status.label}</span>
            <span className="rounded-full bg-soft px-2 py-0.5 text-[11px] font-semibold text-muted">{e.channel === 'whatsapp' ? 'Via WhatsApp' : 'Via form'}</span>
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {when(e.at)}
            {e.page && ` · from ${e.page}`}
          </p>
        </div>
        <label className="text-xs font-semibold text-muted">
          Status{' '}
          <select value={e.status} disabled={busy} onChange={(ev) => update({ status: ev.target.value as EnquiryStatus }, `Marked as ${labelOf(ev.target.value as EnquiryStatus).label}`)} className="ml-1 rounded-lg border border-line bg-white px-2 py-1.5 text-sm font-semibold text-ink">
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <a href={`tel:${e.phone}`} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold hover:border-ink/30">
          <Phone className="size-4" /> {e.phone}
        </a>
        <a href={`https://wa.me/${digits(e.phone)}?text=${hello}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-green-700 hover:border-green-600/40">
          <MessageCircle className="size-4" /> WhatsApp
        </a>
        {e.email && (
          <a href={`mailto:${e.email}?subject=${encodeURIComponent('Your enquiry with MAANRAN ENTERPRISES')}`} className="inline-flex min-w-0 items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold hover:border-ink/30">
            <Mail className="size-4 shrink-0" /> <span className="truncate">{e.email}</span>
          </a>
        )}
      </div>

      {(details.length > 0 || e.message) && (
        <div className="mt-3 rounded-xl bg-soft/70 p-3 text-sm">
          {details.length > 0 && (
            <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
              {details.map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <dt className="shrink-0 text-muted">{k}:</dt>
                  <dd className="font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          )}
          {e.message && <p className={`whitespace-pre-line text-ink/85 ${details.length ? 'mt-2 border-t border-line pt-2' : ''}`}>{e.message}</p>}
        </div>
      )}

      <div className="mt-3">
        <label htmlFor={`note-${e.id}`} className="text-xs font-semibold text-muted">
          Private notes
        </label>
        <div className="mt-1 flex gap-2">
          <textarea id={`note-${e.id}`} value={note} onChange={(ev) => setNote(ev.target.value)} rows={2} placeholder="e.g. Called on Monday, site visit on 3 Nov" className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/15" />
          <Button onClick={() => update({ note }, 'Note saved')} disabled={busy || note.trim() === e.note} className="self-start">
            Save note
          </Button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted">
        <span>{e.updatedBy ? `Last updated by ${e.updatedBy}, ${when(e.updatedAt!)}` : ''}</span>
        <button onClick={remove} className="inline-flex items-center gap-1 font-semibold text-brand hover:underline">
          <Trash2 className="size-3.5" /> Delete
        </button>
      </div>
      {error ? (
        <div className="mt-3">
          <ErrorNotice error={error} onClose={() => setError(null)} />
        </div>
      ) : null}
      {e.status === 'spam' && (
        <div className="mt-3">
          <Notice kind="info">Marked as spam. Delete it if you do not need it.</Notice>
        </div>
      )}
    </li>
  )
}
