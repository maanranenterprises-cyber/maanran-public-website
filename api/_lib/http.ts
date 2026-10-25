// Small helpers shared by the admin API functions (Vercel Functions using the Web Request/Response API).

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: string[],
  ) {
    super(message)
  }
}

export const json = (data: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...init.headers },
  })

// Runs a handler and turns thrown HttpErrors (and anything unexpected) into JSON error responses
export async function handle(fn: () => Promise<Response>) {
  try {
    return await fn()
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message, details: e.details }, { status: e.status })
    console.error(e)
    return json({ error: 'Something went wrong on the server. Please try again.' }, { status: 500 })
  }
}

export function env(name: string) {
  const value = process.env[name]
  if (!value) throw new HttpError(500, `The server is missing the ${name} setting. Add it in Vercel → Settings → Environment Variables.`)
  return value
}

// Changes must come from the admin page on this same site (blocks cross-site requests that ride on the login cookie)
export function requireSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  if (!origin || !host || new URL(origin).host !== host) throw new HttpError(403, 'Request blocked: it did not come from the admin page.')
}

const MAX_BODY = 2_000_000

export async function readJson<T>(request: Request): Promise<T> {
  if (!request.headers.get('content-type')?.includes('application/json')) throw new HttpError(415, 'Expected JSON.')
  const body = await request.text()
  if (body.length > MAX_BODY) throw new HttpError(413, 'This change is too large to save.')
  try {
    return JSON.parse(body) as T
  } catch {
    throw new HttpError(400, 'The request could not be read.')
  }
}
