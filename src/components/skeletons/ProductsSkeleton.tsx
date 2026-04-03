import { SkeletonBox } from "./primitives";

export function ProductsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page title + add button */}
      <div className="flex justify-between items-center">
        <SkeletonBox className="h-7 w-28" />
        <SkeletonBox className="h-9 w-28 rounded-lg" />
      </div>

      {/* Products table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {["Product Name", "Category", "Variants", "Status", "Actions"].map((_, i) => (
                  <th key={i} className="px-6 py-4">
                    <SkeletonBox className="h-3 w-20" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-t border-gray-100 dark:border-gray-700">
                  {/* Product name (2 lines) */}
                  <td className="px-6 py-4">
                    <SkeletonBox className="h-4 w-40 mb-1.5" />
                    <SkeletonBox className="h-3 w-28" />
                  </td>
                  {/* Category */}
                  <td className="px-6 py-4">
                    <SkeletonBox className="h-4 w-24" />
                  </td>
                  {/* Variants badge */}
                  <td className="px-6 py-4 text-center">
                    <SkeletonBox className="h-6 w-12 rounded-md mx-auto" />
                  </td>
                  {/* Status badge */}
                  <td className="px-6 py-4 text-center">
                    <SkeletonBox className="h-5 w-16 rounded-full mx-auto" />
                  </td>
                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
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
  );
}
