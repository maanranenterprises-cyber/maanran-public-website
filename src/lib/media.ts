import { site } from './content'

// Image paths in the content files are either:
//  - an ImageKit path such as "/products/bunker-cot-1.jpg" (when imagekitUrlEndpoint is set in site.json)
//  - a full URL, or a local file under /public such as "/images/logo-256.png"
//  - empty, in which case a placeholder is shown
export function imageUrl(path: string, width?: number): string {
  if (!path) return ''
  if (/^https?:\/\//.test(path) || path.startsWith('/images/')) return path
  const endpoint = site.imagekitUrlEndpoint.replace(/\/$/, '')
  if (!endpoint) return path
  const tr = width ? `?tr=w-${width},f-auto,q-80` : '?tr=f-auto,q-80'
  return `${endpoint}${path.startsWith('/') ? '' : '/'}${path}${tr}`
}
