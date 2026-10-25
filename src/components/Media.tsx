import { ImageIcon } from 'lucide-react'
import { imageUrl } from '../lib/media'

type Props = {
  src: string
  alt: string
  width?: number
  className?: string
  /** Shown on the placeholder until a real photo is added */
  label?: string
  eager?: boolean
  /** 'contain' shows the whole photo (product shots), 'cover' fills the box */
  fit?: 'cover' | 'contain'
}

// Renders an ImageKit/local image, or a branded placeholder while the photo is missing.
export default function Media({ src, alt, width, className = '', label, eager, fit = 'cover' }: Props) {
  const url = imageUrl(src, width)
  if (url) {
    return <img src={url} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" className={`${fit === 'contain' ? 'object-contain bg-white' : 'object-cover'} ${className}`} />
  }
  return (
    <div
      role="img"
      aria-label={alt}
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 ${className}`}
    >
      <div className="absolute -left-10 -top-10 size-40 rounded-full bg-brand/10" />
      <div className="absolute -bottom-12 -right-6 size-44 rounded-full bg-blue/10" />
      <div className="absolute bottom-6 left-1/3 size-16 rounded-full bg-accent/15" />
      <div className="relative flex flex-col items-center gap-1.5 px-4 text-center text-slate-400">
        <ImageIcon className="size-7" strokeWidth={1.5} />
        <span className="text-[11px] font-semibold uppercase tracking-wider">{label ?? 'Photo coming soon'}</span>
      </div>
    </div>
  )
}
