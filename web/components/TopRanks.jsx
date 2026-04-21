'use client';
import { useRef } from 'react';
import Link from 'next/link';
import { normalizeDrama } from '@/lib/api';

export default function TopRanks({ title = 'Top 10 Minggu Ini', items = [] }) {
  const ref = useRef(null);
  const list = items.slice(0, 10).map(normalizeDrama).filter((d) => d?.cover);
  if (!list.length) return null;

  function scrollBy(dir) {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.9), behavior: 'smooth' });
  }

  return (
    <section className="mb-12 sm:mb-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 mb-5 flex items-end justify-between">
        <div>
          <p className="eyebrow text-[11px] font-semibold tracking-widest uppercase text-rose-400">
            Peringkat
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tightest mt-1">
            {title}
          </h2>
        </div>
        <div className="hidden md:flex items-center gap-1.5">
          <button onClick={() => scrollBy(-1)} className="w-9 h-9 grid place-items-center rounded-full bg-bg-card hover:bg-bg-elev border border-bg-line">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button onClick={() => scrollBy(1)} className="w-9 h-9 grid place-items-center rounded-full bg-bg-card hover:bg-bg-elev border border-bg-line">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        </div>
      </div>

      <div ref={ref} className="no-scrollbar flex gap-3 sm:gap-6 overflow-x-auto px-4 sm:px-6 lg:px-10 pb-2">
        {list.map((d, i) => (
          <Link
            href={`/drama/${d.bookId}`}
            key={d.bookId}
            className="group relative flex items-end shrink-0 pl-12 sm:pl-20"
          >
            <span className="rank-num absolute left-0 bottom-2 sm:bottom-3 leading-none">
              {i + 1}
            </span>
            <div className="relative w-32 sm:w-40 md:w-44 aspect-[2/3] rounded-xl overflow-hidden bg-bg-card ring-1 ring-bg-line/60 group-hover:ring-rose-500/60 transition shadow-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.cover} alt={d.title} loading="lazy" className="w-full h-full object-cover transition duration-700 group-hover:scale-[1.05]" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <h3 className="text-xs font-semibold text-white line-clamp-2">{d.title}</h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
