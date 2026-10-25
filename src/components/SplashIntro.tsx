import { useEffect, useRef, useState } from 'react'
import { site } from '../lib/content'

const FADE_IN_MS = 800
const HOLD_MS = 700
const MOVE_MS = 1200

// Launch intro: the logo fades in alone in the centre, glides into its place in the navbar while the page fades in behind it.
export default function SplashIntro() {
  const [done, setDone] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [loaded, setLoaded] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (done) return
    const root = document.documentElement
    root.dataset.intro = ''
    if (logoRef.current?.complete) setLoaded(true)
    return () => {
      delete root.dataset.intro
    }
  }, [done])

  // Starts only once the logo image has loaded, so its fade-in is actually visible
  useEffect(() => {
    if (done || !loaded) return
    const logo = logoRef.current
    const overlay = overlayRef.current
    const target = document.querySelector('header [data-brand-logo]')
    if (!logo || !overlay || !target) return setDone(true)

    let cancelled = false
    const anims: Animation[] = []
    const run = (a: Animation) => (anims.push(a), a.finished)

    ;(async () => {
      await run(logo.animate([{ opacity: 0, transform: 'scale(0.85)' }, { opacity: 1, transform: 'none' }], { duration: FADE_IN_MS, easing: 'ease-out', fill: 'forwards' }))
      await new Promise((r) => window.setTimeout(r, HOLD_MS))
      if (cancelled) return

      const from = logo.getBoundingClientRect()
      const to = target.getBoundingClientRect()
      const dx = to.left + to.width / 2 - (from.left + from.width / 2)
      const dy = to.top + to.height / 2 - (from.top + from.height / 2)
      const scale = to.width / from.width
      // The page fades in while the logo moves, so both finish together
      await Promise.all([
        run(logo.animate([{ transform: 'none' }, { transform: `translate(${dx}px, ${dy}px) scale(${scale})` }], { duration: MOVE_MS, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' })),
        run(overlay.animate([{ backgroundColor: 'rgb(255 255 255 / 1)' }, { backgroundColor: 'rgb(255 255 255 / 0)' }], { duration: MOVE_MS, easing: 'ease-in-out', fill: 'forwards' })),
      ])
      if (!cancelled) setDone(true)
    })().catch(() => {})

    return () => {
      cancelled = true
      anims.forEach((a) => a.cancel())
    }
  }, [done, loaded])

  if (done) return null

  return (
    <div ref={overlayRef} aria-hidden="true" className="fixed inset-0 z-[100] grid place-items-center bg-white">
      <img
        ref={logoRef}
        src={site.logo}
        alt=""
        onLoad={() => setLoaded(true)}
        onError={() => setDone(true)}
        className="size-32 rounded-2xl opacity-0 sm:size-40"
        width={160}
        height={160}
      />
    </div>
  )
}
