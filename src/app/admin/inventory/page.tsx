import React, { Suspense } from "react";
import { InventoryAlertService } from "@/lib/services/inventoryAlertService";
import { Metadata } from "next";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import Link from "next/link";
import { formatCambodiaDate } from "@/lib/utils/timezone";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { InventorySkeleton } from "@/components/skeletons/InventorySkeleton";
import { PackagePlus } from "lucide-react";

export const metadata: Metadata = {
    title: "Inventory Alerts | Neary Collection Admin",
    description: "View low stock alerts and recent inventory movements.",
};

export default function InventoryAlertsPage() {
    return (
        <Suspense fallback={<InventorySkeleton />}>
            <InventoryContent />
        </Suspense>
    );
}

async function InventoryContent() {
    const { lowStockVariants, recentMoves } = await InventoryAlertService.getDashboardAlerts();

    return (
        <div className="space-y-6">
            <PageBreadcrumb pageTitle="Inventory Alerts" />

            {/* Low Stock Alerts */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Low Stock Variants (≤ 5 items)
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        These products are running low and may need restocking soon.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <Table className="min-w-max">
                        <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                            <TableRow>
                                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">
                                    Product
                                </TableCell>
                                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">
                                    Variant Attributes
                                </TableCell>
                                <TableCell isHeader className="py-3 px-4 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 whitespace-nowrap">
                                    Current Stock
                                </TableCell>
                                <TableCell isHeader className="py-3 px-4 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400 whitespace-nowrap">
                                    Action
                                </TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {lowStockVariants.map((variant) => {
                                const attributesStr = [variant.size, variant.color].filter(Boolean).join(" / ");

                                return (
                                    <TableRow key={variant.id}>
                                        <TableCell className="py-3 text-theme-sm text-gray-800 dark:text-white/90 font-medium whitespace-nowrap">
                                            {variant.product.nameKm}
                                        </TableCell>
                                        <TableCell className="py-3 text-theme-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                            {attributesStr || "N/A"}
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-center whitespace-nowrap">
                                            <Badge
                                                color={variant.stockOnHand === 0 ? "error" : "warning"}
                                                size="sm"
                                            >
                                                {variant.stockOnHand} in stock
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-right whitespace-nowrap">
                                            <Link
                                                href={`/admin/products/${variant.productId}#variants`}
                                                className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800"
                                                title="Update Stock"
                                            >
                                                <PackagePlus size={20} />
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {lowStockVariants.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-6 text-center text-gray-500">
                                        No low stock alerts right now.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Recent Inventory Transactions */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 mt-8">
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Recent Inventory Movements
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Tracking recent stock changes from orders, additions, or manual overrides.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <Table className="min-w-max">
                        <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                            <TableRow>
                                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">
                                    Date
                                </TableCell>
                                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">
                                    Product Details
                                </TableCell>
                                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">
                                    Type
                                </TableCell>
                                <TableCell isHeader className="py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 whitespace-nowrap">
                                    Quantity Change
                                </TableCell>
                                <TableCell isHeader className="py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400 whitespace-nowrap">
                                    Reason
                                </TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {recentMoves.map((move) => (
                                <TableRow key={move.id}>
                                    <TableCell className="py-3 text-theme-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                        {formatCambodiaDate(move.createdAt, "dd MMM yyyy, HH:mm")}
                                    </TableCell>
                                    <TableCell className="py-3 text-theme-sm text-gray-800 dark:text-white/90 font-medium whitespace-nowrap">
                                        {move.variant.product.nameKm}
                                    </TableCell>
                                    <TableCell className="py-3 whitespace-nowrap">
                                        <Badge
                                            color={move.type === "IN" ? "success" : move.type === "OUT" ? "error" : "primary"}
                                            size="sm"
                                        >
                                            {move.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-3 text-center text-theme-sm text-gray-800 dark:text-white/90 font-medium whitespace-nowrap">
                                        {move.type === "OUT" || move.type === "DEDUCT" ? "-" : "+"}{move.qty}
                                    </TableCell>
                                    <TableCell className="py-3 text-right text-theme-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                        {move.note || "N/A"}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {recentMoves.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-6 text-center text-gray-500">
                                        No recent inventory transactions found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

        </div>
    );
}
