// Every public page of the site, used by the pre-render and the sitemap.
import { readFileSync } from 'node:fs'

const read = (f) => JSON.parse(readFileSync(new URL(`../src/content/${f}`, import.meta.url)))
export const site = read('site.json')
const products = read('products.json').filter((p) => p.published)
const categories = read('categories.json').filter((c) => c.published)

export const pages = ['/', '/about', '/products', '/interiors', '/contact', '/privacy-policy', '/terms', ...products.map((p) => `/products/${p.slug}`)]
export const categoryPages = categories.map((c) => `/products?category=${c.slug}`)
