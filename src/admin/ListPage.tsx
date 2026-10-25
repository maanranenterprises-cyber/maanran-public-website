// A section's list: search, drag (or arrow buttons) to reorder, show/hide, duplicate, delete, and links to edit.
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, Copy, GripVertical, ImageIcon, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { imageUrl } from '../lib/media'
import { useCollection, useContextData } from './store'
import { type Item, type Section, slugify } from './sections'
import { Button, confirm, ErrorNotice, toast, Toggle } from './ui'

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

// Shows or hides a whole section of the website. Saved to drafts like any other change.
function SectionSwitch({ setting }: { setting: NonNullable<Section['sectionSwitch']> }) {
  const { data, save } = useCollection<Item>('pages')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const sections = (data?.sections ?? {}) as Record<string, boolean>
  if (!data) return null
  const on = sections[setting.key] !== false
  const flip = async () => {
    setBusy(true)
    setError(null)
    try {
      await save({ ...data, sections: { ...sections, [setting.key]: !on } }, `${on ? 'Hide' : 'Show'} ${setting.label.replace(/^Show /, '')}`)
      toast(on ? 'Section hidden (saved to drafts)' : 'Section shown (saved to drafts)')
    } catch (e) {
      setError(e)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className={`rounded-2xl border p-4 transition ${on ? 'border-line bg-white' : 'border-ink/15 bg-ink/[0.04]'} ${busy ? 'pointer-events-none opacity-60' : ''}`}>
      <Toggle label={setting.label} hint={on ? setting.where : `Hidden on the website. ${setting.where}`} checked={on} onChange={flip} />
      <ErrorNotice error={error} onClose={() => setError(null)} />
    </div>
  )
}

export default function ListPage({ section }: { section: Section }) {
  const { data, error, reload, save } = useCollection<Item[]>(section.name)
  const ctx = useContextData(section.needs)
  const [query, setQuery] = useState('')
  // The filter lives in the address (?category=office-chairs) so it survives going into an item and back
  const [params, setParams] = useSearchParams()
  const filterValue = section.filter ? (params.get(section.filter.key) ?? '') : ''
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState<unknown>(null)
  const [dragging, setDragging] = useState<number | null>(null)

  const items = useMemo(() => sorted(data ?? []), [data])
  const visible = section.visibleField ?? 'published'
  const isVisible = (it: Item) => Boolean(it[visible])
  const title = (it: Item) => String(it[section.titleField] || `Untitled ${section.singular}`)
  const inFilter = filterValue ? items.filter((it) => it[section.filter!.key] === filterValue) : items
  const filtered = query ? inFilter.filter((it) => JSON.stringify(it).toLowerCase().includes(query.toLowerCase())) : inFilter
  const filterOptions = section.filter
    ? section.filter.options(ctx).map((o) => ({ ...o, count: items.filter((it) => it[section.filter!.key] === o.value).length }))
    : []
  const keepFilter = filterValue ? `?${section.filter!.key}=${encodeURIComponent(filterValue)}` : ''
  const addLink = `/${section.path}/new${keepFilter}`

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
    const next = items.map((x, j) => (j === i ? { ...x, [visible]: !isVisible(x) } : x))
    commit(next, `${isVisible(it) ? 'Hide' : 'Show'} ${section.singular}: ${title(it)}`, isVisible(it) ? 'Hidden (saved to drafts)' : 'Visible (saved to drafts)')
  }

  const duplicate = (i: number) => {
    const it = items[i]
    const copy = { ...structuredClone(it), [section.titleField]: `${title(it)} (copy)`, [visible]: false }
    copy[section.keyField] = uniqueKey(section, items, `${String(it[section.keyField])}-copy`)
    if (section.keyField === 'id' && 'slug' in it) copy.slug = uniqueKey({ ...section, keyField: 'slug' }, items, `${String(it.slug)}-copy`)
    // A copy is a new product, so the server gives it the next code in its category
    if ('code' in it) copy.code = ''
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
        <Link to={addLink} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
          <Plus className="size-4" /> Add {section.singular}
        </Link>
      </div>

      {section.sectionSwitch && <SectionSwitch setting={section.sectionSwitch} />}

      <ErrorNotice error={saveError} onClose={() => (setSaveError(null), reload())} />

      <div className="flex flex-col gap-2 sm:flex-row">
        {section.filter && (
          <select
            value={filterValue}
            onChange={(e) => setParams(e.target.value ? { [section.filter!.key]: e.target.value } : {}, { replace: true })}
            aria-label="Filter"
            className={`rounded-lg border bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue focus:ring-2 focus:ring-blue/15 sm:w-64 ${filterValue ? 'border-blue text-blue' : 'border-line'}`}
          >
            <option value="">
              {section.filter.allLabel} ({items.length})
            </option>
            {filterOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label} ({o.count})
              </option>
            ))}
          </select>
        )}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${inFilter.length} ${section.plural.toLowerCase()}…`}
            className="w-full rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/15"
          />
        </div>
      </div>
      {query && <p className="-mt-2 text-xs text-muted">Clear the search to drag items into a new order.</p>}

      <ul className={`grid grid-cols-1 gap-2 ${busy ? 'pointer-events-none opacity-60' : ''}`}>
        {filtered.map((it, v) => {
          const i = items.indexOf(it)
          // With a filter, the arrows move an item past its visible neighbour (e.g. within one category)
          const prev = v > 0 ? items.indexOf(filtered[v - 1]) : -1
          const next = v < filtered.length - 1 ? items.indexOf(filtered[v + 1]) : -1
          const img = firstImage(it, section.imageField)
          return (
            <li
              key={String(it[section.keyField])}
              draggable={!query}
              onDragStart={() => setDragging(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dragging !== null && move(dragging, i)}
              onDragEnd={() => setDragging(null)}
              className={`flex items-center gap-3 rounded-xl border bg-white p-2.5 pr-3 transition ${dragging === i ? 'border-blue opacity-50' : 'border-line'} ${isVisible(it) ? '' : 'bg-soft'}`}
            >
              {!query && <GripVertical className="size-4 shrink-0 cursor-grab text-ink/30" aria-hidden="true" />}
              <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-white">
                {section.thumbText ? (
                  <span className="text-base font-extrabold text-brand">{section.thumbText(it)}</span>
                ) : img ? (
                  <img src={imageUrl(img, 160)} alt="" className={`size-full ${section.imageContain ? 'object-contain p-1' : 'object-cover'}`} />
                ) : (
                  <ImageIcon className="size-5 text-ink/20" />
                )}
              </span>
              <Link to={`/${section.path}/${encodeURIComponent(String(it[section.keyField]))}${keepFilter}`} className="min-w-0 flex-1">
                <span className="block truncate font-semibold hover:text-brand">{title(it)}</span>
                <span className="block truncate text-xs text-muted">{section.subtitle?.(it, ctx)}</span>
              </Link>
              <button
                type="button"
                onClick={() => toggle(i)}
                className={`hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-bold sm:inline ${isVisible(it) ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-ink/10 text-ink/60 hover:bg-ink/15'}`}
                title={isVisible(it) ? 'Click to hide' : 'Click to show'}
              >
                {isVisible(it) ? 'Visible' : 'Hidden'}
              </button>
              <span className="flex shrink-0 items-center">
                {!query && (
                  <>
                    <IconButton label="Move up" onClick={() => move(i, prev)} disabled={prev < 0} icon={ArrowUp} />
                    <IconButton label="Move down" onClick={() => move(i, next)} disabled={next < 0} icon={ArrowDown} />
                  </>
                )}
                <IconButton label="Duplicate" onClick={() => duplicate(i)} icon={Copy} />
                <IconButton label="Delete" onClick={() => remove(i)} icon={Trash2} danger />
                <Link to={`/${section.path}/${encodeURIComponent(String(it[section.keyField]))}${keepFilter}`} className="ml-1 hidden items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold hover:border-ink/30 md:inline-flex">
                  <Pencil className="size-3.5" /> Edit
                </Link>
              </span>
            </li>
          )
        })}
        {!filtered.length && <li className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">{query ? 'Nothing matches your search.' : filterValue ? `No ${section.plural.toLowerCase()} in this category yet.` : `No ${section.plural.toLowerCase()} yet.`}</li>}
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
