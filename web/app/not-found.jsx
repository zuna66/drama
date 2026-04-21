import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] grid place-items-center px-6 text-center">
      <div>
        <p className="eyebrow text-[11px] font-semibold tracking-widest uppercase text-rose-400">Hilang</p>
        <div className="font-display text-7xl sm:text-9xl font-bold tracking-tightest mt-2 text-rose-400">404</div>
        <p className="mt-3 text-ink-300">Halaman yang kamu cari nggak ada di sini.</p>
        <Link href="/" className="inline-flex mt-6 px-5 h-10 items-center rounded-full bg-rose-500 hover:bg-rose-400 font-semibold text-sm shadow-glow">
          Balik ke beranda
        </Link>
      </div>
    </div>
  );
}
