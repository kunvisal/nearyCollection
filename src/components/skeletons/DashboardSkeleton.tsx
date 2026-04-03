import { SkeletonBox, SkeletonText } from "./primitives";

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* DashboardDateFilter placeholder */}
      <SkeletonBox height="2.5rem" width="16rem" />

      {/* EcommerceMetrics — 4-col grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-2 md:gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 bg-white p-2.5 flex flex-col justify-between dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <SkeletonBox className="h-3 w-24 mb-2" />
            <div className="flex items-end justify-between">
              <SkeletonBox className="h-5 w-16" />
              <SkeletonBox className="h-4 w-10" />
            </div>
          </div>
        ))}
      </div>

      {/* Middle row: chart (8 cols) + 4 stat mini-cards (4 cols) */}
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-8">
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <SkeletonBox className="h-4 w-32 mb-4" />
            {/* Bar chart skeleton — 12 bars */}
            <div className="flex items-end gap-2 h-44">
              {Array.from({ length: 12 }).map((_, i) => (
                <SkeletonBox
                  key={i}
                  className="flex-1 rounded-sm"
                  height={`${30 + ((i * 17 + 20) % 70)}%`}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="col-span-4 space-y-3 md:space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-200 bg-white p-2 flex flex-col justify-between dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <SkeletonBox className="h-3 w-24 mb-1.5" />
              <div className="flex items-end justify-between gap-2">
                <SkeletonBox className="h-5 w-16" />
                <SkeletonBox className="h-4 w-10" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* StatisticsChart — full width area chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <SkeletonBox className="h-4 w-40 mb-4" />
        {/* Area chart skeleton */}
        <div className="flex items-end gap-1 h-36">
          {Array.from({ length: 20 }).map((_, i) => (
            <SkeletonBox
              key={i}
              className="flex-1 rounded-sm"
              height={`${25 + ((i * 13 + 15) % 65)}%`}
            />
          ))}
        </div>
      </div>

      {/* Bottom row: alerts (4) + recent orders (8) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
        {/* DashboardAlerts */}
        <div className="md:col-span-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 h-full dark:border-gray-800 dark:bg-white/[0.03]">
            <SkeletonBox className="h-4 w-28 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                  <SkeletonBox className="h-8 w-8 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <SkeletonBox className="h-3 w-full" />
                    <SkeletonBox className="h-3 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RecentOrders */}
        <div className="md:col-span-8">
          <div className="rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <SkeletonBox className="h-4 w-32 mb-4" />
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {/* Header row */}
              <div className="grid grid-cols-4 gap-3 py-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonBox key={i} className="h-3 w-16" />
                ))}
              </div>
              {/* Data rows */}
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="grid grid-cols-4 gap-3 py-3">
                  <SkeletonBox className="h-4 w-20" />
                  <SkeletonBox className="h-4 w-16" />
                  <SkeletonBox className="h-5 w-14 rounded-full" />
                  <SkeletonBox className="h-4 w-12" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
