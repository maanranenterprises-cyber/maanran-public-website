import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// Our photos: no right-click "Save image as…" or dragging them out (a deterrent; screenshots still work).
// Zoom panels and other photos shown as backgrounds have no image menu anyway.
const isPhoto = (e: Event) => e.target instanceof HTMLImageElement
document.addEventListener('contextmenu', (e) => isPhoto(e) && e.preventDefault())
document.addEventListener('dragstart', (e) => isPhoto(e) && e.preventDefault())

const root = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// Pages are pre-rendered to HTML at build time (scripts/prerender.mjs); React takes over that HTML.
// In development the root is empty, so it renders from scratch.
if (root.hasChildNodes()) hydrateRoot(root, app)
else createRoot(root).render(app)
