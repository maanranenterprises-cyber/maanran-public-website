// GET /api/content?name=products            → { data, sha } from the drafts branch
// PUT /api/content { name, data, sha, summary } → validates and saves to drafts → { sha }
import { assignCodes } from '../src/lib/codes.js'
import { collections, crossCheck, isCollection, validateCollection, type CollectionName } from '../src/lib/schema.js'
import { prepareDrafts, readContent, writeContent, writeContents } from './_lib/github.js'
import { handle, HttpError, json, readJson, requireSameOrigin } from './_lib/http.js'
import { requireSession } from './_lib/session.js'

function collectionName(name: unknown): CollectionName {
  if (typeof name !== 'string' || !isCollection(name)) throw new HttpError(400, 'Unknown content section.')
  return name
}

// Files that must be checked together with the one being saved
const related: Partial<Record<CollectionName, CollectionName[]>> = { products: ['categories'], categories: ['products'] }

export function GET(request: Request) {
  return handle(async () => {
    requireSession(request)
    const name = collectionName(new URL(request.url).searchParams.get('name'))
    await prepareDrafts()
    return json(await readContent(collections[name].file))
  })
}

export function PUT(request: Request) {
  return handle(async () => {
    requireSameOrigin(request)
    const session = requireSession(request)
    const body = await readJson<{ name?: unknown; data?: unknown; sha?: unknown; summary?: unknown }>(request)
    const name = collectionName(body.name)
    if (typeof body.sha !== 'string') throw new HttpError(400, 'Missing file version. Reload and try again.')

    const result = validateCollection(name, body.data)
    if (!result.ok) throw new HttpError(422, 'Please fix the highlighted problems before saving.', result.errors)

    await prepareDrafts()
    const others = Object.fromEntries(
      await Promise.all((related[name] ?? []).map(async (other) => [other, await readContent(collections[other].file)] as const)),
    ) as Partial<Record<CollectionName, { data: unknown; sha: string }>>
    const summary = typeof body.summary === 'string' && body.summary.trim() ? body.summary.trim().slice(0, 120) : `Update ${collections[name].label}`
    const message = `${summary} (by ${session.name})`

    // New products get the next code in their category; the product list and the category counters are saved together
    if (name === 'products' && others.categories) {
      type P = { category: string; code?: string }
      type C = { slug: string; codePrefix: string; codeCounter: number }
      const numbered = assignCodes(result.data as P[], others.categories.data as C[])
      const problems = crossCheck({ products: numbered.products, categories: numbered.categories })
      if (problems.length) throw new HttpError(422, 'This change would break other content.', problems)
      if (numbered.assigned.length) {
        const sha = await writeContents(
          [
            { file: collections.products.file, data: numbered.products, sha: body.sha },
            { file: collections.categories.file, data: numbered.categories, sha: others.categories.sha },
          ],
          message,
          session.name,
        )
        return json({ sha, assigned: numbered.assigned, data: numbered.products })
      }
    }

    const problems = crossCheck({ ...Object.fromEntries(Object.entries(others).map(([k, v]) => [k, v!.data])), [name]: result.data })
    if (problems.length) throw new HttpError(422, 'This change would break other content.', problems)
    const sha = await writeContent(collections[name].file, result.data, body.sha, message, session.name)
    return json({ sha })
  })
}
