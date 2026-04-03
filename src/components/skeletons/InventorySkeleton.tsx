import { SkeletonBox } from "./primitives";

function TableSkeleton({ cols, rows }: { cols: number; rows: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-y border-gray-100 dark:border-gray-800">
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="py-3 px-4">
                <SkeletonBox className="h-3 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              {Array.from({ length: cols }).map((_, j) => (
                <td key={j} className="py-3 px-4">
                  {j === cols - 1 ? (
                    <SkeletonBox className="h-4 w-16 ml-auto" />
                  ) : j === 2 ? (
                    <SkeletonBox className="h-5 w-12 rounded-full" />
                  ) : (
                    <SkeletonBox className="h-4 w-28" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function InventorySkeleton() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb placeholder */}
      <SkeletonBox className="h-5 w-48" />

      {/* Low stock panel */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="mb-4">
          <SkeletonBox className="h-5 w-64 mb-2" />
          <SkeletonBox className="h-3.5 w-80" />
        </div>
        <TableSkeleton cols={4} rows={5} />
      </div>

      {/* Recent movements panel */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="mb-4">
          <SkeletonBox className="h-5 w-56 mb-2" />
          <SkeletonBox className="h-3.5 w-80" />
        </div>
        <TableSkeleton cols={5} rows={5} />
      </div>
    </div>
  );
}
