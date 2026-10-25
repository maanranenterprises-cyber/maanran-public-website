// What each admin section edits: its fields, labels and help text. The list and edit screens are built from this.
import type { z } from 'zod'
import { bannerSchema, categorySchema, clientSchema, documentSchema, interiorSchema, productSchema, statSchema, testimonialSchema, type CollectionName } from '../lib/schema'

export type Item = Record<string, unknown>
// Other sections' data a form needs, e.g. the category list for the product form
export type Context = Partial<Record<CollectionName, Item[]>>
type Option = { value: string; label: string }

export type FieldDef = { key: string; label: string; hint?: string; required?: boolean } & (
  // `suggestions` offers values already used in this section (e.g. interior types) so spelling stays consistent
  | { type: 'text' | 'textarea'; placeholder?: string; suggestions?: (items: Item[]) => string[] }
  | { type: 'slug'; from: string }
  | { type: 'number'; min?: number; max?: number }
  | { type: 'toggle' }
  | { type: 'image' | 'images'; contain?: boolean }
  | { type: 'select'; options: (ctx: Context) => Option[] }
  | { type: 'datetime' }
  | { type: 'specs' }
  | { type: 'links'; max: number }
  // A downloadable file (PDF); `details` lists extra fields filled in from the upload, e.g. file type and size
  | { type: 'file'; accept: string; details?: { typeKey: string; sizeKey: string } }
)

export type Section = {
  name: CollectionName
  path: string
  singular: string
  plural: string
  description: string
  // Which field identifies an item in links (/admin/products/<slug>) and must be unique
  keyField: 'id' | 'slug'
  idPrefix?: string
  titleField: string
  subtitle?: (item: Item, ctx: Context) => string
  imageField?: string
  imageContain?: boolean
  // Shown in the list instead of a picture when a section has no image (e.g. "250+" for a stat)
  thumbText?: (item: Item) => string
  // The on/off field for "Visible on the website" (stats use `active`, everything else `published`)
  visibleField?: string
  // ImageKit folder for this section's uploads, e.g. /maanran/products
  folder: string
  schema: z.ZodType
  needs?: CollectionName[]
  // Optional dropdown above the list, e.g. products by category; the choice also pre-fills new items
  filter?: { key: string; allLabel: string; options: (ctx: Context) => Option[] }
  // Names of other items that depend on this one; deleting is blocked while there are any
  usedBy?: (item: Item, ctx: Context) => string[]
  fields: FieldDef[]
  newItem: () => Item
}

// Values already used in a field, plus some common starting points
const usedValues = (key: string, defaults: string[]) => (items: Item[]) => [...new Set([...defaults, ...items.map((i) => String(i[key] ?? '')).filter(Boolean)])]

const categoryOptions = (ctx: Context) => (ctx.categories ?? []).map((c) => ({ value: String(c.slug), label: String(c.name) }))
const categoryLabel = (slug: unknown, ctx: Context) => String((ctx.categories ?? []).find((c) => c.slug === slug)?.name ?? slug)

