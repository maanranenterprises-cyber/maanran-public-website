import { clients, pages } from '../lib/content'
import { imageUrl } from '../lib/media'
import SectionHeading from '../components/SectionHeading'

// Short monogram shown until a client's logo is added: "BEL (Bharat ...)" -> "BEL", "Nilagiri Arts & Management" -> "NA"
const initials = (name: string) => {
  const words = name.split('(')[0].trim().split(/\s+/).filter((w) => /^[A-Za-z0-9]/.test(w))
  if (/^[A-Z0-9]{2,4}$/.test(words[0])) return words[0]
  return words
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

type ClientItem = (typeof clients)[number]

// Seconds per card, so both rows move at the same pace whatever their length
const SECONDS_PER_CARD = 3

// Monogram tints from the logo colours, picked from the name so a client always gets the same one
const tints = ['bg-brand/10 text-brand', 'bg-blue/10 text-blue', 'bg-accent/15 text-[#b45c00]', 'bg-ink/[0.06] text-ink/70']
const tintFor = (name: string) => tints[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % tints.length]

function ClientCard({ c, hidden }: { c: ClientItem; hidden?: boolean }) {
  // Logo first, name underneath; clients without a logo yet show a tinted monogram in the same space
  const body = (
    <>
      <span className="grid h-16 w-full place-items-center">
        {c.logo ? (
          <img src={imageUrl(c.logo, 320)} alt="" loading="lazy" className="max-h-16 max-w-[85%] rounded-md object-contain transition duration-300 group-hover/card:scale-105" />
        ) : (
          <span className={`grid size-14 place-items-center rounded-xl text-base font-extrabold tracking-tight ${tintFor(c.name)}`}>{initials(c.name)}</span>
        )}
      </span>
      <span className="line-clamp-1 text-center text-xs font-semibold text-muted">{c.name}</span>
    </>
  )
  const cls =
    'group/card flex h-32 w-56 flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-white px-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition duration-300 hover:-translate-y-0.5 hover:border-brand/25 hover:shadow-[0_12px_28px_-12px_rgb(0_0_0/0.18)]'
  return c.website ? (
    <a href={c.website} target="_blank" rel="noopener" tabIndex={hidden ? -1 : undefined} className={`${cls} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand`}>
      {body}
    </a>
  ) : (
    <div className={cls}>{body}</div>
  )
}

// Endless row: the list is rendered twice and the track slides by one copy's width, so the loop has no visible jump.
// The row pauses while hovered or while a card has keyboard focus.
function Marquee({ items, reverse }: { items: ClientItem[]; reverse?: boolean }) {
  return (
    <div className="marquee group overflow-hidden py-2 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <ul
        className={`marquee-track flex w-max animate-[marquee_var(--duration)_linear_infinite] group-focus-within:[animation-play-state:paused] group-hover:[animation-play-state:paused] ${reverse ? '[animation-direction:reverse]' : ''}`}
        style={{ '--duration': `${items.length * SECONDS_PER_CARD}s` } as React.CSSProperties}
      >
        {[0, 1].map((copy) =>
          items.map((c) => (
            <li key={`${copy}-${c.id}`} className={`pr-5 ${copy === 1 ? 'marquee-copy' : ''}`} aria-hidden={copy === 1 || undefined}>
              <ClientCard c={c} hidden={copy === 1} />
            </li>
          )),
        )}
      </ul>
    </div>
  )
}

export default function Clients() {
  if (!clients.length || !pages.sections.clients) return null
  // Alternate clients between the rows so both stay balanced
  const top = clients.filter((_, i) => i % 2 === 0)
  const bottom = clients.filter((_, i) => i % 2 === 1)
  return (
    <section id="clients" aria-label="Our trusted clients" className="relative overflow-hidden bg-soft py-20 lg:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(2_79_208/0.06),transparent_60%)]" />
      <div className="container-x relative">
        <SectionHeading center eyebrow={pages.home.clients.eyebrow} title={pages.home.clients.title} text={pages.home.clients.text} />
      </div>
      <div className="relative mt-12 grid gap-3">
        <Marquee items={top} reverse />
        {bottom.length > 0 && <Marquee items={bottom} />}
      </div>
      <p className="container-x relative mt-10 text-center text-sm font-medium text-muted">
        <span className="font-extrabold text-ink">{pages.home.clients.count}</span> {pages.home.clients.countText}
      </p>
    </section>
  )
}
