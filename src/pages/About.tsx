import { CheckCircle2, Eye, Target } from 'lucide-react'
import { about, site, yearsOfExperience } from '../lib/content'
import Seo from '../components/Seo'
import Media from '../components/Media'
import PageHeader from './PageHeader'
import Stats from '../sections/Stats'
import WhyUs from '../sections/WhyUs'
import Clients from '../sections/Clients'

export default function About() {
  return (
    <>
      <Seo title="About Us" description={about.intro} path="/about" />
      <PageHeader title={`About ${site.name}`} text={site.tagline} crumbs={[{ label: 'About' }]} image="/images/banners/office-workstations.webp" />
      <section className="py-20">
        <div className="container-x grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="eyebrow">{about.eyebrow}</p>
            <h2 className="h2 mt-2">{about.heading}</h2>
            <p className="mt-5 text-lg leading-relaxed text-ink/85">{about.intro}</p>
            {about.body.map((p) => (
              <p key={p} className="mt-4 leading-relaxed text-muted">{p}</p>
            ))}
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {about.expertise.map((e) => (
                <li key={e} className="flex items-start gap-2 text-sm font-medium">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" /> {e}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {about.images.map((img, i) => (
              <Media key={i} src={img} alt={`${site.name} photo ${i + 1}`} width={700} className={`w-full rounded-2xl ${i === 0 ? 'col-span-2 aspect-[16/9]' : 'aspect-square'}`} label="Company photo" />
            ))}
          </div>
        </div>
        <div className="container-x mt-16 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-brand p-7 text-white">
            <p className="text-5xl font-extrabold">{yearsOfExperience()}+</p>
            <p className="mt-2 font-semibold text-white/85">Years of Experience</p>
          </div>
          <div className="rounded-2xl border border-line p-7">
            <Target className="size-7 text-brand" />
            <h3 className="mt-3 text-lg font-bold">Our Mission</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{about.mission}</p>
          </div>
          <div className="rounded-2xl border border-line p-7">
            <Eye className="size-7 text-blue" />
            <h3 className="mt-3 text-lg font-bold">Our Vision</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{about.vision}</p>
          </div>
        </div>
      </section>
      <Stats />
      <WhyUs />
      <Clients />
    </>
  )
}
