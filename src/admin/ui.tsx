// Building blocks for the admin screens: buttons, form fields, dialogs and notices.
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react'

export function Button({
  children,
  variant = 'default',
  busy,
  className = '',
  ...props
}: React.ComponentProps<'button'> & { variant?: 'default' | 'primary' | 'danger' | 'ghost'; busy?: boolean }) {
  const styles = {
    default: 'border border-line bg-white text-ink hover:border-ink/30',
    primary: 'bg-brand text-white hover:bg-brand-dark',
    danger: 'border border-brand/30 bg-white text-brand hover:bg-brand hover:text-white',
    ghost: 'text-ink/70 hover:bg-ink/5 hover:text-ink',
  }[variant]
  return (
    <button
      type="button"
      {...props}
      disabled={props.disabled || busy}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
    >
      {busy && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  )
}

export function Field({ label, hint, error, children, id }: { label: string; hint?: ReactNode; error?: string; children: ReactNode; id: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      <div className="mt-1.5">{children}</div>
      {error && (
        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-brand">
          <AlertTriangle className="size-3.5" /> {error}
        </p>
      )}
    </div>
  )
}

const inputClass = (error?: string) =>
  `w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 ${error ? 'border-brand focus:ring-brand/15' : 'border-line focus:border-blue focus:ring-blue/15'}`

type Base = { label: string; hint?: ReactNode; error?: string }

export function TextInput({ label, hint, error, value, onChange, multiline, ...rest }: Base & { value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string; readOnly?: boolean }) {
  const id = useId()
  return (
    <Field label={label} hint={hint} error={error} id={id}>
      {multiline ? (
        <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={4} className={`${inputClass(error)} min-h-24`} {...rest} />
      ) : (
        <input id={id} value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass(error)} ${rest.readOnly ? 'bg-soft text-muted' : ''}`} {...rest} />
      )}
    </Field>
  )
}

export function NumberInput({ label, hint, error, value, onChange, min, max }: Base & { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  const id = useId()
  return (
    <Field label={label} hint={hint} error={error} id={id}>
      <input id={id} type="number" value={Number.isFinite(value) ? value : ''} min={min} max={max} onChange={(e) => onChange(e.target.valueAsNumber)} className={inputClass(error)} />
    </Field>
  )
}

export function Select({ label, hint, error, value, onChange, options }: Base & { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  const id = useId()
  return (
    <Field label={label} hint={hint} error={error} id={id}>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass(error)}>
        <option value="">Choose…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  )
}

// datetime-local works in local time; content stores ISO strings (or null for "no limit")
export function DateTimeInput({ label, hint, error, value, onChange }: Base & { value: string | null; onChange: (v: string | null) => void }) {
  const id = useId()
  const local = value ? new Date(new Date(value).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''
  return (
    <Field label={label} hint={hint} error={error} id={id}>
      <div className="flex gap-2">
        <input id={id} type="datetime-local" value={local} onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)} className={inputClass(error)} />
        {value && (
          <Button variant="ghost" onClick={() => onChange(null)} aria-label={`Clear ${label}`}>
            <X className="size-4" />
          </Button>
        )}
      </div>
    </Field>
  )
}

export function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue ${checked ? 'bg-green-600' : 'bg-ink/20'}`}
      >
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </label>
  )
}

export function Card({ title, children, actions }: { title?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
      {(title || actions) && (
        <div className="mb-5 flex items-center justify-between gap-3">
          {title && <h2 className="text-base font-bold">{title}</h2>}
          {actions}
        </div>
      )}
      <div className="grid grid-cols-1 gap-5">{children}</div>
    </section>
  )
}

export function Notice({ kind, children, onClose }: { kind: 'error' | 'success' | 'info'; children: ReactNode; onClose?: () => void }) {
  const style = { error: 'border-brand/30 bg-brand/5 text-brand-dark', success: 'border-green-600/30 bg-green-50 text-green-800', info: 'border-blue/20 bg-blue/5 text-blue' }[kind]
  const Icon = kind === 'success' ? CheckCircle2 : AlertTriangle
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${style}`}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
      {onClose && (
        <button onClick={onClose} aria-label="Dismiss" className="opacity-60 hover:opacity-100">
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}

// Shows a server error with its list of problems, if any
export function ErrorNotice({ error, onClose }: { error: unknown; onClose?: () => void }) {
  if (!error) return null
  const e = error as { message?: string; details?: string[] }
  return (
    <Notice kind="error" onClose={onClose}>
      <p className="font-semibold">{e.message ?? 'Something went wrong.'}</p>
      {e.details && e.details.length > 0 && (
        <ul className="mt-1 list-disc pl-5">
          {e.details.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      )}
    </Notice>
  )
}

// Promise-based confirmation dialog: `if (await confirm({...}))`
type ConfirmOptions = { title: string; message: ReactNode; confirmLabel: string; danger?: boolean }
let openConfirm: ((o: ConfirmOptions) => Promise<boolean>) | null = null
export const confirm = (o: ConfirmOptions) => openConfirm?.(o) ?? Promise.resolve(window.confirm(o.title))

export function ConfirmHost() {
  const [state, setState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    openConfirm = (o) => new Promise((resolve) => setState({ ...o, resolve }))
    return () => {
      openConfirm = null
    }
  }, [])
  useEffect(() => {
    if (!state) return
    confirmRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })
  if (!state) return null
  const close = (v: boolean) => {
    state.resolve(v)
    setState(null)
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4" onClick={() => close(false)}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 id="confirm-title" className="text-lg font-bold">
          {state.title}
        </h2>
        <div className="mt-2 text-sm text-muted">{state.message}</div>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={() => close(false)}>Cancel</Button>
          <Button ref={confirmRef} variant={state.danger ? 'danger' : 'primary'} onClick={() => close(true)}>
            {state.confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Short message in the corner after an action, e.g. "Saved to drafts"
let showToast: ((text: string) => void) | null = null
export const toast = (text: string) => showToast?.(text)

export function ToastHost() {
  const [text, setText] = useState('')
  useEffect(() => {
    let t: number
    showToast = (s) => {
      setText(s)
      window.clearTimeout(t)
      t = window.setTimeout(() => setText(''), 3500)
    }
    return () => {
      showToast = null
      window.clearTimeout(t)
    }
  }, [])
  if (!text) return null
  return (
    <div role="status" className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-xl">
      <CheckCircle2 className="size-4 text-green-400" /> {text}
    </div>
  )
}
