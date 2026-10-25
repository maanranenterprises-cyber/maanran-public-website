// POST /api/login { password, name } → sets the admin session cookie
import { handle, HttpError, json, readJson, requireSameOrigin } from './_lib/http.js'
import { passwordMatches, sessionCookie } from './_lib/session.js'

const FAILED_LOGIN_DELAY_MS = 1500

export function POST(request: Request) {
  return handle(async () => {
    requireSameOrigin(request)
    const { password, name } = await readJson<{ password?: unknown; name?: unknown }>(request)
    const editor = typeof name === 'string' ? name.trim().slice(0, 60) : ''
    if (!editor) throw new HttpError(400, 'Please enter your name.')
    if (typeof password !== 'string' || !passwordMatches(password)) {
      // Slows down password guessing
      await new Promise((r) => setTimeout(r, FAILED_LOGIN_DELAY_MS))
      throw new HttpError(401, 'Wrong password.')
    }
    return json({ name: editor }, { headers: { 'set-cookie': sessionCookie(editor) } })
  })
}
