// What each admin section edits: its fields, labels and help text. The list and edit screens are built from this.
import type { z } from 'zod'
import { bannerSchema, categorySchema, clientSchema, productSchema, type CollectionName } from '../lib/schema'

export type Item = Record<string, unknown>
// Other sections' data a form needs, e.g. the category list for the product form
export type Context = Partial<Record<CollectionName, Item[]>>
type Option = { value: string; label: string }

export type FieldDef = { key: string; label: string; hint?: string; required?: boolean } & (
  | { type: 'text' | 'textarea'; placeholder?: string }
  | { type: 'slug'; from: string }
  | { type: 'number'; min?: number; max?: number }
  | { type: 'toggle' }
  | { type: 'image' | 'images'; contain?: boolean }
  | { type: 'select'; options: (ctx: Context) => Option[] }
  | { type: 'datetime' }
  | { type: 'specs' }
  | { type: 'links'; max: number }
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
]

export const sectionByPath = (path: string) => sections.find((s) => s.path === path)

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
