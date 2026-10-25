import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { categories, products } from '../lib/content'
import { imageUrl } from '../lib/media'

const countFor = (slug: string) => products.filter((p) => p.category === slug).length
const categoryHref = (slug: string) => `/products?category=${slug}`

// Small delay before closing, so the pointer can travel from the nav link down into the panel
const CLOSE_DELAY_MS = 150

// Desktop "Products" nav item: opens a panel of categories on hover, focus or chevron click.
export default function ProductsMenu({ label, linkClass }: { label: string; linkClass: (s: { isActive: boolean }) => string }) {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<number>(undefined)
  const wrapRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const activeSlug = location.pathname === '/products' ? new URLSearchParams(location.search).get('category') : null

  const show = () => {
    window.clearTimeout(closeTimer.current)
    setOpen(true)
  }
  const hide = () => {
    window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setOpen(false), CLOSE_DELAY_MS)
  }

  useEffect(() => setOpen(false), [location])
  useEffect(() => () => window.clearTimeout(closeTimer.current), [])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onDown = (e: PointerEvent) => !wrapRef.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  return (
    <div
      ref={wrapRef}
      onMouseEnter={show}
      onMouseLeave={hide}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}
      className="flex h-full items-center"
    >
      <div className="flex items-center gap-0.5">
        <NavLink to="/products" className={linkClass} onFocus={show}>
          {label}
        </NavLink>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="products-menu"
          aria-label="Show product categories"
          className="rounded p-1 text-ink/60 transition hover:text-brand"
        >
          <ChevronDown className={`size-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && (
        <div id="products-menu" className="absolute inset-x-0 top-full animate-[menu-in_180ms_ease-out] overflow-hidden bg-gradient-to-br from-[#fff1f1] via-[#fbfbfd] to-[#eef3ff] shadow-[0_24px_48px_-24px_rgb(0_0_0/0.3)]">
          {/* Brand-coloured edge so the panel reads as separate from the white navbar */}
          <div className="h-[3px] bg-gradient-to-r from-brand via-accent to-blue" />
          <div className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-brand/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-1/4 size-72 rounded-full bg-blue/10 blur-3xl" />
          <div className="container-x relative grid gap-8 py-8 lg:grid-cols-[1fr_16rem]">
            <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3" aria-label="Product categories">
              {categories.map((c) => {
                const active = activeSlug === c.slug
                const count = countFor(c.slug)
                return (
                  <li key={c.slug}>
                    <Link
                      to={categoryHref(c.slug)}
                      aria-current={active ? 'page' : undefined}
                      className={`group flex items-center gap-3 rounded-xl p-2.5 transition ${active ? 'bg-white shadow-sm ring-1 ring-brand/20' : 'hover:bg-white hover:shadow-[0_8px_20px_-10px_rgb(0_0_0/0.2)]'}`}
                    >
                      <span className="size-12 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-black/5">
                        {c.image && <img src={imageUrl(c.image, 160)} alt="" loading="lazy" className="size-full object-cover transition duration-300 group-hover:scale-110" />}
                      </span>
                      <span className="min-w-0">
                        <span className={`block truncate text-sm font-semibold transition ${active ? 'text-brand' : 'text-ink group-hover:text-brand'}`}>{c.name}</span>
                        <span className="block text-xs text-muted">{count ? `${count} ${count === 1 ? 'product' : 'products'}` : 'Made to order'}</span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>

            <div className="relative hidden flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-ink via-[#1d1420] to-[#3a0d11] p-6 text-white lg:flex">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Full range</p>
                <p className="mt-2 text-lg font-extrabold leading-snug">
                  {products.length} products across {categories.length} categories
                </p>
                <p className="mt-2 text-sm text-white/70">Office, institutional and steel furniture, made in the sizes you need.</p>
              </div>
              <Link to="/products" className="btn mt-6 self-start bg-white text-ink hover:bg-brand hover:text-white">
                View all products <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Mobile menu version: a collapsible list of categories under "Products".
export function MobileProductsMenu({ label }: { label: string }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const onProducts = location.pathname.startsWith('/products')
  const activeSlug = location.pathname === '/products' ? new URLSearchParams(location.search).get('category') : null

  return (
    <div>
      <div className="flex items-center justify-between">
        <NavLink to="/products" end className={`flex-1 rounded-lg px-2 py-3 font-semibold ${onProducts && !activeSlug ? 'text-brand' : 'text-ink'}`}>
          {label}
        </NavLink>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-products" aria-label="Show product categories" className="rounded-lg p-3 text-ink/60">
          <ChevronDown className={`size-5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {open && (
        <ul id="mobile-products" className="mb-2 ml-2 border-l-2 border-line pl-3">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link to={categoryHref(c.slug)} className={`block rounded-lg px-2 py-2.5 text-sm font-medium ${activeSlug === c.slug ? 'text-brand' : 'text-ink/80'}`}>
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
