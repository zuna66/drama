import { getSource, SOURCES } from '@/lib/sources';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SourceLogo from '@/components/SourceLogo';
import Cover from '@/components/Cover';

export const revalidate = 60;

export default async function DetailPage({ params }) {
  const { src, id } = params;
  if (!SOURCES[src]) notFound();
  const source = getSource(src);
  const data = await source.detail(id);

  if (!data) {
    return (
      <div className="min-h-[60vh] grid place-items-center px-6 text-center">
        <div>
          <p className="eyebrow text-[11px] font-semibold tracking-widest uppercase text-rose-400">{source.name}</p>
          <h1 className="font-display text-3xl font-bold tracking-tightest mt-2">Detail tidak tersedia</h1>
          <p className="text-ink-300 mt-2 max-w-md">Sumber {source.name} tidak merespon untuk drama ini.</p>
          <Link href="/" className="inline-flex mt-6 px-5 h-10 items-center rounded-full bg-rose-500 hover:bg-rose-400 font-semibold text-sm shadow-glow">
            Kembali ke beranda
          </Link>
        </div>
      </div>
    );
  }

  const { drama, episodes } = data;

  return (
    <div>
      <section className="relative">
        {drama.cover && (
          <div className="absolute inset-x-0 top-0 h-[80vh] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={drama.cover} alt="" className="w-full h-full object-cover blur-2xl scale-110 opacity-25" />
            <div className="absolute inset-0 bg-gradient-to-b from-bg/60 via-bg/85 to-bg" />
          </div>
        )}

        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pt-10 pb-10">
          <Link href={`/?src=${src}`} className="text-xs text-ink-400 hover:text-ink-50 inline-flex items-center gap-1 mb-6">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
            Kembali ke {source.name}
          </Link>

          <div className="grid sm:grid-cols-[200px,1fr] md:grid-cols-[280px,1fr] gap-6 md:gap-12 items-start">
            <div>
              <Cover
                src={drama.cover}
                alt={drama.title}
                placeholderLabel={drama.title}
                className="w-full aspect-[2/3] rounded-2xl object-cover shadow-card ring-1 ring-bg-line/70"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 pl-0.5 pr-2.5 py-0.5 rounded-full bg-bg-card border border-bg-line/70 text-[11px] font-semibold">
                  <SourceLogo source={source} size={20} />
                  {source.name}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 text-[10px] font-semibold uppercase tracking-wider">
                  Drama Pendek
                </span>
              </div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tightest leading-[1.02] text-balance">
                {drama.title}
              </h1>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-200 tabular">
                {drama.rating && (
                  <span className="inline-flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-400" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span className="font-semibold text-ink-50 text-base">{Number(drama.rating).toFixed(1)}</span>
                  </span>
                )}
                {drama.episodes && (
                  <span className="inline-flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-ink-300" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
                    {drama.episodes} episode
                  </span>
                )}
                {drama.views && <span className="text-ink-300">{drama.views} views</span>}
                {drama.status && <span className="text-ink-300">{drama.status}</span>}
              </div>

              {drama.genres?.length ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {drama.genres.map((g, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-full bg-bg-card border border-bg-line text-xs text-ink-200">
                      {g}
                    </span>
                  ))}
                </div>
              ) : null}

              {drama.description && (
                <p className="mt-6 text-ink-200 leading-relaxed max-w-3xl text-[15px] line-clamp-4">
                  {drama.description}
                </p>
              )}

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href={`/watch/${src}/${id}/${episodes[0]?.no || 1}`}
                  className="inline-flex items-center gap-2.5 pl-5 pr-6 h-12 rounded-full bg-rose-500 hover:bg-rose-400 text-white font-semibold text-sm shadow-glow"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5z" /></svg>
                  Tonton sekarang
                </Link>
                <a href="#episodes" className="inline-flex items-center px-5 h-12 rounded-full bg-bg-card hover:bg-bg-elev border border-bg-line text-sm font-semibold">
                  Daftar episode
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="episodes" className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 mt-4 mb-12">
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="eyebrow text-[11px] font-semibold tracking-widest uppercase text-rose-400">Daftar</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tightest mt-1">Episode</h2>
          </div>
          {episodes.length ? (
            <span className="text-xs text-ink-300 tabular">{episodes.length} episode</span>
          ) : null}
        </div>
        {episodes.length ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
            {episodes.map((ep, i) => {
              const locked = ep.isLocked || ep.is_locked;
              return (
                <Link
                  key={i}
                  href={`/watch/${src}/${id}/${ep.no}`}
                  className={`relative aspect-square grid place-items-center rounded-xl text-sm font-bold tabular border transition ${
                    locked
                      ? 'bg-bg-card/50 border-bg-line/50 text-ink-400'
                      : 'bg-bg-card border-bg-line hover:border-rose-500 hover:bg-rose-500/10'
                  }`}
                  title={`Episode ${ep.no}${locked ? ' (Locked)' : ''}`}
                >
                  {ep.no}
                  {locked && (
                    <svg className="absolute top-1.5 right-1.5 w-3 h-3 text-ink-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17 11h-1V8a4 4 0 00-8 0v3H7a2 2 0 00-2 2v7a2 2 0 002 2h10a2 2 0 002-2v-7a2 2 0 00-2-2zm-7-3a2 2 0 014 0v3h-4V8z" />
                    </svg>
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-ink-300 text-sm">Daftar episode tidak tersedia.</p>
        )}
      </section>
    </div>
  );
}
