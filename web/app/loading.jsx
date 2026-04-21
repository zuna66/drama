import { HeroSkeleton, RowSkeleton } from '@/components/Skeleton';

export default function Loading() {
  return (
    <>
      <HeroSkeleton />
      <div className="mt-6">
        <RowSkeleton />
        <RowSkeleton />
        <RowSkeleton />
      </div>
    </>
  );
}
