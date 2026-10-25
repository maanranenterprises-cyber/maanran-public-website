// Product codes: the category's prefix, a dash and a number, e.g. OC-001.
// Each category stores its prefix and the last number used, so renaming a category never changes codes
// and a deleted product's number is never given to another product.

export const PREFIX_PATTERN = /^[A-Z]{1,6}$/
export const CODE_PATTERN = /^([A-Z]{1,6})-(\d{3,})$/

// First letter of each word, ignoring "&" and "and": "School & College Desk Benches" → "SCDB"
export const suggestPrefix = (name: string) =>
  name
    .split(/[\s/-]+/)
    .filter((w) => w && w !== '&' && w.toLowerCase() !== 'and')
    .map((w) => w.replace(/[^A-Za-z]/g, '').charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 6)

export const formatCode = (prefix: string, n: number) => `${prefix}-${String(n).padStart(3, '0')}`

export function parseCode(code: string) {
  const m = CODE_PATTERN.exec(code)
  return m ? { prefix: m[1], number: Number(m[2]) } : null
}

type Category = { slug: string; codePrefix: string; codeCounter: number }
type Product = { category: string; code?: string }

// Gives every product without a code the next number in its category, and returns the updated categories.
// The input lists are not changed.
export function assignCodes<P extends Product, C extends Category>(products: P[], categories: C[]) {
  const counters = new Map(categories.map((c) => [c.slug, c.codeCounter]))
  const prefixes = new Map(categories.map((c) => [c.slug, c.codePrefix]))
  const assigned: string[] = []
  const nextProducts = products.map((p) => {
    if (p.code || !prefixes.has(p.category)) return p
    const n = (counters.get(p.category) ?? 0) + 1
    counters.set(p.category, n)
    const code = formatCode(prefixes.get(p.category)!, n)
    assigned.push(code)
    return { ...p, code }
  })
  const nextCategories = categories.map((c) => (counters.get(c.slug) === c.codeCounter ? c : { ...c, codeCounter: counters.get(c.slug)! }))
  return { products: nextProducts, categories: nextCategories, assigned }
}
