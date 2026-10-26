import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import devApi from './scripts/dev-api'

// Customer feedback awaiting review is kept in testimonials.json for the admin (which reads it through the API),
// but it must not be built into the public website's code before it is approved.
function stripPendingFeedback(): Plugin {
  return {
    name: 'maanran-strip-pending-feedback',
    enforce: 'pre',
    load(id) {
      if (!id.replace(/\\/g, '/').endsWith('/src/content/testimonials.json')) return
      const list = JSON.parse(readFileSync(id, 'utf8')) as { pending?: boolean }[]
      return JSON.stringify(list.filter((t) => !t.pending))
    },
  }
}

export default defineConfig({
  plugins: [stripPendingFeedback(), react(), tailwindcss(), devApi()],
  build: {
    // The public site and the admin are separate pages, so visitors never download the admin code
    rollupOptions: { input: { main: 'index.html', admin: 'admin.html' } },
  },
})
