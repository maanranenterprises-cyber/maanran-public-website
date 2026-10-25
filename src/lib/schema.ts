// Rules for every editable content file in src/content.
// Shared by the build (scripts/prerender.mjs fails on broken content), the admin API (rejects bad saves)
// and the admin forms. Objects keep unknown keys such as "_note", so editing never drops them.
import { z } from 'zod'

const text = z.string().trim()
const required = (label: string) => text.min(1, `${label} is required`)
// Image or file path: a local /images/... or /downloads/... file, an ImageKit path, a full URL, or empty for a placeholder
const media = z.string().trim()
const slug = text.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes only (e.g. office-chairs)')
const order = z.number().int().min(0)
const link = z.looseObject({ label: required('Button text'), href: required('Button link') })
const isoDate = z.string().datetime({ offset: true, local: true }).or(z.string().date()).nullable()

export const bannerSchema = z.looseObject({
  id: required('ID'),
  heading: required('Heading'),
  subtitle: text,
  imageDesktop: media,
  imageMobile: media,
  ctas: z.array(link).max(3),
  order,
  published: z.boolean(),
  publishFrom: isoDate,
  publishUntil: isoDate,
})

export const categorySchema = z.looseObject({
  slug,
  name: required('Name'),
  description: text,
  image: media,
  order,
  published: z.boolean(),
})

export const productSchema = z.looseObject({
  id: required('ID'),
  slug,
  name: required('Name'),
  brand: text,
  category: required('Category'),
  shortDescription: text,
  description: text,
  images: z.array(media),
  specs: z.record(z.string(), z.string()),
  featured: z.boolean(),
  order,
  published: z.boolean(),
})

