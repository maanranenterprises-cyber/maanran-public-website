import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import devApi from './scripts/dev-api'

export default defineConfig({
  plugins: [react(), tailwindcss(), devApi()],
  build: {
    // The public site and the admin are separate pages, so visitors never download the admin code
    rollupOptions: { input: { main: 'index.html', admin: 'admin.html' } },
  },
})
