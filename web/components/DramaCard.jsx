'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function DramaCard({ drama, size = 'md', rank }) {
  if (!drama || !drama.id) return null;
  const { src, id, title, cover, rating, episodes, views, genres, vip } = drama;
  const [broken, setBroken] = useState(false);

  const sizes = {
    sm: 'w-32 sm:w-36',
    md: 'w-36 sm:w-40 md:w-44',
    lg: 'w-44 sm:w-52 md:w-56',
  };

  const showCover = cover && !broken;

  return (
    <Link href={`/drama/${src}/${id}`} className={`group block ${sizes[size]} shrink-0`}>
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-bg-card ring-1 ring-bg-line/60 group-hover:ring-rose-500/60 transition shadow-card">
        {showCover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={title}
            loading="lazy"
            onError={() => setBroken(true)}
            className="w-full h-full object-cover transition duration-700 group-hover:scale-[1.06]"
          />
        ) : (
          <div className="w-full h-full grid place-items-center p-3 text-center bg-gradient-to-br from-bg-card to-bg-elev">
            <div>
              <svg className="w-8 h-8 mx-auto mb-1.5 text-ink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <p className="text-[10px] text-ink-400 font-medium line-clamp-2">{title || 'No cover'}</p>
            </div>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

        {rank ? (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-rose-500 text-white text-[11px] font-bold tabular shadow-md">#{rank}</span>
        ) : null}

        {vip ? (
          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-400 to-amber-600 text-black text-[10px] font-extrabold tracking-wider shadow-md flex items-center gap-1" style={{ left: rank ? '3.25rem' : '0.5rem' }}>
            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.39 6.95H22l-6.18 4.49 2.39 6.95L12 15.9l-6.21 4.49 2.39-6.95L2 8.95h7.61L12 2z" />
            </svg>
            VIP
          </span>
        ) : null}

        {(rating || views) ? (
          <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/65 backdrop-blur text-[10px] font-semibold tabular flex items-center gap-1">
            {rating ? (
              <>
                <svg viewBox="0 0 24 24" className="w-3 h-3 text-amber-400" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                {Number(rating).toFixed(1)}
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                {views}
              </>
            )}
          </span>
        ) : null}

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
          <div className="w-12 h-12 rounded-full bg-rose-500 grid place-items-center shadow-glow">
            <svg className="w-5 h-5 text-white translate-x-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7L8 5z" />
            </svg>
          </div>
        </div>

        {episodes ? (
          <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur text-[10px] font-semibold tabular text-ink-100 inline-flex items-center gap-1">
            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5z" /></svg>
            {episodes} Ep
          </span>
        ) : null}
      </div>

      <div className="mt-2.5 px-0.5">
        <h3 className="text-[13.5px] font-semibold leading-tight text-ink-50 line-clamp-2 group-hover:text-rose-300 transition">
          {title}
        </h3>
        {genres?.[0] && (
          <p className="mt-1 text-[11px] text-ink-400 line-clamp-1">{genres.slice(0, 2).join(' · ')}</p>
        )}
      </div>
    </Link>
  );
}
