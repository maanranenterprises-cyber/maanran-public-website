// In-memory stand-in for the parts of the GitHub API the admin uses (branches, commits, file contents,
// compare and merge). Used by the local dev server (scripts/dev-api.ts) and by tests; never in production.
type Files = Map<string, { text: string; sha: string }>
type Commit = { sha: string; seq: number; parents: string[]; files: Files; message: string; author: string; date: string }

export function createFakeGitHub(initialFiles: Record<string, string>) {
  let n = 0
  const id = (p: string) => `${p}${(++n).toString(16).padStart(6, '0')}`
  const commits = new Map<string, Commit>()
  const branches = new Map<string, string>()
  const trees = new Map<string, Files>()

  const files: Files = new Map(Object.entries(initialFiles).map(([path, text]) => [path, { text, sha: id('blob') }]))
  const root: Commit = { sha: id('c'), seq: n, parents: [], files, message: 'Initial content', author: 'Developer', date: new Date(Date.now() - 86400000).toISOString() }
  commits.set(root.sha, root)
  branches.set('main', root.sha)

  const resolve = (ref: string) => commits.get(branches.get(ref) ?? ref)
  const ancestors = (sha: string, seen = new Set<string>()) => {
    if (seen.has(sha)) return seen
    seen.add(sha)
    for (const p of commits.get(sha)?.parents ?? []) ancestors(p, seen)
    return seen
  }
  const add = (parents: string[], files: Files, message: string, author: string) => {
    const c: Commit = { sha: id('c'), seq: n, parents, files, message, author, date: new Date().toISOString() }
    commits.set(c.sha, c)
    return c
  }
  const view = (c: Commit) => ({ sha: c.sha, parents: c.parents.map((sha) => ({ sha })), commit: { message: c.message, author: { name: c.author, date: c.date }, committer: { date: c.date } } })
  const changedFiles = (a: Commit, b: Commit) => [...new Set([...a.files.keys(), ...b.files.keys()])].filter((k) => a.files.get(k)?.sha !== b.files.get(k)?.sha)

  async function handle(url: URL, init: RequestInit = {}): Promise<Response> {
    const path = url.pathname.replace(/^\/repos\/[^/]+\/[^/]+/, '')
    const method = init.method ?? 'GET'
    const body = init.body ? JSON.parse(init.body as string) : null
    const res = (status: number, data?: unknown) => new Response(data === undefined ? null : JSON.stringify(data), { status })
    let m: RegExpMatchArray | null

    if ((m = path.match(/^\/git\/ref\/heads\/(.+)$/))) return branches.has(m[1]) ? res(200, { object: { sha: branches.get(m[1]) } }) : res(404, { message: 'Not Found' })
    if (path === '/git/refs' && method === 'POST') return branches.set(body.ref.replace('refs/heads/', ''), body.sha), res(201, {})
    if ((m = path.match(/^\/git\/refs\/heads\/(.+)$/)) && method === 'PATCH') {
      // Without force, only moving the branch forward is allowed (as on GitHub)
      if (body.force === false && !ancestors(body.sha).has(branches.get(m[1])!)) return res(422, { message: 'Update is not a fast forward' })
      return branches.set(m[1], body.sha), res(200, {})
    }
    if ((m = path.match(/^\/git\/commits\/(.+)$/)) && method === 'GET') {
      const c = commits.get(m[1])
      return c ? res(200, { sha: c.sha, tree: { sha: `tree:${c.sha}` } }) : res(404, {})
    }
    if (path === '/git/trees' && method === 'POST') {
      const base = commits.get(String(body.base_tree).replace('tree:', ''))!
      const next: Files = new Map(base.files)
      for (const t of body.tree) next.set(t.path, { text: t.content, sha: id('blob') })
      const treeId = id('tree')
      trees.set(treeId, next)
      return res(201, { sha: treeId })
    }
    if (path === '/git/commits' && method === 'POST') {
      const c = add(body.parents, trees.get(body.tree)!, body.message, body.author?.name ?? 'Admin')
      return res(201, { sha: c.sha })
    }

    if ((m = path.match(/^\/compare\/(.+)\.\.\.(.+)$/))) {
      const base = resolve(m[1])!, head = resolve(m[2])!
      const inBase = ancestors(base.sha), inHead = ancestors(head.sha)
      const ahead = [...inHead].filter((s) => !inBase.has(s)).map((s) => commits.get(s)!).sort((a, b) => a.seq - b.seq)
      return res(200, {
        ahead_by: ahead.length,
        behind_by: [...inBase].filter((s) => !inHead.has(s)).length,
        files: changedFiles(base, head).map((filename) => ({ filename, status: 'modified' })),
        commits: ahead.map(view),
      })
    }

    if ((m = path.match(/^\/commits\/(.+)$/))) {
      const c = resolve(m[1])
      return c ? res(200, view(c)) : res(404, {})
    }
    if (path === '/commits') {
      const head = resolve(url.searchParams.get('sha') ?? 'main')!
      const list = [...ancestors(head.sha)].map((s) => commits.get(s)!).sort((a, b) => b.seq - a.seq)
      return res(200, list.slice(0, Number(url.searchParams.get('per_page') ?? 30)).map(view))
    }

    if ((m = path.match(/^\/contents\/(.+)$/))) {
      if (method === 'GET') {
        const file = resolve(url.searchParams.get('ref') ?? 'main')?.files.get(m[1])
        return file ? res(200, { content: Buffer.from(file.text).toString('base64'), sha: file.sha }) : res(404, {})
      }
      const head = resolve(body.branch)!
      if (head.files.get(m[1])?.sha !== body.sha) return res(409, { message: 'conflict' })
      const next: Files = new Map(head.files)
      const sha = id('blob')
      next.set(m[1], { text: Buffer.from(body.content, 'base64').toString(), sha })
      branches.set(body.branch, add([head.sha], next, body.message, body.author?.name ?? 'Admin').sha)
      return res(200, { content: { sha } })
    }

    if (path === '/merges') {
      const base = resolve(body.base)!, head = resolve(body.head)!
      if (ancestors(base.sha).has(head.sha)) return res(204)
      // Content edits only happen on the head branch here, so the head's files are the merged result
      const merged = add([base.sha, head.sha], new Map(head.files), body.commit_message, 'Admin')
      branches.set(body.base, merged.sha)
      return res(201, { sha: merged.sha })
    }
    return res(501, { message: `fake GitHub: ${method} ${path} is not simulated` })
  }

  return {
    handle,
    branchSha: (b: string) => branches.get(b),
    file: (branch: string, path: string) => resolve(branch)?.files.get(path)?.text,
    // Test helper: change a file on a branch directly (as an older version of the admin might have)
    setFile: (branch: string, path: string, text: string) => {
      const head = resolve(branch)!
      const next: Files = new Map(head.files)
      next.set(path, { text, sha: id('blob') })
      branches.set(branch, add([head.sha], next, `Direct change to ${path}`, 'Test').sha)
    },
  }
}
