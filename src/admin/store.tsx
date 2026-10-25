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
      const { sha } = await api.save(name, data, state.sha, summary)
      setState({ data, sha })
      window.dispatchEvent(new Event(SAVED))
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

type DraftsState = { drafts: Drafts | null; refresh: () => Promise<void> }
const DraftsContext = createContext<DraftsState>({ drafts: null, refresh: async () => {} })

export function DraftsProvider({ children }: { children: ReactNode }) {
  const [drafts, setDrafts] = useState<Drafts | null>(null)
  const refresh = useCallback(async () => {
    try {
      setDrafts(await api.drafts())
    } catch {
      // The top bar just shows no count if this fails; screens show their own errors
    }
  }, [])
  useEffect(() => {
    refresh()
    window.addEventListener(SAVED, refresh)
    return () => window.removeEventListener(SAVED, refresh)
  }, [refresh])
  return <DraftsContext.Provider value={{ drafts, refresh }}>{children}</DraftsContext.Provider>
}

export const useDrafts = () => useContext(DraftsContext)
