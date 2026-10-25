import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Download, Menu, MessageSquareText, X } from 'lucide-react'
import { navigation, showDownloads, site } from '../lib/content'
import { useEnquiry } from './EnquiryContext'
import ProductsMenu, { MobileProductsMenu } from './ProductsMenu'

export function Brand({ light }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label={`${site.name} home`}>
      <img src={site.logo} alt="" data-brand-logo className="size-10 rounded-md lg:size-11" width={44} height={44} />
      <span className="leading-none">
        <span className={`block text-lg font-extrabold tracking-wide ${light ? 'text-white' : 'text-ink'}`}>MAANRAN</span>
        <span className={`block text-[10px] font-bold tracking-[0.32em] ${light ? 'text-white/70' : 'text-brand'}`}>ENTERPRISES</span>
      </span>
    </Link>
  )
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `relative py-2 text-sm font-semibold transition hover:text-brand ${isActive ? 'text-brand' : 'text-ink/80'}`

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { openEnquiry } = useEnquiry()
  const location = useLocation()

  useEffect(() => setOpen(false), [location])
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`sticky top-0 z-40 bg-white/95 backdrop-blur transition-shadow ${scrolled ? 'shadow-[0_1px_0_0_var(--color-line),0_8px_24px_-12px_rgb(0_0_0/0.15)]' : ''}`}>
      <div className="container-x flex h-[72px] items-center justify-between gap-4">
        <Brand />

        <nav aria-label="Main" className="hidden h-full items-center gap-5 md:flex lg:gap-8">
          {navigation.map((n) =>
            n.href === '/products' ? (
              <ProductsMenu key={n.href} label={n.label} linkClass={linkClass} />
            ) : (
              <NavLink key={n.href} to={n.href} end={n.href === '/'} className={linkClass}>
                {n.label}
              </NavLink>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {showDownloads && (
            <Link to="/#downloads" className="btn-outline px-3 lg:px-5" title="Download Catalog & Brochure">
              <Download className="size-4" />
              <span className="hidden xl:inline">Download Catalog & Brochure</span>
              <span className="xl:hidden">Catalog</span>
            </Link>
          )}
          <button onClick={() => openEnquiry()} className="btn-primary px-3 lg:px-5">
            <MessageSquareText className="size-4" />
            <span>Get Enquiry</span>
          </button>
        </div>

        <button className="rounded-lg p-2 md:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-menu" aria-label="Menu">
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="border-t border-line bg-white md:hidden">
          <nav aria-label="Mobile" className="container-x flex flex-col py-3">
            {navigation.map((n) =>
              n.href === '/products' ? (
                <MobileProductsMenu key={n.href} label={n.label} />
              ) : (
                <NavLink key={n.href} to={n.href} end={n.href === '/'} className={({ isActive }) => `rounded-lg px-2 py-3 font-semibold ${isActive ? 'text-brand' : 'text-ink'}`}>
                  {n.label}
                </NavLink>
              ),
            )}
            <div className="mt-3 grid gap-2 pb-2">
              {showDownloads && (
                <Link to="/#downloads" className="btn-outline">
                  <Download className="size-4" /> Download Catalog & Brochure
                </Link>
              )}
              <button onClick={() => openEnquiry()} className="btn-primary">
                <MessageSquareText className="size-4" /> Get Enquiry
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
