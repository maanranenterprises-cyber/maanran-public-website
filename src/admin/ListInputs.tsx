// Inputs for lists inside a page: plain text lists (paragraphs, points), small records (benefits, menu items) and a single button.
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import type { Item, SubField } from './sections'
import { Button, Toggle } from './ui'

const box = 'w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/15'

function Legend({ label, hint, required }: { label: string; hint?: string; required?: boolean }) {
  return (
    <>
      <legend className="text-sm font-semibold">
        {label}
        {required && (
          <span aria-hidden="true" className="text-brand">
            {' '}
            *
          </span>
        )}
      </legend>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </>
  )
}

function MoveButtons({ i, count, move, label }: { i: number; count: number; move: (from: number, to: number) => void; label: string }) {
  return (
    <>
      <Button variant="ghost" className="!px-2" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move ${label} up`}>
        <ArrowUp className="size-4" />
      </Button>
      <Button variant="ghost" className="!px-2" onClick={() => move(i, i + 1)} disabled={i === count - 1} aria-label={`Move ${label} down`}>
        <ArrowDown className="size-4" />
      </Button>
    </>
  )
}

const moved = <T,>(list: T[], from: number, to: number) => {
  const next = [...list]
  const [x] = next.splice(from, 1)
  next.splice(to, 0, x)
  return next
}

export function StringsInput({
  label,
  hint,
  error,
  required,
  value,
  onChange,
  addLabel,
  multiline,
  placeholder,
}: {
  label: string
  hint?: string
  error?: string
  required?: boolean
  value: string[]
  onChange: (v: string[]) => void
  addLabel: string
  multiline?: boolean
  placeholder?: string
}) {
  const set = (i: number, v: string) => onChange(value.map((x, j) => (j === i ? v : x)))
  return (
    <fieldset>
      <Legend label={label} hint={hint} required={required} />
      <ol className="mt-2 grid gap-2">
        {value.map((v, i) => (
          <li key={i} className="flex items-start gap-1">
            <span className="mt-2 w-5 shrink-0 text-right text-xs font-semibold text-muted">{i + 1}.</span>
            {multiline ? (
              <textarea value={v} onChange={(e) => set(i, e.target.value)} rows={3} placeholder={placeholder} aria-label={`${label} ${i + 1}`} className={box} />
            ) : (
              <input value={v} onChange={(e) => set(i, e.target.value)} placeholder={placeholder} aria-label={`${label} ${i + 1}`} className={box} />
            )}
            <MoveButtons i={i} count={value.length} move={(a, b) => onChange(moved(value, a, b))} label={`item ${i + 1}`} />
            <Button variant="ghost" className="!px-2" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`Remove ${label} ${i + 1}`}>
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ol>
      <Button onClick={() => onChange([...value, ''])} className="mt-2">
        <Plus className="size-4" /> {addLabel}
      </Button>
      {error && <p className="mt-1 text-xs font-medium text-brand">{error}</p>}
    </fieldset>
  )
}

export function ObjectsInput({
  label,
  hint,
  error,
  required,
  value,
  onChange,
  fields,
  addLabel,
  fixed,
  idPrefix,
  newItem,
}: {
  label: string
  hint?: string
  error?: string
  required?: boolean
  value: Item[]
  onChange: (v: Item[]) => void
  fields: SubField[]
  addLabel?: string
  fixed?: boolean
  idPrefix?: string
  newItem?: () => Item
}) {
  // Records that carry an `order` (benefits, menu items) are renumbered to match the list after every change
  const commit = (next: Item[]) => onChange(next.map((x, i) => ('order' in x ? { ...x, order: i + 1 } : x)))
  const set = (i: number, key: string, v: unknown) => commit(value.map((x, j) => (j === i ? { ...x, [key]: v } : x)))
  const add = () => {
    const base = newItem?.() ?? {}
    const extra = idPrefix ? { id: `${idPrefix}-${Math.random().toString(36).slice(2, 8)}`, order: value.length + 1 } : {}
    commit([...value, { ...extra, ...base }])
  }
  return (
    <fieldset>
      <Legend label={label} hint={hint} required={required} />
      <ol className="mt-2 grid gap-3">
        {value.map((x, i) => (
          <li key={String(x.id ?? i)} className="rounded-xl border border-line bg-soft/60 p-3">
            <div className="flex items-start gap-2">
              <span className="mt-2 w-5 shrink-0 text-right text-xs font-semibold text-muted">{i + 1}.</span>
              <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
                {fields.map((f) => {
                  const v = x[f.key]
                  const aria = `${label} ${i + 1} ${f.label}`
                  if (f.type === 'toggle') return <Toggle key={f.key} label={f.label} checked={Boolean(v)} onChange={(c) => set(i, f.key, c)} />
                  if (f.type === 'readonly')
                    return (
                      <span key={f.key} className="self-center text-sm">
                        <span className="text-xs text-muted">{f.label}: </span>
                        <span className="font-semibold capitalize">{String(v ?? '')}</span>
                      </span>
                    )
                  return f.type === 'textarea' ? (
                    <textarea key={f.key} value={String(v ?? '')} onChange={(e) => set(i, f.key, e.target.value)} rows={3} placeholder={f.placeholder ?? f.label} aria-label={aria} className={`${box} sm:col-span-full`} />
                  ) : (
                    <input key={f.key} value={String(v ?? '')} onChange={(e) => set(i, f.key, e.target.value)} placeholder={f.placeholder ?? f.label} aria-label={aria} className={box} />
                  )
                })}
              </div>
              <span className="flex shrink-0">
                <MoveButtons i={i} count={value.length} move={(a, b) => commit(moved(value, a, b))} label={`item ${i + 1}`} />
                {!fixed && (
                  <Button variant="ghost" className="!px-2" onClick={() => commit(value.filter((_, j) => j !== i))} aria-label={`Remove ${label} ${i + 1}`}>
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </span>
            </div>
          </li>
        ))}
      </ol>
      {!fixed && (
        <Button onClick={add} className="mt-2">
          <Plus className="size-4" /> {addLabel ?? 'Add'}
        </Button>
      )}
      {error && <p className="mt-1 text-xs font-medium text-brand">{error}</p>}
    </fieldset>
  )
}

type Link = { label: string; href: string }

export function LinkInput({ label, hint, error, value, onChange, optional }: { label: string; hint?: string; error?: string; value: Link | null; onChange: (v: Link | null) => void; optional?: boolean }) {
  const on = value !== null && value !== undefined
  const link = value ?? { label: '', href: '' }
  return (
    <fieldset>
      <Legend label={label} hint={hint ?? 'A page such as /about or /products, or #enquiry to open the enquiry form.'} />
      {optional && (
        <div className="mt-2">
          <Toggle label="Show a button" checked={on} onChange={(c) => onChange(c ? { label: '', href: '' } : null)} />
        </div>
      )}
      {on && (
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input value={link.label} onChange={(e) => onChange({ ...link, label: e.target.value })} placeholder="Button text" aria-label={`${label} text`} className={`${box} sm:max-w-56`} />
          <input value={link.href} onChange={(e) => onChange({ ...link, href: e.target.value })} placeholder="/about" aria-label={`${label} link`} className={box} />
        </div>
      )}
      {error && <p className="mt-1 text-xs font-medium text-brand">{error}</p>}
    </fieldset>
  )
}
