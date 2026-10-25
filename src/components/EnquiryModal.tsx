import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import EnquiryForm from './EnquiryForm'

export default function EnquiryModal({ open, product, onClose }: { open: boolean; product?: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[min(640px,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] rounded-2xl p-0 shadow-2xl backdrop:bg-ink/60 backdrop:backdrop-blur-sm"
      aria-labelledby="enquiry-title"
    >
      <div className="relative p-6 sm:p-8">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-2 text-muted hover:bg-soft hover:text-ink" aria-label="Close enquiry form">
          <X className="size-5" />
        </button>
        <p className="eyebrow">Get Enquiry</p>
        <h2 id="enquiry-title" className="mt-1 text-2xl font-extrabold tracking-tight">Tell us what you need</h2>
        <p className="mt-1 text-sm text-muted">We usually reply within one working day.</p>
        <div className="mt-6">{open && <EnquiryForm product={product} onDone={onClose} />}</div>
      </div>
    </dialog>
  )
}
