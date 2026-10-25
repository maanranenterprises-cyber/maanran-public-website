import { useEffect, useRef, useState } from 'react'
import { Briefcase, Heart, Smile, Users, type LucideIcon } from 'lucide-react'
import { stats, type Stat } from '../lib/content'

const icons: Record<string, LucideIcon> = { smile: Smile, briefcase: Briefcase, users: Users, heart: Heart }

function Counter({ stat, run }: { stat: Stat; run: boolean }) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!run) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return setValue(stat.value)
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 1600)
      setValue(Math.round(stat.value * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [run, stat.value])
  return (
    <span>
      {value}
      {stat.suffix}
    </span>
  )
}

export default function Stats() {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  if (!stats.length) return null

  return (
    <section id="stats" ref={ref} aria-label="Company statistics" className="relative overflow-hidden bg-ink py-16 text-white">
      <div className="absolute -left-20 top-0 size-72 rounded-full bg-brand/30 blur-3xl" />
      <div className="absolute -right-10 bottom-0 size-72 rounded-full bg-blue/30 blur-3xl" />
      <ul className="container-x relative grid grid-cols-2 gap-6 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = icons[s.icon] ?? Smile
          return (
            <li key={s.id} className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-center backdrop-blur">
              <span className="grid size-12 place-items-center rounded-full bg-accent/20 text-accent">
                <Icon className="size-6" />
              </span>
              <p className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                <Counter stat={s} run={visible} />
              </p>
              <p className="text-sm font-medium text-white/70">{s.label}</p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
