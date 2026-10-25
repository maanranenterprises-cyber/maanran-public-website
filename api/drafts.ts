// GET  /api/drafts                       → unpublished changes waiting on the drafts branch
// POST /api/drafts { action: 'publish' }  → makes them live (Vercel rebuilds the site from main)
// POST /api/drafts { action: 'discard' }  → throws them away
import { CONTENT_DIR, compareDrafts, discardDrafts, prepareDrafts, publishDrafts } from './_lib/github.js'
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
    })
  })
}

export function POST(request: Request) {
  return handle(async () => {
    requireSameOrigin(request)
    const session = requireSession(request)
    const { action } = await readJson<{ action?: unknown }>(request)
    if (action === 'publish') return json({ published: await publishDrafts(session.name) })
    if (action === 'discard') {
      await discardDrafts()
      return json({ discarded: true })
    }
    throw new HttpError(400, 'Unknown action.')
  })
}
