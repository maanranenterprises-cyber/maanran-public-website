import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Images, MapPin } from 'lucide-react'
import { instagram, interiors, pages, type InteriorProject } from '../lib/content'
import Seo from '../components/Seo'
import Media from '../components/Media'
import { InstagramIcon } from '../components/Icons'
import { useEnquiry } from '../components/EnquiryContext'
import PageHeader from './PageHeader'

export default function Interiors() {
  const types = ['All', ...new Set(interiors.map((p) => p.type))]
  const [type, setType] = useState('All')
  const { openEnquiry } = useEnquiry()
  const list = type === 'All' ? interiors : interiors.filter((p) => p.type === type)

  return (
    <>
      <Seo title="Home & Office Interiors in Bengaluru" description="Home and office interior design and furnishing in Bengaluru by MAANRAN ENTERPRISES: a gallery of completed homes, offices and commercial spaces." path="/interiors" image="/images/banners/home-interiors.webp" crumbs={[{ name: 'Interiors', path: '/interiors' }]} />
      <PageHeader title={pages.interiors.title} text={pages.interiors.text} crumbs={[{ label: 'Interiors' }]} image={pages.interiors.image} />
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
          {/* Keyed by the filter so the cards fade in again when it changes */}
          <ul key={type} className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p, i) => (
              <ProjectCard key={p.id} project={p} index={i} />
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
                <span className="block text-xl font-extrabold">{pages.interiors.instagramTitle}</span>
                <span className="mt-1 block text-sm text-white/85">
                  {pages.interiors.instagramText} Follow {instagram.handle}
                </span>
              </span>
              <span className="btn shrink-0 bg-white text-ink transition group-hover:bg-ink group-hover:text-white">Follow us</span>
            </a>
          )}
          <div className="mt-8 flex flex-col items-center gap-4 rounded-3xl bg-soft px-6 py-10 text-center">
            <h2 className="h2">{pages.interiors.ctaTitle}</h2>
            <p className="max-w-xl text-muted">{pages.interiors.ctaText}</p>
            <button onClick={() => openEnquiry(undefined, 'Home & Office Interiors')} className="btn-primary px-6 py-3">Get Enquiry</button>
          </div>
        </div>
      </section>

    </>
  )
}

// Project card linking to its page; cards fade up one after another (see .reveal in index.css)
export function ProjectCard({ project: p, index }: { project: InteriorProject; index: number }) {
  const photos = p.images.filter(Boolean).length
  return (
    <li className="reveal" style={{ '--i': index } as React.CSSProperties}>
      <Link to={`/interiors/${p.slug}`} className="group block h-full overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5">
        <div className="relative overflow-hidden">
          <Media src={p.images[0] ?? ''} alt={p.title} width={700} className="aspect-[4/3] w-full transition duration-500 group-hover:scale-[1.04]" label="Project photo" />
          {photos > 1 && (
            <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-ink/70 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
              <Images className="size-3.5" /> {photos} photos
            </span>
          )}
        </div>
        <div className="p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue">{p.type}</p>
          <h2 className="mt-1 text-lg font-bold group-hover:text-brand">{p.title}</h2>
          {p.city && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted">
              <MapPin className="size-3.5" /> {p.city}
            </p>
          )}
          <p className="mt-2 line-clamp-2 text-sm text-muted">{p.description}</p>
        </div>
      </Link>
    </li>
  )
}
