import { SkeletonBox } from "@/components/skeletons/primitives";

function SkeletonCard() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                            <SkeletonBox className="h-4 w-4 rounded" />
                            <SkeletonBox className="h-5 w-40 rounded" />
                            <SkeletonBox className="h-5 w-24 rounded-full" />
                        </div>
                        <div className="flex items-center gap-1.5">
                            <SkeletonBox className="h-4 w-4 rounded" />
                            <SkeletonBox className="h-4 w-32 rounded" />
                        </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                        <SkeletonBox className="w-8 h-8 rounded-lg" />
                        <SkeletonBox className="w-8 h-8 rounded-lg" />
                        <SkeletonBox className="w-8 h-8 rounded-lg" />
                    </div>
                </div>
            </div>

            {/* Payment & Customer Details */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white dark:bg-gray-800">
                <div>
                    <SkeletonBox className="h-3 w-36 rounded mb-4" />
                    <div className="space-y-3">
                        {[70, 60, 50].map((w, i) => (
                            <div key={i} className="flex items-center justify-between gap-2">
                                <SkeletonBox className="h-3.5 w-14 rounded" />
                                <SkeletonBox className="h-3.5 rounded" width={`${w}%`} />
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <SkeletonBox className="h-3 w-32 rounded mb-4" />
                    <div className="space-y-3">
                        {[65, 80].map((w, i) => (
                            <div key={i} className="flex items-center justify-between gap-2">
                                <SkeletonBox className="h-3.5 w-14 rounded" />
                                <SkeletonBox className="h-3.5 rounded" width={`${w}%`} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Price Summary */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                <SkeletonBox className="h-3 w-28 rounded mb-4" />
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between gap-2">
                            <SkeletonBox className="h-3.5 w-16 rounded" />
                            <SkeletonBox className="h-3.5 w-14 rounded" />
                        </div>
                    ))}
                    <div className="flex items-center justify-between gap-2 pt-1">
                        <SkeletonBox className="h-4 w-12 rounded" />
                        <SkeletonBox className="h-5 w-20 rounded" />
                    </div>
                </div>
            </div>

            {/* Items to Pack */}
            <div className="p-4 flex-1">
                <SkeletonBox className="h-3 w-24 rounded mb-4" />
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3 items-center">
                            <SkeletonBox className="w-10 h-10 rounded-lg shrink-0" />
                            <div className="flex-1 space-y-1.5">
                                <SkeletonBox className="h-3.5 w-full rounded" />
                                <SkeletonBox className="h-3 w-1/2 rounded" />
                            </div>
                            <SkeletonBox className="w-10 h-8 rounded-lg shrink-0" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                <SkeletonBox className="h-10 w-40 rounded-lg" />
            </div>
        </div>
    );
}

export function PackagingWorkflowSkeleton() {
    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-2">
                    <SkeletonBox className="h-7 w-52 rounded" />
                    <SkeletonBox className="h-4 w-72 rounded" />
                </div>
                <SkeletonBox className="h-9 w-full sm:w-64 rounded-lg" />
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        </div>
    );
}
