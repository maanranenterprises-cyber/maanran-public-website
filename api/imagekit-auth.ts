// GET /api/imagekit-auth → a short-lived permission for the admin page to upload one image straight to ImageKit.
// The ImageKit private key stays on the server; the browser only receives a signature that expires in 30 minutes.
import { createHmac, randomUUID } from 'node:crypto'
import { env, handle, json } from './_lib/http.js'
import { requireSession } from './_lib/session.js'

const VALID_FOR_SECONDS = 30 * 60

export function GET(request: Request) {
  return handle(async () => {
    requireSession(request)
    const token = randomUUID()
    const expire = Math.floor(Date.now() / 1000) + VALID_FOR_SECONDS
    const signature = createHmac('sha1', env('IMAGEKIT_PRIVATE_KEY')).update(token + expire).digest('hex')
    return json({ token, expire, signature, publicKey: env('IMAGEKIT_PUBLIC_KEY') })
  })
}
