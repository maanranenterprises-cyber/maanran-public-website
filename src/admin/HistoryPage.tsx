// Published changes, newest first. The most recent publish can be undone (restored, then published again).
import { useCallback, useEffect, useState } from 'react'
import { History, Undo2 } from 'lucide-react'
import { api, type Publish } from './api'
import { useDrafts } from './store'
import { Button, Card, confirm, ErrorNotice, Notice, toast } from './ui'

const when = (at: string) => new Date(at).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })

export default function HistoryPage() {
  const { drafts, refresh } = useDrafts()
  const [publishes, setPublishes] = useState<Publish[] | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      setPublishes((await api.history()).publishes)
    } catch (e) {
      setError(e)
    }
  }, [])
  useEffect(() => {
    load()
  }, [load])

  const pending = drafts?.pending ?? 0

  const undo = async (p: Publish) => {
    const ok = await confirm({
      title: 'Undo this publish?',
      message: (
        <>
          <p>The website goes back to how it was before {when(p.at)}. These changes are reversed:</p>
          <ul className="mt-2 list-disc pl-5">
            {p.edits.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
          <p className="mt-2">The website updates in about 2 minutes.</p>
        </>
      ),
      confirmLabel: 'Undo publish',
      danger: true,
    })
    if (!ok) return
    setBusy(true)
    setError(null)
    try {
      await api.undo(p.sha)
      await api.publish()
      toast('Undone. The website updates in about 2 minutes.')
      await Promise.all([refresh(), load()])
    } catch (e) {
      setError(e)
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">History</h1>
        <p className="mt-1 text-sm text-muted">Every publish, newest first. The most recent one can be undone.</p>
      </div>
      <ErrorNotice error={error} onClose={() => setError(null)} />
      {pending > 0 && <Notice kind="info">You have {pending} unpublished {pending === 1 ? 'change' : 'changes'}. Publish or discard them before undoing a publish.</Notice>}
      {!publishes ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : publishes.length === 0 ? (
        <Card>
          <p className="flex items-center gap-2 text-sm text-muted">
            <History className="size-4" /> Nothing has been published from the admin yet.
          </p>
        </Card>
      ) : (
        <ol className="grid grid-cols-1 gap-3">
          {publishes.map((p, i) => (
            <li key={p.sha} className="rounded-2xl border border-line bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold">
                    {when(p.at)}
                    {i === 0 && <span className="ml-2 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-bold text-green-700">Latest</span>}
                  </p>
                  <p className="text-xs text-muted">Published by {p.by}</p>
                </div>
                {i === 0 && (
                  <Button variant="danger" onClick={() => undo(p)} busy={busy} disabled={pending > 0}>
                    <Undo2 className="size-4" /> Undo this publish
                  </Button>
                )}
              </div>
              <ul className="mt-3 grid gap-1 border-t border-line pt-3 text-sm">
                {p.edits.map((e, j) => (
                  <li key={j} className="text-ink/85">
                    • {e}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
