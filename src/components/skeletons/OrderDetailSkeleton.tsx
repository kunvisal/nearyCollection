import { SkeletonBox } from "./primitives";

export function OrderDetailSkeleton() {
  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-center gap-4">
          <SkeletonBox className="h-9 w-9 rounded-full" />
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <SkeletonBox className="h-7 w-36" />
              <SkeletonBox className="h-6 w-20 rounded-full" />
            </div>
            <SkeletonBox className="h-3.5 w-48" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-9 w-24 rounded-lg" />
          <SkeletonBox className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: items table + workflow */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <SkeletonBox className="h-5 w-28 mb-4" />
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    {["Product", "Qty", "Price", "Total"].map((_, i) => (
                      <th key={i} className="px-4 py-3">
                        <SkeletonBox className="h-3 w-14" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <SkeletonBox className="h-12 w-12 rounded-lg shrink-0" />
                          <div className="space-y-1.5">
                            <SkeletonBox className="h-3.5 w-36" />
                            <SkeletonBox className="h-3 w-24" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <SkeletonBox className="h-4 w-6 mx-auto" />
                      </td>
                      <td className="px-4 py-3">
                        <SkeletonBox className="h-4 w-14 ml-auto" />
                      </td>
                      <td className="px-4 py-3">
                        <SkeletonBox className="h-4 w-16 ml-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-gray-200 dark:border-gray-700">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={3} className="px-4 py-2">
                        <SkeletonBox className="h-4 w-20 ml-auto" />
                      </td>
                      <td className="px-4 py-2">
                        <SkeletonBox className="h-4 w-16 ml-auto" />
                      </td>
                    </tr>
                  ))}
                </tfoot>
              </table>
            </div>
          </div>

          {/* Fulfillment workflow */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <SkeletonBox className="h-5 w-40 mb-4" />
            <div className="flex flex-wrap gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonBox key={i} className="h-9 w-36 rounded-lg" />
              ))}
            </div>
          </div>
        </div>

        {/* Right: customer info + payment panel */}
        <div className="space-y-6">
          {/* Customer info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <SkeletonBox className="h-5 w-36 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <SkeletonBox className="h-3.5 w-20" />
                  <SkeletonBox className="h-3.5 w-28" />
                </div>
              ))}
            </div>
          </div>

          {/* Payment status panel */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <SkeletonBox className="h-5 w-32 mb-4" />
            <div className="space-y-3">
              <div className="flex justify-between">
                <SkeletonBox className="h-3.5 w-20" />
                <SkeletonBox className="h-5 w-24 rounded-full" />
              </div>
              <div className="flex gap-2 pt-2">
                <SkeletonBox className="h-9 flex-1 rounded-lg" />
                <SkeletonBox className="h-9 flex-1 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
