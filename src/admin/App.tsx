// Admin app: login gate, layout (sidebar + top bar with Publish), dashboard and the section screens.
import { createContext, useContext, useEffect, useState, type FormEvent } from 'react'
import { createBrowserRouter, Link, NavLink, Outlet, RouterProvider, useParams } from 'react-router-dom'
import { AlertTriangle, Inbox, BadgeCheck, BarChart3, Building2, CheckCircle2, CircleHelp, Download, ExternalLink, FileText, History, Images, LayoutDashboard, LayoutGrid, Loader2, LogOut, Menu, MessageSquareQuote, Package, Rocket, Settings, Sofa, Type, Undo2, Users, X } from 'lucide-react'
import { api } from './api'
import EditPage from './EditPage'
import ListPage from './ListPage'
import { sectionByPath, sections, singleByPath, singles } from './sections'
import SinglePage from './SinglePage'
import HistoryPage from './HistoryPage'
import HelpPage from './HelpPage'
import EnquiriesPage from './EnquiriesPage'
import { DraftsProvider, useDrafts, type LiveStatus } from './store'
import { Button, Card, ConfirmHost, confirm, ErrorNotice, Notice, TextInput, toast, ToastHost } from './ui'

const icons = { banners: Images, categories: LayoutGrid, products: Package, clients: Users, stats: BarChart3, testimonials: MessageSquareQuote, interiors: Sofa, downloads: Download, 'why-us': BadgeCheck, about: Building2, settings: Settings, 'page-text': Type } as Record<string, typeof Images>

function Login({ onLoggedIn }: { onLoggedIn: (name: string) => void }) {
  const [name, setName] = useState(() => localStorageGet('admin:name'))
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const r = await api.login(name.trim(), password)
      localStorageSet('admin:name', r.name)
      onLoggedIn(r.name)
    } catch (err) {
      setError(err)
      setBusy(false)
    }
  }
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-[#fff1f1] via-soft to-[#eef3ff] p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-line bg-white p-7 shadow-xl">
        <div className="flex items-center gap-3">
          <img src="/images/logo-256.png" alt="" className="size-11 rounded-md" />
          <div>
            <p className="font-extrabold tracking-wide">MAANRAN</p>
            <p className="text-xs font-semibold text-muted">Website admin</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4">
          <TextInput label="Your name" hint="Shown next to the changes you make." value={name} onChange={setName} placeholder="e.g. Ravi" />
          <div>
            <label htmlFor="pw" className="block text-sm font-semibold">
              Password
            </label>
            <input id="pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/15" />
          </div>
          <ErrorNotice error={error} />
          <Button type="submit" variant="primary" busy={busy} disabled={!name.trim() || !password} className="py-2.5">
            Log in
          </Button>
        </div>
      </form>
    </main>
  )
}

function localStorageGet(key: string) {
  try {
    return localStorage.getItem(key) ?? ''
  } catch {
    return ''
  }
}
function localStorageSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Private browsing: the name just is not remembered
  }
}

// What the top bar says when nothing is waiting to be published
function LiveNote({ live }: { live: LiveStatus }) {
  if (live === 'publishing')
    return (
      <span className="inline-flex items-center gap-1.5 font-semibold text-blue">
        <Loader2 className="size-4 animate-spin" /> Publishing… the website updates in about 2 minutes
      </span>
    )
  if (live === 'stalled')
    return (
      <span className="inline-flex items-center gap-1.5 font-semibold text-brand" title="The last publish has not reached the website after several minutes. Contact your developer.">
        <AlertTriangle className="size-4" /> The website hasn't updated yet
      </span>
    )
  if (live === 'live')
    return (
      <span className="inline-flex items-center gap-1.5">
        <CheckCircle2 className="size-4 text-green-600" /> Website is up to date
      </span>
    )
  return <span>All changes are published</span>
}

