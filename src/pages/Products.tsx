import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { categories, categoryName, pages, products, site } from '../lib/content'
import { searchProducts } from '../lib/search'
import Seo from '../components/Seo'
import ProductCard from '../components/ProductCard'
import { useEnquiry } from '../components/EnquiryContext'
import PageHeader from './PageHeader'

export default function Products() {
  const [params, setParams] = useSearchParams()
  const { openEnquiry } = useEnquiry()
  // The pre-rendered /products page has no ?category or ?q, so the first render must match it (all products);
  // the filter applies right after, before the browser paints
  const [hydrated, setHydrated] = useState(false)
  useLayoutEffect(() => setHydrated(true), [])
  const active = hydrated ? (params.get('category') ?? '') : ''
  // The box keeps its own text: the address updates a moment later, and reading it back would drop fast keystrokes.
  // It follows the address only when that changes some other way (Back, or a shared link).
  const urlQuery = hydrated ? (params.get('q') ?? '') : ''
  const [query, setQuery] = useState('')
  const pending = useRef<string[]>([]) // what the box has written to the address, oldest first, not yet seen there
  useEffect(() => {
    const ours = pending.current.indexOf(urlQuery)
    if (ours >= 0) pending.current.splice(0, ours + 1)
    else {
      pending.current = []
      setQuery(urlQuery)
    }
  }, [urlQuery])
  const inCategory = active ? products.filter((p) => p.category === active) : products
  const list = query.trim() ? searchProducts(inCategory, query, categoryName) : inCategory
  // When nothing matches in the chosen category, offer the matches in the others
  const elsewhere = active && query.trim() && !list.length ? searchProducts(products, query, categoryName).length : 0
  const current = categories.find((c) => c.slug === active)

  // Both live in the address (so a search can be shared and Back works); typing replaces it rather than adding history
  const update = (next: { category?: string; q?: string }) => {
    const category = next.category ?? active
    const q = next.q ?? query
    setQuery(q)
    if (q !== urlQuery) pending.current.push(q)
    setParams({ ...(category && { category }), ...(q && { q }) }, { replace: true })
  }

  const chip = (slug: string, label: string) => (
    <button
      key={slug || 'all'}
      onClick={() => update({ category: slug })}
      aria-pressed={active === slug}
      className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${active === slug ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink/75 hover:border-brand hover:text-brand'}`}
    >
      {label}
    </button>
  )

  return (
    <>
      {/* Search results share the category page's address for search engines, so they are not indexed separately */}
      <Seo
        title={current ? `${current.name} in ${site.address.locality}` : `Furniture Products in ${site.address.locality}`}
        description={
          current
            ? `${current.description} Made to order and installed by ${site.name}, ${site.address.locality}.`
            : `Office workstations, chairs, tables, storage, steel furniture, school, library, hostel and lab furniture from ${site.name}, ${site.address.locality}.`
        }
        path={`/products${active ? `?category=${active}` : ''}`}
        image={current?.image}
        crumbs={[{ name: 'Products', path: '/products' }, ...(current ? [{ name: current.name, path: `/products?category=${current.slug}` }] : [])]}
      />
      <PageHeader title={current ? current.name : pages.products.title} text={current?.description ?? pages.products.text} crumbs={current ? [{ label: 'Products', to: '/products' }, { label: current.name }] : [{ label: 'Products' }]} image={current?.image || pages.products.image} />
      <section className="py-12 lg:py-16">
        <div className="container-x">
          <form role="search" onSubmit={(e) => (e.preventDefault(), (document.activeElement as HTMLElement | null)?.blur())} className="relative mb-5 max-w-xl">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => update({ q: e.target.value })}
              onKeyDown={(e) => e.key === 'Escape' && update({ q: '' })}
              placeholder='Search products, e.g. "bunk cot" or "OW-012"'
              aria-label="Search products"
              enterKeyHint="search"
              autoComplete="off"
              className="field py-3 pr-11 pl-11 text-base [&::-webkit-search-cancel-button]:appearance-none"
            />
            {query && (
              <button type="button" onClick={() => update({ q: '' })} aria-label="Clear search" className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-soft hover:text-ink">
                <X className="size-4" />
              </button>
            )}
          </form>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filter by category">
            {chip('', 'All')}
            {categories.map((c) => chip(c.slug, c.name))}
          </div>
          <p className="mt-6 text-sm text-muted" aria-live="polite">
            {list.length} {list.length === 1 ? 'product' : 'products'}
            {query.trim() && ` for “${query.trim()}”`}
            {active && ` in ${categoryName(active)}`}
            {query && (
              <>
                {' · '}
                <button type="button" onClick={() => update({ q: '' })} className="font-semibold text-brand hover:underline">
                  Clear search
                </button>
              </>
            )}
          </p>
          <ul className="mt-4 grid gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {list.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
          {!list.length &&
            (query.trim() ? (
              <div className="py-16 text-center">
                {elsewhere ? (
                  <p className="text-muted">
                    No matches in {categoryName(active)}.{' '}
                    <button type="button" onClick={() => update({ category: '' })} className="font-semibold text-brand hover:underline">
                      See {elsewhere} {elsewhere === 1 ? 'match' : 'matches'} in all categories →
                    </button>
                  </p>
                ) : (
                  <>
                    <p className="text-muted">
                      No products match “<strong className="text-ink">{query.trim()}</strong>”.
                    </p>
                    <p className="mt-1 text-muted">We make furniture to order, so we may still be able to help.</p>
                    <button type="button" onClick={() => openEnquiry(undefined, current?.name, `Looking for: ${query.trim()}`)} className="btn-primary mt-5">
                      Ask us about “{query.trim()}”
                    </button>
                  </>
                )}
              </div>
            ) : (
              <p className="py-16 text-center text-muted">No products in this category yet. Please ask us through the enquiry form.</p>
            ))}
        </div>
      </section>
    </>
  )
}
