'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (pathname === '/search') setQ(params.get('q') || '');
  }, [pathname, params]);

  function submit(e) {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  const links = [
    { href: '/', label: 'Beranda' },
    { href: '/browse', label: 'Sumber' },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-bg/85 backdrop-blur-xl border-b border-bg-line/70'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center gap-4 sm:gap-8">
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <div className="relative">
            <div className="w-8 h-8 rounded-md bg-rose-500 flex items-center justify-center shadow-glow">
              <span className="font-display font-bold text-white text-sm">S</span>
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-300 animate-pulse" />
          </div>
          <span className="font-display font-bold text-lg tracking-tightest">
            Sinema
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative py-1 transition ${
                  active ? 'text-ink-50' : 'text-ink-300 hover:text-ink-50'
                }`}
              >
                {l.label}
                {active && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-rose-500" />
                )}
              </Link>
            );
          })}
        </nav>

        <form onSubmit={submit} className="ml-auto flex-1 max-w-md">
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari judul, genre, aktor..."
              className="w-full h-10 pl-11 pr-4 rounded-full bg-bg-card border border-bg-line/80 placeholder:text-ink-400 focus:outline-none focus:border-rose-500/60 focus:bg-bg-elev text-sm transition"
            />
            <svg
              className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-3.5-3.5" />
            </svg>
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-50"
                aria-label="Clear"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            )}
          </div>
        </form>
      </div>
    </header>
  );
}
