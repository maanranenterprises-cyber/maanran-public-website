import { site } from '../lib/content'

// React 19 hoists <title> and <meta> into <head>, so each page can set its own.
export default function Seo({ title, description, path = '' }: { title?: string; description?: string; path?: string }) {
  const fullTitle = title ? `${title} | ${site.name}` : `${site.name} | Office, Institutional & Steel Furniture`
  const desc = description ?? site.description.replace(' (PLACEHOLDER description)', '')
  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={`${site.domain}${path}`} />
      <meta property="og:image" content={`${site.domain}/images/logo-512.png`} />
      <link rel="canonical" href={`${site.domain}${path}`} />
    </>
  )
}
