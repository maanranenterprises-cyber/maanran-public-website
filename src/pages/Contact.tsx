import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { facebook, instagram, pages, site, whatsappLink } from '../lib/content'
import Seo from '../components/Seo'
import EnquiryForm from '../components/EnquiryForm'
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from '../components/Icons'
import PageHeader from './PageHeader'

export default function Contact() {
  const { contact, address } = site
  const items = [
    { icon: Phone, label: 'Phone', value: contact.phoneDisplay, href: `tel:${contact.phone}` },
    { icon: WhatsAppIcon, label: 'WhatsApp', value: contact.phoneDisplay, href: whatsappLink() },
    { icon: Mail, label: 'Email', value: contact.email, href: `mailto:${contact.email}` },
    ...(instagram ? [{ icon: InstagramIcon, label: 'Instagram', value: instagram.handle, href: instagram.url }] : []),
    ...(facebook ? [{ icon: FacebookIcon, label: 'Facebook', value: site.name, href: facebook.url }] : []),
    { icon: Clock, label: 'Business hours', value: contact.hours },
    { icon: MapPin, label: 'Address', value: address.lines.join(', ') },
  ]
  return (
    <>
      <Seo
        title="Contact Us"
        description={`Call ${contact.phoneDisplay}, WhatsApp or email ${site.name} for furniture and interior enquiries. Visit us at ${address.lines.join(', ')}.`}
        path="/contact"
        crumbs={[{ name: 'Contact', path: '/contact' }]}
      />
      <PageHeader title={pages.contact.title} text={pages.contact.text} crumbs={[{ label: 'Contact' }]} />
      <section className="py-14 lg:py-20">
        <div className="container-x grid gap-10 lg:grid-cols-[1fr_1.5fr]">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">{pages.contact.detailsTitle}</h2>
            <ul className="mt-6 space-y-3">
              {items.map(({ icon: Icon, label, value, href }) => {
                const inner = (
                  <>
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
                      <Icon className="size-5" />
                    </span>
                    <span>
                      <span className="block text-xs text-muted">{label}</span>
                      <span className="block font-semibold">{value}</span>
                    </span>
                  </>
                )
                return (
                  <li key={label}>
                    {href ? (
                      <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener" className="flex items-center gap-3 rounded-2xl border border-line p-4 transition hover:border-brand/40">
                        {inner}
                      </a>
                    ) : (
                      <div className="flex items-center gap-3 rounded-2xl border border-line p-4">{inner}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
          <div className="rounded-3xl border border-line p-6 shadow-sm sm:p-8">
            <p className="eyebrow">{pages.contact.formEyebrow}</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight">{pages.contact.formTitle}</h2>
            <div className="mt-6">
              <EnquiryForm />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
