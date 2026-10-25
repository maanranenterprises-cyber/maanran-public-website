import { useState } from 'react'
import { MapPin, X } from 'lucide-react'
import { instagram, interiors, type InteriorProject } from '../lib/content'
import Seo from '../components/Seo'
import Media from '../components/Media'
import { InstagramIcon } from '../components/Icons'
import { useEnquiry } from '../components/EnquiryContext'
import PageHeader from './PageHeader'

export default function Interiors() {
  const types = ['All', ...new Set(interiors.map((p) => p.type))]
  const [type, setType] = useState('All')
  const [open, setOpen] = useState<InteriorProject | null>(null)
  const { openEnquiry } = useEnquiry()
  const list = type === 'All' ? interiors : interiors.filter((p) => p.type === type)

  return (
    <>
      <Seo title="Home & Office Interiors" description="A gallery of home and office interior projects completed by MAANRAN ENTERPRISES." path="/interiors" />
      <PageHeader title="Home & Office Interiors" text="A look at some of the homes, offices and commercial spaces we have designed and furnished." crumbs={[{ label: 'Interiors' }]} image="/images/banners/home-interiors.webp" />
      <section className="py-12 lg:py-16">
        <div className="container-x">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter projects">
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                aria-pressed={type === t}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${type === t ? 'border-brand bg-brand text-white' : 'border-line text-ink/75 hover:border-brand hover:text-brand'}`}
              >
                {t}
              </button>
            ))}
          </div>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => (
              <li key={p.id}>
                <button onClick={() => setOpen(p)} className="group block w-full overflow-hidden rounded-2xl border border-line text-left transition hover:shadow-xl hover:shadow-black/5">
                  <div className="overflow-hidden">
                    <Media src={p.images[0] ?? ''} alt={p.title} width={700} className="aspect-[4/3] w-full transition duration-500 group-hover:scale-[1.03]" label="Project photo" />
                  </div>
                  <div className="p-5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-blue">{p.type}</p>
                    <h2 className="mt-1 text-lg font-bold">{p.title}</h2>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                      <MapPin className="size-3.5" /> {p.city}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-muted">{p.description}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          {instagram && (
            <a
              href={instagram.url}
              target="_blank"
              rel="noopener"
              className="group mt-14 flex flex-col items-center gap-5 overflow-hidden rounded-3xl bg-gradient-to-br from-[#833ab4] via-[#e1306c] to-[#f77737] px-6 py-8 text-white sm:flex-row sm:px-10"
            >
              <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/30">
                <InstagramIcon className="size-8" />
              </span>
              <span className="flex-1 text-center sm:text-left">
                <span className="block text-xl font-extrabold">See our latest interiors on Instagram</span>
                <span className="mt-1 block text-sm text-white/85">New projects, site progress and finished spaces, posted as we complete them. Follow {instagram.handle}</span>
              </span>
              <span className="btn shrink-0 bg-white text-ink transition group-hover:bg-ink group-hover:text-white">Follow us</span>
            </a>
          )}
          <div className="mt-8 flex flex-col items-center gap-4 rounded-3xl bg-soft px-6 py-10 text-center">
            <h2 className="h2">Planning an interior project?</h2>
            <p className="max-w-xl text-muted">Share your floor plan and requirements, and we will suggest a layout and quotation.</p>
            <button onClick={() => openEnquiry('Home & Office Interiors')} className="btn-primary px-6 py-3">Get Enquiry</button>
          </div>
        </div>
      </section>

      {open && (
        <div role="dialog" aria-modal="true" aria-label={open.title} className="fixed inset-0 z-50 grid place-items-center bg-ink/80 p-4 backdrop-blur-sm" onClick={() => setOpen(null)}>
          <div className="max-h-[90dvh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 p-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue">{open.type} · {open.city}</p>
                <h2 className="mt-1 text-2xl font-extrabold">{open.title}</h2>
                <p className="mt-2 text-sm text-muted">{open.description}</p>
              </div>
              <button onClick={() => setOpen(null)} className="rounded-full p-2 hover:bg-soft" aria-label="Close">
                <X className="size-5" />
              </button>
            </div>
            <div className="grid gap-3 px-6 pb-6 sm:grid-cols-2">
              {open.images.map((img, i) => (
                <Media key={i} src={img} alt={`${open.title} photo ${i + 1}`} width={900} className="aspect-[4/3] w-full rounded-xl" label="Project photo" />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
