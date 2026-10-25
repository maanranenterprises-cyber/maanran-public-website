import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { banners, site } from "../lib/content";
import { imageUrl } from "../lib/media";
import CtaLink from "../components/CtaLink";

// Fallback backdrops used while banner photos are not uploaded yet
const placeholderBackdrops = [
  "from-[#1b0b0c] via-[#4a0a0e] to-[#12151c]",
  "from-[#0b1430] via-[#0d2a6b] to-[#12151c]",
  "from-[#24140a] via-[#6b3608] to-[#12151c]",
  "from-[#12151c] via-[#3a0d11] to-[#0b1430]",
];

export default function Hero() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = banners.length;
  const go = useCallback((i: number) => setIndex((i + count) % count), [count]);

  useEffect(() => {
    if (paused || count < 2) return;
    const t = window.setInterval(() => setIndex((i) => (i + 1) % count), 5000);
    return () => window.clearInterval(t);
  }, [paused, count]);

  if (!count) return null;

  return (
    <section
      id="hero"
      aria-roledescription="carousel"
      aria-label="Highlights"
      className="relative h-[calc(100svh-72px)] min-h-[520px] max-h-[820px] overflow-hidden bg-ink text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {banners.map((b, i) => {
        const active = i === index;
        const desktop = imageUrl(b.imageDesktop, 1920);
        const mobile = imageUrl(b.imageMobile || b.imageDesktop, 800);
        return (
          <div
            key={b.id}
            aria-hidden={!active}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              active ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            {desktop ? (
              <picture>
                <source media="(max-width: 767px)" srcSet={mobile} />
                <img
                  src={desktop}
                  alt=""
                  loading={i === 0 ? "eager" : "lazy"}
                  className={`absolute inset-0 size-full object-cover transition-transform duration-[7000ms] ease-out ${
                    active ? "scale-105" : "scale-100"
                  }`}
                />
              </picture>
            ) : (
              <div
                className={`absolute inset-0 bg-gradient-to-br ${
                  placeholderBackdrops[i % placeholderBackdrops.length]
                }`}
              >
                <div
                  className={`absolute -right-24 top-1/4 size-[36rem] rounded-full bg-brand/25 blur-3xl transition-transform duration-[7000ms] ${
                    active ? "translate-x-0" : "translate-x-16"
                  }`}
                />
                <div className="absolute -bottom-40 left-1/4 size-[28rem] rounded-full bg-accent/20 blur-3xl" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:64px_64px]" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/10" />
            <div className="container-x relative flex h-full flex-col justify-center pb-16">
              <div
                className={`max-w-2xl transition-all delay-200 duration-700 ${
                  active
                    ? "translate-y-0 opacity-100"
                    : "translate-y-6 opacity-0"
                }`}
              >
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">
                  {site.name}
                </p>
                {i === 0 ? (
                  <h1 className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                    {b.heading}
                  </h1>
                ) : (
                  <p className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                    {b.heading}
                  </p>
                )}
                <p className="mt-5 max-w-xl text-base text-white/80 sm:text-lg">
                  {b.subtitle}
                </p>
                <p className="mt-4 flex items-center gap-1.5 text-sm font-medium text-white/70">
                  <MapPin className="size-4 text-accent" /> {site.location}
                </p>
                {b.ctas.length > 0 && (
                  <div className="mt-8 flex flex-wrap gap-3">
                    {b.ctas.map((c, ci) => (
                      <CtaLink
                        key={c.label}
                        href={c.href}
                        className={
                          ci === 0
                            ? "btn-primary px-6 py-3"
                            : "btn-light px-6 py-3"
                        }
                      >
                        {c.label}
                      </CtaLink>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {count > 1 && (
        <div className="container-x absolute inset-x-0 bottom-8 flex items-center justify-between pr-24 xl:pr-8">
          <div className="flex gap-2">
            {banners.map((b, i) => (
              <button
                key={b.id}
                onClick={() => go(i)}
                aria-label={`Show slide ${i + 1}`}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all ${
                  i === index
                    ? "w-10 bg-white"
                    : "w-4 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => go(index - 1)}
              className="grid size-11 place-items-center rounded-full border border-white/30 hover:bg-white hover:text-ink"
              aria-label="Previous slide"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={() => go(index + 1)}
              className="grid size-11 place-items-center rounded-full border border-white/30 hover:bg-white hover:text-ink"
              aria-label="Next slide"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
