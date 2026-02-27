import React from "react";
import Link from "next/link";

interface LowStockAlert {
    id: string;
    sku: string;
    size: string;
    color: string;
    stockOnHand: number;
    lowStockThreshold: number;
    product: {
        nameKm: string;
        nameEn: string | null;
    };
}

interface PendingVerification {
    id: string;
    orderId: string;
    method: string;
    uploadedAt: Date;
    order: {
        orderCode: string;
        total: number;
        customer: {
            fullName: string;
        }
    };
}

interface DashboardAlertsProps {
    lowStockAlerts: LowStockAlert[];
    pendingVerifications: PendingVerification[];
}

export default function DashboardAlerts({
    lowStockAlerts,
    pendingVerifications,
}: DashboardAlertsProps) {
    const hasAlerts = lowStockAlerts.length > 0 || pendingVerifications.length > 0;

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Action Required
                    </h3>
                    <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
                        Important tasks and alerts that need your attention
                    </p>
                </div>
                {hasAlerts && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-500">
                        <span className="text-sm font-semibold">
                            {lowStockAlerts.length + pendingVerifications.length}
                        </span>
                    </div>
                )}
            </div>

            {!hasAlerts ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-50 text-success-500 dark:bg-success-500/10 mb-4">
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <p className="text-gray-800 dark:text-white/90 font-medium">All caught up!</p>
                    <p className="text-gray-500 text-sm mt-1">No alerts or pending verifications.</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 max-h-[400px]">
                    {/* Pending Verifications */}
                    {pendingVerifications.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-warning-500"></span>
                                Pending Payments ({pendingVerifications.length})
                            </h4>
                            <div className="space-y-3">
                                {pendingVerifications.map((slip) => (
                                    <Link href={`/admin/orders/${slip.orderId}`} key={slip.id} className="block group">
                                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 hover:border-brand-500/30 hover:bg-brand-50/50 transition-colors dark:border-gray-800 dark:bg-gray-800/50 dark:hover:border-brand-500/30 dark:hover:bg-brand-500/10">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                                                    {slip.order?.orderCode}
                                                </span>
                                                <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full dark:bg-brand-500/10 dark:text-brand-400">
                                                    Verify
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs text-gray-500 line-clamp-1">
                                                    {slip.order?.customer?.fullName} • {slip.method}
                                                </span>
                                                <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                                                    ${slip.order?.total?.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Low Stock Alerts */}
                    {lowStockAlerts.length > 0 && (
                        <div className={pendingVerifications.length > 0 ? "pt-2" : ""}>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-error-500"></span>
                                Low Stock ({lowStockAlerts.length})
                            </h4>
                            <div className="space-y-3">
                                {lowStockAlerts.map((alert) => (
                                    <Link href={`/admin/inventory?sku=${alert.sku}`} key={alert.id} className="block group">
                                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 hover:border-error-500/30 hover:bg-error-50/50 transition-colors dark:border-gray-800 dark:bg-gray-800/50 dark:hover:border-error-500/30 dark:hover:bg-error-500/10">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-medium text-gray-800 dark:text-gray-200 text-sm line-clamp-1 pr-2">
                                                    {alert.product.nameKm}
                                                </span>
                                                <span className="text-xs font-semibold text-error-600 bg-error-50 px-2 py-0.5 rounded-full dark:bg-error-500/10 dark:text-error-400 whitespace-nowrap">
                                                    {alert.stockOnHand}/{alert.lowStockThreshold} left
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs text-gray-500">
                                                    SKU: {alert.sku}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {alert.size} • {alert.color}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
