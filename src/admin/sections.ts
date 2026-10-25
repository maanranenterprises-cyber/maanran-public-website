// What each admin section edits: its fields, labels and help text. The list and edit screens are built from this.
import type { z } from 'zod'
import { aboutSchema, bannerSchema, categorySchema, clientSchema, documentSchema, interiorSchema, pagesSchema, productSchema, siteSchema, statSchema, testimonialSchema, whyUsSchema, type CollectionName } from '../lib/schema'

export type Item = Record<string, unknown>
// Other sections' data a form needs, e.g. the category list for the product form
export type Context = Partial<Record<CollectionName, Item[]>>
type Option = { value: string; label: string }

// Fields inside each entry of an `objects` list (e.g. a benefit's title and text)
export type SubField = { key: string; label: string; type: 'text' | 'textarea' | 'toggle' | 'readonly'; placeholder?: string }

// `lock`: 'existing' = read-only after the item is first saved; 'used' = read-only while other items depend on it
export type FieldDef = { key: string; label: string; hint?: string; required?: boolean; lock?: 'existing' | 'used' } & (
  // `suggestions` offers values already used in this section (e.g. interior types) so spelling stays consistent
  | { type: 'text' | 'textarea'; placeholder?: string; suggestions?: (items: Item[]) => string[] }
  | { type: 'slug'; from: string }
  // Product code prefix: suggested from another field (first letters of its words) until edited by hand
  | { type: 'prefix'; from: string }
  // Shown but never edited here
  | { type: 'readonly'; placeholder?: string }
  // The product code: shown locked; for a new product, a preview of the code it will get in the chosen category
  | { type: 'code'; categoryKey: string }
  | { type: 'number'; min?: number; max?: number }
  | { type: 'toggle' }
  | { type: 'image' | 'images'; contain?: boolean }
  | { type: 'select'; options: (ctx: Context) => Option[] }
  | { type: 'datetime' }
  | { type: 'specs' }
  | { type: 'links'; max: number }
  // A downloadable file (PDF); `details` lists extra fields filled in from the upload, e.g. file type and size
  | { type: 'file'; accept: string; details?: { typeKey: string; sizeKey: string } }
  // A list of plain texts, e.g. paragraphs or bullet points
  | { type: 'strings'; addLabel: string; multiline?: boolean; placeholder?: string }
  // A list of small records, e.g. benefits or menu items. `fixed` lists can be edited and reordered but not added to
  | { type: 'objects'; fields: SubField[]; addLabel?: string; fixed?: boolean; idPrefix?: string; newItem?: () => Item }
  // One button: text + link. `optional` adds a switch to show it or not (stored as null when off)
  | { type: 'link'; optional?: boolean }
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
  // Switch at the top of the list that shows or hides the whole section on the website (stored in pages.json → sections)
  sectionSwitch?: { key: string; label: string; where: string }
  // ImageKit folder for this section's uploads, e.g. /maanran/products
  folder: string
  schema: z.ZodType
  needs?: CollectionName[]
  // Optional dropdown above the list, e.g. products by category; the choice also pre-fills new items
  // `match` decides membership when it is not a plain field comparison; `preset: false` stops new items copying the filter
  filter?: { key: string; allLabel: string; options: (ctx: Context) => Option[]; match?: (item: Item, value: string) => boolean; preset?: boolean }
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
    sectionSwitch: { key: 'hero', label: 'Show the banner slideshow', where: 'At the top of the home page.' },
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
      {
        key: 'codePrefix',
        label: 'Product code prefix',
        type: 'prefix',
        from: 'name',
        required: true,
        lock: 'used',
        hint: 'Products in this category are numbered with it, e.g. OC → OC-001, OC-002. Suggested from the first letters of the name; it cannot be changed once the category has products.',
      },
      { key: 'description', label: 'Short description', type: 'textarea', required: true },
      { key: 'image', label: 'Image', type: 'image', required: true, hint: 'Shown in the Products menu and as the category page banner.' },
      { key: 'published', label: 'Visible on the website', type: 'toggle' },
    ],
    newItem: () => ({ name: '', slug: '', codePrefix: '', codeCounter: 0, description: '', image: '', published: true }),
  },
  {
    name: 'products',
    sectionSwitch: { key: 'products', label: 'Show featured products on the home page', where: 'The scrolling row of featured products. The Products page is not affected.' },
    path: 'products',
    singular: 'product',
    plural: 'Products',
    description: 'Every product on the website. Featured products also appear on the home page.',
    keyField: 'id',
    idPrefix: 'p',
    titleField: 'name',
    subtitle: (p, ctx) => [p.code, categoryLabel(p.category, ctx), p.featured ? 'Featured' : ''].filter(Boolean).join(' · '),
    imageField: 'images',
    imageContain: true,
    folder: 'products',
    schema: productSchema,
    needs: ['categories'],
    filter: { key: 'category', allLabel: 'All categories', options: categoryOptions },
    fields: [
      { key: 'code', label: 'Product code', type: 'code', categoryKey: 'category' },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'slug', label: 'Link name', type: 'slug', from: 'name', hint: 'Used in the web address, e.g. /products/linear-workstation-4-seater. Set automatically from the name and cannot be changed later.' },
      { key: 'category', label: 'Category', type: 'select', options: categoryOptions, required: true, lock: 'existing', hint: 'Cannot be changed after the product is saved, because the product code comes from it.' },
      { key: 'brand', label: 'Brand', type: 'text' },
      { key: 'shortDescription', label: 'Short description', type: 'textarea', required: true, hint: 'One or two sentences, shown on product cards and in Google results.' },
      { key: 'description', label: 'Full description', type: 'textarea', required: true },
      { key: 'images', label: 'Photos', type: 'images', contain: true, required: true },
      { key: 'specs', label: 'Specifications', type: 'specs', hint: 'For example Size → 1200 × 600 mm.' },
      { key: 'featured', label: 'Featured on the home page', type: 'toggle' },
      { key: 'published', label: 'Visible on the website', type: 'toggle' },
    ],
    newItem: () => ({ code: '', name: '', slug: '', brand: 'MAANRAN', category: '', shortDescription: '', description: '', images: [], specs: {}, featured: false, published: true }),
  },
  {
    name: 'clients',
    sectionSwitch: { key: 'clients', label: 'Show the Trusted Clients section', where: 'On the home page and the About page.' },
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
    sectionSwitch: { key: 'stats', label: 'Show the stats section', where: 'On the home page and the About page.' },
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
    sectionSwitch: { key: 'testimonials', label: 'Show the testimonials section', where: 'On the home page.' },
    path: 'testimonials',
    singular: 'testimonial',
    plural: 'Testimonials',
    description: 'Customer feedback in the "What our customers say" carousel on the home page.',
    keyField: 'id',
    idPrefix: 't',
    titleField: 'name',
    subtitle: (t) =>
      [t.pending && t.submittedAt ? `Sent ${new Date(String(t.submittedAt)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : '', t.designation, t.rating ? '★'.repeat(Number(t.rating)) : '']
        .filter(Boolean)
        .join(' · '),
    imageField: 'photo',
    // Feedback sent through the website form waits here until approved
    filter: { key: 'review', allLabel: 'All testimonials', options: () => [{ value: 'pending', label: 'Awaiting review' }], match: (t) => Boolean(t.pending), preset: false },
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
    description: 'Completed projects. Each one has its own page with a photo gallery, linked from the Interiors page.',
    keyField: 'id',
    idPrefix: 'i',
    titleField: 'title',
    subtitle: (p) => [p.type, p.city].filter(Boolean).join(' · '),
    imageField: 'images',
    folder: 'interiors',
    schema: interiorSchema,
    fields: [
      { key: 'title', label: 'Project title', type: 'text', required: true, placeholder: 'e.g. 3BHK apartment interiors' },
      { key: 'slug', label: 'Link name', type: 'slug', from: 'title', hint: 'The project page address, e.g. /interiors/3bhk-apartment-interiors. Set from the title and cannot be changed later, so shared links keep working.' },
      { key: 'type', label: 'Type', type: 'text', required: true, hint: 'Used as the filter buttons on the Interiors page. Pick an existing one to keep them grouped.', suggestions: usedValues('type', ['Home', 'Office', 'Commercial']) },
      { key: 'city', label: 'City', type: 'text', suggestions: usedValues('city', ['Bengaluru']) },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'images', label: 'Photos', type: 'images', required: true },
      { key: 'published', label: 'Visible on the website', type: 'toggle' },
    ],
    newItem: () => ({ title: '', slug: '', type: '', city: 'Bengaluru', description: '', images: [], published: true }),
  },
  {
    name: 'documents',
    sectionSwitch: { key: 'downloads', label: 'Show the Downloads section', where: 'On the home page, together with the "Download Catalog" buttons that link to it.' },
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

// Sections that are one page of settings rather than a list. Field keys can be paths such as "contact.phone".
export type SingleSection = {
  name: CollectionName
  path: string
  label: string
  description: string
  folder: string
  schema: z.ZodType
  groups: { title: string; description?: string; fields: FieldDef[] }[]
}

const heading = (base: string, what: string): FieldDef[] => [
  { key: `${base}.eyebrow`, label: 'Small heading', type: 'text', hint: `The short line in red above the ${what} title.` },
  { key: `${base}.title`, label: 'Title', type: 'text', required: true },
  { key: `${base}.text`, label: 'Intro text', type: 'textarea' },
]

const legal = (base: string): FieldDef[] => [
  { key: `${base}.title`, label: 'Page title', type: 'text', required: true },
  {
    key: `${base}.sections`,
    label: 'Sections',
    type: 'objects',
    addLabel: 'Add section',
    hint: 'You can write {company}, {email} or {phone} and the current details are filled in.',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'body', label: 'Text', type: 'textarea' },
    ],
    newItem: () => ({ heading: '', body: '' }),
  },
]

export const singles: SingleSection[] = [
  {
    name: 'whyUs',
    path: 'why-us',
    label: 'Why us',
    description: 'The "Why Choose Us" section on the home and About pages.',
    folder: 'why-us',
    schema: whyUsSchema,
    groups: [
      {
        title: 'Text',
        fields: [
          { key: 'visible', label: 'Show this section', type: 'toggle' },
          { key: 'eyebrow', label: 'Small heading', type: 'text', hint: 'The short line in red above the title.' },
          { key: 'heading', label: 'Title', type: 'text', required: true },
          { key: 'description', label: 'Intro text', type: 'textarea' },
          { key: 'cta', label: 'Button', type: 'link', optional: true },
        ],
      },
      {
        title: 'Benefits',
        fields: [
          {
            key: 'benefits',
            label: 'Benefit points',
            type: 'objects',
            addLabel: 'Add benefit',
            idPrefix: 'w',
            fields: [
              { key: 'title', label: 'Title', type: 'text' },
              { key: 'text', label: 'Text', type: 'textarea' },
            ],
            newItem: () => ({ title: '', text: '' }),
          },
        ],
      },
      {
        title: 'Photos and badge',
        fields: [
          { key: 'images', label: 'Photos', type: 'images', hint: 'The first two are used: a tall main photo and a smaller square one.' },
          { key: 'badge.value', label: 'Badge number', type: 'text', placeholder: '100%', hint: 'The blue box under the photos. Leave empty to hide it.' },
          { key: 'badge.label', label: 'Badge text', type: 'text' },
        ],
      },
    ],
  },
  {
    name: 'about',
    path: 'about',
    label: 'About',
    description: 'The About section on the home page and the About page.',
    folder: 'about',
    schema: aboutSchema,
    groups: [
      {
        title: 'Text',
        fields: [
          { key: 'visible', label: 'Show the About section on the home page', type: 'toggle' },
          { key: 'eyebrow', label: 'Small heading', type: 'text' },
          { key: 'heading', label: 'Title', type: 'text', required: true },
          { key: 'intro', label: 'Intro', type: 'textarea', hint: 'Also used as the About page description in Google results.' },
          { key: 'body', label: 'More paragraphs', type: 'strings', multiline: true, addLabel: 'Add paragraph', hint: 'The home page shows the first one; the About page shows them all.' },
          { key: 'expertise', label: 'Expertise points', type: 'strings', addLabel: 'Add point', placeholder: 'e.g. Steel furniture fabrication' },
          { key: 'cta', label: 'Button on the home page', type: 'link' },
        ],
      },
      {
        title: 'Mission and vision',
        fields: [
          { key: 'mission', label: 'Our mission', type: 'textarea' },
          { key: 'vision', label: 'Our vision', type: 'textarea' },
        ],
      },
      { title: 'Photos', fields: [{ key: 'images', label: 'Photos', type: 'images', hint: 'The home page uses the first two; the About page shows all of them.' }] },
    ],
  },
  {
    name: 'site',
    path: 'settings',
    label: 'Site settings',
    description: 'Company details, contact information, address, social links and the menu.',
    folder: 'site',
    schema: siteSchema,
    groups: [
      {
        title: 'Company',
        fields: [
          { key: 'name', label: 'Company name', type: 'text', required: true },
          { key: 'tagline', label: 'Tagline', type: 'text', hint: 'Shown in the footer and under the About page title.' },
          { key: 'description', label: 'Description', type: 'textarea', hint: 'Used in Google results for the home page and when the site is shared.' },
          { key: 'location', label: 'Location shown on banners', type: 'text', placeholder: 'Bengaluru, Karnataka' },
          { key: 'experienceStartYear', label: 'Year started', type: 'number', min: 1900, max: 2100, hint: 'The "Years of Experience" number is worked out from this.' },
        ],
      },
      {
        title: 'Contact',
        fields: [
          { key: 'contact.phoneDisplay', label: 'Phone (as shown)', type: 'text', required: true, placeholder: '+91 98862 77250' },
          { key: 'contact.phone', label: 'Phone (for the call button)', type: 'text', required: true, placeholder: '+919886277250', hint: 'With country code and no spaces.' },
          { key: 'contact.whatsapp', label: 'WhatsApp number', type: 'text', placeholder: '919886277250', hint: 'Digits only, with country code, no + or spaces.' },
          { key: 'whatsappMessage', label: 'WhatsApp starting message', type: 'textarea', hint: 'Pre-filled when a visitor taps a WhatsApp button.' },
          { key: 'contact.email', label: 'Email', type: 'text', required: true },
          { key: 'contact.hours', label: 'Business hours (as shown)', type: 'text', placeholder: 'Monday to Sunday, 9 AM to 8 PM' },
          { key: 'contact.opens', label: 'Opens at (for Google)', type: 'text', placeholder: '09:00', hint: '24-hour time. Keep in step with the hours above.' },
          { key: 'contact.closes', label: 'Closes at (for Google)', type: 'text', placeholder: '20:00' },
          { key: 'contact.formEndpoint', label: 'Enquiry form address (Formspree)', type: 'text', hint: 'Where the website enquiry form sends to, e.g. https://formspree.io/f/…' },
        ],
      },
      {
        title: 'Address and map',
        fields: [
          { key: 'address.lines', label: 'Address as shown', type: 'strings', addLabel: 'Add line' },
          { key: 'address.street', label: 'Street (for Google)', type: 'text' },
          { key: 'address.locality', label: 'City', type: 'text' },
          { key: 'address.region', label: 'State', type: 'text' },
          { key: 'address.postalCode', label: 'PIN code', type: 'text' },
          { key: 'address.latitude', label: 'Map latitude', type: 'number' },
          { key: 'address.longitude', label: 'Map longitude', type: 'number' },
          { key: 'address.mapLink', label: 'Google Maps link', type: 'text', hint: 'Used for the "Get directions" link.' },
          { key: 'address.mapCid', label: 'Google Maps listing ID', type: 'text', hint: 'Shows your business listing on the footer map. Ask your developer if you need to change it.' },
        ],
      },
      {
        title: 'Social links',
        fields: [
          {
            key: 'social',
            label: 'Profiles',
            type: 'objects',
            fixed: true,
            hint: 'Leave a link empty to grey out that icon.',
            fields: [
              { key: 'type', label: 'Network', type: 'readonly' },
              { key: 'url', label: 'Link', type: 'text', placeholder: 'https://' },
            ],
          },
        ],
      },
      {
        title: 'Menu',
        fields: [
          {
            key: 'navigation',
            label: 'Menu items',
            type: 'objects',
            fixed: true,
            hint: 'Rename, reorder or hide menu items. The page each one opens is fixed.',
            fields: [
              { key: 'label', label: 'Text', type: 'text' },
              { key: 'href', label: 'Opens', type: 'readonly' },
              { key: 'visible', label: 'Show in menu', type: 'toggle' },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'pages',
    path: 'page-text',
    label: 'Page text',
    description: 'Headings and text across the website, the footer and the legal pages.',
    folder: 'pages',
    schema: pagesSchema,
    groups: [
      { title: 'Home: Products section', fields: heading('home.products', 'products') },
      {
        title: 'Home: Clients section',
        fields: [
          ...heading('home.clients', 'clients'),
          { key: 'home.clients.count', label: 'Client count', type: 'text', placeholder: '50+' },
          { key: 'home.clients.countText', label: 'Text after the count', type: 'text' },
        ],
      },
      { title: 'Home: Testimonials section', fields: heading('home.testimonials', 'testimonials') },
      { title: 'Home: Downloads section', fields: heading('home.downloads', 'downloads') },
      {
        title: 'Products page',
        fields: [
          { key: 'products.title', label: 'Title', type: 'text', required: true },
          { key: 'products.text', label: 'Text', type: 'textarea' },
          { key: 'products.image', label: 'Header image', type: 'image' },
        ],
      },
      {
        title: 'Interiors page',
        fields: [
          { key: 'interiors.title', label: 'Title', type: 'text', required: true },
          { key: 'interiors.text', label: 'Text', type: 'textarea' },
          { key: 'interiors.image', label: 'Header image', type: 'image' },
          { key: 'interiors.instagramTitle', label: 'Instagram banner title', type: 'text' },
          { key: 'interiors.instagramText', label: 'Instagram banner text', type: 'textarea' },
          { key: 'interiors.ctaTitle', label: 'Enquiry box title', type: 'text' },
          { key: 'interiors.ctaText', label: 'Enquiry box text', type: 'textarea' },
        ],
      },
      {
        title: 'Contact page',
        fields: [
          { key: 'contact.title', label: 'Title', type: 'text', required: true },
          { key: 'contact.text', label: 'Text', type: 'textarea' },
          { key: 'contact.detailsTitle', label: 'Contact details heading', type: 'text' },
          { key: 'contact.formEyebrow', label: 'Form small heading', type: 'text' },
          { key: 'contact.formTitle', label: 'Form title', type: 'text' },
        ],
      },
      { title: 'About page', fields: [{ key: 'about.image', label: 'Header image', type: 'image' }] },
      {
        title: 'Feedback page',
        description: 'The page customers use to send feedback: maanran.com/feedback',
        fields: [
          { key: 'feedback.title', label: 'Title', type: 'text', required: true },
          { key: 'feedback.text', label: 'Text', type: 'textarea' },
          { key: 'feedback.thanks', label: 'Thank-you message', type: 'textarea', required: true },
        ],
      },
      {
        title: 'Footer',
        fields: [
          { key: 'footer.ctaTitle', label: 'Call-to-action title', type: 'text' },
          { key: 'footer.ctaText', label: 'Call-to-action text', type: 'textarea' },
          { key: 'footer.ctaButton', label: 'Call-to-action button', type: 'text' },
          { key: 'footer.blurb', label: 'Text under the logo', type: 'textarea' },
        ],
      },
      {
        title: 'Privacy and terms pages',
        fields: [{ key: 'legal.note', label: 'Notice at the top of both pages', type: 'text', hint: 'Leave empty to remove the "placeholder text" notice.' }],
      },
      { title: 'Privacy policy', fields: legal('legal.privacy') },
      { title: 'Terms & conditions', fields: legal('legal.terms') },
    ],
  },
]

export const singleByPath = (path: string) => singles.find((s) => s.path === path)
