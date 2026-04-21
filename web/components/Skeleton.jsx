export function CardSkeleton() {
  return (
    <div className="w-36 sm:w-40 md:w-44 shrink-0">
      <div className="aspect-[2/3] rounded-xl skeleton" />
      <div className="mt-2.5 h-3 rounded skeleton w-3/4" />
      <div className="mt-1.5 h-2.5 rounded skeleton w-1/2" />
    </div>
  );
}

export function RowSkeleton({ count = 6 }) {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 mb-12">
      <div className="h-3 w-20 rounded skeleton mb-2" />
      <div className="h-7 w-56 rounded skeleton mb-5" />
      <div className="flex gap-3 sm:gap-4 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <section className="relative h-[78vh] min-h-[560px] max-h-[820px] overflow-hidden">
      <div className="absolute inset-0 skeleton opacity-50" />
      <div className="relative max-w-[1400px] mx-auto h-full flex flex-col justify-end px-4 sm:px-6 lg:px-10 pb-16 gap-3">
        <div className="h-3 w-40 rounded skeleton" />
        <div className="h-12 w-3/4 max-w-2xl rounded skeleton" />
        <div className="h-12 w-2/3 max-w-xl rounded skeleton" />
        <div className="h-4 w-1/2 max-w-md rounded skeleton" />
      </div>
    </section>
  );
}
