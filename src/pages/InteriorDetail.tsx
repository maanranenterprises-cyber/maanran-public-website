import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Expand, MapPin, MessageSquareText } from 'lucide-react'
import { interiorBySlug, interiors, pages, site } from '../lib/content'
import Seo from '../components/Seo'
import Media from '../components/Media'
import Lightbox from '../components/Lightbox'
import { useEnquiry } from '../components/EnquiryContext'
import PageHeader from './PageHeader'
import NotFound from './NotFound'
import { ProjectCard } from './Interiors'

const CTA = 'Plan a similar project'

export default function InteriorDetail() {
  const { slug = '' } = useParams()
  const project = interiorBySlug(slug)
  const [viewing, setViewing] = useState<number | null>(null)
  const { openEnquiry } = useEnquiry()
  if (!project) return <NotFound />

  const photos = project.images.filter(Boolean)
  const where = [project.type, project.city].filter(Boolean).join(' · ')
  // Same type first, then the rest, newest order kept
  const more = [...interiors.filter((p) => p.id !== project.id && p.type === project.type), ...interiors.filter((p) => p.id !== project.id && p.type !== project.type)].slice(0, 3)
  const enquire = () => openEnquiry(`Interior project like "${project.title}"`)
  const [main, ...rest] = photos

  return (
    <>
      <Seo
        title={`${project.title} | ${project.type} Interiors`}
        description={`${project.description} ${project.type} interior project by ${site.name}${project.city ? `, ${project.city}` : ''}.`}
        path={`/interiors/${project.slug}`}
        image={main}
        crumbs={[
          { name: 'Interiors', path: '/interiors' },
          { name: project.title, path: `/interiors/${project.slug}` },
        ]}
      />
      <PageHeader title={project.title} text={where} crumbs={[{ label: 'Interiors', to: '/interiors' }, { label: project.title }]} image={main || pages.interiors.image} />

      <section className="py-12 lg:py-16">
        <div className="container-x grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
          <div>
            {photos.length ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {[main, ...rest].map((img, i) => (
                  <button
                    key={`${img}-${i}`}
                    onClick={() => setViewing(i)}
                    aria-label={`Open photo ${i + 1} of ${photos.length}`}
                    className={`group relative overflow-hidden rounded-2xl ${i === 0 ? 'col-span-2' : ''}`}
                  >
                    <Media src={img} alt={`${project.title}, photo ${i + 1}`} width={i === 0 ? 1400 : 700} eager={i === 0} className={`w-full transition duration-500 group-hover:scale-[1.03] ${i === 0 ? 'aspect-[16/9]' : 'aspect-[4/3]'}`} />
                    <span className="absolute inset-0 grid place-items-center bg-ink/0 transition group-hover:bg-ink/25">
                      <Expand className="size-7 text-white opacity-0 drop-shadow transition group-hover:opacity-100" />
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <Media src="" alt="" className="aspect-[16/9] w-full rounded-2xl" label="Project photos coming soon" />
            )}
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-[11px] font-bold uppercase tracking-wider text-blue">{project.type}</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight">{project.title}</h2>
            {project.city && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                <MapPin className="size-4" /> {project.city}
              </p>
            )}
            {project.description && <p className="mt-5 whitespace-pre-line leading-relaxed text-ink/85">{project.description}</p>}
            {photos.length > 0 && (
              <button onClick={() => setViewing(0)} className="btn-outline mt-6 w-full">
                <Expand className="size-4" /> View all {photos.length} photos
              </button>
            )}
            <button onClick={enquire} className="btn-primary mt-3 w-full py-3">
              <MessageSquareText className="size-4" /> {CTA}
            </button>
          </aside>
        </div>

        {more.length > 0 && (
          <div className="container-x mt-16 border-t border-line pt-12">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-2xl font-extrabold tracking-tight">More projects</h2>
              <Link to="/interiors" className="text-sm font-semibold text-brand hover:underline">
                All projects
              </Link>
            </div>
            <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((p, i) => (
                <ProjectCard key={p.id} project={p} index={i} />
              ))}
            </ul>
          </div>
        )}
      </section>

      {viewing !== null && (
        <Lightbox images={photos} start={viewing} title={project.title} onClose={() => setViewing(null)}>
          <button
            onClick={() => {
              setViewing(null)
              enquire()
            }}
            className="btn-primary px-6"
          >
            <MessageSquareText className="size-4" /> {CTA}
          </button>
        </Lightbox>
      )}
    </>
  )
}
