import { site } from '../lib/content'
import Seo from '../components/Seo'
import PageHeader from './PageHeader'

// PLACEHOLDER legal text: have it reviewed before launch.
const pages = {
  privacy: {
    title: 'Privacy Policy',
    sections: [
      ['Information we collect', `When you send an enquiry, we collect the details you enter: name, phone number, email, city and your message. We do not ask for payment details on this website.`],
      ['How we use it', `We use your details only to reply to your enquiry, prepare quotations and follow up about your order. We do not sell your information.`],
      ['Third-party services', `Enquiry forms are delivered to us by email through a form service (Web3Forms), and WhatsApp messages go through WhatsApp. Images are served by ImageKit. These services process data under their own privacy policies.`],
      ['Contact', `To ask about or delete your information, email ${site.contact.email} or call ${site.contact.phoneDisplay}.`],
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    sections: [
      ['Use of this website', `This website gives general information about ${site.name} and its products. Product images, sizes and specifications are for reference and may vary.`],
      ['Quotations and orders', 'Prices, delivery dates and warranties are confirmed in writing in each quotation or order, not on this website.'],
      ['Intellectual property', `The ${site.name} name, logo and website content belong to ${site.name} and may not be reused without permission.`],
      ['Contact', `Questions about these terms can be sent to ${site.contact.email}.`],
    ],
  },
} as const

export default function Legal({ page }: { page: keyof typeof pages }) {
  const { title, sections } = pages[page]
  return (
    <>
      <Seo title={title} path={page === 'privacy' ? '/privacy-policy' : '/terms'} />
      <PageHeader title={title} crumbs={[{ label: title }]} />
      <section className="py-14">
        <div className="container-x max-w-3xl">
          <p className="rounded-lg bg-accent/10 px-4 py-3 text-sm text-ink/80">Placeholder text. This page will be updated with the final policy before launch.</p>
          {sections.map(([h, p]) => (
            <div key={h} className="mt-8">
              <h2 className="text-xl font-bold">{h}</h2>
              <p className="mt-2 leading-relaxed text-muted">{p}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
