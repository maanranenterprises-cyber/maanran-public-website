import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = { onPrev: () => void; onNext: () => void; canPrev?: boolean; canNext?: boolean; label: string }

export default function CarouselArrows({ onPrev, onNext, canPrev = true, canNext = true, label }: Props) {
  const cls = 'grid size-11 place-items-center rounded-full border border-line bg-white text-ink transition hover:border-brand hover:text-brand disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink'
  return (
    <div className="flex gap-2">
      <button type="button" onClick={onPrev} disabled={!canPrev} className={cls} aria-label={`Previous ${label}`}>
        <ChevronLeft className="size-5" />
      </button>
      <button type="button" onClick={onNext} disabled={!canNext} className={cls} aria-label={`Next ${label}`}>
        <ChevronRight className="size-5" />
      </button>
    </div>
  )
}
