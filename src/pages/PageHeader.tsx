import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { imageUrl } from '../lib/media'

type Crumb = { label: string; to?: string }

export default function PageHeader({ title, text, crumbs, image, children }: { title: string; text?: string; crumbs: Crumb[]; image?: string; children?: ReactNode }) {
  const bg = image ? imageUrl(image, 1920) : ''
  return (
    <div className="relative overflow-hidden bg-ink text-white">
      {bg && (
        <>
          <img src={bg} alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />
        </>
      )}
      <div className="absolute -right-24 -top-24 size-80 rounded-full bg-brand/30 blur-3xl" />
      <div className="absolute -bottom-24 left-1/4 size-72 rounded-full bg-blue/25 blur-3xl" />
      <div className={`container-x relative ${bg ? 'py-20 sm:py-28' : 'py-14 sm:py-16'}`}>
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-white/60">
          <Link to="/" className="hover:text-white">Home</Link>
          {crumbs.map((c) => (
            <span key={c.label} className="flex items-center gap-1">
              <ChevronRight className="size-3" />
              {c.to ? <Link to={c.to} className="hover:text-white">{c.label}</Link> : <span className="text-white/90">{c.label}</span>}
            </span>
          ))}
        </nav>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
        {text && <p className="mt-3 max-w-2xl text-white/75">{text}</p>}
        {children}
      </div>
    </div>
  )
}
