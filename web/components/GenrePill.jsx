import Link from 'next/link';

export default function GenrePill({ categories = [], current }) {
  if (!categories.length) return null;
  return (
    <section className="mb-12 sm:mb-14">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="eyebrow text-[11px] font-semibold tracking-widest uppercase text-rose-400">Eksplor</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tightest mt-1">Genre Populer</h2>
          </div>
          <Link href="/browse" className="text-xs text-ink-300 hover:text-ink-50 hidden sm:inline-flex items-center gap-1">
            Semua genre
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const active = String(current) === String(c.id);
            return (
              <Link
                key={c.id}
                href={`/category/${c.id}`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition border ${
                  active
                    ? 'bg-rose-500 border-rose-500 text-white shadow-glow'
                    : 'bg-bg-card border-bg-line text-ink-200 hover:border-rose-500/50 hover:text-ink-50'
                }`}
              >
                {c.name}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
