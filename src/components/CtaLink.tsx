import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useEnquiry } from './EnquiryContext'

// A content-driven button: "#enquiry" opens the enquiry form, anything else is a page link.
export default function CtaLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  const { openEnquiry } = useEnquiry()
  if (href === '#enquiry') {
    return (
      <button type="button" onClick={() => openEnquiry()} className={className}>
        {children}
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
