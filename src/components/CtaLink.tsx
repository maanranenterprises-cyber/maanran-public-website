import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MessageSquareText } from 'lucide-react'
import { pages } from '../lib/content'
import { useEnquiry } from './EnquiryContext'

// A content-driven button: "#enquiry" opens the enquiry form, anything else is a page link.
// A link to the page the visitor is already on (e.g. "Learn More" → /about, shown on the About page)
// would do nothing, so it becomes the consultation button instead.
export default function CtaLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  const { openEnquiry } = useEnquiry()
  const { pathname } = useLocation()
  const samePage = href.startsWith('/') && !href.includes('#') && href.replace(/\/$/, '') === pathname.replace(/\/$/, '')
  if (href === '#enquiry' || samePage) {
    return (
      <button type="button" onClick={() => openEnquiry()} className={className}>
        {samePage ? (
          <>
            <MessageSquareText className="size-4" /> {pages.footer.ctaButton}
          </>
        ) : (
          children
        )}
      </button>
    )
  }
  if (/^https?:/.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener" className={className}>
        {children}
      </a>
    )
  }
  return (
    <Link to={href} className={className}>
      {children}
    </Link>
  )
}
