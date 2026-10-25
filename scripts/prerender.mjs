// Renders every page to static HTML after the build, so search engines and link previews
// get the full content and per-page title/description without running JavaScript.
// /about is written to dist/about.html (Vercel's cleanUrls serves it at /about); unknown URLs get dist/404.html.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { pages } from './pages.mjs'

const dist = new URL('../dist/', import.meta.url)
const server = new URL('../dist-server/', import.meta.url)
const { render } = await import(new URL('entry-server.js', server))
const template = readFileSync(new URL('index.html', dist), 'utf8')

// React puts <title>, <meta> and <link> tags at the front of its output; they belong in <head>
const HEAD_TAG = /^(<title>[^<]*<\/title>|<meta [^>]*\/>|<link [^>]*\/>)/

for (const path of [...pages, '/404']) {
  let body = await render(path)
  let head = ''
  for (let m; (m = body.match(HEAD_TAG)); body = body.slice(m[0].length)) head += m[0]
  if (!head.includes('<title>')) throw new Error(`No <title> rendered for ${path}`)
  const html = template.replace('</head>', `${head}\n  </head>`).replace('<div id="root"></div>', `<div id="root">${body}</div>`)
  const file = path === '/' ? 'index.html' : `${path.slice(1)}.html`
  const out = new URL(file, dist)
  mkdirSync(dirname(out.pathname), { recursive: true })
  writeFileSync(out, html)
}
rmSync(server, { recursive: true, force: true })
console.log(`prerendered ${pages.length + 1} pages`)
