export default function Footer() {
  return (
    <footer className="mt-16 border-t border-bg-line/70">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-12 grid gap-10 md:grid-cols-[1.4fr,1fr,1fr,1fr]">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-md bg-rose-500 grid place-items-center">
              <span className="font-display font-bold text-white text-sm">S</span>
            </div>
            <span className="font-display font-bold text-lg tracking-tightest">Sinema</span>
          </div>
          <p className="text-sm text-ink-300 max-w-sm leading-relaxed">
            Platform showcase yang memutar drama pendek favorit kamu. Bukan layanan resmi — proyek eksperimen pribadi.
          </p>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-ink-400 mb-3">Jelajahi</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="/" className="text-ink-200 hover:text-rose-400">Beranda</a></li>
            <li><a href="/browse" className="text-ink-200 hover:text-rose-400">Sumber</a></li>
            <li><a href="/search" className="text-ink-200 hover:text-rose-400">Pencarian</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-ink-400 mb-3">Bantuan</h4>
          <ul className="space-y-2 text-sm">
            <li><span className="text-ink-300">FAQ</span></li>
            <li><span className="text-ink-300">Privasi</span></li>
            <li><span className="text-ink-300">Syarat</span></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-ink-400 mb-3">Catatan</h4>
          <p className="text-xs text-ink-300 leading-relaxed">
            Beberapa endpoint sumber bisa memblokir IP lokal. Untuk produksi pakai server dengan IP Indonesia residensial atau proxy.
          </p>
        </div>
      </div>
      <div className="border-t border-bg-line/70 py-5 text-center text-[11px] text-ink-400 tracking-wide">
        © {new Date().getFullYear()} SINEMA · DIRANCANG UNTUK MARATHON SEMALAMAN
      </div>
    </footer>
  );
}
