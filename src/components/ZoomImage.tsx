// Product photo with hover zoom (desktop, mouse only): a lens follows the pointer over the photo and a panel beside it,
// over the product details, shows that part enlarged from a larger copy of the photo. Touch screens get the plain photo.
import { useEffect, useRef, useState, type MouseEvent } from 'react'
import Media from './Media'
import { imageUrl } from '../lib/media'

const ZOOM = 2.5
const ZOOM_WIDTH = 2000
// Wide screens only: the panel needs the details column beside the photo
const CAN_ZOOM = '(min-width: 1024px) and (hover: hover) and (pointer: fine)'

type Box = { x: number; y: number; w: number; h: number }
type View = { lens: Box; photo: Box }

export default function ZoomImage({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  const frame = useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = useState(false)
  const [view, setView] = useState<View | null>(null)

  useEffect(() => {
    const query = window.matchMedia(CAN_ZOOM)
    const sync = () => setEnabled(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  const move = (e: MouseEvent<HTMLDivElement>) => {
    const box = frame.current?.getBoundingClientRect()
    const img = frame.current?.querySelector('img')
    if (!box || !img?.naturalWidth) return
    // The photo is fitted inside the frame ("contain"), so it may not fill it; the lens stays on the photo
    const scale = Math.min(box.width / img.naturalWidth, box.height / img.naturalHeight)
    const photo = { w: img.naturalWidth * scale, h: img.naturalHeight * scale, x: 0, y: 0 }
    photo.x = (box.width - photo.w) / 2
    photo.y = (box.height - photo.h) / 2
    const w = box.width / ZOOM
    const h = box.height / ZOOM
    const place = (pointer: number, size: number, start: number, length: number) =>
      length <= size ? start + (length - size) / 2 : Math.min(Math.max(pointer - size / 2, start), start + length - size)
    const x = e.clientX - box.left
    const y = e.clientY - box.top
    if (x < photo.x || x > photo.x + photo.w || y < photo.y || y > photo.y + photo.h) return setView(null)
    setView({ photo, lens: { w, h, x: place(x, w, photo.x, photo.w), y: place(y, h, photo.y, photo.h) } })
  }

  const zoomable = enabled && Boolean(imageUrl(src))
  return (
    <div ref={frame} className="relative" onMouseMove={zoomable ? move : undefined} onMouseLeave={() => setView(null)} style={zoomable ? { cursor: 'crosshair' } : undefined}>
      <Media src={src} alt={alt} width={1000} eager fit="contain" className={className} label="Product photo" />
      {view && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute border border-blue/40 bg-blue/10"
            style={{ left: view.lens.x, top: view.lens.y, width: view.lens.w, height: view.lens.h, backgroundImage: 'radial-gradient(rgb(255 255 255 / 0.6) 1px, transparent 1px)', backgroundSize: '4px 4px' }}
          />
          {/* The smaller copy shows at once (already loaded); the larger one covers it when it arrives */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-[calc(100%+3.5rem)] z-30 size-full overflow-hidden rounded-2xl border border-line bg-white bg-no-repeat shadow-2xl"
            style={{
              backgroundImage: `url("${imageUrl(src, ZOOM_WIDTH)}"), url("${imageUrl(src, 1000)}")`,
              backgroundSize: `${view.photo.w * ZOOM}px ${view.photo.h * ZOOM}px`,
              backgroundPosition: `${-(view.lens.x - view.photo.x) * ZOOM}px ${-(view.lens.y - view.photo.y) * ZOOM}px`,
            }}
          />
        </>
      )}
    </div>
  )
}
