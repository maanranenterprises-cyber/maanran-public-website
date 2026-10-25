import { fillTokens, pages } from '../lib/content'
import Seo from '../components/Seo'
import PageHeader from './PageHeader'

export default function Legal({ page }: { page: 'privacy' | 'terms' }) {
  const { title, sections } = pages.legal[page]
  return (
    <>
      <Seo title={title} path={page === 'privacy' ? '/privacy-policy' : '/terms'} />
      <PageHeader title={title} crumbs={[{ label: title }]} />
      <section className="py-14">
        <div className="container-x max-w-3xl">
          {pages.legal.note && <p className="rounded-lg bg-accent/10 px-4 py-3 text-sm text-ink/80">{pages.legal.note}</p>}
          {sections.map((s) => (
            <div key={s.heading} className="mt-8">
              <h2 className="text-xl font-bold">{s.heading}</h2>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-muted">{fillTokens(s.body)}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
