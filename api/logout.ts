// POST /api/logout → clears the admin session cookie
import { handle, json, requireSameOrigin } from './_lib/http.js'
import { clearedCookie } from './_lib/session.js'

export function POST(request: Request) {
  return handle(async () => {
    requireSameOrigin(request)
    return json({ ok: true }, { headers: { 'set-cookie': clearedCookie } })
  })
}
