import { useLayoutEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { categories, categoryName, pages, products, site } from '../lib/content'
import Seo from '../components/Seo'
import ProductCard from '../components/ProductCard'
import PageHeader from './PageHeader'

export default function Products() {
  const [params, setParams] = useSearchParams()
  // The pre-rendered /products page has no ?category, so the first render must match it (all products);
  // the filter applies right after, before the browser paints
  const [hydrated, setHydrated] = useState(false)
  useLayoutEffect(() => setHydrated(true), [])
  const active = hydrated ? (params.get('category') ?? '') : ''
  const list = active ? products.filter((p) => p.category === active) : products
  const current = categories.find((c) => c.slug === active)

  const chip = (slug: string, label: string) => (
    <button
      key={slug || 'all'}
      onClick={() => setParams(slug ? { category: slug } : {}, { replace: true })}
      aria-pressed={active === slug}
      className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${active === slug ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink/75 hover:border-brand hover:text-brand'}`}
    >
      {label}
    </button>
  )

  return (
    <>
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
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filter by category">
            {chip('', 'All')}
            {categories.map((c) => chip(c.slug, c.name))}
          </div>
          <p className="mt-6 text-sm text-muted">
            {list.length} {list.length === 1 ? 'product' : 'products'}
            {active && ` in ${categoryName(active)}`}
          </p>
          <ul className="mt-4 grid gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {list.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
          {!list.length && <p className="py-16 text-center text-muted">No products in this category yet. Please ask us through the enquiry form.</p>}
        </div>
      </section>
    </>
  )
}
