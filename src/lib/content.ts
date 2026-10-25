// All site content comes from the JSON files in src/content.
// Editing a file there and redeploying is how the site is updated (no backend).
import siteJson from '../content/site.json'
import bannersJson from '../content/banners.json'
import aboutJson from '../content/about.json'
import clientsJson from '../content/clients.json'
import categoriesJson from '../content/categories.json'
import productsJson from '../content/products.json'
import statsJson from '../content/stats.json'
import whyUsJson from '../content/why-us.json'
import testimonialsJson from '../content/testimonials.json'
import documentsJson from '../content/documents.json'
import interiorsJson from '../content/interiors.json'

export type Link = { label: string; href: string }

export type Banner = {
  id: string
  heading: string
  subtitle: string
  imageDesktop: string
  imageMobile: string
  ctas: Link[]
  order: number
  published: boolean
  publishFrom: string | null
  publishUntil: string | null
}

export type Category = { slug: string; name: string; description: string; image: string; order: number; published: boolean }

export type Product = {
  id: string
  slug: string
  name: string
  brand: string
  category: string
  shortDescription: string
  description: string
  images: string[]
  specs: Record<string, string>
  featured: boolean
  order: number
  published: boolean
}

export type Client = { id: string; name: string; logo: string; website: string; order: number; published: boolean }
export type Stat = { id: string; label: string; value: number; suffix: string; icon: string; order: number; active: boolean; verified: boolean }
export type Testimonial = { id: string; name: string; photo: string; text: string; rating: number; designation: string; order: number; published: boolean }
export type Doc = {
  id: string
  title: string
  category: string
  description: string
  cover: string
  file: string
  fileType: string
  sizeLabel: string
  featured: boolean
  order: number
  published: boolean
}
export type InteriorProject = { id: string; title: string; type: string; city: string; description: string; images: string[]; order: number; published: boolean }

type Publishable = { order: number; published?: boolean; active?: boolean; publishFrom?: string | null; publishUntil?: string | null }

// Only published (or active) records inside their publication window, sorted by `order`.
// The check runs in the browser, so scheduled banners switch on and off without a rebuild.
export function live<T extends Publishable>(items: T[], now = new Date()): T[] {
  return items
    .filter((item) => item.published !== false && item.active !== false)
    .filter((item) => !item.publishFrom || new Date(item.publishFrom) <= now)
    .filter((item) => !item.publishUntil || new Date(item.publishUntil) >= now)
    .sort((a, b) => a.order - b.order)
}

export const site = siteJson
export const about = aboutJson
export const whyUs = { ...whyUsJson, benefits: live(whyUsJson.benefits) }
export const banners = live(bannersJson as Banner[])
export const clients = live(clientsJson as Client[])
export const categories = live(categoriesJson as Category[])
export const products = live(productsJson as unknown as Product[])
export const featuredProducts = products.filter((p) => p.featured)
export const stats = live(statsJson as Stat[])
export const testimonials = live(testimonialsJson as Testimonial[])
export const documents = live(documentsJson as Doc[])
export const interiors = live(interiorsJson as InteriorProject[])
export const navigation = live(site.navigation.map((n) => ({ ...n, active: n.visible })))

// Instagram profile from site.social, with the @handle taken from its URL (null until a URL is added)
const instagramUrl = site.social.find((s) => s.type === 'instagram')?.url ?? ''
export const instagram = instagramUrl ? { url: instagramUrl, handle: `@${instagramUrl.replace(/\/+$/, '').split('/').pop()}` } : null

const facebookUrl = site.social.find((s) => s.type === 'facebook')?.url ?? ''
export const facebook = facebookUrl ? { url: facebookUrl } : null

export const categoryName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug

export function yearsOfExperience(now = new Date()) {
  return Math.max(1, now.getFullYear() - site.experienceStartYear)
}

export const whatsappLink = (text: string = site.whatsappMessage) =>
  `https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(text)}`
