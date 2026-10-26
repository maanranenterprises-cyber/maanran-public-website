// Loading and saving sections, and the shared "unpublished changes" state shown in the top bar.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { CollectionName } from '../lib/schema'
import { api, type Drafts } from './api'

const SAVED = 'admin:saved'

// Loads one content file from drafts; save() writes the whole file back and keeps the version (sha) current
export function useCollection<T>(name: CollectionName) {
  const [state, setState] = useState<{ data: T; sha: string } | null>(null)
  const [error, setError] = useState<unknown>(null)

  const reload = useCallback(async () => {
    setError(null)
    try {
      setState(await api.load<T>(name))
    } catch (e) {
      setError(e)
    }
  }, [name])

  useEffect(() => {
    reload()
  }, [reload])

  const save = useCallback(
    async (data: T, summary: string) => {
      if (!state) return
      const res = await api.save(name, data, state.sha, summary)
      setState({ data: res.data ?? data, sha: res.sha })
      window.dispatchEvent(new Event(SAVED))
      return res
    },
    [name, state],
  )

  return { data: state?.data, error, reload, save }
}

// Loads several sections at once (e.g. categories for the product form)
export function useContextData(names: CollectionName[] = []) {
  const [ctx, setCtx] = useState<Partial<Record<CollectionName, Record<string, unknown>[]>>>({})
  const key = names.join(',')
  useEffect(() => {
    if (!key) return
    Promise.all(key.split(',').map(async (n) => [n, (await api.load<Record<string, unknown>[]>(n as CollectionName)).data] as const))
      .then((pairs) => setCtx(Object.fromEntries(pairs)))
      .catch(() => {})
  }, [key])
  return ctx
}

// Whether the website shows the newest published version yet:
// 'publishing' while Vercel builds it, 'stalled' if that takes far longer than usual (the build probably failed)
export type LiveStatus = 'unknown' | 'live' | 'publishing' | 'stalled'
const CHECK_EVERY_MS = 10_000
const STALLED_AFTER_MS = 8 * 60_000

// `feedback`: customer feedback from the website form still awaiting review (shown as a badge and on the dashboard)
// `enquiries`: new customer enquiries (null until known, e.g. before the enquiries database is connected)
type DraftsState = { drafts: Drafts | null; refresh: () => Promise<void>; live: LiveStatus; feedback: number; enquiries: number | null; refreshEnquiries: () => Promise<void> }
const DraftsContext = createContext<DraftsState>({ drafts: null, refresh: async () => {}, live: 'unknown', feedback: 0, enquiries: null, refreshEnquiries: async () => {} })
const ENQUIRY_CHECK_MS = 60_000

export function DraftsProvider({ children }: { children: ReactNode }) {
  const [drafts, setDrafts] = useState<Drafts | null>(null)
  const [feedback, setFeedback] = useState(0)
  const refresh = useCallback(async () => {
    try {
      const [d, t] = await Promise.all([api.drafts(), api.load<{ pending?: boolean }[]>('testimonials')])
      setDrafts(d)
      setFeedback(t.data.filter((x) => x.pending).length)
    } catch {
      // The top bar just shows no count if this fails; screens show their own errors
    }
  }, [])
  useEffect(() => {
    refresh()
    window.addEventListener(SAVED, refresh)
    return () => window.removeEventListener(SAVED, refresh)
  }, [refresh])

  const [live, setLive] = useState<LiveStatus>('unknown')
  const target = drafts?.live
  useEffect(() => {
    if (!target) return
    let stop = false
    let timer: number
    const check = async () => {
      const version = await api.siteVersion()
      if (stop) return
      if (!version || version === 'local') return setLive('unknown')
      if (version === target.sha) return setLive('live')
      setLive(Date.now() - new Date(target.at).getTime() > STALLED_AFTER_MS ? 'stalled' : 'publishing')
      timer = window.setTimeout(check, CHECK_EVERY_MS)
    }
    check()
    return () => {
      stop = true
      window.clearTimeout(timer)
    }
  }, [target])

  // New enquiries: checked every minute while the admin is open, and straight away when its tab is shown again
  const [enquiries, setEnquiries] = useState<number | null>(null)
  const refreshEnquiries = useCallback(async () => {
    try {
      setEnquiries((await api.newEnquiries()).new)
    } catch {
      setEnquiries(null)
    }
  }, [])
  useEffect(() => {
    refreshEnquiries()
    const timer = window.setInterval(refreshEnquiries, ENQUIRY_CHECK_MS)
    const onVisible = () => document.visibilityState === 'visible' && refreshEnquiries()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refreshEnquiries])
  // The browser tab shows the count, e.g. "(3) Admin | MAANRAN ENTERPRISES"
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\) /, '')
    document.title = enquiries ? `(${enquiries}) ${base}` : base
  }, [enquiries])

  return <DraftsContext.Provider value={{ drafts, refresh, live, feedback, enquiries, refreshEnquiries }}>{children}</DraftsContext.Provider>
}

export const useDrafts = () => useContext(DraftsContext)
