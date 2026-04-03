import { SkeletonBox } from "./primitives";

export function OrdersSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="flex justify-between items-center">
        <SkeletonBox className="h-7 w-48" />
      </div>

      {/* Filters panel */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
        {/* Row 1: search + 2 selects */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonBox className="h-9 w-full" />
          <SkeletonBox className="h-9 w-full" />
          <SkeletonBox className="h-9 w-full" />
        </div>
        {/* Row 2: date range + reset button */}
        <div className="flex flex-wrap gap-3 items-center">
          <SkeletonBox className="h-9 w-36" />
          <SkeletonBox className="h-9 w-36" />
          <SkeletonBox className="h-9 w-20" />
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {/* checkbox */}
              <th className="px-4 py-3 w-10">
                <SkeletonBox className="h-4 w-4" />
              </th>
              {["Order Code", "Date", "Customer", "Payment", "Status", "Total", ""].map((_, i) => (
                <th key={i} className="px-4 py-3 text-left">
                  <SkeletonBox className="h-3 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-3">
                  <SkeletonBox className="h-4 w-4" />
                </td>
                <td className="px-4 py-3">
                  <SkeletonBox className="h-4 w-24" />
                </td>
                <td className="px-4 py-3">
                  <SkeletonBox className="h-4 w-20" />
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <SkeletonBox className="h-3 w-28" />
                    <SkeletonBox className="h-3 w-20" />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <SkeletonBox className="h-5 w-16 rounded-full" />
                </td>
                <td className="px-4 py-3">
                  <SkeletonBox className="h-5 w-20 rounded-full" />
                </td>
                <td className="px-4 py-3">
                  <SkeletonBox className="h-4 w-16" />
                </td>
                <td className="px-4 py-3">
                  <SkeletonBox className="h-7 w-7 rounded-md" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination row */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <SkeletonBox className="h-4 w-32" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonBox key={i} className="h-8 w-8 rounded-md" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
