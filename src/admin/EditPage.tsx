// Add or edit one item of a section. The form is built from the section's field list (sections.ts),
// checked with the same rules the server and the build use, then the whole file is saved to drafts.
import { useEffect, useState } from 'react'
import { Link, useBlocker, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Lock, Plus, Trash2 } from 'lucide-react'
import { FileInput, ImageInput, ImagesInput } from './ImageInput'
import { LinkInput, ObjectsInput, StringsInput } from './ListInputs'
import { formatCode, suggestPrefix } from '../lib/codes'
import { uniqueKey } from './ListPage'
import { useCollection, useContextData } from './store'
import { type Context, type FieldDef, type Item, type Section, slugify } from './sections'
import { Button, Card, confirm, DateTimeInput, ErrorNotice, NumberInput, Select, TextInput, toast, Toggle } from './ui'

type Errors = Record<string, string>

// Turns rule failures into one message per field, e.g. ctas › 0 › label → "Button 1: Button text is required"
function fieldErrors(section: Section, item: Item): Errors {
  const result = section.schema.safeParse(item)
  if (result.success) return {}
  const errors: Errors = {}
  for (const issue of result.error.issues) {
    const [key, index] = issue.path
    if (typeof key !== 'string' || errors[key]) continue
    errors[key] = typeof index === 'number' ? `Item ${index + 1}: ${issue.message}` : issue.message
  }
  return errors
}

