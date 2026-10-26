import { useEffect, useRef } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Outlet, useLocation, useNavigationType } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import WhatsAppButton from './WhatsAppButton'
import { EnquiryProvider } from './EnquiryContext'
import SplashIntro from './SplashIntro'
import { BusinessJsonLd } from './Seo'

// Scrolls to the #section in the URL (e.g. /#downloads from another page), or to the top on page change.
// A new ?query from a link (e.g. a category in the Products menu) also counts as a page change;
// in-page filters that replace the query (the category chips) keep the scroll position.
function ScrollManager() {
  const { pathname, hash, search } = useLocation()
  const navType = useNavigationType()
  const lastPath = useRef(pathname)
  useEffect(() => {
    const samePage = lastPath.current === pathname
    lastPath.current = pathname
    if (samePage && navType === 'REPLACE') return
    if (hash) {
      const id = decodeURIComponent(hash.slice(1))
      const t = window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 60)
      return () => window.clearTimeout(t)
    }
    window.scrollTo({ top: 0 })
  }, [pathname, hash, search, navType])
  return null
}

export default function Layout() {
  return (
    <EnquiryProvider>
      <ScrollManager />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
      <SplashIntro />
      <BusinessJsonLd />
      {/* Vercel Web Analytics (visitors, pages, sources; no cookies) and Speed Insights. Public site only, not the admin */}
      <Analytics />
      <SpeedInsights />
    </EnquiryProvider>
  )
}