function PublishButton() {
  const { drafts, refresh, live } = useDrafts()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const pending = drafts?.pending ?? 0
  const publish = async () => {
    const ok = await confirm({
      title: `Publish ${pending} ${pending === 1 ? 'change' : 'changes'}?`,
      message: 'Everything saved in drafts goes live. The website updates in about 2 minutes.',
      confirmLabel: 'Publish',
    })
    if (!ok) return
    setBusy(true)
    setError(null)
    try {
      await api.publish()
      toast('Published. The website updates in about 2 minutes.')
      await refresh()
    } catch (e) {
      const details = (e as { details?: string[] }).details
      if (details?.length) {
        await confirm({
          title: 'Cannot publish yet',
          message: (
            <>
              <p>{(e as Error).message}</p>
              <ul className="mt-2 list-disc pl-5 text-brand-dark">
                {details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </>
          ),
          confirmLabel: 'OK',
        })
      } else setError(e)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="flex items-center gap-3">
      {error ? <span className="text-xs font-semibold text-brand">{(error as Error).message}</span> : null}
      <span className="hidden text-sm text-muted sm:inline" role="status">
        {pending ? `${pending} unpublished ${pending === 1 ? 'change' : 'changes'}` : <LiveNote live={live} />}
      </span>
      <Button variant="primary" onClick={publish} busy={busy} disabled={!pending}>
        <Rocket className="size-4" /> Publish
      </Button>
    </div>
  )
}

function Layout({ name, onLogout }: { name: string; onLogout: () => void }) {
  const [open, setOpen] = useState(false)
  const { feedback, enquiries } = useDrafts()
  const nav = `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition`
  const link = ({ isActive }: { isActive: boolean }) => `${nav} ${isActive ? 'bg-brand/10 text-brand' : 'text-ink/75 hover:bg-ink/5 hover:text-ink'}`
  return (
    <div className="min-h-screen">
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 border-r border-line bg-white transition-transform lg:translate-x-0 ${open ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <img src="/images/logo-256.png" alt="" className="size-9 rounded-md" />
            <span className="leading-tight">
              <span className="block text-sm font-extrabold tracking-wide">MAANRAN</span>
              <span className="block text-[11px] font-semibold text-muted">Website admin</span>
            </span>
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>
        <nav className="grid gap-1 overflow-y-auto p-3" onClick={() => setOpen(false)}>
          <NavLink to="/" end className={link}>
            <LayoutDashboard className="size-4" /> Dashboard
          </NavLink>
          <NavLink to="/enquiries" className={link}>
            <Inbox className="size-4" /> Enquiries
            {enquiries ? (
              <span className="ml-auto rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-white" title={`${enquiries} new`}>
                {enquiries} new
              </span>
            ) : null}
          </NavLink>
          <span className="my-2 h-px bg-line" />
          {sections.map((s) => {
            const Icon = icons[s.path] ?? FileText
            return (
              <NavLink key={s.path} to={`/${s.path}`} className={link}>
                <Icon className="size-4" /> {s.plural}
                {s.path === 'testimonials' && feedback > 0 && (
                  <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-white" title={`${feedback} awaiting review`}>
                    {feedback} new
                  </span>
                )}
              </NavLink>
            )
          })}
          <p className="mt-4 px-3 text-[11px] font-bold uppercase tracking-wider text-muted">Pages and settings</p>
          {singles.map((s) => {
            const Icon = icons[s.path] ?? FileText
            return (
              <NavLink key={s.path} to={`/${s.path}`} className={link}>
                <Icon className="size-4" /> {s.label}
              </NavLink>
            )
          })}
          <span className="my-3 h-px bg-line" />
          <NavLink to="/history" className={link}>
            <History className="size-4" /> History
          </NavLink>
          <NavLink to="/help" className={link}>
            <CircleHelp className="size-4" /> Help
          </NavLink>
        </nav>
      </aside>
      {open && <div className="fixed inset-0 z-20 bg-ink/40 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-3 border-b border-line bg-white/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="size-5" />
            </button>
            <a href="/" target="_blank" rel="noopener" className="hidden items-center gap-1 text-sm font-semibold text-muted hover:text-ink sm:inline-flex">
              View website <ExternalLink className="size-3.5" />
            </a>
          </div>
          <div className="flex items-center gap-4">
            <PublishButton />
            <span className="hidden h-6 w-px bg-line md:block" />
            <span className="hidden text-sm font-semibold md:inline">{name}</span>
            <Button variant="ghost" onClick={onLogout} aria-label="Log out" title="Log out" className="!px-2">
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function Dashboard({ name }: { name: string }) {
  const { drafts, refresh, live, feedback, enquiries } = useDrafts()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const discard = async () => {
    const ok = await confirm({
      title: 'Discard all unpublished changes?',
      message: 'Every change saved since the last publish is thrown away. The live website is not affected.',
      confirmLabel: 'Discard changes',
      danger: true,
    })
    if (!ok) return
    setBusy(true)
    try {
      await api.discard()
      toast('Unpublished changes discarded')
      await refresh()
    } catch (e) {
      setError(e)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="grid grid-cols-1 gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Hello, {name}</h1>
        <p className="mt-1 text-sm text-muted">
          Changes you save go to drafts first. Press Publish when you are ready for them to go live.{' '}
          <Link to="/help" className="font-semibold text-blue hover:underline">
            How it works
          </Link>
        </p>
      </div>
      <ErrorNotice error={error} onClose={() => setError(null)} />
      {enquiries ? (
        <Link to="/enquiries" className="flex items-center gap-4 rounded-2xl border border-brand/30 bg-brand/[0.04] p-4 transition hover:border-brand/50 sm:p-5">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand text-white">
            <Inbox className="size-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-extrabold">
              {enquiries} new {enquiries === 1 ? 'enquiry' : 'enquiries'}
            </span>
            <span className="block text-sm text-muted">Customers waiting to hear from you. Call, WhatsApp or email them from the inbox.</span>
          </span>
          <span className="hidden font-semibold text-brand sm:inline">Open inbox →</span>
        </Link>
      ) : null}
      {feedback > 0 && (
        <Notice kind="info">
          <span className="font-semibold">
            {feedback} customer {feedback === 1 ? 'review is' : 'reviews are'} waiting for approval.
          </span>{' '}
          <Link to="/testimonials?review=pending" className="font-semibold underline">
            Review now
          </Link>
        </Notice>
      )}
      <Card
        title="Unpublished changes"
        actions={
          drafts && drafts.pending > 0 ? (
            <div className="flex gap-2">
              <Button variant="danger" onClick={discard} busy={busy}>
                <Undo2 className="size-4" /> Discard
              </Button>
            </div>
          ) : null
        }
      >
        {!drafts ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : drafts.pending === 0 ? (
          live === 'publishing' ? (
            <Notice kind="info">Everything is published. The website is updating now and will show the changes in about 2 minutes.</Notice>
          ) : live === 'stalled' ? (
            <Notice kind="error">The last publish has not reached the website after several minutes. Contact your developer; your changes are saved.</Notice>
          ) : (
            <Notice kind="success">Everything is published. The website shows the latest content.</Notice>
          )
        ) : (
          <>
            <ul className="divide-y divide-line">
              {drafts.changes.map((c, i) => (
                <li key={i} className="flex items-start justify-between gap-4 py-2.5 text-sm">
                  <span>{c.message.replace(/ \(by [^)]*\)$/, '')}</span>
                  <span className="shrink-0 text-xs text-muted">
                    {c.by} · {new Date(c.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
      <div className="grid gap-3 sm:grid-cols-2">
        {[...sections, ...singles.map((s) => ({ ...s, plural: s.label }))].map((s) => {
          const Icon = icons[s.path] ?? FileText
          return (
            <Link key={s.path} to={`/${s.path}`} className="flex items-start gap-3 rounded-2xl border border-line bg-white p-4 transition hover:border-brand/30 hover:shadow-md">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                <Icon className="size-5" />
              </span>
              <span>
                <span className="block font-bold">{s.plural}</span>
                <span className="block text-xs text-muted">{s.description}</span>
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function SectionRoute({ edit }: { edit?: boolean }) {
  const { section: path = '', key } = useParams()
  const section = sectionByPath(path)
  const single = singleByPath(path)
  if (single && !edit) return <SinglePage key={path} section={single} />
  if (!section) return <ErrorNotice error={{ message: 'This page does not exist.' }} />
  return edit ? <EditPage key={`${path}-${key}`} section={section} /> : <ListPage key={path} section={section} />
}

export default function App() {
  const [user, setUser] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    api
      .session()
      .then((s) => setUser(s.loggedIn ? (s.name ?? '') : null))
      .catch(() => setUser(null))
    const onLoggedOut = () => setUser(null)
    window.addEventListener('admin:logged-out', onLoggedOut)
    return () => window.removeEventListener('admin:logged-out', onLoggedOut)
  }, [])

  const [router] = useState(() =>
    createBrowserRouter(
      [
        {
          element: <LayoutRoute />,
          children: [
            { path: '/', element: <DashboardRoute /> },
            { path: '/history', element: <HistoryPage /> },
            { path: '/enquiries', element: <EnquiriesPage /> },
            { path: '/help', element: <HelpPage /> },
            { path: '/:section', element: <SectionRoute /> },
            { path: '/:section/:key', element: <SectionRoute edit /> },
          ],
        },
      ],
      { basename: '/admin' },
    ),
  )

  if (user === undefined)
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="size-6 animate-spin text-muted" />
      </div>
    )
  if (user === null) return <Login onLoggedIn={setUser} />

  const logout = async () => {
    await api.logout().catch(() => {})
    setUser(null)
  }

  return (
    <UserContext.Provider value={{ name: user, logout }}>
      <DraftsProvider>
        <RouterProvider router={router} />
        <ConfirmHost />
        <ToastHost />
      </DraftsProvider>
    </UserContext.Provider>
  )
}

const UserContext = createContext<{ name: string; logout: () => void }>({ name: '', logout: () => {} })
const LayoutRoute = () => {
  const { name, logout } = useContext(UserContext)
  return <Layout name={name} onLogout={logout} />
}
const DashboardRoute = () => <Dashboard name={useContext(UserContext).name} />
