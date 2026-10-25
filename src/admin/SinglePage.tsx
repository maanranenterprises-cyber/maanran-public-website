// One page of settings (Why us, About, Site settings, Page text): grouped fields, saved to drafts as one file.
import { useEffect, useState } from 'react'
import { useBlocker } from 'react-router-dom'
import { FieldInput } from './EditPage'
import { useCollection } from './store'
import type { FieldDef, Item, SingleSection } from './sections'
import { Button, Card, confirm, ErrorNotice, toast } from './ui'

// Field keys may be paths into the file, e.g. "contact.phone" or "home.clients.title"
const getPath = (obj: Item, path: string): unknown => path.split('.').reduce<unknown>((o, k) => (o as Item | undefined)?.[k], obj)
function setPath(obj: Item, path: string, value: unknown): Item {
  const [head, ...rest] = path.split('.')
  return { ...obj, [head]: rest.length ? setPath((obj[head] as Item) ?? {}, rest.join('.'), value) : value }
}

// Matches each rule failure to the field it belongs to, e.g. ["benefits", 2, "title"] → benefits: "Item 3: Title is required"
function fieldErrors(section: SingleSection, data: Item) {
  const result = section.schema.safeParse(data)
  if (result.success) return {}
  const keys = section.groups.flatMap((g) => g.fields.map((f) => f.key)).sort((a, b) => b.length - a.length)
  const errors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const path = issue.path.map(String)
    const key = keys.find((k) => k.split('.').every((part, i) => path[i] === part))
    if (!key || errors[key]) continue
    const index = issue.path[key.split('.').length]
    errors[key] = typeof index === 'number' ? `Item ${index + 1}: ${issue.message}` : issue.message
  }
  return errors
}

const anchor = (title: string) => `group-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

export default function SinglePage({ section }: { section: SingleSection }) {
  const { data, error, save } = useCollection<Item>(section.name)
  const [draft, setDraft] = useState<Item | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saveError, setSaveError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (data && !draft) setDraft(data)
  }, [data, draft])

  const dirty = draft !== null && data !== undefined && JSON.stringify(draft) !== JSON.stringify(data)
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !busy && currentLocation.pathname !== nextLocation.pathname)
  useEffect(() => {
    if (blocker.state !== 'blocked') return
    confirm({ title: 'Leave without saving?', message: 'Your changes on this page will be lost.', confirmLabel: 'Leave', danger: true }).then((ok) => (ok ? blocker.proceed() : blocker.reset()))
  }, [blocker])
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const change = (fields: Record<string, unknown>) => {
    setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => !(k in fields))))
    setDraft((prev) => (prev ? Object.entries(fields).reduce((acc, [k, v]) => setPath(acc, k, v), prev) : prev))
  }

  const onSave = async () => {
    if (!draft) return
    const found = fieldErrors(section, draft)
    setErrors(found)
    if (Object.keys(found).length) {
      setSaveError({ message: 'Please fix the highlighted fields.' })
      return
    }
    setBusy(true)
    setSaveError(null)
    try {
      const cleaned = section.schema.parse(draft) as Item
      await save(cleaned, `Update ${section.label.toLowerCase()}`)
      setDraft(cleaned)
      toast('Saved to drafts. Publish to make it live.')
    } catch (e) {
      setSaveError(e)
    } finally {
      setBusy(false)
    }
  }

  const discard = async () => {
    if (await confirm({ title: 'Undo your changes on this page?', message: 'The page goes back to how it was when you opened it.', confirmLabel: 'Undo changes', danger: true })) {
      setDraft(data ?? null)
      setErrors({})
      setSaveError(null)
    }
  }

  if (error) return <ErrorNotice error={error} />
  if (!draft) return <p className="text-sm text-muted">Loading…</p>

  const render = (f: FieldDef) => (
    <FieldInput
      key={f.key}
      field={f}
      value={getPath(draft, f.key)}
      error={errors[f.key]}
      ctx={{}}
      items={[]}
      item={draft}
      setMany={change}
      section={section}
      locked={false}
      onChange={(v) => change({ [f.key]: v })}
    />
  )

  return (
    <div className="grid grid-cols-1 gap-5 pb-24">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{section.label}</h1>
        <p className="mt-1 text-sm text-muted">{section.description}</p>
      </div>
      {section.groups.length > 4 && (
        <nav aria-label="Jump to" className="flex flex-wrap gap-2">
          {section.groups.map((g) => (
            <a key={g.title} href={`#${anchor(g.title)}`} className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-ink/75 hover:border-blue hover:text-blue">
              {g.title}
            </a>
          ))}
        </nav>
      )}
      <ErrorNotice error={saveError} onClose={() => setSaveError(null)} />
      {section.groups.map((g) => (
        <div key={g.title} id={anchor(g.title)} className="scroll-mt-20">
          <Card title={g.title}>
            {g.description && <p className="-mt-3 text-sm text-muted">{g.description}</p>}
            {g.fields.map(render)}
          </Card>
        </div>
      ))}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-4xl items-center justify-end gap-3 px-4 py-3 sm:px-6">
          {dirty && <span className="mr-auto text-xs text-muted">Unsaved changes</span>}
          <Button onClick={discard} disabled={!dirty || busy}>
            Undo changes
          </Button>
          <Button variant="primary" onClick={onSave} busy={busy} disabled={!dirty}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
