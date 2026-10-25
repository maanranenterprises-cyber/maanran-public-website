# MAANRAN ENTERPRISES website

React + Vite + Tailwind site with no backend. All content lives in JSON files and is published by rebuilding the site.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/ (+ sitemap.xml)
npm run preview    # serve the build
```

## Updating content

Everything on the site comes from `src/content/`:

| File | What it controls |
| --- | --- |
| `site.json` | Company name, location, logo, navigation, phone, WhatsApp, email, hours, address, map, social links, ImageKit endpoint, experience start year |
| `banners.json` | Homepage hero slides (heading, subtitle, images, buttons, schedule) |
| `about.json` | About section and About page |
| `clients.json` | Trusted clients grid |
| `categories.json` | Product categories (filters on /products) |
| `products.json` | Products and their detail pages (`/products/<slug>`) |
| `stats.json` | Statistics row |
| `why-us.json` | Why Choose Us section |
| `testimonials.json` | Customer feedback carousel |
| `documents.json` | Download Catalog & Brochure cards (PDFs in `public/downloads/`) |
| `interiors.json` | Home & Office Interiors gallery (`/interiors`) |

Common fields on records:

- `published: false` hides a record; `order` sets its position.
- Banners also take `publishFrom` / `publishUntil` (ISO dates). These are checked in the visitor's browser, so scheduled banners switch on and off without a rebuild.
- Years of experience is calculated from `experienceStartYear` in `site.json`.
- Statistics marked `"verified": false` are placeholders.

Anything containing `PLACEHOLDER` still needs real company details before launch.

## Images (ImageKit)

1. Upload photos in the ImageKit dashboard (Media Library), e.g. into `/banners`, `/products`, `/interiors`, `/clients`.
2. Set `imagekitUrlEndpoint` in `site.json` (e.g. `https://ik.imagekit.io/your_id`).
3. Put the ImageKit path in the content file, e.g. `"images": ["/products/bunker-cot-1.jpg"]`.

The site requests resized WebP/AVIF versions automatically. Empty image fields show a placeholder. Never put the ImageKit private key in this project.

## Enquiry form

- **Send Enquiry** emails the enquiry to `contact.email` in `src/content/site.json` (currently info@maanran.com).
- By default this goes through FormSubmit (formsubmit.co), which needs no account. The very first enquiry triggers a one-time "Activate form" email to that inbox; click the link in it, and every enquiry after that is delivered. Enquiries sent before activation are not delivered.
- Optionally, create a free access key at web3forms.com for the company inbox and set it as `VITE_WEB3FORMS_KEY` (see `.env.example`, or the host's environment variables); the form then uses Web3Forms instead.
- **Send on WhatsApp** opens WhatsApp with the enquiry pre-filled.

## Deploying

Vercel (recommended): import the GitHub repository at vercel.com/new. `vercel.json` already sets the build command, the `dist` output folder and the rewrite that makes page refreshes work, and every push to `main` redeploys the site.

Any other static host works too. On Netlify or Cloudflare Pages: build command `npm run build`, output folder `dist`. `public/_redirects` makes page refreshes work on Netlify; Cloudflare Pages handles single-page apps automatically.
