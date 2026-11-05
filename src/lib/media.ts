import { site } from './content.js'

// Image paths in the content files are either:
//  - an ImageKit path such as "/products/bunker-cot-1.jpg" (when imagekitUrlEndpoint is set in site.json)
//  - a full URL, or a local file under /public such as "/images/logo-256.png"
//  - empty, in which case a placeholder is shown
// `ratio` (width ÷ height) crops the photo to that shape here rather than in the page, so the watermark is not cut off
export function imageUrl(path: string, width?: number, ratio?: number): string {
  if (!path) return ''
  if (/^https?:\/\//.test(path) || path.startsWith('/images/')) return path
  const endpoint = site.imagekitUrlEndpoint.replace(/\/$/, '')
  if (!endpoint) return path
  const size = width ? `w-${width}${ratio ? `,h-${Math.round(width / ratio)}` : ''},` : ''
  const tr = `?tr=${size}f-auto,q-80${width ? watermark(path, width) : ''}`
  return `${endpoint}${path.startsWith('/') ? '' : '/'}${path}${tr}`
}

// Our own product and project photos carry a small "MAANRAN" mark in the corner, added by ImageKit as the photo is
// delivered (the uploaded originals stay clean). Sized from the width asked for; thumbnails too small to read it go without.
const WATERMARKED = /^\/?maanran\/(products|interiors)\//
const WATERMARK_MIN_WIDTH = 300

function watermark(path: string, width: number) {
  if (!WATERMARKED.test(path) || width < WATERMARK_MIN_WIDTH) return ''
  const px = (divisor: number) => Math.max(1, Math.round(width / divisor))
  return `:l-text,i-MAANRAN,fs-${px(34)},co-FFFFFFE6,tg-b,bg-00000040,pa-${px(140)}_${px(70)},r-${px(170)},lx-N${px(40)},ly-N${px(40)},l-end`
}
