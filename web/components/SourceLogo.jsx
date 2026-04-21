export default function SourceLogo({ source, size = 28, className = '' }) {
  if (!source) return null;
  const dim = `${size}px`;
  return (
    <span
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shadow-md ${className}`}
      style={{ width: dim, height: dim, background: source.accent }}
    >
      {source.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={source.logo}
          alt={source.name}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-[10px] font-bold text-white">{source.short}</span>
      )}
    </span>
  );
}
