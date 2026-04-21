import { getSource, SOURCES } from '@/lib/sources';
import Hero from '@/components/Hero';
import SourceTabs from '@/components/SourceTabs';
import DramaGrid from '@/components/DramaGrid';

export const revalidate = 120;

export default async function HomePage({ searchParams }) {
  const srcId = searchParams?.src && SOURCES[searchParams.src] ? searchParams.src : 'melolo';
  const source = getSource(srcId);
  const items = await source.home();

  const heroPool = items.filter((x) => x?.cover && x?.description).slice(0, 5);
  const grid = items.filter((x) => x?.cover);

  return (
    <>
      {heroPool.length ? <Hero items={heroPool} /> : <div className="h-20" />}

      <div className="mt-2 sm:mt-6">
        <SourceTabs current={srcId} basePath="/" />

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 mb-5">
          <p className="eyebrow text-[11px] font-semibold tracking-widest uppercase text-rose-400">Sumber: {source.name}</p>
          <div className="flex items-end justify-between gap-4 mt-1">
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tightest">Terbaru</h2>
            <span className="text-xs text-ink-400 tabular">{grid.length} judul</span>
          </div>
        </div>

        {grid.length ? (
          <DramaGrid items={grid} />
        ) : (
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-20 text-center">
            <div className="text-5xl mb-3">😔</div>
            <p className="text-ink-300">Sumber ini lagi kosong / bermasalah. Coba pilih sumber lain di tab atas.</p>
          </div>
        )}
      </div>
    </>
  );
}
