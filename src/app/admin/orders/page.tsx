"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Eye, Search, Printer, Calendar, RotateCcw } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { formatCambodiaDate } from "@/lib/utils/timezone";

type Order = {
    id: string;
    orderCode: string;
    createdAt: string;
    total: number;
    paymentMethod: string;
    paymentStatus: string;
    orderStatus: string;
    customer: {
        fullName: string;
        phone: string;
    };
};

function getTodayStr() {
    // Use browser local time (Cambodia UTC+7) instead of .toISOString() which
    // returns UTC and would give yesterday's date before 07:00 AM Cambodia time.
    return format(new Date(), "yyyy-MM-dd");
}

export default function OrdersPage() {
    const today = getTodayStr();

    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [paymentFilter, setPaymentFilter] = useState("");
    const [dateFrom, setDateFrom] = useState(today);
    const [dateTo, setDateTo] = useState(today);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Bulk select
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const fetchOrders = useCallback(async () => {
        try {
            setIsLoading(true);
            setSelectedIds(new Set()); // clear selection on new fetch
            const query = new URLSearchParams({
                page: page.toString(),
                limit: "20",
                ...(searchTerm && { search: searchTerm }),
                ...(statusFilter && { status: statusFilter }),
                ...(paymentFilter && { paymentStatus: paymentFilter }),
                ...(dateFrom && { dateFrom }),
                ...(dateTo && { dateTo }),
            });

            const res = await fetch(`/api/admin/orders?${query.toString()}`);
            const data = await res.json();

            if (res.ok) {
                setOrders(data.data);
                setTotalPages(data.meta.totalPages);
                setTotalCount(data.meta.total);
            } else {
                console.error("Failed to fetch orders:", data.error);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setIsLoading(false);
        }
    }, [page, searchTerm, statusFilter, paymentFilter, dateFrom, dateTo]);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchOrders();
        }, 300);
        return () => clearTimeout(debounce);
    }, [fetchOrders]);

    const resetToToday = () => {
        const t = getTodayStr();
        setDateFrom(t);
        setDateTo(t);
        setPage(1);
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'NEW': return "bg-blue-100 text-blue-800";
            case 'PROCESSING': return "bg-yellow-100 text-yellow-800";
            case 'SHIPPED': return "bg-purple-100 text-purple-800";
            case 'DELIVERED': return "bg-green-100 text-green-800";
            case 'CANCELLED': return "bg-red-100 text-red-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const getPaymentStyle = (status: string) => {
        switch (status) {
            case 'UNPAID': return "bg-yellow-100 text-yellow-800";
            case 'PENDING_VERIFICATION': return "bg-orange-100 text-orange-800";
            case 'PAID': return "bg-green-100 text-green-800";
            case 'FAILED': return "bg-red-100 text-red-800";
            case 'REFUNDED': return "bg-gray-100 text-gray-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    // Selection helpers
    const allCurrentSelected = orders.length > 0 && orders.every(o => selectedIds.has(o.id));
    const someSelected = selectedIds.size > 0;

    const toggleSelectAll = () => {
        if (allCurrentSelected) {
            setSelectedIds(prev => {
                const next = new Set(prev);
                orders.forEach(o => next.delete(o.id));
                return next;
            });
        } else {
            setSelectedIds(prev => {
                const next = new Set(prev);
                orders.forEach(o => next.add(o.id));
                return next;
            });
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handlePrintSelected = () => {
        const ids = Array.from(selectedIds).join(",");
        window.open(`/print/orders?ids=${ids}`, "_blank");
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Orders Dashboard</h1>
                {someSelected && (
                    <button
                        onClick={handlePrintSelected}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                    >
                        <Printer className="w-4 h-4" />
                        Print Selected ({selectedIds.size})
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-3">
                {/* Row 1: Search + Status + Payment */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Order Code, Customer Name, Phone..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="">All Order Statuses</option>
                        <option value="NEW">New</option>
                        <option value="PROCESSING">Processing</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                    <select
                        value={paymentFilter}
                        onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="">All Payment Statuses</option>
                        <option value="UNPAID">Unpaid</option>
                        <option value="PENDING_VERIFICATION">Pending Verification</option>
                        <option value="PAID">Paid</option>
                        <option value="FAILED">Failed</option>
                    </select>
                </div>

                {/* Row 2: Date range */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1 text-sm text-gray-500 font-medium">
                        <Calendar className="w-4 h-4" />
                        Date Range:
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={dateFrom}
                            max={dateTo || undefined}
                            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        <span className="text-gray-400 text-sm">→</span>
                        <input
                            type="date"
                            value={dateTo}
                            min={dateFrom || undefined}
                            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                    <button
                        onClick={resetToToday}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Today
                    </button>
                    {!isLoading && (
                        <span className="text-sm text-gray-500 ml-auto">
                            {totalCount} order{totalCount !== 1 ? "s" : ""} found
                        </span>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300">
                            <tr>
                                <th className="px-4 py-4 w-10">
                                    <input
                                        type="checkbox"
                                        checked={allCurrentSelected}
                                        onChange={toggleSelectAll}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        title="Select all on this page"
                                    />
                                </th>
                                <th className="px-4 py-4 font-semibold">Order ID</th>
                                <th className="px-4 py-4 font-semibold">Date</th>
                                <th className="px-4 py-4 font-semibold">Customer</th>
                                <th className="px-4 py-4 font-semibold text-center">Payment Status</th>
                                <th className="px-4 py-4 font-semibold text-center">Order Status</th>
                                <th className="px-4 py-4 font-semibold text-right">Total</th>
                                <th className="px-4 py-4 font-semibold text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                        Loading orders...
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                        No orders found matching the criteria.
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr
                                        key={order.id}
                                        className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${selectedIds.has(order.id) ? "bg-indigo-50 dark:bg-indigo-900/20" : ""}`}
                                    >
                                        <td className="px-4 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(order.id)}
                                                onChange={() => toggleSelect(order.id)}
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-4 py-4 font-medium text-gray-900 dark:text-white">
                                            {order.orderCode}
                                        </td>
                                        <td className="px-4 py-4">
                                            {formatCambodiaDate(order.createdAt, "dd MMM yyyy, HH:mm")}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="font-medium text-gray-900 dark:text-white">{order.customer.fullName}</div>
                                            <div className="text-xs text-gray-500">{order.customer.phone}</div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getPaymentStyle(order.paymentStatus)}`}>
                                                {order.paymentStatus.replace('_', ' ')}
                                            </span>
                                            <div className="text-[10px] text-gray-400 mt-1 uppercase">{order.paymentMethod}</div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(order.orderStatus)}`}>
                                                {order.orderStatus}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-right font-medium text-gray-900 dark:text-white">
                                            ${Number(order.total).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/admin/orders/${order.id}`}
                                                    className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View
                                                </Link>
                                                <Link
                                                    href={`/print/order/${order.id}`}
                                                    target="_blank"
                                                    className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                                                    title="Print this receipt"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!isLoading && totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                            Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
