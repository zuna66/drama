import DramaCard from './DramaCard';

export default function DramaGrid({ items = [] }) {
  if (!items.length) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-16 text-center text-ink-300">
        Tidak ada drama untuk ditampilkan.
      </div>
    );
  }
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {items.map((d, i) => (
          <DramaCard key={(d.bookId || d.id || i) + '-' + i} drama={d} size="md" />
        ))}
      </div>
    </div>
  );
}
