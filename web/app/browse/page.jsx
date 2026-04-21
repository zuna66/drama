import { SOURCE_LIST } from '@/lib/sources';
import Link from 'next/link';
import SourceLogo from '@/components/SourceLogo';

export default function BrowsePage() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
      <div className="mb-10 max-w-2xl">
        <p className="eyebrow text-[11px] font-semibold tracking-widest uppercase text-rose-400">Sumber</p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tightest mt-2 text-balance">
          Pilih platform <span className="text-rose-400">drama pendek</span> kesayanganmu.
        </h1>
        <p className="mt-3 text-ink-300 text-[15px]">Setiap sumber punya katalog yang beda — dari DramaBox sampai Dramadash.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SOURCE_LIST.map((s) => (
          <Link
            key={s.id}
            href={`/?src=${s.id}`}
            className="group relative overflow-hidden rounded-2xl p-6 h-44 bg-bg-card border border-bg-line/70 hover:border-bg-line transition flex flex-col justify-between"
            style={{ borderColor: undefined }}
          >
            <div
              className="absolute inset-0 opacity-30 group-hover:opacity-60 transition"
              style={{ background: `radial-gradient(120% 80% at 100% 0%, ${s.accent}55, transparent 60%)` }}
            />
            <div className="relative flex items-center gap-3">
              <SourceLogo source={s} size={48} className="!rounded-xl" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-ink-300 font-semibold">Sumber</p>
                <h3 className="font-display font-bold text-2xl tracking-tightest">{s.name}</h3>
              </div>
            </div>
            <div className="relative flex items-center justify-between">
              <p className="text-xs text-ink-300">{s.note || 'Aktif'}</p>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-100 group-hover:text-rose-300">
                Jelajah
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
