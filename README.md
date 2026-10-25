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

- **Send Enquiry** posts the enquiry to Formspree at `contact.formEndpoint` in `src/content/site.json`. Formspree emails it to the inbox set on that form in the Formspree dashboard (formspree.io), where past submissions can also be seen.
- To use a different Formspree form, replace `formEndpoint` with its URL.
- **Send on WhatsApp** opens WhatsApp with the enquiry pre-filled.

## Admin (in progress)

The admin is at **/admin** (`admin.html` + `src/admin/`). It edits the files in `src/content/` through the server functions in `api/`. Nothing is stored anywhere else. It currently covers banners, categories, products and clients; the other sections are coming next.

**Trying it locally:** run `npm run dev`, open http://localhost:5173/admin, and log in with any name and the password `admin`. In development, `scripts/dev-api.ts` runs the real `api/` functions against an in-memory copy of the content. Nothing is written to disk, GitHub or ImageKit, and everything resets when the dev server restarts.

- **Login**: one shared password. The login form also asks for the editor's name, which is recorded on every change. A signed cookie keeps the editor logged in for 7 days.
- **Drafts**: saves go to the `drafts` branch, and Vercel builds a preview of it. **Publish** merges `drafts` into `main`, and Vercel then rebuilds the live site in about 1–2 minutes. **Discard** resets `drafts` to `main`.
- **Checks**: every save is checked against the rules in `src/lib/schema.ts` (for example, required fields, valid links, and products that point to a real category). The build runs the same checks, so broken content never goes live.
- **Images**: the admin uploads them straight to ImageKit, using a 30-minute permission from `/api/imagekit-auth`.

| Endpoint | Purpose |
|---|---|
| `POST /api/login`, `POST /api/logout`, `GET /api/session` | Log in, log out, and check who is logged in |
| `GET /api/content?name=products`, `PUT /api/content` | Read a section from drafts, or save it |
| `GET /api/drafts`, `POST /api/drafts` `{action: "publish" \| "discard"}` | List unpublished changes, publish them, or discard them |
| `GET /api/imagekit-auth` | Upload permission for one image |

Vercel environment variables (Settings → Environment Variables, for Production and Preview):

| Name | Value |
|---|---|
| `ADMIN_PASSWORD` | The admin password (16+ characters) |
| `SESSION_SECRET` | A long random string (`openssl rand -base64 32`); changing it logs everyone out |
| `GITHUB_TOKEN` | A fine-grained GitHub token for this repository only, with Contents: Read and write |
| `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_PUBLIC_KEY` | From the ImageKit dashboard → Developer options |
| `GITHUB_REPO` | Optional; defaults to `maanranenterprises-cyber/maanran-public-website` |
| `DRAFTS_PREVIEW_URL` | Optional; Vercel's address for the `drafts` branch preview, so the dashboard shows a Preview button |

## Deploying

Vercel (recommended): import the GitHub repository at vercel.com/new. `vercel.json` already sets the build command, the `dist` output folder, clean page addresses and the `/admin` rewrite, and every push to `main` redeploys the site.

Any other static host works too. On Netlify or Cloudflare Pages: build command `npm run build`, output folder `dist`. `public/_redirects` makes page refreshes work on Netlify; Cloudflare Pages handles single-page apps automatically.
