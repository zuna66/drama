'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  {
    href: '/',
    label: 'Beranda',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path d="M3 11l9-8 9 8v10a2 2 0 01-2 2h-4v-7H10v7H6a2 2 0 01-2-2V11z" />
      </svg>
    ),
  },
  {
    href: '/browse',
    label: 'Sumber',
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: '/search',
    label: 'Cari',
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-3.5-3.5" />
      </svg>
    ),
  },
];

export default function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 sm:hidden">
      <div className="mx-3 mb-3 rounded-2xl bg-bg-card/90 backdrop-blur-xl border border-bg-line/70 shadow-card">
        <ul className="flex items-stretch justify-around">
          {items.map((it) => {
            const active = pathname === it.href || (it.href === '/search' && pathname?.startsWith('/search'));
            return (
              <li key={it.href} className="flex-1">
                <Link
                  href={it.href}
                  className={`flex flex-col items-center justify-center gap-1 py-2.5 ${
                    active ? 'text-rose-400' : 'text-ink-300'
                  }`}
                >
                  {it.icon(active)}
                  <span className="text-[10px] font-semibold tracking-wide">{it.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
