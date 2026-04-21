import { getSource, SOURCES } from '@/lib/sources';
import DramaGrid from '@/components/DramaGrid';
import SourceTabs from '@/components/SourceTabs';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SearchPage({ searchParams }) {
  const q = (searchParams?.q || '').trim();
  const srcId = searchParams?.src && SOURCES[searchParams.src] ? searchParams.src : 'melolo';
  const source = getSource(srcId);
  let items = [];

  if (q) {
    try { items = (await source.search(q)) || []; } catch { items = []; }
  }

  return (
    <div className="pt-8 min-h-[60vh]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 mb-6">
        <p className="eyebrow text-[11px] font-semibold tracking-widest uppercase text-rose-400">Pencarian</p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tightest mt-2 text-balance">
          {q ? <>Hasil untuk <span className="text-rose-400">"{q}"</span></> : 'Cari drama favoritmu'}
        </h1>
        {q && <p className="mt-3 text-ink-300 text-sm tabular">{items.length} hasil dari {source.name}</p>}
        {!q && <p className="mt-3 text-ink-300 text-[15px] max-w-xl">Pilih sumber, lalu ketik judul di kolom pencarian atas.</p>}
      </div>

      <SourceTabs current={srcId} basePath="/search" extraQuery={q ? `q=${encodeURIComponent(q)}` : ''} />

      {q ? (
        items.length ? (
          <DramaGrid items={items} />
        ) : (
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-20 text-center">
            <div className="text-5xl mb-4">🎬</div>
            <p className="text-ink-300">Tidak ada hasil di {source.name}. Coba ganti sumber.</p>
            <Link href="/" className="inline-flex mt-6 px-5 h-10 items-center rounded-full bg-rose-500 hover:bg-rose-400 text-sm font-semibold shadow-glow">
              Balik ke beranda
            </Link>
          </div>
        )
      ) : null}
    </div>
  );
}
