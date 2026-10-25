// GET  /api/drafts                       → unpublished changes waiting on the drafts branch
// POST /api/drafts { action: 'publish' }  → makes them live (Vercel rebuilds the site from main)
// POST /api/drafts { action: 'discard' }  → throws them away
import { collections, validateAll, type CollectionName } from '../src/lib/schema.js'
import { CONTENT_DIR, compareDrafts, discardDrafts, prepareDrafts, publishDrafts, readContent } from './_lib/github.js'
import { handle, HttpError, json, readJson, requireSameOrigin } from './_lib/http.js'
import { requireSession } from './_lib/session.js'

export function GET(request: Request) {
  return handle(async () => {
    requireSession(request)
    await prepareDrafts()
    const diff = await compareDrafts()
    return json({
      pending: diff.ahead_by,
      files: (diff.files ?? []).filter((f) => f.filename.startsWith(`${CONTENT_DIR}/`)).map((f) => f.filename.slice(CONTENT_DIR.length + 1)),
      changes: diff.commits.map((c) => ({ message: c.commit.message, by: c.commit.author.name, at: c.commit.author.date })).reverse(),
      // Vercel's address for the drafts branch preview, e.g. https://maanran-public-website-git-drafts-<team>.vercel.app
      previewUrl: process.env.DRAFTS_PREVIEW_URL || undefined,
    })
  })
}

export function POST(request: Request) {
  return handle(async () => {
    requireSameOrigin(request)
    const session = requireSession(request)
    const { action } = await readJson<{ action?: unknown }>(request)
    if (action === 'publish') {
      // Same check as the build: anything that would fail it is refused here, so the live site never gets stuck on a failed build
      const names = Object.keys(collections) as CollectionName[]
      const content = Object.fromEntries(await Promise.all(names.map(async (n) => [n, (await readContent(collections[n].file)).data] as const)))
      const problems = validateAll(content as Record<CollectionName, unknown>)
      if (problems.length) throw new HttpError(422, 'Some saved changes are incomplete. Fix or delete them, then publish again.', problems)
      return json({ published: await publishDrafts(session.name) })
    }
    if (action === 'discard') {
      await discardDrafts()
      return json({ discarded: true })
    }
    throw new HttpError(400, 'Unknown action.')
  })
}
