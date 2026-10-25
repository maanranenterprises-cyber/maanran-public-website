import { whatsappLink } from '../lib/content'
import { WhatsAppIcon } from './Icons'

export default function WhatsAppButton() {
  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noopener"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-30 grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition hover:scale-105"
    >
      <WhatsAppIcon className="size-7" />
    </a>
  )
}
