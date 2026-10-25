// The admin API functions (api/) run on Vercel with Node's own ES module loader, which needs the full file name
// in relative imports ('./codes.js', not './codes'). Local tools accept either, so check it here before deploying.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const files = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? files(join(dir, f)) : [join(dir, f)]))
const checked = [...files('api'), ...files('src/lib')].filter((f) => f.endsWith('.ts'))
const bad = checked.flatMap((f) =>
  [...readFileSync(f, 'utf8').matchAll(/from '(\.\.?\/[^']+)'/g)].filter((m) => !/\.(js|json)$/.test(m[1])).map((m) => `${f}: import '${m[1]}' needs a .js ending`),
)
if (bad.length) {
  console.error(`Server function imports would fail on Vercel:\n  ${bad.join('\n  ')}`)
  process.exit(1)
}
console.log(`api imports: ${checked.length} files ok`)
