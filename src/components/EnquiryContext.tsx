import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import EnquiryModal from './EnquiryModal'

type Ctx = { openEnquiry: (product?: string) => void }
const EnquiryCtx = createContext<Ctx>({ openEnquiry: () => {} })

export function EnquiryProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [product, setProduct] = useState<string | undefined>()

  const openEnquiry = useCallback((p?: string) => {
    setProduct(p)
    setOpen(true)
  }, [])

  return (
    <EnquiryCtx.Provider value={{ openEnquiry }}>
      {children}
      <EnquiryModal open={open} product={product} onClose={() => setOpen(false)} />
    </EnquiryCtx.Provider>
  )
}

export const useEnquiry = () => useContext(EnquiryCtx)
