// Full-screen photo viewer: arrows, keyboard (← → Esc), swipe, thumbnails and a counter.
// The browser's Back button closes it, focus stays inside while open, and the page behind cannot scroll.
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { imageUrl } from '../lib/media'

type Props = { images: string[]; start: number; title: string; onClose: () => void; children?: ReactNode }

const SWIPE_PX = 50
let openViewers = 0
// Screen-sized versions, so a phone does not download a desktop-sized photo
const srcSet = (path: string) => [800, 1200, 1800].map((w) => `${imageUrl(path, w)} ${w}w`).join(', ')

export default function Lightbox({ images, start, title, onClose, children }: Props) {
  const [index, setIndex] = useState(start)
  const dialog = useRef<HTMLDivElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const swipeFrom = useRef<number | null>(null)
  const count = images.length
  const go = useCallback((i: number) => setIndex((i + count) % count), [count])

  // Back button closes the viewer: open adds a history entry, closing by any other means removes it again.
  // Set up once; the latest onClose is read through a ref so a new function from the parent changes nothing.
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const closedByBack = useRef(false)
  useEffect(() => {
    openViewers++
    if (!window.history.state?.lightbox) window.history.pushState({ lightbox: true }, '')
    const onPop = () => {
      closedByBack.current = true
      closeRef.current()
    }
    window.addEventListener('popstate', onPop)
    return () => {
      openViewers--
      window.removeEventListener('popstate', onPop)
      // Checked a moment later: React's development mode closes and reopens components straight away
      window.setTimeout(() => {
        if (openViewers === 0 && !closedByBack.current && window.history.state?.lightbox) window.history.back()
      }, 0)
    }
  }, [])

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeButton.current?.focus()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') go(index + 1)
      else if (e.key === 'ArrowLeft') go(index - 1)
      else if (e.key === 'Tab') {
        // Keep keyboard focus inside the viewer
        const focusable = dialog.current?.querySelectorAll<HTMLElement>('button, a[href]')
        if (!focusable?.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus())
        else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus())
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [index, go, onClose])

  // Load the neighbours in advance so moving between photos feels instant
  useEffect(() => {
    for (const i of [index + 1, index - 1]) {
      const path = images[(i + count) % count]
      if (path) Object.assign(new Image(), { sizes: '100vw', srcset: srcSet(path) })
    }
  }, [index, images, count])

  const current = images[index]
  return (
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label={`${title}: photos`}
      className="lightbox fixed inset-0 z-[60] flex flex-col bg-ink/95 text-white"
      onPointerDown={(e) => (swipeFrom.current = e.clientX)}
      onPointerUp={(e) => {
        if (swipeFrom.current === null) return
        const dx = e.clientX - swipeFrom.current
        swipeFrom.current = null
        if (Math.abs(dx) > SWIPE_PX) go(index + (dx < 0 ? 1 : -1))
      }}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <p className="min-w-0 truncate text-sm font-semibold">
          {title} <span className="ml-2 font-normal text-white/60" aria-live="polite">{`${index + 1} / ${count}`}</span>
        </p>
        <button ref={closeButton} onClick={onClose} aria-label="Close photos" className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 hover:bg-white/20">
          <X className="size-5" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16">
        {current ? (
          <img key={current} src={imageUrl(current, 1200)} srcSet={srcSet(current)} sizes="100vw" alt={`${title}, photo ${index + 1} of ${count}`} className="lightbox-photo max-h-full max-w-full select-none rounded-lg object-contain" draggable={false} />
        ) : (
          <p className="text-white/60">Photo coming soon</p>
        )}
        {count > 1 && (
          <>
            <button onClick={() => go(index - 1)} aria-label="Previous photo" className="absolute left-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/25 sm:left-4">
              <ChevronLeft className="size-6" />
            </button>
            <button onClick={() => go(index + 1)} aria-label="Next photo" className="absolute right-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/25 sm:right-4">
              <ChevronRight className="size-6" />
            </button>
          </>
        )}
      </div>

      <div className="flex flex-col gap-3 px-4 py-4 sm:px-6">
        {count > 1 && (
          <div className="flex justify-center gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={`${img}-${i}`}
                onClick={() => setIndex(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index}
                className={`size-14 shrink-0 overflow-hidden rounded-md border-2 transition sm:size-16 ${i === index ? 'border-white' : 'border-transparent opacity-50 hover:opacity-90'}`}
              >
                {img && <img src={imageUrl(img, 160)} alt="" className="size-full object-cover" draggable={false} />}
              </button>
            ))}
          </div>
        )}
        {children && <div className="flex justify-center">{children}</div>}
      </div>
    </div>
  )
}
