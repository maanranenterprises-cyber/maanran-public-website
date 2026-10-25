import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from 'react-router-dom'
import { routes } from './App'
import { collections, validateAll, type CollectionName } from './lib/schema'

const contentFiles = import.meta.glob<unknown>('./content/*.json', { eager: true, import: 'default' })

// Build-time check of every content file; the build stops if anything is broken, so the live site keeps its last good version
export function checkContent() {
  const content = Object.fromEntries(
    (Object.keys(collections) as CollectionName[]).map((name) => [name, contentFiles[`./content/${collections[name].file}`]]),
  ) as Record<CollectionName, unknown>
  return validateAll(content)
}

// Build-time render of one page to HTML, used by scripts/prerender.mjs
export async function render(path: string) {
  const handler = createStaticHandler(routes)
  const context = await handler.query(new Request(`http://localhost${path}`))
  if (context instanceof Response) throw new Error(`Unexpected redirect while pre-rendering ${path}`)
  const router = createStaticRouter(handler.dataRoutes, context)
  return renderToString(
    <StrictMode>
      <StaticRouterProvider router={router} context={context} />
    </StrictMode>,
  )
}
