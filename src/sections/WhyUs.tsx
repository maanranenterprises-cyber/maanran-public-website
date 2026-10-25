import { CheckCircle2 } from 'lucide-react'
import { whyUs } from '../lib/content'
import Media from '../components/Media'
import CtaLink from '../components/CtaLink'

export default function WhyUs() {
  if (!whyUs.visible) return null
  const [main, second] = whyUs.images
  return (
    <section id="why-us" className="py-20 lg:py-28">
      <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="eyebrow">{whyUs.eyebrow}</p>
          <h2 className="h2 mt-2">{whyUs.heading}</h2>
          <p className="mt-4 leading-relaxed text-muted">{whyUs.description}</p>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2">
            {whyUs.benefits.map((b) => (
              <li key={b.id} className="flex gap-3">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
                  <CheckCircle2 className="size-5" />
                </span>
                <span>
                  <span className="block font-bold">{b.title}</span>
                  <span className="mt-0.5 block text-sm text-muted">{b.text}</span>
                </span>
              </li>
            ))}
          </ul>
          {whyUs.cta && (
            <CtaLink href={whyUs.cta.href} className="btn-outline mt-8 px-6 py-3">
              {whyUs.cta.label}
            </CtaLink>
          )}
        </div>
        <div className="grid grid-cols-5 gap-4">
          <Media src={main} alt="Completed furniture project" width={800} className="col-span-3 aspect-[3/4] w-full rounded-3xl" label="Main photo" />
          <div className="col-span-2 flex flex-col gap-4 pt-12">
            <Media src={second} alt="Furniture detail" width={500} className="aspect-square w-full rounded-3xl" label="Photo" />
            <div className="rounded-3xl bg-blue p-5 text-white">
              <p className="text-3xl font-extrabold">100%</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-white/80">In-house delivery and installation</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
