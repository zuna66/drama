'use client';
import { useRef } from 'react';
import DramaCard from './DramaCard';

export default function Row({ title, subtitle, items, viewAllHref, size = 'md' }) {
  const ref = useRef(null);
  if (!items?.length) return null;

  function scrollBy(dir) {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.9), behavior: 'smooth' });
  }

  return (
    <section className="mb-10 sm:mb-14">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-[11px] font-semibold tracking-widest uppercase text-rose-400">
            Koleksi
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tightest mt-1">
            {title}
          </h2>
          {subtitle && <p className="text-sm text-ink-300 mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {viewAllHref && (
            <a
              href={viewAllHref}
              className="text-xs font-medium text-ink-300 hover:text-ink-50 hidden sm:inline-flex items-center gap-1"
            >
              Semua
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
          )}
          <div className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => scrollBy(-1)}
              className="w-9 h-9 grid place-items-center rounded-full bg-bg-card hover:bg-bg-elev border border-bg-line transition"
              aria-label="Scroll left"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={() => scrollBy(1)}
              className="w-9 h-9 grid place-items-center rounded-full bg-bg-card hover:bg-bg-elev border border-bg-line transition"
              aria-label="Scroll right"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div
        ref={ref}
        className="no-scrollbar flex gap-3 sm:gap-4 overflow-x-auto px-4 sm:px-6 lg:px-10 pb-2"
      >
        {items.map((d, i) => (
          <DramaCard key={(d.bookId || d.id || i) + '-' + i} drama={d} size={size} />
        ))}
      </div>
    </section>
  );
}
