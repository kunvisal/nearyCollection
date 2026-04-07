"use client";

import React, { useState, useEffect } from "react";
import { Truck, Phone, CheckCircle2, XCircle, Search, MapPin, User, Loader2, ChevronDown, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { DeliverySkeleton } from "@/components/skeletons/DeliverySkeleton";
import { Modal } from "@/components/ui/modal";

type Order = {
    id: string;
    orderCode: string;
    createdAt: string;
    total: number;
    paymentMethod: string;
    deliveryService?: string | null;
    paymentStatus: string;
    customer: {
        fullName: string;
        phone: string;
    };
    shippingAddress: any;
    note?: string;
    items: {
        qty: number;
        productNameSnapshot: string;
        colorSnapshot: string;
        sizeSnapshot: string;
    }[];
};

const DELIVERY_SERVICE_LABELS: Record<string, string> = {
    JALAT: "Jalat (ចល័ត)",
    VET: "VET (វីរប៊ុនថាំ)",
    JT: "J&T",
};

export default function DeliveryWorkflowPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Collapse state
    const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

    // Multi-select state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Single-order confirmation modal
    const [confirmSingle, setConfirmSingle] = useState<{ id: string; action: "DELIVERED" | "FAILED" } | null>(null);

    // Bulk confirmation modal
    const [confirmBulkAction, setConfirmBulkAction] = useState<"DELIVERED" | "FAILED" | null>(null);

    const { addToast } = useToast();

    const fetchShippedOrders = async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/admin/orders?status=SHIPPED&limit=50");
            const json = await res.json();
            if (json.data) setOrders(json.data);
        } catch (error) {
            console.error("Failed to fetch orders for delivery", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchShippedOrders();
    }, []);

    const filteredOrders = orders.filter(o =>
        o.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customer.phone.includes(searchQuery)
    );

    // Prune selectedIds when search changes
    useEffect(() => {
        setSelectedIds(prev => {
            const visibleIds = new Set(filteredOrders.map(o => o.id));
            const next = new Set([...prev].filter(id => visibleIds.has(id)));
            return next.size === prev.size ? prev : next;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery]);

    // --- Collapse helpers ---
    const toggleCollapse = (id: string) => {
        setCollapsedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const allCollapsed = filteredOrders.length > 0 && filteredOrders.every(o => collapsedIds.has(o.id));

    const toggleCollapseAll = () => {
        if (allCollapsed) {
            setCollapsedIds(new Set());
        } else {
            setCollapsedIds(new Set(filteredOrders.map(o => o.id)));
        }
    };

    // --- Selection helpers ---
    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const allVisibleSelected = filteredOrders.length > 0 && filteredOrders.every(o => selectedIds.has(o.id));

    const toggleSelectAll = () => {
        if (allVisibleSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredOrders.map(o => o.id)));
        }
    };

    // --- Single order update ---
    const executeSingleUpdate = async (orderId: string, action: "DELIVERED" | "FAILED") => {
        setConfirmSingle(null);
        setProcessingId(orderId);
        try {
            const newStatus = action === "FAILED" ? "CANCELLED" : "DELIVERED";
            const payload: Record<string, string> = { status: newStatus };
            if (action === "DELIVERED") payload.paymentStatus = "PAID";

            const res = await fetch(`/api/admin/orders/${orderId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setOrders(prev => prev.filter(o => o.id !== orderId));
                addToast("success", "Success", action === "DELIVERED" ? "Order delivered successfully." : "Order marked as failed / returned.");
            } else {
                const json = await res.json();
                addToast("error", "Failed", json.error || "Update failed");
            }
        } catch (error) {
            console.error(error);
            addToast("error", "Error", "An unexpected error occurred");
        } finally {
            setProcessingId(null);
        }
    };

    // --- Bulk update ---
    const executeBulkUpdate = async (action: "DELIVERED" | "FAILED") => {
        setConfirmBulkAction(null);
        const ids = [...selectedIds];
        setSelectedIds(new Set());

        const newStatus = action === "FAILED" ? "CANCELLED" : "DELIVERED";
        const payload: Record<string, string> = { status: newStatus };
        if (action === "DELIVERED") payload.paymentStatus = "PAID";

        const results = await Promise.allSettled(
            ids.map(id =>
                fetch(`/api/admin/orders/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                })
            )
        );

        const succeeded = ids.filter((_, i) => {
            const r = results[i];
            return r.status === "fulfilled" && (r as PromiseFulfilledResult<Response>).value.ok;
        });
        const failCount = ids.length - succeeded.length;

        setOrders(prev => prev.filter(o => !succeeded.includes(o.id)));

        if (succeeded.length > 0)
            addToast("success", "Success", action === "DELIVERED"
                ? `${succeeded.length} order${succeeded.length !== 1 ? "s" : ""} delivered.`
                : `${succeeded.length} order${succeeded.length !== 1 ? "s" : ""} marked failed / returned.`
            );
        if (failCount > 0)
            addToast("error", "Partial Failure", `${failCount} order${failCount !== 1 ? "s" : ""} failed to update.`);
    };

    if (isLoading) return <DeliverySkeleton />;

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Truck className="w-6 h-6 text-purple-500" />
                        Out for Delivery
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Orders currently with the delivery team.</p>
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search deliveries..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm dark:text-white"
                    />
                </div>
            </div>

            {/* Bulk actions toolbar */}
            {filteredOrders.length > 0 && (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    {/* Left: select-all + collapse-all */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-700 dark:text-gray-300">
                            <input
                                type="checkbox"
                                checked={allVisibleSelected}
                                onChange={toggleSelectAll}
                                className="w-4 h-4 accent-purple-600 cursor-pointer rounded"
                            />
                            <span>{allVisibleSelected ? "Deselect all" : "Select all"}</span>
                        </label>

                        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />

                        <button
                            onClick={toggleCollapseAll}
                            className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors select-none"
                        >
                            <ChevronsUpDown className="w-4 h-4" />
                            <span>{allCollapsed ? "Expand all" : "Collapse all"}</span>
                        </button>
                    </div>

                    {/* Right: bulk action buttons (fade in when something selected) */}
                    <div className={`flex items-center gap-2 transition-all duration-300 ${selectedIds.size > 0 ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                        <button
                            onClick={() => setConfirmBulkAction("FAILED")}
                            className="px-3 py-2 bg-white dark:bg-gray-800 border-2 border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg font-medium flex items-center gap-1.5 text-sm transition-colors whitespace-nowrap"
                        >
                            <XCircle className="w-4 h-4" />
                            Fail Selected ({selectedIds.size})
                        </button>
                        <button
                            onClick={() => setConfirmBulkAction("DELIVERED")}
                            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-1.5 text-sm transition-colors whitespace-nowrap"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Deliver Selected ({selectedIds.size})
                        </button>
                    </div>
                </div>
            )}

            {filteredOrders.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <Truck className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">All deliveries complete!</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">There are no orders out for delivery right now.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredOrders.map(order => {
                        const isCollapsed = collapsedIds.has(order.id);
                        const isSelected = selectedIds.has(order.id);
                        const totalQty = order.items ? order.items.reduce((s, i) => s + i.qty, 0) : 0;

                        return (
                            <div
                                key={order.id}
                                className={`bg-white dark:bg-gray-800 rounded-xl border shadow-sm overflow-hidden flex flex-col transition-colors duration-200 ${
                                    isSelected
                                        ? "border-purple-400 dark:border-purple-500 ring-2 ring-purple-200 dark:ring-purple-900/50"
                                        : "border-gray-200 dark:border-gray-700"
                                }`}
                            >
                                {/* Top accent bar */}
                                <div className={`h-1.5 w-full ${order.paymentStatus === "PAID" ? "bg-green-500" : "bg-orange-500"}`} />

                                {/* Header — always visible */}
                                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                                    <div className="flex justify-between items-start gap-2">
                                        {/* Left: checkbox + info */}
                                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSelect(order.id)}
                                                className="w-4 h-4 mt-0.5 accent-purple-600 cursor-pointer rounded shrink-0"
                                            />
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                                                    #{order.orderCode}
                                                    {order.paymentStatus !== "PAID" && (
                                                        <span className="text-[10px] uppercase font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-sm">Collect COD</span>
                                                    )}
                                                </h3>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    <span className="font-medium text-purple-600 dark:text-purple-400">${Number(order.total).toFixed(2)}</span>
                                                    {" • "}{totalQty} item{totalQty !== 1 ? "s" : ""}
                                                </div>
                                                {/* Customer summary — shown only when collapsed */}
                                                <div className={`transition-all duration-300 overflow-hidden ${isCollapsed ? "max-h-12 opacity-100 mt-1.5" : "max-h-0 opacity-0"}`}>
                                                    <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        {order.customer.fullName} · {order.customer.phone}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: phone + collapse toggle */}
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <a
                                                href={`tel:${order.customer.phone}`}
                                                className="inline-flex items-center justify-center p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-full transition-colors"
                                            >
                                                <Phone className="w-4 h-4" />
                                            </a>
                                            <button
                                                onClick={() => toggleCollapse(order.id)}
                                                className="inline-flex items-center justify-center p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full transition-colors"
                                                title={isCollapsed ? "Expand" : "Collapse"}
                                            >
                                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Collapsible body */}
                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? "max-h-0 opacity-0" : "max-h-[800px] opacity-100"}`}>

                                    {/* Address & Customer */}
                                    <div className="p-4 flex-1 flex flex-col gap-3">
                                        <div className="flex items-start gap-2.5">
                                            <User className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{order.customer.fullName}</div>
                                                <div className="text-xs text-gray-500">{order.customer.phone}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-2.5">
                                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                            <div className="text-sm text-gray-700 dark:text-gray-300">
                                                <div className="line-clamp-2">
                                                    {(order.shippingAddress as any)?.detailedAddress || "No address details provided."}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Delivery Service: {DELIVERY_SERVICE_LABELS[order.deliveryService || ""] || "-"}
                                                </div>
                                            </div>
                                        </div>

                                        {order.note && (
                                            <div className="mt-1 text-xs bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 p-2.5 rounded-lg border border-yellow-100 dark:border-yellow-900/50">
                                                {order.note}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setConfirmSingle({ id: order.id, action: "FAILED" })}
                                            disabled={processingId === order.id}
                                            className="py-2.5 bg-white dark:bg-gray-800 border-2 border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
                                        >
                                            {processingId === order.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <XCircle className="w-4 h-4" />
                                                    Fail / Return
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setConfirmSingle({ id: order.id, action: "DELIVERED" })}
                                            disabled={processingId === order.id}
                                            className="py-2.5 bg-green-600 hover:bg-green-700 text-white shadow-sm rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
                                        >
                                            {processingId === order.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Delivered
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Single-order confirmation modal */}
            <Modal isOpen={!!confirmSingle} onClose={() => setConfirmSingle(null)} className="max-w-[400px] p-6">
                <div className="flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                        confirmSingle?.action === "DELIVERED"
                            ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-500"
                            : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-500"
                    }`}>
                        {confirmSingle?.action === "DELIVERED"
                            ? <CheckCircle2 className="w-8 h-8" />
                            : <XCircle className="w-8 h-8" />
                        }
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {confirmSingle?.action === "DELIVERED" ? "Confirm Delivered" : "Confirm Fail / Return"}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        {confirmSingle?.action === "DELIVERED"
                            ? "Mark this order as successfully delivered? Payment will also be marked as paid."
                            : "Mark this order as failed / returned? The order will be cancelled and stock will be restored."
                        }
                    </p>
                    <div className="flex w-full gap-3">
                        <button
                            onClick={() => setConfirmSingle(null)}
                            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => confirmSingle && executeSingleUpdate(confirmSingle.id, confirmSingle.action)}
                            className={`flex-1 px-4 py-2.5 text-white rounded-lg font-medium transition-colors ${
                                confirmSingle?.action === "DELIVERED"
                                    ? "bg-green-600 hover:bg-green-700"
                                    : "bg-red-600 hover:bg-red-700"
                            }`}
                        >
                            Yes, Confirm
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Bulk confirmation modal */}
            <Modal isOpen={!!confirmBulkAction} onClose={() => setConfirmBulkAction(null)} className="max-w-[400px] p-6">
                <div className="flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                        confirmBulkAction === "DELIVERED"
                            ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-500"
                            : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-500"
                    }`}>
                        {confirmBulkAction === "DELIVERED"
                            ? <CheckCircle2 className="w-8 h-8" />
                            : <XCircle className="w-8 h-8" />
                        }
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {confirmBulkAction === "DELIVERED"
                            ? `Deliver ${selectedIds.size} Orders`
                            : `Fail / Return ${selectedIds.size} Orders`
                        }
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        {confirmBulkAction === "DELIVERED"
                            ? `Mark all ${selectedIds.size} selected order${selectedIds.size !== 1 ? "s" : ""} as delivered? Payment will also be marked as paid.`
                            : `Mark all ${selectedIds.size} selected order${selectedIds.size !== 1 ? "s" : ""} as failed / returned? They will be cancelled and stock restored.`
                        }
                    </p>
                    <div className="flex w-full gap-3">
                        <button
                            onClick={() => setConfirmBulkAction(null)}
                            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => confirmBulkAction && executeBulkUpdate(confirmBulkAction)}
                            className={`flex-1 px-4 py-2.5 text-white rounded-lg font-medium transition-colors ${
                                confirmBulkAction === "DELIVERED"
                                    ? "bg-green-600 hover:bg-green-700"
                                    : "bg-red-600 hover:bg-red-700"
                            }`}
                        >
                            Yes, Confirm All
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
