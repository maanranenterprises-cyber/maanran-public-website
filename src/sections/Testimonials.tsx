import { useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { Link } from 'react-router-dom'
import { MessageSquarePlus, Quote, Star } from 'lucide-react'
import { pages, testimonials } from '../lib/content'
import Media from '../components/Media'
import CarouselArrows from '../components/CarouselArrows'
import SectionHeading from '../components/SectionHeading'

export default function Testimonials() {
  const [emblaRef, embla] = useEmblaCarousel({ align: 'start', loop: true }, [Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })])
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    if (!embla) return
    const onSelect = () => setSelected(embla.selectedScrollSnap())
    embla.on('select', onSelect)
    onSelect()
  }, [embla])

  if (!testimonials.length || !pages.sections.testimonials) return null

  return (
    <section id="testimonials" className="bg-soft py-20 lg:py-24">
      <div className="container-x">
        <SectionHeading center eyebrow={pages.home.testimonials.eyebrow} title={pages.home.testimonials.title} text={pages.home.testimonials.text} />
        <div className="mt-12 overflow-hidden" ref={emblaRef}>
          <div className="-ml-6 flex">
            {testimonials.map((t) => (
              <div key={t.id} className="min-w-0 shrink-0 grow-0 basis-full pl-6 md:basis-1/2 lg:basis-1/3">
                <figure className="flex h-full flex-col rounded-2xl border border-line bg-white p-7">
                  <Quote className="size-8 text-brand/25" />
                  {t.rating > 0 && (
                    <div className="mt-3 flex gap-0.5" aria-label={`Rated ${t.rating} out of 5`}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className={`size-4 ${i < t.rating ? 'fill-accent text-accent' : 'text-line'}`} />
                      ))}
                    </div>
                  )}
                  <blockquote className="mt-4 flex-1 leading-relaxed text-ink/85">{t.text}</blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-5">
                    {t.photo ? (
                      <Media src={t.photo} alt={t.name} width={96} className="size-11 rounded-full" />
                    ) : (
                      <span className="grid size-11 place-items-center rounded-full bg-blue/10 font-bold text-blue">{t.name.charAt(0)}</span>
                    )}
                    <span>
                      <span className="block font-bold">{t.name}</span>
                      {t.designation && <span className="block text-xs text-muted">{t.designation}</span>}
                    </span>
                  </figcaption>
                </figure>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
          <CarouselArrows label="testimonial" onPrev={() => embla?.scrollPrev()} onNext={() => embla?.scrollNext()} />
          <div className="flex gap-1.5">
            {testimonials.map((t, i) => (
              <button key={t.id} onClick={() => embla?.scrollTo(i)} aria-label={`Show testimonial ${i + 1}`} className={`h-1.5 rounded-full transition-all ${i === selected ? 'w-6 bg-brand' : 'w-1.5 bg-ink/20'}`} />
            ))}
          </div>
          <Link to="/feedback" className="btn-outline">
            <MessageSquarePlus className="size-4" /> Share your feedback
          </Link>
        </div>
      </div>
    </section>
  )
}
