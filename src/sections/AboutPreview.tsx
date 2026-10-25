import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { about, site, yearsOfExperience } from '../lib/content'
import Media from '../components/Media'

export default function AboutPreview() {
  if (!about.visible) return null
  const [main, second] = about.images
  return (
    <section id="about" className="py-20 lg:py-28">
      <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="relative">
          <Media src={main} alt={`${site.name} workshop`} width={900} className="aspect-[4/3] w-full rounded-3xl" label="Company photo" />
          <div className="absolute -bottom-8 right-4 hidden w-44 overflow-hidden rounded-2xl border-8 border-white shadow-xl sm:block">
            <Media src={second} alt={`${site.name} project`} width={500} className="aspect-square w-full" label="Photo" />
          </div>
          <div className="absolute -top-6 left-6 rounded-2xl bg-brand px-6 py-5 text-white shadow-xl shadow-brand/30">
            <p className="text-4xl font-extrabold leading-none">{yearsOfExperience()}+</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-white/85">Years of Experience</p>
          </div>
        </div>
        <div>
          <p className="eyebrow">{about.eyebrow}</p>
          <h2 className="h2 mt-2">{about.heading}</h2>
          <p className="mt-2 text-lg font-semibold text-blue">{site.name}</p>
          <p className="mt-4 leading-relaxed text-muted">{about.intro}</p>
          <p className="mt-3 leading-relaxed text-muted">{about.body[0]}</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {about.expertise.map((e) => (
              <li key={e} className="flex items-start gap-2 text-sm font-medium">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" /> {e}
              </li>
            ))}
          </ul>
          <Link to={about.cta.href} className="btn-primary mt-8 px-6 py-3">
            {about.cta.label} <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
