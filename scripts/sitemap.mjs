// Writes dist/sitemap.xml from the content files after each build.
import { writeFileSync } from 'node:fs'
import { categoryPages, pages, site } from './pages.mjs'

const today = new Date().toISOString().slice(0, 10)
const escape = (s) => s.replace(/&/g, '&amp;')
const paths = [...pages, ...categoryPages]
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${escape(site.domain + p)}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`
writeFileSync(new URL('../dist/sitemap.xml', import.meta.url), xml)
console.log(`sitemap.xml: ${paths.length} URLs`)
