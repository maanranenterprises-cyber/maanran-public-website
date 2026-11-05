// Product search on the Products page. Every word typed must match the product somewhere (code, name, category,
// details); results are ranked by where the words matched. Runs in the browser over the published products.
import type { Product } from './content.js'

// Everyday words customers use for the same thing. A word may sit in several groups ("desk" is a table and a bench).
const SYNONYMS = [
  ['table', 'desk'],
  ['bench', 'desk'],
  ['cot', 'bed', 'bunk', 'bunker'],
  ['almirah', 'cupboard', 'storage', 'locker', 'cabinet', 'wardrobe'],
  ['rack', 'shelf', 'shelves', 'bookshelf'],
  ['workstation', 'cubicle', 'workspace'],
  ['cafeteria', 'canteen', 'dining'],
  ['school', 'college', 'classroom'],
  ['hostel', 'pg'],
  ['lab', 'laboratory'],
  ['steel', 'metal', 'ms', 'iron'],
]
const IGNORED = new Set(['a', 'an', 'and', 'the', 'of', 'for', 'with', 'in', 'to'])

// "Benches" and "bench", "chairs" and "chair" are the same word for searching
const stem = (w: string) => (/(ch|sh|x|ss)es$/.test(w) ? w.slice(0, -2) : /[^s]s$/.test(w) && w.length > 3 ? w.slice(0, -1) : w)
const words = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).map(stem)

const synonymsOf = new Map<string, string[]>()
for (const group of SYNONYMS.map((g) => g.map(stem)))
  for (const w of group) synonymsOf.set(w, [...new Set([...(synonymsOf.get(w) ?? []), ...group.filter((x) => x !== w)])])

// Codes compare by prefix and number, so "OW-012", "ow12" and "ow 12" are the same code
const codeKey = (s: string) => s.toLowerCase().replace(/[\s-]+/g, '').match(/^([a-z]{1,6})0*(\d+)$/)?.slice(1).join('-')

type Field = { weight: number; words: string[] }

function fieldsOf(p: Product, categoryName: string): Field[] {
  const [prefix, number] = p.code.toLowerCase().split('-')
  return [
    { weight: 100, words: [prefix, `${prefix}${number}`] },
    { weight: 10, words: words(p.name) },
    { weight: 6, words: words(categoryName) },
    { weight: 2, words: words([p.brand, p.shortDescription, ...Object.entries(p.specs ?? {}).flat()].join(' ')) },
    { weight: 1, words: words(p.description) },
  ]
}

// Best weight of a field the word matches. The typed word may be the start of a word, so results appear while typing;
// synonyms must match a whole word ("seat" is not "seater") and count half.
function score(fields: Field[], word: string) {
  const best = (match: (x: string) => boolean) => Math.max(0, ...fields.filter((f) => f.words.some(match)).map((f) => f.weight))
  return best((x) => x.startsWith(word)) || Math.max(0, ...(synonymsOf.get(word) ?? []).map((s) => best((x) => x === s))) / 2
}

export function searchProducts(list: Product[], query: string, categoryName: (slug: string) => string): Product[] {
  // A product code finds just that product
  const code = codeKey(query)
  const byCode = code ? list.filter((p) => codeKey(p.code) === code) : []
  if (byCode.length) return byCode

  const terms = words(query).filter((w) => !IGNORED.has(w))
  if (!terms.length) return list
  return list
    .map((p, i) => {
      const fields = fieldsOf(p, categoryName(p.category))
      const scores = terms.map((t) => score(fields, t))
      return { p, i, total: scores.every((s) => s > 0) ? scores.reduce((a, b) => a + b, 0) : 0 }
    })
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total || a.i - b.i)
    .map((r) => r.p)
}
