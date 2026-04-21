import Link from 'next/link';

export default function CategoryChips({ categories = [], current }) {
  if (!categories.length) return null;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
      <h2 className="text-lg sm:text-xl font-bold tracking-tight mb-3">Genre</h2>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => {
          const active = String(current) === String(c.id);
          return (
            <Link
              key={c.id}
              href={`/category/${c.id}`}
              className={`px-3.5 py-1.5 rounded-full text-sm transition border ${
                active
                  ? 'bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/30'
                  : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
              }`}
            >
              {c.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