export default function EditPage({ section }: { section: Section }) {
  const { key } = useParams()
  const isNew = key === 'new'
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { data, error, save } = useCollection<Item[]>(section.name)
  const ctx = useContextData(section.needs)
  const [item, setItem] = useState<Item | null>(null)
  const [original, setOriginal] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [saveError, setSaveError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)
  // Fields filled in from another field (link name, code prefix) until edited by hand
  const [touched, setTouched] = useState<string[]>([])

  useEffect(() => {
    if (!data || item) return
    // "Add product" from a filtered list starts in that category
    const preset = section.filter && params.get(section.filter.key) ? { [section.filter.key]: params.get(section.filter.key) } : {}
    const found = isNew ? { ...section.newItem(), ...preset } : data.find((x) => String(x[section.keyField]) === key)
    if (found) {
      setItem(found)
      setOriginal(JSON.stringify(found))
    }
  }, [data, item, isNew, key, section, params])

  const dirty = item !== null && JSON.stringify(item) !== original
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !busy && currentLocation.pathname !== nextLocation.pathname)
  useEffect(() => {
    if (blocker.state !== 'blocked') return
    confirm({ title: 'Leave without saving?', message: 'Your changes to this page will be lost.', confirmLabel: 'Leave', danger: true }).then((ok) => (ok ? blocker.proceed() : blocker.reset()))
  }, [blocker])
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const name = item ? String(item[section.titleField] || '') : ''
  // Back to the list with the same filter (the list passes ?category=… along to its items)
  const filterParam = section.filter && params.get(section.filter.key)
  const backTo = `/${section.path}${filterParam ? `?${section.filter!.key}=${encodeURIComponent(filterParam)}` : ''}`

  // A field's error goes away as soon as it is changed; the full check runs again on Save
  const clearErrors = (keys: string[]) =>
    setErrors((prev) => (keys.some((k) => k in prev) ? Object.fromEntries(Object.entries(prev).filter(([k]) => !keys.includes(k))) : prev))

  const set = (field: string, value: unknown) => {
    clearErrors([field])
    setItem((prev) => {
      if (!prev) return prev
      const next = { ...prev, [field]: value }
      // New items get their link name from the name until it is edited by hand
      for (const f of section.fields) {
        if ((f.type !== 'slug' && f.type !== 'prefix') || f.from !== field || !isNew || touched.includes(f.key)) continue
        next[f.key] = f.type === 'slug' ? slugify(String(value)) : suggestPrefix(String(value))
      }
      return next
    })
  }

  const onSave = async () => {
    if (!item || !data) return
    let toSave = { ...item }
    if (isNew) {
      if (section.keyField === 'id') toSave.id = uniqueKey(section, data, '')
      toSave.order = data.length + 1
    }
    const found = fieldErrors(section, toSave)
    if (section.fields.some((f) => f.type === 'slug') && data.some((x) => x !== data.find((d) => String(d[section.keyField]) === key) && x.slug === toSave.slug)) {
      found.slug = 'Another item already uses this link name. Change it slightly.'
    }
    const current = data.find((d) => String(d[section.keyField]) === key)
    if (section.fields.some((f) => f.type === 'prefix') && data.some((x) => x !== current && x.codePrefix === toSave.codePrefix)) {
      found.codePrefix = `Another category already uses ${String(toSave.codePrefix)}. Choose different letters.`
    }
    setErrors(found)
    if (Object.keys(found).length) {
      setSaveError({ message: 'Please fix the highlighted fields.' })
      return
    }
    toSave = section.schema.parse(toSave) as Item
    setBusy(true)
    setSaveError(null)
    try {
      const next = isNew ? [...data, toSave] : data.map((x) => (String(x[section.keyField]) === key ? toSave : x))
      const res = await save(next, `${isNew ? 'Add' : 'Update'} ${section.singular}: ${String(toSave[section.titleField])}`)
      setOriginal(JSON.stringify(item))
      const code = res?.assigned?.[0]
      toast(code ? `Added as ${code}. Publish to make it live.` : `${isNew ? 'Added' : 'Saved'} to drafts. Publish to make it live.`)
      navigate(backTo)
    } catch (e) {
      setSaveError(e)
    } finally {
      setBusy(false)
    }
  }

  const onDelete = async () => {
    if (!data || !item) return
    const users = section.usedBy?.(item, ctx) ?? []
    if (users.length) {
      setSaveError({ message: `"${name}" is used by ${users.length} ${users.length === 1 ? 'product' : 'products'}. Move them to another category or delete them first.`, details: users })
      return
    }
    const ok = await confirm({ title: `Delete "${name}"?`, message: 'It is removed from the website when you publish.', confirmLabel: 'Delete', danger: true })
    if (!ok) return
    setBusy(true)
    try {
      await save(
        data.filter((x) => String(x[section.keyField]) !== key).map((x, i) => ({ ...x, order: i + 1 })),
        `Delete ${section.singular}: ${name}`,
      )
      setOriginal(JSON.stringify(item))
      toast('Deleted (saved to drafts)')
      navigate(backTo)
    } catch (e) {
      setSaveError(e)
      setBusy(false)
    }
  }

  if (error) return <ErrorNotice error={error} />
  if (!data) return <p className="text-sm text-muted">Loading…</p>
  if (!item) return <ErrorNotice error={{ message: `This ${section.singular} was not found. It may have been deleted.` }} />

  return (
    <div className="grid grid-cols-1 gap-5 pb-24">
      <div>
        <Link to={backTo} className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
          <ArrowLeft className="size-4" /> {section.plural}
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight">{isNew ? `New ${section.singular}` : name || `Untitled ${section.singular}`}</h1>
      </div>

      <ErrorNotice error={saveError} onClose={() => setSaveError(null)} />

      <Card>
        {section.fields.map((f) => (
          <FieldInput
            key={f.key}
            field={f}
            value={item[f.key]}
            error={errors[f.key]}
            ctx={ctx}
            items={data}
            item={item}
            setMany={(fields) => {
              clearErrors(Object.keys(fields))
              setItem((prev) => (prev ? { ...prev, ...fields } : prev))
            }}
            section={section}
            locked={(f.type === 'slug' && !isNew) || (f.lock === 'existing' && !isNew) || (f.lock === 'used' && (section.usedBy?.(item, ctx).length ?? 0) > 0)}
            onChange={(v) => {
              if (f.type === 'slug' || f.type === 'prefix') setTouched((t) => [...t, f.key])
              set(f.key, v)
            }}
          />
        ))}
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          {!isNew ? (
            <Button variant="danger" onClick={onDelete} disabled={busy}>
              <Trash2 className="size-4" /> Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3">
            {dirty && <span className="hidden text-xs text-muted sm:inline">Unsaved changes</span>}
            <Button onClick={() => navigate(backTo)}>Cancel</Button>
            <Button variant="primary" onClick={onSave} busy={busy} disabled={!dirty && !isNew}>
              {isNew ? `Add ${section.singular}` : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

type FieldProps = {
  field: FieldDef
  value: unknown
  error?: string
  onChange: (v: unknown) => void
  ctx: Context
  // The whole section and the item being edited, for suggestions and fields that fill in others
  items: Item[]
  item: Item
  setMany: (fields: Item) => void
  // Where uploads go and how suggestion lists are named
  section: Pick<Section, 'folder' | 'path'>
  locked: boolean
}

export function FieldInput({ field: f, value, error, onChange, ctx, items, item, setMany, section, locked }: FieldProps) {
  const common = { label: f.label, hint: f.hint, error, required: f.required }
  switch (f.type) {
    case 'text':
    case 'textarea': {
      const listId = f.suggestions ? `${section.path}-${f.key}-suggestions` : undefined
      return (
        <>
          <TextInput {...common} value={String(value ?? '')} onChange={onChange} multiline={f.type === 'textarea'} placeholder={f.placeholder} list={listId} />
          {listId && (
            <datalist id={listId}>
              {f.suggestions!(items).map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          )}
        </>
      )
    }
    case 'file':
      return (
        <FileInput
          {...common}
          value={String(value ?? '')}
          details={f.details ? [item[f.details.typeKey], item[f.details.sizeKey]].filter(Boolean).join(' · ') : undefined}
          folder={section.folder}
          accept={f.accept}
          onUploaded={({ url, type, size }) => setMany({ [f.key]: url, ...(f.details ? { [f.details.typeKey]: type, [f.details.sizeKey]: size } : {}) })}
          onRemove={() => onChange('')}
        />
      )
    case 'slug':
      return <TextInput {...common} value={String(value ?? '')} onChange={(v) => onChange(slugify(v))} readOnly={locked} />
    case 'number':
      return <NumberInput {...common} value={Number(value)} onChange={onChange} min={f.min} max={f.max} />
    case 'toggle':
      return <Toggle label={f.label} hint={f.hint} checked={Boolean(value)} onChange={onChange} />
    case 'select':
      return <Select {...common} value={String(value ?? '')} onChange={onChange} options={f.options(ctx)} disabled={locked} />
    case 'prefix':
      return <TextInput {...common} value={String(value ?? '')} onChange={(v) => onChange(v.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6))} readOnly={locked} />
    case 'code':
      return <CodeField label={f.label} code={String(value ?? '')} category={(ctx.categories ?? []).find((c) => c.slug === item[f.categoryKey])} />
    case 'readonly':
      return <TextInput {...common} value={String(value ?? '')} onChange={() => {}} placeholder={f.placeholder} readOnly />
    case 'datetime':
      return <DateTimeInput {...common} value={(value as string | null) ?? null} onChange={onChange} />
    case 'image':
      return <ImageInput {...common} value={String(value ?? '')} onChange={onChange} folder={section.folder} contain={f.contain} />
    case 'images':
      return <ImagesInput {...common} value={(value as string[]) ?? []} onChange={onChange} folder={section.folder} contain={f.contain} />
    case 'specs':
      return <SpecsInput {...common} value={(value as Record<string, string>) ?? {}} onChange={onChange} />
    case 'strings':
      return <StringsInput {...common} value={(value as string[]) ?? []} onChange={onChange} addLabel={f.addLabel} multiline={f.multiline} placeholder={f.placeholder} />
    case 'objects':
      return <ObjectsInput {...common} value={(value as Item[]) ?? []} onChange={onChange} fields={f.fields} addLabel={f.addLabel} fixed={f.fixed} idPrefix={f.idPrefix} newItem={f.newItem} />
    case 'link':
      return <LinkInput {...common} value={(value as { label: string; href: string } | null) ?? null} onChange={onChange} optional={f.optional} />
    case 'links':
      return <LinksInput {...common} value={(value as { label: string; href: string }[]) ?? []} onChange={onChange} max={f.max} />
  }
}

const rowInput = 'w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/15'

// Specifications are stored as { "Size": "1200 x 600 mm" }; edited as rows so the order and empty rows are kept while typing
function SpecsInput({ label, hint, error, value, onChange }: { label: string; hint?: string; error?: string; required?: boolean; value: Record<string, string>; onChange: (v: Record<string, string>) => void }) {
  const [rows, setRows] = useState(() => Object.entries(value))
  const update = (next: [string, string][]) => {
    setRows(next)
    onChange(Object.fromEntries(next.filter(([k]) => k.trim()).map(([k, v]) => [k.trim(), v])))
  }
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{label}</legend>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      <div className="mt-2 grid gap-2">
        {rows.map(([k, v], i) => (
          <div key={i} className="flex gap-2">
            <input value={k} onChange={(e) => update(rows.map((r, j) => (j === i ? [e.target.value, r[1]] : r)))} placeholder="e.g. Size" aria-label={`Specification ${i + 1} name`} className={`${rowInput} max-w-48`} />
            <input value={v} onChange={(e) => update(rows.map((r, j) => (j === i ? [r[0], e.target.value] : r)))} placeholder="e.g. 1200 × 600 mm" aria-label={`Specification ${i + 1} value`} className={rowInput} />
            <Button variant="ghost" onClick={() => update(rows.filter((_, j) => j !== i))} aria-label={`Remove specification ${i + 1}`}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        <Button onClick={() => update([...rows, ['', '']])} className="justify-self-start">
          <Plus className="size-4" /> Add specification
        </Button>
      </div>
      {error && <p className="mt-1 text-xs font-medium text-brand">{error}</p>}
    </fieldset>
  )
}

function LinksInput({ label, hint, error, required, value, onChange, max }: { label: string; hint?: string; error?: string; required?: boolean; value: { label: string; href: string }[]; onChange: (v: { label: string; href: string }[]) => void; max: number }) {
  const set = (i: number, k: 'label' | 'href', v: string) => onChange(value.map((l, j) => (j === i ? { ...l, [k]: v } : l)))
  return (
    <fieldset>
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
      <div className="mt-2 grid gap-2">
        {value.map((l, i) => (
          <div key={i} className="flex gap-2">
            <input value={l.label} onChange={(e) => set(i, 'label', e.target.value)} placeholder="Button text" aria-label={`Button ${i + 1} text`} className={`${rowInput} max-w-56`} />
            <input value={l.href} onChange={(e) => set(i, 'href', e.target.value)} placeholder="/products or #enquiry" aria-label={`Button ${i + 1} link`} className={rowInput} />
            <Button variant="ghost" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`Remove button ${i + 1}`}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        {value.length < max && (
          <Button onClick={() => onChange([...value, { label: '', href: '' }])} className="justify-self-start">
            <Plus className="size-4" /> Add button
          </Button>
        )}
      </div>
      {error && <p className="mt-1 text-xs font-medium text-brand">{error}</p>}
    </fieldset>
  )
}

// Product code: always locked. A saved product shows its code; a new one previews the next code in the chosen category.
// The server assigns the real code on save, so if someone else adds a product to that category first, this one gets the next number.
function CodeField({ label, code, category }: { label: string; code: string; category?: Item }) {
  const next = !code && category ? formatCode(String(category.codePrefix), Number(category.codeCounter) + 1) : ''
  const shown = code || next
  const hint = code
    ? 'This product’s unique code. It never changes.'
    : category
      ? `This product will be ${next} when you save (the next number in ${String(category.name)}). If someone else adds a product there first, it gets the following number.`
      : 'Choose a category below to see the code. It is made from the category’s prefix and the next number, e.g. OC-004.'
  return (
    <div>
      <p className="text-sm font-semibold text-ink">{label}</p>
      <p className="mt-0.5 text-xs text-muted">{hint}</p>
      <div
        role="textbox"
        aria-readonly="true"
        aria-label={label}
        className="mt-1.5 flex items-center gap-2 rounded-lg border border-dashed border-ink/20 bg-ink/[0.04] px-3 py-2 text-sm"
      >
        <Lock className="size-4 shrink-0 text-ink/40" aria-hidden="true" />
        {shown ? (
          <span className="font-mono font-semibold tracking-wide text-ink">
            {shown}
            {!code && <span className="ml-2 font-sans text-xs font-normal text-muted">(when saved)</span>}
          </span>
        ) : (
          <span className="text-muted">Shown once a category is chosen</span>
        )}
      </div>
    </div>
  )
}
