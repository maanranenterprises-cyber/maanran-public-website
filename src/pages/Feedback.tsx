import { pages } from '../lib/content'
import Seo from '../components/Seo'
import FeedbackForm from '../components/FeedbackForm'
import PageHeader from './PageHeader'

export default function Feedback() {
  return (
    <>
      <Seo title={pages.feedback.title} description={pages.feedback.text} path="/feedback" noindex />
      <PageHeader title={pages.feedback.title} text={pages.feedback.text} crumbs={[{ label: 'Feedback' }]} />
      <section className="py-12 lg:py-16">
        <div className="container-x max-w-3xl">
          <div className="rounded-3xl border border-line p-6 shadow-sm sm:p-8">
            <FeedbackForm />
          </div>
        </div>
      </section>
    </>
  )
}
