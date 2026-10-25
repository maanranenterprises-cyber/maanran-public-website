import { Link } from 'react-router-dom'
import Seo from '../components/Seo'

export default function NotFound() {
  return (
    <section className="container-x flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <Seo title="Page not found" noindex />
      <p className="text-7xl font-extrabold text-brand">404</p>
      <h1 className="mt-4 text-2xl font-extrabold">This page could not be found</h1>
      <p className="mt-2 text-muted">The link may be old or mistyped.</p>
      <div className="mt-6 flex gap-3">
        <Link to="/" className="btn-primary">Go Home</Link>
        <Link to="/products" className="btn-outline">View Products</Link>
      </div>
    </section>
  )
}