export const sections: Section[] = [
  {
    name: 'banners',
    path: 'banners',
    singular: 'banner',
    plural: 'Banners',
    description: 'The large slides at the top of the home page.',
    keyField: 'id',
    idPrefix: 'b',
    titleField: 'heading',
    subtitle: (b) => String(b.subtitle ?? ''),
    imageField: 'imageDesktop',
    folder: 'banners',
    schema: bannerSchema,
    fields: [
      { key: 'heading', label: 'Heading', type: 'text', required: true },
      { key: 'subtitle', label: 'Subtitle', type: 'textarea', required: true },
      { key: 'imageDesktop', label: 'Image (desktop)', type: 'image', required: true, hint: 'Wide photo, ideally 1920 × 1080 or larger.' },
      { key: 'imageMobile', label: 'Image (mobile)', type: 'image', hint: 'Optional. A taller photo for phones; the desktop image is used if empty.' },
      { key: 'ctas', label: 'Buttons', type: 'links', max: 3, required: true, hint: 'Up to 3. A link can be a page such as /products, or #enquiry to open the enquiry form.' },
      { key: 'publishFrom', label: 'Show from', type: 'datetime', hint: 'Optional. Leave empty to show straight away.' },
      { key: 'publishUntil', label: 'Show until', type: 'datetime', hint: 'Optional. Leave empty to keep showing.' },
      { key: 'published', label: 'Visible on the website', type: 'toggle' },
    ],
    newItem: () => ({ heading: '', subtitle: '', imageDesktop: '', imageMobile: '', ctas: [], published: true, publishFrom: null, publishUntil: null }),
  },
  {
    name: 'categories',
    path: 'categories',
    singular: 'category',
    plural: 'Categories',
    description: 'Product groups. They appear in the Products menu and as filters on the Products page.',
    keyField: 'slug',
    titleField: 'name',
    subtitle: (c) => String(c.description ?? ''),
    imageField: 'image',
    folder: 'categories',
    schema: categorySchema,
    needs: ['products'],
    // Products point at a category by its link name, so a category in use cannot be deleted
    usedBy: (c, ctx) => (ctx.products ?? []).filter((p) => p.category === c.slug).map((p) => String(p.name)),
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'slug', label: 'Link name', type: 'slug', from: 'name', hint: 'Used in the web address, e.g. /products?category=office-chairs. Set automatically from the name and cannot be changed later.' },
      { key: 'description', label: 'Short description', type: 'textarea', required: true },
      { key: 'image', label: 'Image', type: 'image', required: true, hint: 'Shown in the Products menu and as the category page banner.' },
      { key: 'published', label: 'Visible on the website', type: 'toggle' },
    ],
    newItem: () => ({ name: '', slug: '', description: '', image: '', published: true }),
  },
  {
    name: 'products',
    path: 'products',
    singular: 'product',
    plural: 'Products',
    description: 'Every product on the website. Featured products also appear on the home page.',
    keyField: 'id',
    idPrefix: 'p',
    titleField: 'name',
    subtitle: (p, ctx) => `${categoryLabel(p.category, ctx)}${p.featured ? ' · Featured' : ''}`,
    imageField: 'images',
    imageContain: true,
    folder: 'products',
    schema: productSchema,
    needs: ['categories'],
    filter: { key: 'category', allLabel: 'All categories', options: categoryOptions },
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'slug', label: 'Link name', type: 'slug', from: 'name', hint: 'Used in the web address, e.g. /products/linear-workstation-4-seater. Set automatically from the name and cannot be changed later.' },
      { key: 'category', label: 'Category', type: 'select', options: categoryOptions, required: true },
      { key: 'brand', label: 'Brand', type: 'text' },
      { key: 'shortDescription', label: 'Short description', type: 'textarea', required: true, hint: 'One or two sentences, shown on product cards and in Google results.' },
      { key: 'description', label: 'Full description', type: 'textarea', required: true },
      { key: 'images', label: 'Photos', type: 'images', contain: true, required: true },
      { key: 'specs', label: 'Specifications', type: 'specs', hint: 'For example Size → 1200 × 600 mm.' },
      { key: 'featured', label: 'Featured on the home page', type: 'toggle' },
      { key: 'published', label: 'Visible on the website', type: 'toggle' },
    ],
    newItem: () => ({ name: '', slug: '', brand: 'MAANRAN', category: '', shortDescription: '', description: '', images: [], specs: {}, featured: false, published: true }),
  },
  {
    name: 'clients',
    path: 'clients',
    singular: 'client',
    plural: 'Clients',
    description: 'Logos in the Trusted Clients section on the home and About pages.',
    keyField: 'id',
    idPrefix: 'c',
    titleField: 'name',
    subtitle: (c) => String(c.website ?? ''),
    imageField: 'logo',
    imageContain: true,
    folder: 'clients',
    schema: clientSchema,
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'logo', label: 'Logo', type: 'image', contain: true, required: true, hint: 'PNG or SVG with a white or transparent background works best.' },
      { key: 'website', label: 'Website', type: 'text', placeholder: 'https://', hint: 'Optional. Makes the logo clickable.' },
      { key: 'published', label: 'Visible on the website', type: 'toggle' },
    ],
    newItem: () => ({ name: '', logo: '', website: '', published: true }),
  },
  {
    name: 'stats',
    path: 'stats',
    singular: 'stat',
    plural: 'Stats',
    description: 'The counters on the home and About pages, such as "250+ Client Satisfaction".',
    keyField: 'id',
    idPrefix: 's',
    titleField: 'label',
    subtitle: (s) => `Icon: ${String(s.icon)}`,
    thumbText: (s) => `${String(s.value)}${String(s.suffix ?? '')}`,
    visibleField: 'active',
    folder: 'stats',
    schema: statSchema,
    fields: [
      { key: 'label', label: 'Label', type: 'text', required: true, placeholder: 'e.g. Successful Projects' },
      { key: 'value', label: 'Number', type: 'number', min: 0, required: true, hint: 'The number counts up from 0 when visitors scroll to it.' },
      { key: 'suffix', label: 'After the number', type: 'text', placeholder: '+', hint: 'Optional, e.g. + or %.' },
      {
        key: 'icon',
        label: 'Icon',
        type: 'select',
        required: true,
        options: () => [
          { value: 'smile', label: 'Smile' },
          { value: 'briefcase', label: 'Briefcase' },
          { value: 'users', label: 'People' },
          { value: 'heart', label: 'Heart' },
        ],
      },
      { key: 'active', label: 'Visible on the website', type: 'toggle' },
    ],
    newItem: () => ({ label: '', value: 0, suffix: '+', icon: 'smile', active: true, verified: false }),
  },
  {
    name: 'testimonials',
    path: 'testimonials',
    singular: 'testimonial',
    plural: 'Testimonials',
    description: 'Customer feedback in the "What our customers say" carousel on the home page.',
    keyField: 'id',
    idPrefix: 't',
    titleField: 'name',
    subtitle: (t) => [t.designation, t.rating ? '★'.repeat(Number(t.rating)) : ''].filter(Boolean).join(' · '),
    imageField: 'photo',
    folder: 'testimonials',
    schema: testimonialSchema,
    fields: [
      { key: 'name', label: 'Customer name', type: 'text', required: true },
      { key: 'designation', label: 'Role and company', type: 'text', placeholder: 'e.g. Principal, ABC School' },
      { key: 'text', label: 'What they said', type: 'textarea', required: true },
      { key: 'rating', label: 'Star rating', type: 'number', min: 0, max: 5, hint: '1 to 5 stars. Use 0 to hide the stars.' },
      { key: 'photo', label: 'Photo', type: 'image', hint: 'Optional. A square photo works best; without one, their initial is shown.' },
      { key: 'published', label: 'Visible on the website', type: 'toggle' },
    ],
    newItem: () => ({ name: '', photo: '', text: '', rating: 5, designation: '', published: true }),
  },
  {
    name: 'interiors',
    path: 'interiors',
    singular: 'project',
    plural: 'Interiors',
    description: 'Completed projects in the gallery on the Interiors page.',
    keyField: 'id',
    idPrefix: 'i',
    titleField: 'title',
    subtitle: (p) => [p.type, p.city].filter(Boolean).join(' · '),
    imageField: 'images',
    folder: 'interiors',
    schema: interiorSchema,
    fields: [
      { key: 'title', label: 'Project title', type: 'text', required: true, placeholder: 'e.g. 3BHK apartment interiors' },
      { key: 'type', label: 'Type', type: 'text', required: true, hint: 'Used as the filter buttons on the Interiors page. Pick an existing one to keep them grouped.', suggestions: usedValues('type', ['Home', 'Office', 'Commercial']) },
      { key: 'city', label: 'City', type: 'text', suggestions: usedValues('city', ['Bengaluru']) },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'images', label: 'Photos', type: 'images', required: true },
      { key: 'published', label: 'Visible on the website', type: 'toggle' },
    ],
    newItem: () => ({ title: '', type: '', city: 'Bengaluru', description: '', images: [], published: true }),
  },
  {
    name: 'documents',
    path: 'downloads',
    singular: 'download',
    plural: 'Downloads',
    description: 'Catalogues and brochures in the Downloads section of the home page.',
    keyField: 'id',
    idPrefix: 'd',
    titleField: 'title',
    subtitle: (d) => [d.category, [d.fileType, d.sizeLabel].filter(Boolean).join(' '), d.featured ? 'Featured' : ''].filter(Boolean).join(' · '),
    imageField: 'cover',
    folder: 'downloads',
    schema: documentSchema,
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g. Product Catalog 2027' },
      { key: 'category', label: 'Kind of document', type: 'text', suggestions: usedValues('category', ['Company Profile', 'Product Catalog', 'Product Brochure']) },
      { key: 'description', label: 'Short description', type: 'textarea' },
      { key: 'file', label: 'File', type: 'file', accept: 'application/pdf', required: true, details: { typeKey: 'fileType', sizeKey: 'sizeLabel' }, hint: 'PDF, up to 25 MB.' },
      { key: 'cover', label: 'Cover image', type: 'image', hint: 'Optional. Without one, a branded cover with the title is shown.' },
      { key: 'featured', label: 'Show a "Featured" badge', type: 'toggle' },
      { key: 'published', label: 'Visible on the website', type: 'toggle' },
    ],
    newItem: () => ({ title: '', category: '', description: '', cover: '', file: '', fileType: 'PDF', sizeLabel: '', featured: false, published: true }),
  },
]

export const sectionByPath = (path: string) => sections.find((s) => s.path === path)

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
