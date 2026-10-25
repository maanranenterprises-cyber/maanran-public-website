// A section's list: search, drag (or arrow buttons) to reorder, show/hide, duplicate, delete, and links to edit.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUp, Copy, GripVertical, ImageIcon, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { imageUrl } from '../lib/media'
import { useCollection, useContextData } from './store'
import { type Item, type Section, slugify } from './sections'
import { Button, confirm, ErrorNotice, toast } from './ui'

// Items carry an `order` number; the list keeps them sorted and renumbers after any move
const sorted = (items: Item[]) => [...items].sort((a, b) => Number(a.order) - Number(b.order))
const renumber = (items: Item[]) => items.map((it, i) => ({ ...it, order: i + 1 }))

export const firstImage = (item: Item, field?: string) => {
  const v = field ? item[field] : ''
  return Array.isArray(v) ? String(v[0] ?? '') : String(v ?? '')
}

export function uniqueKey(section: Section, items: Item[], base: string) {
  const taken = new Set(items.map((i) => String(i[section.keyField])))
  if (section.keyField === 'id') {
    let id = ''
    do id = `${section.idPrefix}-${Math.random().toString(36).slice(2, 8)}`
    while (taken.has(id))
    return id
  }
  let key = slugify(base) || section.singular
  for (let n = 2; taken.has(key); n++) key = `${slugify(base)}-${n}`
  return key
}

