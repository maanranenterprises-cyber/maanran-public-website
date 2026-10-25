import { Link } from 'react-router-dom'
import { ArrowRight, Clock, Mail, MapPin, Phone } from 'lucide-react'
import { categories, navigation, site, whatsappLink } from '../lib/content'
import { useEnquiry } from './EnquiryContext'
import { Brand } from './Navbar'
import { WhatsAppIcon, socialIcons } from './Icons'

export default function Footer() {
  const { openEnquiry } = useEnquiry()
  const { contact, address } = site
  const year = new Date().getFullYear()
  // The listing ID shows the business card on the map (and "View larger map" opens the listing); otherwise fall back to a pin
  const mapSrc = address.mapCid
    ? `https://www.google.com/maps?cid=${address.mapCid}&output=embed`
    : address.mapQuery
      ? `https://www.google.com/maps?q=${encodeURIComponent(address.mapQuery)}&z=17&output=embed`
      : ''

  const contactItems = [
    { icon: <WhatsAppIcon className="size-5" />, label: 'WhatsApp', value: contact.phoneDisplay, href: whatsappLink() },
    { icon: <Phone className="size-5" />, label: 'Call us', value: contact.phoneDisplay, href: `tel:${contact.phone}` },
    { icon: <Mail className="size-5" />, label: 'Email', value: contact.email, href: `mailto:${contact.email}` },
    { icon: <Clock className="size-5" />, label: 'Business hours', value: contact.hours },
  ]

  return (
    <footer id="contact" className="bg-ink text-white">
      {/* Division 1: Start your project */}
      <div className="container-x py-14">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-brand-dark p-8 sm:p-10">
          <div className="absolute -right-16 -top-16 size-64 rounded-full bg-accent/30 blur-2xl" />
          <div className="absolute -bottom-20 left-1/3 size-56 rounded-full bg-blue/30 blur-2xl" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1.1fr_1.4fr]">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Start Your Project</h2>
              <p className="mt-2 text-white/80">Tell us about your space and get a free consultation and quotation.</p>
              <button onClick={() => openEnquiry()} className="btn mt-5 bg-white text-brand hover:bg-white/90">
                Book a Free Consultation <ArrowRight className="size-4" />
              </button>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {contactItems.map((c) => {
                const inner = (
                  <>
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/15">{c.icon}</span>
                    <span className="min-w-0">
                      <span className="block text-xs text-white/70">{c.label}</span>
                      <span className="block break-words font-semibold leading-snug">{c.value}</span>
                    </span>
                  </>
                )
                return (
                  <li key={c.label}>
                    {c.href ? (
                      <a href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener" className="flex h-full items-center gap-3 rounded-2xl bg-white/10 p-3 transition hover:bg-white/20">
                        {inner}
                      </a>
                    ) : (
                      <div className="flex h-full items-center gap-3 rounded-2xl bg-white/10 p-3">{inner}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* Division 2: Company information and links */}
      <div className="container-x grid gap-10 border-t border-white/10 py-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1.3fr_1.3fr]">
        <div>
          <Brand light />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/65">{site.tagline}. Office, institutional and steel furniture, designed, made and installed by one team.</p>
          <div className="mt-5 flex gap-2">
            {site.social.map((s) => {
              const Icon = socialIcons[s.type as keyof typeof socialIcons]
              if (!Icon) return null
              const cls = 'grid size-9 place-items-center rounded-full bg-white/10 transition hover:bg-brand'
              return s.url ? (
                <a key={s.type} href={s.url} target="_blank" rel="noopener" aria-label={`${site.name} on ${s.type[0].toUpperCase()}${s.type.slice(1)}`} className={cls}>
                  <Icon className="size-4" />
                </a>
              ) : (
                <span key={s.type} title={`${s.type} link coming soon`} className={`${cls} opacity-50`}>
                  <Icon className="size-4" />
                </span>
              )
            })}
          </div>
        </div>
        <FooterLinks title="Explore" links={navigation.map((n) => ({ label: n.label, href: n.href }))} />
        <FooterLinks
          title="Services"
          links={[{ label: 'Home & Office Interiors', href: '/interiors' }, ...categories.slice(0, 6).map((c) => ({ label: c.name, href: `/products?category=${c.slug}` }))]}
        />
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white/90">Get in Touch</h3>
          <ul className="mt-4 space-y-3 text-sm text-white/70">
            <li className="flex gap-2.5">
              <Phone className="mt-0.5 size-4 shrink-0 text-accent" />
              <a href={`tel:${contact.phone}`} className="hover:text-white">{contact.phoneDisplay}</a>
            </li>
            <li className="flex gap-2.5">
              <Mail className="mt-0.5 size-4 shrink-0 text-accent" />
              <a href={`mailto:${contact.email}`} className="hover:text-white">{contact.email}</a>
            </li>
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-accent" />
              <span>{address.lines.join(', ')}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Division 3: Location */}
      <div className="container-x pb-12">
        <div className="grid overflow-hidden rounded-2xl border border-white/10 md:grid-cols-[1fr_2fr]">
          <div className="flex flex-col justify-center gap-2 bg-white/5 p-6">
            <MapPin className="size-6 text-accent" />
            <h3 className="text-lg font-bold">Visit Us</h3>
            <address className="not-italic text-sm leading-relaxed text-white/70">
              {site.name}
              {address.lines.map((l) => (
                <span key={l} className="block">{l}</span>
              ))}
            </address>
            {address.mapLink && (
              <a href={address.mapLink} target="_blank" rel="noopener" className="mt-2 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-accent hover:text-white">
                Get directions <ArrowRight className="size-4" />
              </a>
            )}
          </div>
          {mapSrc ? (
            <iframe title="Company location map" src={mapSrc} className="h-64 w-full border-0 md:h-72" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          ) : (
            <div className="grid h-64 place-items-center bg-white/[0.03] text-sm text-white/50 md:h-72">Map appears here once the company address is added</div>
          )}
        </div>
      </div>

      {/* Bottom legal bar */}
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-xs text-white/55 sm:flex-row">
          <p>© {year} {site.name}. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white">Terms & Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterLinks({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h3 className="text-sm font-bold uppercase tracking-wider text-white/90">{title}</h3>
      <ul className="mt-4 space-y-2.5 text-sm text-white/70">
        {links.map((l) => (
          <li key={l.href}>
            <Link to={l.href} className="hover:text-white">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
