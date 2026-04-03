import { SkeletonBox } from "./primitives";

export function CategoriesSkeleton() {
  return (
    <div className="space-y-6">
      {/* Title + add button */}
      <div className="flex justify-between items-center">
        <SkeletonBox className="h-7 w-32" />
        <SkeletonBox className="h-9 w-32 rounded-lg" />
      </div>

      {/* Categories table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {["Name (KH)", "Name (EN)", "Order", "Status", "Actions"].map((_, i) => (
                  <th key={i} className="px-6 py-4">
                    <SkeletonBox className="h-3 w-20" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-t border-gray-100 dark:border-gray-700">
                  <td className="px-6 py-4">
                    <SkeletonBox className="h-4 w-28" />
                  </td>
                  <td className="px-6 py-4">
                    <SkeletonBox className="h-4 w-24" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <SkeletonBox className="h-4 w-6 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <SkeletonBox className="h-5 w-16 rounded-full mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      <SkeletonBox className="h-5 w-5 rounded" />
                      <SkeletonBox className="h-5 w-5 rounded" />
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
