import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import EnquiryModal from './EnquiryModal'

// `interest` pre-selects "Interested in" (e.g. the product's category) when we already know it
type Ctx = { openEnquiry: (product?: string, interest?: string) => void }
const EnquiryCtx = createContext<Ctx>({ openEnquiry: () => {} })

export function EnquiryProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [product, setProduct] = useState<string | undefined>()
  const [interest, setInterest] = useState<string | undefined>()

  const openEnquiry = useCallback((p?: string, i?: string) => {
    setProduct(p)
    setInterest(i)
    setOpen(true)
  }, [])

  return (
    <EnquiryCtx.Provider value={{ openEnquiry }}>
      {children}
      <EnquiryModal open={open} product={product} interest={interest} onClose={() => setOpen(false)} />
    </EnquiryCtx.Provider>
  )
}

export const useEnquiry = () => useContext(EnquiryCtx)
