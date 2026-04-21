'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { SOURCE_LIST } from '@/lib/sources';
import SourceLogo from './SourceLogo';

export default function SourceTabs({ current = 'melolo', basePath = '/', extraQuery = '' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);
  const active = SOURCE_LIST.find((s) => s.id === current) || SOURCE_LIST[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? SOURCE_LIST.filter((s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
    : SOURCE_LIST;

  const hrefFor = (s) => `${basePath}?src=${s.id}${extraQuery ? `&${extraQuery}` : ''}`;

  const popular = SOURCE_LIST.slice(0, 6);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 mb-8">
      <div className="flex items-center gap-2">
        <div className="relative" ref={ref}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-2.5 pl-1.5 pr-3 h-11 rounded-full border-2 bg-bg-card text-ink-50 transition hover:bg-bg-elev"
            style={{ borderColor: active.accent }}
            aria-expanded={open}
            aria-haspopup="listbox"
          >
            <SourceLogo source={active} size={32} />
            <span className="text-sm font-semibold">{active.name}</span>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: active.accent }} />
            <svg className={`w-4 h-4 ml-1 transition ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {open && (
            <div
              className="absolute left-0 top-full mt-2 w-[min(92vw,520px)] z-30 rounded-2xl bg-bg-card border border-bg-line/70 shadow-2xl backdrop-blur p-3"
              role="listbox"
            >
              <div className="relative mb-2">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Cari di ${SOURCE_LIST.length} sumber…`}
                  autoFocus
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-bg-elev border border-bg-line/50 text-sm text-ink-50 placeholder:text-ink-400 focus:outline-none focus:border-rose-500/60"
                />
              </div>
              <div className="max-h-[min(60vh,420px)] overflow-y-auto -mr-1 pr-1">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {filtered.map((s) => {
                    const isActive = s.id === current;
                    return (
                      <Link
                        key={s.id}
                        href={hrefFor(s)}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-2.5 px-2 py-2 rounded-xl border transition ${
                          isActive
                            ? 'bg-rose-500/10 border-rose-500/60 text-ink-50'
                            : 'border-transparent hover:bg-bg-elev hover:border-bg-line/60 text-ink-200'
                        }`}
                      >
                        <SourceLogo source={s} size={28} />
                        <span className="text-[13px] font-semibold leading-tight truncate">{s.name}</span>
                      </Link>
                    );
                  })}
                  {filtered.length === 0 && (
                    <p className="col-span-full text-center text-ink-400 text-sm py-6">Tidak ada sumber cocok.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="no-scrollbar overflow-x-auto flex-1 -mr-4 pr-4 sm:mr-0 sm:pr-0">
          <div className="flex items-center gap-1.5 min-w-max">
            {popular.map((s) => {
              if (s.id === active.id) return null;
              return (
                <Link
                  key={s.id}
                  href={hrefFor(s)}
                  scroll={false}
                  className="group inline-flex items-center gap-2 pl-1.5 pr-3 h-10 rounded-full border bg-bg-card/60 border-bg-line/70 text-ink-300 hover:text-ink-50 hover:border-bg-line whitespace-nowrap transition"
                >
                  <SourceLogo source={s} size={26} />
                  <span className="text-[13px] font-semibold">{s.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
