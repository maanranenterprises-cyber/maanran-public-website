// Writes dist/sitemap.xml from the content files after each build.
import { readFileSync, writeFileSync } from 'node:fs'

const read = (f) => JSON.parse(readFileSync(new URL(`../src/content/${f}`, import.meta.url)))
const site = read('site.json')
const products = read('products.json').filter((p) => p.published)

const paths = ['/', '/about', '/products', '/interiors', '/contact', '/privacy-policy', '/terms', ...products.map((p) => `/products/${p.slug}`)]
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${site.domain}${p}</loc></url>`).join('\n')}
</urlset>
`
writeFileSync(new URL('../dist/sitemap.xml', import.meta.url), xml)
console.log(`sitemap.xml: ${paths.length} URLs`)
