import { Download, FileText } from 'lucide-react'
import { documents, pages, showDownloads } from '../lib/content'
import Media from '../components/Media'
import SectionHeading from '../components/SectionHeading'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

// Counts downloads in Google Analytics once a GA tag is added to index.html
const trackDownload = (title: string) => window.gtag?.('event', 'file_download', { file_name: title })

export default function Downloads() {
  if (!showDownloads) return null
  return (
    <section id="downloads" className="py-20 lg:py-24">
      <div className="container-x">
        <SectionHeading center eyebrow={pages.home.downloads.eyebrow} title={pages.home.downloads.title} text={pages.home.downloads.text} />
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {documents.map((d) => (
            <li key={d.id} className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:shadow-xl hover:shadow-black/5">
              <div className="relative">
                {d.cover ? (
                  <Media src={d.cover} alt={`${d.title} cover`} width={480} className="aspect-[3/4] w-full" />
                ) : (
                  <div className="flex aspect-[3/4] w-full flex-col justify-between bg-gradient-to-br from-ink via-[#2a0d10] to-brand-dark p-6 text-white">
                    <img src="/images/logo-256.png" alt="" className="size-12 rounded" />
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">{d.category}</p>
                      <p className="mt-2 text-xl font-extrabold leading-tight">{d.title}</p>
                    </div>
                  </div>
                )}
                {d.featured && <span className="absolute right-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Featured</span>}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue">{d.category}</p>
                <h3 className="mt-1 font-bold">{d.title}</h3>
                <p className="mt-1.5 flex-1 text-sm text-muted">{d.description}</p>
                <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-muted">
                  <FileText className="size-3.5" /> {d.fileType}
                  {d.sizeLabel && ` · ${d.sizeLabel}`}
                </p>
                <a href={d.file} download target={d.file.startsWith('http') ? '_blank' : undefined} rel="noopener" onClick={() => trackDownload(d.title)} className="btn-primary mt-4">
                  <Download className="size-4" /> Download
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
