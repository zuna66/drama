'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Hero({ items = [] }) {
  const list = items.filter((x) => x?.cover).slice(0, 5);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (list.length < 2) return;
    const id = setInterval(() => setIdx((v) => (v + 1) % list.length), 7000);
    return () => clearInterval(id);
  }, [list.length]);

  if (!list.length) return null;
  const f = list[idx];

  return (
    <section className="relative">
      <div className="relative h-[78vh] min-h-[560px] max-h-[820px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={f.id}
          src={f.cover}
          alt={f.title}
          className="absolute inset-0 w-full h-full object-cover scale-105 animate-fade-up"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-transparent" />

        <div className="relative h-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 flex items-end">
          <div className="grid sm:grid-cols-[1fr,auto] gap-8 sm:gap-12 items-end pb-10 sm:pb-16 w-full">
            <div className="max-w-2xl animate-fade-up" key={`txt-${f.id}`}>
              <p className="eyebrow text-[11px] font-semibold tracking-widest uppercase text-rose-400">
                Sedang Populer
              </p>
              <h1 className="font-display font-bold text-4xl sm:text-6xl lg:text-7xl mt-3 tracking-tightest leading-[0.95] text-balance">
                {f.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-200 tabular">
                {f.rating && (
                  <span className="inline-flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-400" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span className="font-semibold text-ink-50">{Number(f.rating).toFixed(1)}</span>
                  </span>
                )}
                {f.episodes && <span className="text-ink-300">{f.episodes} episode</span>}
                {f.views && <span className="text-ink-300">· {f.views} views</span>}
                {f.genres?.[0] && <span className="text-ink-300">· {f.genres.slice(0, 2).join(', ')}</span>}
              </div>

              {f.description && (
                <p className="mt-5 text-ink-200 leading-relaxed line-clamp-3 max-w-xl text-[15px]">
                  {f.description}
                </p>
              )}

              <div className="mt-7 flex items-center gap-3">
                <Link
                  href={`/watch/${f.src}/${f.id}/1`}
                  className="inline-flex items-center gap-2.5 pl-5 pr-6 h-12 rounded-full bg-rose-500 hover:bg-rose-400 text-white font-semibold text-sm shadow-glow transition"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7L8 5z" />
                  </svg>
                  Mulai nonton
                </Link>
                <Link
                  href={`/drama/${f.src}/${f.id}`}
                  className="inline-flex items-center gap-2 px-5 h-12 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur text-sm font-semibold border border-white/10 transition"
                >
                  Info detail
                </Link>
              </div>
            </div>

            <div className="hidden md:block animate-fade-up">
              <div className="relative w-56 lg:w-64 aspect-[2/3] rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.cover} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>

        {list.length > 1 && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 sm:bottom-8 sm:left-auto sm:right-10 sm:translate-x-0 flex items-center gap-1.5 z-10">
            {list.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`h-1 rounded-full transition-all ${
                  i === idx ? 'w-8 bg-rose-500' : 'w-4 bg-white/25 hover:bg-white/40'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
