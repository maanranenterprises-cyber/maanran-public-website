// Minimal client for the Upstash Redis REST API (the private store for customer enquiries).
// Connecting Upstash to the project in Vercel adds the address and token as environment variables.
import { HttpError } from './http.js'

type Reply = { result?: unknown; error?: string }

function settings() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  if (!url || !token) throw new HttpError(500, 'The enquiries database is not connected. In Vercel, add Upstash Redis to this project (Storage), then redeploy.')
  return { url: url.replace(/\/$/, ''), token }
}

// Runs several commands in one request, e.g. redis([['SET', 'k', 'v'], ['ZADD', 'idx', 1, 'k']])
export async function redis(commands: (string | number)[][]): Promise<unknown[]> {
  const { url, token } = settings()
  let res: Response
  try {
    res = await fetch(`${url}/pipeline`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(commands), cache: 'no-store' })
  } catch {
    throw new HttpError(502, 'Could not reach the enquiries database. Please try again.')
  }
  if (!res.ok) {
    console.error('Upstash error', res.status, await res.text())
    throw new HttpError(502, 'The enquiries database did not accept the request. Please try again.')
  }
  const replies = (await res.json()) as Reply[]
  const failed = replies.find((r) => r.error)
  if (failed) {
    console.error('Upstash command error', failed.error)
    throw new HttpError(502, 'The enquiries database reported an error. Please try again.')
  }
  return replies.map((r) => r.result)
}
