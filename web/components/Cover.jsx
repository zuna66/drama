'use client';
import { useState } from 'react';

export default function Cover({ src, alt, className = '', placeholderLabel }) {
  const [broken, setBroken] = useState(false);
  if (src && !broken) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={alt || ''}
        onError={() => setBroken(true)}
        className={className}
      />
    );
  }
  return (
    <div className={`grid place-items-center text-ink-400 bg-gradient-to-br from-bg-card to-bg-elev ${className}`}>
      <div className="text-center p-4">
        <svg className="w-10 h-10 mx-auto mb-2 text-ink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
        <p className="text-xs text-ink-400 font-medium line-clamp-2">{placeholderLabel || alt || 'No cover'}</p>
      </div>
    </div>
  );
}
