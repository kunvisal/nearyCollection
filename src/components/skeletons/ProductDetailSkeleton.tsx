import { SkeletonBox } from "./primitives";

export function ProductDetailSkeleton() {
  return (
    <div className="space-y-8 pb-10">
      {/* Header: back button + product name */}
      <div className="flex items-center gap-4">
        <SkeletonBox className="h-9 w-9 rounded-full" />
        <div className="space-y-1.5">
          <SkeletonBox className="h-7 w-48" />
          <SkeletonBox className="h-3.5 w-24" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: images panel */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <SkeletonBox className="h-5 w-20 mb-4" />
            {/* 2-col image grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonBox key={i} className="w-full aspect-square rounded-lg" />
              ))}
            </div>
            {/* Upload zone */}
            <SkeletonBox className="w-full h-24 rounded-xl" />
          </div>
        </div>

        {/* Right: variants table */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <SkeletonBox className="h-5 w-40" />
              <SkeletonBox className="h-9 w-28 rounded-lg" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    {["SKU / Attributes", "Cost Price", "Sale Price", "Stock", "Status", "Actions"].map((_, i) => (
                      <th key={i} className="px-4 py-3">
                        <SkeletonBox className="h-3 w-16" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="px-4 py-3">
                        <SkeletonBox className="h-4 w-24 mb-1" />
                        <SkeletonBox className="h-3 w-20" />
                      </td>
                      <td className="px-4 py-3">
                        <SkeletonBox className="h-4 w-14 ml-auto" />
                      </td>
                      <td className="px-4 py-3">
                        <SkeletonBox className="h-4 w-14 ml-auto" />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <SkeletonBox className="h-6 w-10 rounded-md mx-auto" />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <SkeletonBox className="h-5 w-14 rounded-full mx-auto" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <SkeletonBox className="h-7 w-7 rounded-md" />
                          <SkeletonBox className="h-7 w-7 rounded-md" />
                          <SkeletonBox className="h-7 w-7 rounded-md" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
