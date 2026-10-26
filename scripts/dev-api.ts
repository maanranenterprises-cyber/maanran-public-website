// Development only (`npm run dev`): serves /api/* with the real handlers in api/, against an in-memory stand-in
// for GitHub that starts from the current src/content files. Nothing is written to disk or sent to GitHub/ImageKit.
// Log in at http://localhost:5173/admin with the password "admin".
import { readdirSync, readFileSync } from 'node:fs'
import { createFakeGitHub } from './fake-github'
import { createFakeRedis } from './fake-redis'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin, ViteDevServer } from 'vite'

// Pretend build time: /version.json switches to the newest commit this long after a publish
const FAKE_BUILD_MS = 4000

// Uploaded images are kept in memory and served from /__dev/files/...
const uploads = new Map<string, { type: string; data: Buffer }>()

async function toRequest(req: IncomingMessage) {
  const chunks: Buffer[] = []
  for await (const c of req) chunks.push(c as Buffer)
  const headers = new Headers()
  for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v)
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
  return new Request(`http://${req.headers.host}${req.url}`, { method: req.method, headers, body: hasBody ? Buffer.concat(chunks) : undefined })
}

async function send(res: ServerResponse, response: Response) {
  res.statusCode = response.status
  // The real cookie is Secure; browsers accept that on localhost, but strip it so any local client keeps it
  response.headers.forEach((v, k) => res.setHeader(k, k === 'set-cookie' ? v.replace('; Secure', '') : v))
  res.end(Buffer.from(await response.arrayBuffer()))
}

export default function devApi(): Plugin {
  return {
    name: 'maanran-dev-api',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      process.env.ADMIN_PASSWORD ||= 'admin'
      process.env.SESSION_SECRET ||= 'dev-only-secret'
      process.env.GITHUB_TOKEN ||= 'dev'
      process.env.UPSTASH_REDIS_REST_URL ||= 'http://fake-redis.local'
      process.env.UPSTASH_REDIS_REST_TOKEN ||= 'dev'
      const enquiriesDb = createFakeRedis()
      const root = server.config.root
      const github = createFakeGitHub(Object.fromEntries(readdirSync(`${root}/src/content`).map((f) => [`src/content/${f}`, readFileSync(`${root}/src/content/${f}`, 'utf8')])))
      let live = github.branchSha('main')
      let seen = live
      let seenAt = 0
      const realFetch = globalThis.fetch
      globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(input instanceof Request ? input.url : String(input))
        if (url.hostname === 'api.github.com') return github.handle(url, init)
        if (url.hostname === 'fake-redis.local') return enquiriesDb.handle(url, init)
        return realFetch(input, init)
      }) as typeof fetch

      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        // The admin is a single page app at /admin (production does the same with a rewrite in vercel.json)
        if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
          req.url = '/admin.html'
          return next()
        }
        if (url.pathname === '/version.json') {
          const head = github.branchSha('main')
          if (head !== seen) [seen, seenAt] = [head, Date.now()]
          if (Date.now() - seenAt > FAKE_BUILD_MS) live = seen
          return send(res, Response.json({ commit: live, builtAt: new Date().toISOString() }))
        }
        if (url.pathname.startsWith('/__dev/files/')) {
          const file = uploads.get(url.pathname)
          if (!file) return (res.statusCode = 404), res.end()
          res.setHeader('content-type', file.type)
          return res.end(file.data)
        }
        if (url.pathname === '/__dev/upload' && req.method === 'POST') {
          const form = await (await toRequest(req)).formData()
          const file = form.get('file') as File
          const path = `/__dev/files/${Date.now()}-${String(form.get('fileName') ?? 'upload').replace(/[^\w.-]/g, '_')}`
          uploads.set(path, { type: file.type, data: Buffer.from(await file.arrayBuffer()) })
          return send(res, Response.json({ filePath: `http://${req.headers.host}${path}` }))
        }
        if (!url.pathname.startsWith('/api/')) return next()
        try {
          const request = await toRequest(req)
          // Uploads go to the in-memory store instead of ImageKit
          if (url.pathname === '/api/imagekit-auth') {
            return send(res, Response.json({ token: 'dev', expire: 0, signature: 'dev', publicKey: 'dev', uploadUrl: '/__dev/upload' }))
          }
          const mod = await server.ssrLoadModule(`/api/${url.pathname.slice(5).replace(/[^\w-]/g, '')}.ts`)
          const handler = mod[request.method]
          if (!handler) return send(res, Response.json({ error: 'Method not allowed' }, { status: 405 }))
          await send(res, await handler(request))
        } catch (e) {
          console.error(e)
          send(res, Response.json({ error: String(e) }, { status: 500 }))
        }
      })
    },
  }
}
