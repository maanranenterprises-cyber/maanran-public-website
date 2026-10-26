import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MessageSquareText } from 'lucide-react'
import { categories, categoryName, products, site, whatsappLink } from '../lib/content'
import Seo from '../components/Seo'
import Media from '../components/Media'
import ProductCard from '../components/ProductCard'
import { useEnquiry } from '../components/EnquiryContext'
import { WhatsAppIcon } from '../components/Icons'
import PageHeader from './PageHeader'
import NotFound from './NotFound'

export default function ProductDetail() {
  const { slug } = useParams()
  const product = products.find((p) => p.slug === slug)
  const { openEnquiry } = useEnquiry()
  const [imageIndex, setImageIndex] = useState(0)

  if (!product) return <NotFound />

  const images = product.images.length ? product.images : ['', '', '']
  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4)

  return (
    <>
      <Seo
        title={`${product.name} | ${categoryName(product.category)}`}
        description={`${product.shortDescription} Product code ${product.code}. Made to order by ${site.name}, ${site.address.locality}.`}
        path={`/products/${product.slug}`}
        image={product.images[0]}
        crumbs={[
          { name: 'Products', path: '/products' },
          { name: categoryName(product.category), path: `/products?category=${product.category}` },
          { name: product.name, path: `/products/${product.slug}` },
        ]}
      />
      <PageHeader
        title={product.name}
        crumbs={[
          { label: 'Products', to: '/products' },
          { label: categoryName(product.category), to: `/products?category=${product.category}` },
          { label: product.name },
        ]}
        image={categories.find((c) => c.slug === product.category)?.image}
      />
      <section className="py-12 lg:py-16">
        <div className="container-x grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <Media key={imageIndex} src={images[imageIndex]} alt={product.name} width={1000} eager fit="contain" className="aspect-[4/3] w-full rounded-2xl border border-line" label="Product photo" />
            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setImageIndex(i)} aria-label={`Show image ${i + 1}`} className={`overflow-hidden rounded-xl border-2 ${i === imageIndex ? 'border-brand' : 'border-transparent'}`}>
                    <Media src={img} alt="" width={200} fit="contain" className="aspect-square w-full" label={`${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <Link to={`/products?category=${product.category}`} className="text-xs font-bold uppercase tracking-wider text-blue hover:underline">
              {categoryName(product.category)}
            </Link>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight">{product.name}</h2>
            <p className="mt-1 text-sm text-muted">
              Product code: <span className="font-semibold text-ink">{product.code}</span>
              <span className="mx-2 text-line">|</span>
              Brand: <span className="font-semibold text-ink">{product.brand}</span>
            </p>
            <p className="mt-5 leading-relaxed text-ink/85">{product.description}</p>
            {Object.keys(product.specs).length > 0 && (
              <dl className="mt-8 divide-y divide-line overflow-hidden rounded-2xl border border-line">
                {Object.entries(product.specs).map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[140px_1fr] gap-4 px-5 py-3 text-sm odd:bg-soft">
                    <dt className="font-semibold">{k}</dt>
                    <dd className="text-muted">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => openEnquiry(`${product.name} (${product.code})`, categoryName(product.category))} className="btn-primary flex-1 py-3">
                <MessageSquareText className="size-4" /> Enquire About This Product
              </button>
              <a href={whatsappLink(`Hello ${site.name}, I am interested in ${product.name} (product code ${product.code}).`)} target="_blank" rel="noopener" className="btn flex-1 bg-[#25D366] py-3 text-white hover:bg-[#1ebe5b]">
                <WhatsAppIcon className="size-4" /> WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </section>
      {related.length > 0 && (
        <section className="bg-soft py-16">
          <div className="container-x">
            <h2 className="text-2xl font-extrabold tracking-tight">More in {categoryName(product.category)}</h2>
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <li key={p.id}>
                  <ProductCard product={p} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  )
}
