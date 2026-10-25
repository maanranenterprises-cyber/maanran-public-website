import { categories, facebook, instagram, site } from '../lib/content'
import { imageUrl } from '../lib/media'

type Crumb = { name: string; path: string }
type Props = { title?: string; description?: string; path?: string; image?: string; noindex?: boolean; crumbs?: Crumb[] }

const absolute = (url: string) => (url.startsWith('http') ? url : `${site.domain}${url}`)
const defaultTitle = `${site.name} | Office, Institutional & Steel Furniture in ${site.address.locality}`
// Content files still mark unfinished text with "(PLACEHOLDER ...)"; keep that out of search results
const clean = (text: string) => text.replace(/\s*\(PLACEHOLDER[^)]*\)/g, '').trim()
const defaultDescription = clean(site.description)

const JsonLd = ({ data }: { data: object }) => <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />

// React 19 hoists <title>, <meta> and <link> into <head>, so each page can set its own.
// The build pre-renders every page, so these tags are in the HTML that search engines and link previews read.
export default function Seo({ title, description, path = '', image, noindex, crumbs }: Props) {
  const fullTitle = title ? `${title} | ${site.name}` : defaultTitle
  const desc = description ? clean(description) : defaultDescription
  const url = `${site.domain}${path}`
  const img = absolute(image ? imageUrl(image, 1200) : '/images/logo-512.png')
  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {noindex && <meta name="robots" content="noindex" />}
      {!noindex && <link rel="canonical" href={url} />}
      <meta property="og:site_name" content={site.name} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
      {crumbs && (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [{ name: 'Home', path: '/' }, ...crumbs].map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: `${site.domain}${c.path}` })),
          }}
        />
      )}
    </>
  )
}

// Business details for Google (name, address, map pin, hours, phone, social profiles). Rendered once on every page.
export function BusinessJsonLd() {
  const { address, contact } = site
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'FurnitureStore',
        '@id': `${site.domain}/#business`,
        name: site.name,
        description: defaultDescription,
        url: site.domain,
        logo: absolute('/images/logo-512.png'),
        image: absolute('/images/logo-512.png'),
        telephone: contact.phone,
        email: contact.email,
        foundingDate: String(site.experienceStartYear),
        address: {
          '@type': 'PostalAddress',
          streetAddress: address.street,
          addressLocality: address.locality,
          addressRegion: address.region,
          postalCode: address.postalCode,
          addressCountry: address.country,
        },
        geo: { '@type': 'GeoCoordinates', latitude: address.latitude, longitude: address.longitude },
        hasMap: address.mapLink,
        areaServed: address.locality,
        openingHoursSpecification: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          opens: contact.opens,
          closes: contact.closes,
        },
        sameAs: [instagram?.url, facebook?.url].filter(Boolean),
        makesOffer: categories.map((c) => ({ '@type': 'Offer', itemOffered: { '@type': 'Product', name: c.name, description: c.description } })),
      }}
    />
  )
}
