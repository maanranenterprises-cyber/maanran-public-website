import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useEmblaCarousel from 'embla-carousel-react'
import { ArrowRight } from 'lucide-react'
import { featuredProducts } from '../lib/content'
import ProductCard from '../components/ProductCard'
import CarouselArrows from '../components/CarouselArrows'
import SectionHeading from '../components/SectionHeading'

export default function ProductsRail() {
  const [emblaRef, embla] = useEmblaCarousel({ align: 'start', slidesToScroll: 'auto', containScroll: 'trimSnaps' })
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(true)

  const update = useCallback(() => {
    if (!embla) return
    setCanPrev(embla.canScrollPrev())
    setCanNext(embla.canScrollNext())
  }, [embla])

  useEffect(() => {
    if (!embla) return
    update()
    embla.on('select', update).on('reInit', update)
  }, [embla, update])

  if (!featuredProducts.length) return null

  return (
    <section id="products" className="py-20 lg:py-24">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading eyebrow="Our Products" title="Furniture for every space" text="Office, institutional and steel furniture, made to order in the sizes you need." />
          <div className="flex items-center gap-4">
            <Link to="/products" className="hidden text-sm font-semibold text-brand hover:underline sm:inline-flex sm:items-center sm:gap-1">
              View all products <ArrowRight className="size-4" />
            </Link>
            <CarouselArrows label="products" onPrev={() => embla?.scrollPrev()} onNext={() => embla?.scrollNext()} canPrev={canPrev} canNext={canNext} />
          </div>
        </div>
        <div className="-mx-2 mt-10 overflow-hidden px-2 py-2" ref={emblaRef}>
          <div className="-ml-4 flex touch-pan-y">
            {featuredProducts.map((p) => (
              <div key={p.id} className="min-w-0 shrink-0 grow-0 basis-[78%] pl-4 sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
        <Link to="/products" className="btn-outline mt-8 w-full sm:hidden">
          View all products <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  )
}
