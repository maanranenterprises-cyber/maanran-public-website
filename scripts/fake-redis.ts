// In-memory stand-in for the Upstash Redis REST API (only the commands the enquiries use).
// Used by the local dev server (scripts/dev-api.ts) and by tests; never in production.
export function createFakeRedis() {
  const strings = new Map<string, string>()
  const zsets = new Map<string, Map<string, number>>()
  const sets = new Map<string, Set<string>>()
  const zset = (k: string) => zsets.get(k) ?? (zsets.set(k, new Map()), zsets.get(k)!)
  const set = (k: string) => sets.get(k) ?? (sets.set(k, new Set()), sets.get(k)!)

  function run([cmd, ...a]: (string | number)[]): unknown {
    const args = a.map(String)
    switch (String(cmd).toUpperCase()) {
      case 'SET': return strings.set(args[0], args[1]), 'OK'
      case 'GET': return strings.get(args[0]) ?? null
      case 'MGET': return args.map((k) => strings.get(k) ?? null)
      case 'DEL': return args.filter((k) => strings.delete(k)).length
      case 'ZADD': return zset(args[0]).set(args[2], Number(args[1])), 1
      case 'ZREM': return zset(args[0]).delete(args[1]) ? 1 : 0
      case 'ZREVRANGE': return [...zset(args[0])].sort((x, y) => y[1] - x[1]).map(([m]) => m)
      case 'SADD': return set(args[0]).add(args[1]), 1
      case 'SREM': return set(args[0]).delete(args[1]) ? 1 : 0
      case 'SCARD': return set(args[0]).size
      default: throw new Error(`fake Redis: ${cmd} is not simulated`)
    }
  }

  return {
    async handle(url: URL, init: RequestInit = {}) {
      if (url.pathname !== '/pipeline') return new Response('not found', { status: 404 })
      const commands = JSON.parse(String(init.body)) as (string | number)[][]
      return Response.json(commands.map((c) => {
        try {
          return { result: run(c) }
        } catch (e) {
          return { error: String(e) }
        }
      }))
    },
    size: () => strings.size,
  }
}
