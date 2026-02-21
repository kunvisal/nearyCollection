"use client";

import React, { useState, useEffect } from "react";
import { Eye, Search, Filter } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

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

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [paymentFilter, setPaymentFilter] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchOrders = async () => {
        try {
            setIsLoading(true);
            const query = new URLSearchParams({
                page: page.toString(),
                limit: "10",
                ...(searchTerm && { search: searchTerm }),
                ...(statusFilter && { status: statusFilter }),
                ...(paymentFilter && { paymentStatus: paymentFilter }),
            });

            const res = await fetch(`/api/admin/orders?${query.toString()}`);
            const data = await res.json();

            if (res.ok) {
                setOrders(data.data);
                setTotalPages(data.meta.totalPages);
            } else {
                console.error("Failed to fetch orders:", data.error);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchOrders();
        }, 300); // 300ms debounce for search

        return () => clearTimeout(debounce);
    }, [page, searchTerm, statusFilter, paymentFilter]);

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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Orders Dashboard</h1>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
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
                    {/* Status Filter */}
                    <div>
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
                    </div>
                    {/* Payment Filter */}
                    <div>
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
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Order ID</th>
                                <th className="px-6 py-4 font-semibold">Date</th>
                                <th className="px-6 py-4 font-semibold">Customer</th>
                                <th className="px-6 py-4 font-semibold text-center">Payment Status</th>
                                <th className="px-6 py-4 font-semibold text-center">Order Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Total</th>
                                <th className="px-6 py-4 font-semibold text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        Loading orders...
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        No orders found matching the criteria.
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            {order.orderCode}
                                        </td>
                                        <td className="px-6 py-4">
                                            {format(new Date(order.createdAt), "dd MMM yyyy, HH:mm")}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900 dark:text-white">{order.customer.fullName}</div>
                                            <div className="text-xs text-gray-500">{order.customer.phone}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getPaymentStyle(order.paymentStatus)}`}>
                                                {order.paymentStatus.replace('_', ' ')}
                                            </span>
                                            <div className="text-[10px] text-gray-400 mt-1 uppercase">{order.paymentMethod}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(order.orderStatus)}`}>
                                                {order.orderStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                                            ${Number(order.total).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link href={`/admin/orders/${order.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                                                <Eye className="w-4 h-4" />
                                                View
                                            </Link>
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
