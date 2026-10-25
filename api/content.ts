// GET /api/content?name=products            → { data, sha } from the drafts branch
// PUT /api/content { name, data, sha, summary } → validates and saves to drafts → { sha }
import { collections, crossCheck, isCollection, validateCollection, type CollectionName } from '../src/lib/schema.js'
import { prepareDrafts, readContent, writeContent } from './_lib/github.js'
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
    const others = await Promise.all((related[name] ?? []).map(async (other) => [other, (await readContent(collections[other].file)).data] as const))
    const problems = crossCheck({ ...Object.fromEntries(others), [name]: result.data })
    if (problems.length) throw new HttpError(422, 'This change would break other content.', problems)

    const summary = typeof body.summary === 'string' && body.summary.trim() ? body.summary.trim().slice(0, 120) : `Update ${collections[name].label}`
    const sha = await writeContent(collections[name].file, result.data, body.sha, `${summary} (by ${session.name})`, session.name)
    return json({ sha })
  })
}