export const clientSchema = z.looseObject({
  id: required('ID'),
  name: required('Name'),
  logo: media,
  website: text.refine((v) => !v || /^https?:\/\//.test(v), 'Website must start with http:// or https://'),
  order,
  published: z.boolean(),
})

export const statSchema = z.looseObject({
  id: required('ID'),
  label: required('Label'),
  value: z.number().min(0),
  suffix: text,
  icon: z.enum(['smile', 'briefcase', 'users', 'heart']),
  order,
  active: z.boolean(),
  verified: z.boolean(),
})

export const testimonialSchema = z.looseObject({
  id: required('ID'),
  name: required('Name'),
  photo: media,
  text: required('Testimonial text'),
  rating: z.number().int().min(0).max(5),
  designation: text,
  order,
  published: z.boolean(),
})

export const documentSchema = z.looseObject({
  id: required('ID'),
  title: required('Title'),
  category: text,
  description: text,
  cover: media,
  file: required('File'),
  fileType: text,
  sizeLabel: text,
  featured: z.boolean(),
  order,
  published: z.boolean(),
})

export const interiorSchema = z.looseObject({
  id: required('ID'),
  title: required('Title'),
  type: required('Type'),
  city: text,
  description: text,
  images: z.array(media),
  order,
  published: z.boolean(),
})

export const aboutSchema = z.looseObject({
  visible: z.boolean(),
  eyebrow: text,
  heading: required('Heading'),
  intro: text,
  body: z.array(text),
  expertise: z.array(text),
  images: z.array(media),
  cta: link,
  mission: text,
  vision: text,
})

export const whyUsSchema = z.looseObject({
  visible: z.boolean(),
  eyebrow: text,
  heading: required('Heading'),
  description: text,
  benefits: z.array(z.looseObject({ id: required('ID'), title: required('Title'), text, order })),
  images: z.array(media),
  cta: link.nullable(),
  badge: z.looseObject({ value: text, label: text }),
})

const heading = z.looseObject({ eyebrow: text, title: required('Title'), text })
const legalPage = z.looseObject({ title: required('Title'), sections: z.array(z.looseObject({ heading: required('Heading'), body: text })) })

export const pagesSchema = z.looseObject({
  home: z.looseObject({
    products: heading,
    clients: heading.extend({ count: text, countText: text }),
    testimonials: heading,
    downloads: heading,
  }),
  products: z.looseObject({ title: required('Title'), text, image: media }),
  interiors: z.looseObject({ title: required('Title'), text, image: media, instagramTitle: text, instagramText: text, ctaTitle: text, ctaText: text }),
  contact: z.looseObject({ title: required('Title'), text, detailsTitle: text, formEyebrow: text, formTitle: text }),
  about: z.looseObject({ image: media }),
  footer: z.looseObject({ ctaTitle: text, ctaText: text, ctaButton: text, blurb: text }),
  legal: z.looseObject({ note: text, privacy: legalPage, terms: legalPage }),
})

export const siteSchema = z.looseObject({
  name: required('Company name'),
  shortName: text,
  tagline: text,
  location: text,
  description: text,
  experienceStartYear: z.number().int().min(1900).max(2100),
  logo: media,
  imagekitUrlEndpoint: text,
  domain: text.url(),
  navigation: z.array(z.looseObject({ label: required('Menu label'), href: required('Menu link'), visible: z.boolean(), order })),
  contact: z.looseObject({
    phone: required('Phone'),
    phoneDisplay: required('Phone as shown'),
    whatsapp: text.regex(/^\d{10,15}$/, 'WhatsApp number: digits only, with country code (e.g. 919886277250)'),
    email: text.email('Enter a valid email'),
    formEndpoint: text.url('Enter the Formspree form URL'),
    hours: text,
    opens: text.regex(/^\d{2}:\d{2}$/, 'Use 24-hour time, e.g. 09:00'),
    closes: text.regex(/^\d{2}:\d{2}$/, 'Use 24-hour time, e.g. 20:00'),
  }),
  address: z.looseObject({
    lines: z.array(text).min(1),
    street: text,
    locality: text,
    region: text,
    postalCode: text,
    country: text,
    latitude: z.number(),
    longitude: z.number(),
    mapQuery: text,
    mapCid: text,
    mapLink: text,
  }),
  social: z.array(z.looseObject({ type: z.enum(['facebook', 'instagram', 'linkedin', 'youtube']), url: text })),
  whatsappMessage: text,
})

// Every file the admin may read and write, keyed by its name in the admin and the API
export const collections = {
  site: { file: 'site.json', label: 'Site settings', schema: siteSchema },
  pages: { file: 'pages.json', label: 'Page text', schema: pagesSchema },
  banners: { file: 'banners.json', label: 'Banners', schema: z.array(bannerSchema) },
  categories: { file: 'categories.json', label: 'Categories', schema: z.array(categorySchema) },
  products: { file: 'products.json', label: 'Products', schema: z.array(productSchema) },
  clients: { file: 'clients.json', label: 'Clients', schema: z.array(clientSchema) },
  stats: { file: 'stats.json', label: 'Stats', schema: z.array(statSchema) },
  whyUs: { file: 'why-us.json', label: 'Why us', schema: whyUsSchema },
  about: { file: 'about.json', label: 'About', schema: aboutSchema },
  testimonials: { file: 'testimonials.json', label: 'Testimonials', schema: z.array(testimonialSchema) },
  documents: { file: 'documents.json', label: 'Downloads', schema: z.array(documentSchema) },
  interiors: { file: 'interiors.json', label: 'Interiors', schema: z.array(interiorSchema) },
} as const

export type CollectionName = keyof typeof collections
export const isCollection = (name: string): name is CollectionName => Object.hasOwn(collections, name)

// Readable messages such as "products › 3 › name: Name is required"
export function describeIssues(name: string, error: z.ZodError) {
  return error.issues.map((i) => `${[name, ...i.path].join(' › ')}: ${i.message}`)
}

function duplicates(values: string[]) {
  return [...new Set(values.filter((v, i) => values.indexOf(v) !== i))]
}

// Rules that span records or files: unique IDs and slugs, and products pointing at a real category
export function crossCheck(content: Partial<Record<CollectionName, unknown>>) {
  const errors: string[] = []
  const list = (name: CollectionName) => (Array.isArray(content[name]) ? (content[name] as Record<string, string>[]) : [])
  for (const name of ['banners', 'products', 'clients', 'stats', 'testimonials', 'documents', 'interiors'] as const) {
    for (const id of duplicates(list(name).map((r) => r.id))) errors.push(`${name}: the ID "${id}" is used more than once`)
  }
  for (const name of ['categories', 'products'] as const) {
    for (const s of duplicates(list(name).map((r) => r.slug))) errors.push(`${name}: the link name "${s}" is used more than once`)
  }
  const categorySlugs = new Set(list('categories').map((c) => c.slug))
  if (content.categories && content.products) {
    for (const p of list('products')) {
      if (!categorySlugs.has(p.category)) errors.push(`products › ${p.name}: category "${p.category}" does not exist`)
    }
  }
  return errors
}

// Checks one file on its own; returns the cleaned data or the problems found
export function validateCollection(name: CollectionName, data: unknown) {
  const result = collections[name].schema.safeParse(data)
  return result.success ? { ok: true as const, data: result.data } : { ok: false as const, errors: describeIssues(name, result.error) }
}

// Checks every file plus the cross-file rules; used by the build
export function validateAll(content: Record<CollectionName, unknown>) {
  const errors: string[] = []
  for (const name of Object.keys(collections) as CollectionName[]) {
    const r = validateCollection(name, content[name])
    if (!r.ok) errors.push(...r.errors)
  }
  return [...errors, ...crossCheck(content)]
}
