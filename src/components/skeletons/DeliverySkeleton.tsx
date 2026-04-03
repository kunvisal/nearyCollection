import { SkeletonBox } from "./primitives";

function DeliveryCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
      {/* Top accent bar */}
      <SkeletonBox className="h-1.5 w-full rounded-none" />

      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start">
        <div className="space-y-1.5">
          <SkeletonBox className="h-4.5 w-28" />
          <SkeletonBox className="h-3 w-36" />
        </div>
        <SkeletonBox className="h-8 w-8 rounded-full" />
      </div>

      {/* Address & customer */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex items-start gap-2.5">
          <SkeletonBox className="h-4 w-4 mt-0.5 shrink-0 rounded" />
          <div className="space-y-1.5 flex-1">
            <SkeletonBox className="h-3.5 w-32" />
            <SkeletonBox className="h-3 w-24" />
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <SkeletonBox className="h-4 w-4 mt-0.5 shrink-0 rounded" />
          <div className="space-y-1.5 flex-1">
            <SkeletonBox className="h-3 w-full" />
            <SkeletonBox className="h-3 w-3/4" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SkeletonBox className="h-5 w-16 rounded-full" />
          <SkeletonBox className="h-3 w-20" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-3">
        <SkeletonBox className="h-9 rounded-lg" />
        <SkeletonBox className="h-9 rounded-lg" />
      </div>
    </div>
  );
}

export function DeliverySkeleton() {
  return (
    <div className="space-y-6">
      {/* Title + search bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1.5">
          <SkeletonBox className="h-7 w-48" />
          <SkeletonBox className="h-3.5 w-60" />
        </div>
        <SkeletonBox className="h-9 w-full sm:w-64 rounded-lg" />
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <DeliveryCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
