// GET /api/session → who is logged in (the admin page uses this to decide between the login screen and the editor)
import { handle, json } from './_lib/http.js'
import { readSession } from './_lib/session.js'

export function GET(request: Request) {
  return handle(async () => {
    const session = readSession(request)
    return json(session ? { loggedIn: true, name: session.name } : { loggedIn: false })
  })
}