export default function ListPage({ section }: { section: Section }) {
  const { data, error, reload, save } = useCollection<Item[]>(section.name)
  const ctx = useContextData(section.needs)
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState<unknown>(null)
  const [dragging, setDragging] = useState<number | null>(null)

  const items = useMemo(() => sorted(data ?? []), [data])
  const title = (it: Item) => String(it[section.titleField] || `Untitled ${section.singular}`)
  const filtered = query ? items.filter((it) => JSON.stringify(it).toLowerCase().includes(query.toLowerCase())) : items

  const commit = async (next: Item[], summary: string, done?: string) => {
    setBusy(true)
    setSaveError(null)
    try {
      await save(next, summary)
      if (done) toast(done)
    } catch (e) {
      setSaveError(e)
    } finally {
      setBusy(false)
    }
  }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    commit(renumber(next), `Reorder ${section.plural.toLowerCase()}`, 'New order saved to drafts')
  }

  const toggle = (i: number) => {
    const it = items[i]
    const next = items.map((x, j) => (j === i ? { ...x, published: !x.published } : x))
    commit(next, `${it.published ? 'Hide' : 'Show'} ${section.singular}: ${title(it)}`, it.published ? 'Hidden (saved to drafts)' : 'Visible (saved to drafts)')
  }

  const duplicate = (i: number) => {
    const it = items[i]
    const copy = { ...structuredClone(it), [section.titleField]: `${title(it)} (copy)`, published: false }
    copy[section.keyField] = uniqueKey(section, items, `${String(it[section.keyField])}-copy`)
    if (section.keyField === 'id' && 'slug' in it) copy.slug = uniqueKey({ ...section, keyField: 'slug' }, items, `${String(it.slug)}-copy`)
    const next = [...items]
    next.splice(i + 1, 0, copy)
    commit(renumber(next), `Duplicate ${section.singular}: ${title(it)}`, 'Copy added as hidden. Edit it, then make it visible.')
  }

  const remove = async (i: number) => {
    const it = items[i]
    const users = section.usedBy?.(it, ctx) ?? []
    if (users.length) {
      setSaveError({
        message: `"${title(it)}" is used by ${users.length} ${users.length === 1 ? 'product' : 'products'}. Move them to another category or delete them first.`,
        details: users,
      })
      return
    }
    const ok = await confirm({
      title: `Delete "${title(it)}"?`,
      message: 'It is removed from the website when you publish. Until then you can bring it back with "Discard changes".',
      confirmLabel: 'Delete',
      danger: true,
    })
    if (ok) commit(renumber(items.filter((_, j) => j !== i)), `Delete ${section.singular}: ${title(it)}`, 'Deleted (saved to drafts)')
  }

  if (error) return <ErrorNotice error={error} />
  if (!data) return <p className="text-sm text-muted">Loading…</p>

  return (
    <div className="grid grid-cols-1 gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{section.plural}</h1>
          <p className="mt-1 text-sm text-muted">{section.description}</p>
        </div>
        <Link to={`/${section.path}/new`} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
          <Plus className="size-4" /> Add {section.singular}
        </Link>
      </div>

      <ErrorNotice error={saveError} onClose={() => (setSaveError(null), reload())} />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${items.length} ${section.plural.toLowerCase()}…`}
          className="w-full rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/15"
        />
      </div>
      {query && <p className="-mt-2 text-xs text-muted">Clear the search to drag items into a new order.</p>}

      <ul className={`grid grid-cols-1 gap-2 ${busy ? 'pointer-events-none opacity-60' : ''}`}>
        {filtered.map((it) => {
          const i = items.indexOf(it)
          const img = firstImage(it, section.imageField)
          return (
            <li
              key={String(it[section.keyField])}
              draggable={!query}
              onDragStart={() => setDragging(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dragging !== null && move(dragging, i)}
              onDragEnd={() => setDragging(null)}
              className={`flex items-center gap-3 rounded-xl border bg-white p-2.5 pr-3 transition ${dragging === i ? 'border-blue opacity-50' : 'border-line'} ${it.published ? '' : 'bg-soft'}`}
            >
              {!query && <GripVertical className="size-4 shrink-0 cursor-grab text-ink/30" aria-hidden="true" />}
              <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-white">
                {img ? <img src={imageUrl(img, 160)} alt="" className={`size-full ${section.imageContain ? 'object-contain p-1' : 'object-cover'}`} /> : <ImageIcon className="size-5 text-ink/20" />}
              </span>
              <Link to={`/${section.path}/${encodeURIComponent(String(it[section.keyField]))}`} className="min-w-0 flex-1">
                <span className="block truncate font-semibold hover:text-brand">{title(it)}</span>
                <span className="block truncate text-xs text-muted">{section.subtitle?.(it, ctx)}</span>
              </Link>
              <button
                type="button"
                onClick={() => toggle(i)}
                className={`hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-bold sm:inline ${it.published ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-ink/10 text-ink/60 hover:bg-ink/15'}`}
                title={it.published ? 'Click to hide' : 'Click to show'}
              >
                {it.published ? 'Visible' : 'Hidden'}
              </button>
              <span className="flex shrink-0 items-center">
                {!query && (
                  <>
                    <IconButton label="Move up" onClick={() => move(i, i - 1)} disabled={i === 0} icon={ArrowUp} />
                    <IconButton label="Move down" onClick={() => move(i, i + 1)} disabled={i === items.length - 1} icon={ArrowDown} />
                  </>
                )}
                <IconButton label="Duplicate" onClick={() => duplicate(i)} icon={Copy} />
                <IconButton label="Delete" onClick={() => remove(i)} icon={Trash2} danger />
                <Link to={`/${section.path}/${encodeURIComponent(String(it[section.keyField]))}`} className="ml-1 hidden items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold hover:border-ink/30 md:inline-flex">
                  <Pencil className="size-3.5" /> Edit
                </Link>
              </span>
            </li>
          )
        })}
        {!filtered.length && <li className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">{query ? 'Nothing matches your search.' : `No ${section.plural.toLowerCase()} yet.`}</li>}
      </ul>
    </div>
  )
}

function IconButton({ label, onClick, icon: Icon, disabled, danger }: { label: string; onClick: () => void; icon: typeof Copy; disabled?: boolean; danger?: boolean }) {
  return (
    <Button variant="ghost" onClick={onClick} disabled={disabled} aria-label={label} title={label} className={`!px-2 ${danger ? 'hover:!text-brand' : ''}`}>
      <Icon className="size-4" />
    </Button>
  )
}
