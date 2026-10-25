// GET  /api/history                    → recent publishes, newest first, with the edits each one made live
// POST /api/history { action: 'undo', sha } → puts the content back as it was before that publish, in drafts
//      (the admin then publishes it, through the same checks as any publish). Only the latest publish can be undone,
//      so an undo never overwrites changes that were published after it.
import { collections } from '../src/lib/schema.js'
import { compareDrafts, listPublishes, prepareDrafts, readContent, writeContent } from './_lib/github.js'
import { handle, HttpError, json, readJson, requireSameOrigin } from './_lib/http.js'
import { requireSession } from './_lib/session.js'

const SHOWN = 15

export function GET(request: Request) {
  return handle(async () => {
    requireSession(request)
    return json({ publishes: await listPublishes(SHOWN) })
  })
}

export function POST(request: Request) {
  return handle(async () => {
    requireSameOrigin(request)
    const session = requireSession(request)
    const { action, sha } = await readJson<{ action?: unknown; sha?: unknown }>(request)
    if (action !== 'undo' || typeof sha !== 'string') throw new HttpError(400, 'Unknown action.')

    const [latest] = await listPublishes(1)
    if (!latest || latest.sha !== sha) throw new HttpError(409, 'Only the most recent publish can be undone. Reload the history and try again.')
    await prepareDrafts()
    if ((await compareDrafts()).ahead_by > 0) throw new HttpError(409, 'You have unpublished changes. Publish or discard them first, then undo.')

    const when = new Date(latest.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })
    for (const file of latest.files) {
      const before = await readContent(file, latest.before)
      const current = await readContent(file)
      const label = Object.values(collections).find((c) => c.file === file)?.label ?? file
      await writeContent(file, before.data, current.sha, `Undo publish of ${when}: ${label} (by ${session.name})`, session.name)
    }
    return json({ restored: latest.files })
  })
}
