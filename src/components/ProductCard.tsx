import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { categoryName, type Product } from '../lib/content'
import Media from './Media'

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to={`/products/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-1 hover:border-brand/30 hover:shadow-xl hover:shadow-black/5"
    >
      <Media fit={product.category === 'office-chairs' ? 'contain' : 'cover'} src={product.images[0] ?? ''} alt={product.name} width={480} className="aspect-[4/3] w-full transition duration-500 group-hover:scale-[1.03]" label="Product photo" />
      <div className="flex flex-1 flex-col p-4">
        <p className="flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wider text-blue">
          <span className="truncate">{categoryName(product.category)}</span>
          <span className="shrink-0 rounded bg-soft px-1.5 py-0.5 font-mono text-[10px] tracking-normal text-ink/60">{product.code}</span>
        </p>
        <h3 className="mt-1 font-bold leading-snug text-ink">{product.name}</h3>
        <p className="mt-0.5 text-xs text-muted">Brand: {product.brand}</p>
        <p className="mt-2 line-clamp-2 text-sm text-muted">{product.shortDescription}</p>
        <span className="mt-auto flex items-center gap-1 pt-3 text-sm font-semibold text-brand">
          View Product <ArrowUpRight className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  )
}
