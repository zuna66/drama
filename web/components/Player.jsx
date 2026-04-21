'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const AUTOPLAY_KEY = 'dramabox:autoplay';

export default function Player({ src, poster, subtitle, nextHref }) {
  const ref = useRef(null);
  const router = useRouter();
  const [error, setError] = useState(null);
  const [autoplay, setAutoplay] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTOPLAY_KEY);
      if (saved !== null) setAutoplay(saved === '1');
    } catch {}
    setHydrated(true);
  }, []);

  const toggleAutoplay = () => {
    setAutoplay((prev) => {
      const next = !prev;
      try { localStorage.setItem(AUTOPLAY_KEY, next ? '1' : '0'); } catch {}
      return next;
    });
  };

  useEffect(() => {
    const video = ref.current;
    if (!video || !src) return;
    setError(null);

    const tryPlay = () => {
      const p = video.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          video.muted = true;
          video.play().catch(() => {});
        });
      }
    };

    const isM3u8 = /\.m3u8(\?|$|\/)/.test(src) || src.includes('manifest/video');
    let hls;

    if (isM3u8) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
      } else {
        import('hls.js').then(({ default: Hls }) => {
          if (Hls.isSupported()) {
            hls = new Hls({
              enableWorker: true,
              lowLatencyMode: false,
              capLevelToPlayerSize: false,
              startLevel: -1,
            });
            hls.loadSource(src);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              if (hls.levels?.length) {
                const best = hls.levels.reduce(
                  (acc, lvl, i) => (lvl.height > (hls.levels[acc]?.height || 0) ? i : acc),
                  0,
                );
                hls.nextLevel = best;
              }
              tryPlay();
            });
            hls.on(Hls.Events.ERROR, (_, data) => {
              if (data.fatal) setError(`HLS error: ${data.type}`);
            });
          } else {
            video.src = src;
          }
        });
      }
    } else {
      video.src = src;
    }

    const onErr = () => {
      const mediaErr = video.error;
      if (!mediaErr) return;
      if (video.readyState >= 2 || video.currentTime > 0) return;
      setError('Gagal memuat video. URL mungkin sudah expired atau di-blok CORS.');
    };
    const clearErr = () => setError(null);
    const onLoadedMetadata = () => tryPlay();
    video.addEventListener('error', onErr);
    video.addEventListener('loadeddata', clearErr);
    video.addEventListener('playing', clearErr);
    video.addEventListener('canplay', clearErr);
    video.addEventListener('loadedmetadata', onLoadedMetadata);

    return () => {
      video.removeEventListener('error', onErr);
      video.removeEventListener('loadeddata', clearErr);
      video.removeEventListener('playing', clearErr);
      video.removeEventListener('canplay', clearErr);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      if (hls) hls.destroy();
    };
  }, [src]);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const onEnded = () => {
      if (autoplay && nextHref) router.push(nextHref);
    };
    video.addEventListener('ended', onEnded);
    return () => video.removeEventListener('ended', onEnded);
  }, [autoplay, nextHref, router]);

  if (!src) {
    return (
      <div className="aspect-video w-full grid place-items-center bg-black rounded-2xl text-ink-400 ring-1 ring-bg-line">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-ink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M10 9l5 3-5 3V9z" />
          </svg>
          <p className="text-sm">Video tidak tersedia</p>
          <p className="text-xs text-ink-500 mt-1">Sumber tidak menyediakan stream untuk episode ini.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <video
        ref={ref}
        poster={poster}
        controls
        autoPlay
        playsInline
        className="w-full aspect-video bg-black rounded-2xl shadow-card ring-1 ring-bg-line"
      >
        {subtitle && <track kind="subtitles" src={subtitle} default label="Subtitle" />}
      </video>

      <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
        <button
          type="button"
          onClick={toggleAutoplay}
          aria-pressed={autoplay}
          className={`inline-flex items-center gap-2 h-9 pl-2 pr-3.5 rounded-full border text-xs font-semibold transition ${
            autoplay
              ? 'bg-rose-500/15 border-rose-500/50 text-rose-200'
              : 'bg-bg-card border-bg-line text-ink-300 hover:border-bg-line/60'
          }`}
          title={autoplay ? 'Autoplay aktif — episode berikutnya akan diputar otomatis' : 'Autoplay nonaktif'}
        >
          <span
            className={`w-8 h-5 rounded-full relative transition ${autoplay ? 'bg-rose-500' : 'bg-bg-line'}`}
            aria-hidden="true"
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${autoplay ? 'left-3.5' : 'left-0.5'}`}
            />
          </span>
          Autoplay {hydrated ? (autoplay ? 'ON' : 'OFF') : ''}
        </button>
        {autoplay && nextHref && (
          <span className="text-[11px] text-ink-400">Lanjut otomatis ke episode berikutnya</span>
        )}
      </div>

      {error && (
        <div className="absolute bottom-16 left-3 right-3 px-3 py-2 rounded-lg bg-amber-500/95 text-amber-950 text-xs font-medium">
          {error}
        </div>
      )}
    </div>
  );
}
