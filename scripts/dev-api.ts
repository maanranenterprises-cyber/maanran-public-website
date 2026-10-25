// Development only (`npm run dev`): serves /api/* with the real handlers in api/, against an in-memory stand-in
// for GitHub that starts from the current src/content files. Nothing is written to disk or sent to GitHub/ImageKit.
// Log in at http://localhost:5173/admin with the password "admin".
import { readdirSync, readFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin, ViteDevServer } from 'vite'

type Branch = { sha: string; commits: string[]; files: Map<string, { text: string; sha: string }> }

function fakeGitHub(root: string) {
  let n = 0
  const id = () => `dev${++n}`
  const files = new Map<string, { text: string; sha: string }>()
  for (const f of readdirSync(`${root}/src/content`)) files.set(`src/content/${f}`, { text: readFileSync(`${root}/src/content/${f}`, 'utf8'), sha: id() })
  const branches = new Map<string, Branch>([['main', { sha: 'main0', commits: ['main0'], files }]])
  const copy = (b: Branch): Branch => ({ sha: b.sha, commits: [...b.commits], files: new Map(b.files) })
  const bySha = (sha: string) => [...branches.values()].find((b) => b.sha === sha)!
  const messages = new Map<string, { message: string; name: string; date: string }>()

  return async (url: URL, init: RequestInit = {}) => {
    const path = url.pathname.replace(/^\/repos\/[^/]+\/[^/]+/, '')
    const method = init.method ?? 'GET'
    const body = init.body ? JSON.parse(init.body as string) : null
    const res = (status: number, data?: unknown) => new Response(data === undefined ? null : JSON.stringify(data), { status })
    let m: RegExpMatchArray | null
    if ((m = path.match(/^\/git\/ref\/heads\/(.+)$/))) {
      const b = branches.get(m[1])
      return b ? res(200, { object: { sha: b.sha } }) : res(404, { message: 'Not Found' })
    }
    if (path === '/git/refs' && method === 'POST') return branches.set(body.ref.replace('refs/heads/', ''), copy(bySha(body.sha))), res(201, {})
    if ((m = path.match(/^\/git\/refs\/heads\/(.+)$/)) && method === 'PATCH') return branches.set(m[1], copy(bySha(body.sha))), res(200, {})
    if ((m = path.match(/^\/compare\/(.+)\.\.\.(.+)$/))) {
      const base = branches.get(m[1])!, head = branches.get(m[2])!
      const ahead = head.commits.filter((c) => !base.commits.includes(c))
      return res(200, {
        ahead_by: ahead.length,
        behind_by: base.commits.filter((c) => !head.commits.includes(c)).length,
        files: [...head.files.keys()].filter((k) => head.files.get(k)!.sha !== base.files.get(k)?.sha).map((filename) => ({ filename, status: 'modified' })),
        commits: ahead.map((sha) => {
          const c = messages.get(sha)
          return { sha, commit: { message: c?.message ?? 'Change', author: { name: c?.name ?? 'Admin', date: c?.date ?? new Date().toISOString() } } }
        }),
      })
    }
    if ((m = path.match(/^\/contents\/(.+)$/))) {
      const branch = branches.get(method === 'GET' ? url.searchParams.get('ref')! : body.branch)!
      const file = branch.files.get(m[1])
      if (method === 'GET') return file ? res(200, { content: Buffer.from(file.text).toString('base64'), sha: file.sha }) : res(404, {})
      if (file?.sha !== body.sha) return res(409, { message: 'conflict' })
      const sha = id()
      branch.files.set(m[1], { text: Buffer.from(body.content, 'base64').toString(), sha })
      branch.sha = id()
      branch.commits.push(branch.sha)
      messages.set(branch.sha, { message: body.message, name: body.author.name, date: new Date().toISOString() })
      return res(200, { content: { sha } })
    }
    if (path === '/merges') {
      const main = branches.get('main')!, d = branches.get('drafts')!
      if (d.commits.every((c) => main.commits.includes(c))) return res(204)
      for (const [k, v] of d.files) main.files.set(k, v)
      main.commits.push(...d.commits.filter((c) => !main.commits.includes(c)))
      main.sha = id()
      main.commits.push(main.sha)
      return res(201, {})
    }
    return res(501, { message: `dev-api: ${method} ${path} is not simulated` })
  }
}

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
      const github = fakeGitHub(server.config.root)
      const realFetch = globalThis.fetch
      globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(input instanceof Request ? input.url : String(input))
        return url.hostname === 'api.github.com' ? github(url, init) : realFetch(input, init)
      }) as typeof fetch

      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        // The admin is a single page app at /admin (production does the same with a rewrite in vercel.json)
        if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
          req.url = '/admin.html'
          return next()
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
