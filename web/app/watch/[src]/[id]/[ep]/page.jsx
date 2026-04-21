import { getSource, SOURCES } from '@/lib/sources';
import Link from 'next/link';
import Player from '@/components/Player';
import { notFound } from 'next/navigation';
import SourceLogo from '@/components/SourceLogo';

export const dynamic = 'force-dynamic';

export default async function WatchPage({ params }) {
  const { src, id, ep } = params;
  if (!SOURCES[src]) notFound();
  const source = getSource(src);
  const epNum = parseInt(ep, 10) || 1;

  const [stream, detail] = await Promise.all([
    source.stream(id, epNum),
    source.detail(id),
  ]);

  const drama = detail?.drama;
  const episodes = detail?.episodes || [];
  const totalEps = episodes.length || stream?.eps || epNum;
  const videoUrl = stream?.videoUrl || null;
  const poster = stream?.poster || drama?.cover;
  const nextHref = epNum < totalEps ? `/watch/${src}/${id}/${epNum + 1}` : null;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pt-6 pb-16">
      <div className="text-xs text-ink-400 mb-4 flex items-center gap-2 flex-wrap">
        <Link href={`/?src=${src}`} className="hover:text-ink-50">{source.name}</Link>
        <span>/</span>
        <Link href={`/drama/${src}/${id}`} className="hover:text-ink-50 truncate max-w-[200px] sm:max-w-none">
          {drama?.title || `Drama ${id}`}
        </Link>
        <span>/</span>
        <span className="text-ink-200 tabular">EP {epNum}</span>
      </div>

      <div className="grid lg:grid-cols-[1fr,340px] gap-6 lg:gap-8">
        <div>
          <Player src={videoUrl} poster={poster} subtitle={stream?.subtitle} nextHref={nextHref} />

          <div className="mt-5 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 pl-0.5 pr-2.5 py-0.5 rounded-full bg-bg-card border border-bg-line/70 text-[11px] font-semibold">
                  <SourceLogo source={source} size={18} />
                  {source.name}
                </span>
                <span className="text-[11px] font-semibold tracking-widest uppercase text-rose-400">
                  Episode {epNum} <span className="text-ink-400 font-normal normal-case">dari {totalEps}</span>
                </span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tightest text-balance">
                {drama?.title || `Drama ${id}`}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {epNum > 1 ? (
                <Link href={`/watch/${src}/${id}/${epNum - 1}`} className="px-4 h-10 inline-flex items-center rounded-full bg-bg-card border border-bg-line hover:border-rose-500/50 text-sm font-medium">
                  ← Eps {epNum - 1}
                </Link>
              ) : null}
              {epNum < totalEps ? (
                <Link href={`/watch/${src}/${id}/${epNum + 1}`} className="px-4 h-10 inline-flex items-center rounded-full bg-rose-500 hover:bg-rose-400 text-sm font-semibold shadow-glow">
                  Eps {epNum + 1} →
                </Link>
              ) : null}
            </div>
          </div>

          {!videoUrl && (
            <div className="mt-5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm">
              Video tidak ditemukan dari sumber {source.name}. Coba ganti episode atau pilih sumber lain.
            </div>
          )}

          {drama?.description && (
            <div className="mt-6 p-5 rounded-2xl bg-bg-card border border-bg-line/70">
              <h3 className="font-display font-bold text-lg tracking-tightest mb-2">Sinopsis</h3>
              <p className="text-ink-200 text-[14px] leading-relaxed">{drama.description}</p>
            </div>
          )}
        </div>

        <aside className="lg:max-h-[80vh] lg:overflow-y-auto rounded-2xl bg-bg-card border border-bg-line/70 p-4">
          <div className="sticky top-0 -mx-4 -mt-4 px-4 pt-4 pb-3 mb-3 bg-bg-card/95 backdrop-blur border-b border-bg-line/70 z-10">
            <h3 className="font-display font-bold tracking-tightest">Episode</h3>
            <p className="text-xs text-ink-400 tabular mt-0.5">{totalEps} total · {source.name}</p>
          </div>
          {episodes.length ? (
            <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
              {episodes.map((e, i) => {
                const active = Number(e.no) === Number(epNum);
                const locked = e.isLocked || e.is_locked;
                return (
                  <Link
                    key={i}
                    href={`/watch/${src}/${id}/${e.no}`}
                    className={`aspect-square grid place-items-center rounded-lg text-sm font-bold tabular border transition ${
                      active
                        ? 'bg-rose-500 border-rose-500 text-white shadow-glow'
                        : locked
                        ? 'bg-bg-elev border-bg-line/50 text-ink-400'
                        : 'bg-bg-elev border-bg-line hover:border-rose-500/60'
                    }`}
                  >
                    {e.no}
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-ink-400 text-sm py-4">Tidak ada daftar episode.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
