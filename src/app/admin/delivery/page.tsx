"use client";

import React, { useState, useEffect } from "react";
import { Truck, Phone, CheckCircle2, XCircle, Search, MapPin, User } from "lucide-react";
import { format } from "date-fns";

type Order = {
    id: string;
    orderCode: string;
    createdAt: string;
    total: number;
    paymentMethod: string;
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

export default function DeliveryWorkflowPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchShippedOrders = async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/admin/orders?status=SHIPPED&limit=50");
            const json = await res.json();
            if (json.data) {
                setOrders(json.data);
            }
        } catch (error) {
            console.error("Failed to fetch orders for delivery", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchShippedOrders();
    }, []);

    const handleUpdateDeliveryStatus = async (orderId: string, status: 'DELIVERED' | 'FAILED') => {
        const actionText = status === 'DELIVERED' ? 'delivered successfully' : 'delivery failed';
        if (!confirm(`Mark this order as ${actionText}?`)) return;

        setProcessingId(orderId);
        try {
            // Wait, we need to mark it DELIVERED if successful, or potentially handle FAILED
            // The existing backend only accepts standard states. We'll use 'DELIVERED' and maybe 'CANCELLED' or a new 'FAILED' if we add it.
            // But since 'CANCELLED' implies returned to stock, we'll map FAILED to CANCELLED for now or keep in SHIPPED with a note?
            // Actually, the simplest for FAILED is just to Cancel or keep it and require manual review. Let's just use CANCELLED.
            const newStatus = status === 'FAILED' ? 'CANCELLED' : 'DELIVERED';

            const res = await fetch(`/api/admin/orders/${orderId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                // Remove from local state immediately for snappy UI
                setOrders(prev => prev.filter(o => o.id !== orderId));
            } else {
                const json = await res.json();
                alert(json.error || "Update failed");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred");
        } finally {
            setProcessingId(null);
        }
    };

    const filteredOrders = orders.filter(o =>
        o.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customer.phone.includes(searchQuery)
    );

    return (
        <div className="space-y-6">
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

            {isLoading ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading deliveries...</div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <Truck className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">All deliveries complete!</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">There are no orders out for delivery right now.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredOrders.map(order => (
                        <div key={order.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col relative group">

                            {/* Top Accent Bar based on payment status */}
                            <div className={`h-1.5 w-full ${order.paymentStatus === 'PAID' ? 'bg-green-500' : 'bg-orange-500'}`} />

                            {/* Header */}
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        #{order.orderCode}
                                        {order.paymentStatus !== 'PAID' && (
                                            <span className="text-[10px] uppercase font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-sm">Collect COD</span>
                                        )}
                                    </h3>
                                    <div className="text-xs text-gray-500 mt-1">
                                        <span className="font-medium text-purple-600 dark:text-purple-400">${Number(order.total).toFixed(2)}</span> total
                                        {' • '} {order.items ? order.items.reduce((s, i) => s + i.qty, 0) : 0} items
                                    </div>
                                </div>
                                <div className="text-right">
                                    <a
                                        href={`tel:${order.customer.phone}`}
                                        className="inline-flex items-center justify-center p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-full transition-colors"
                                    >
                                        <Phone className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>

                            {/* Address & Customer */}
                            <div className="p-4 flex-1 flex flex-col gap-3">

                                <div className="flex items-start gap-2.5">
                                    <User className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{order.customer.fullName}</div>
                                        <div className="text-xs text-gray-500">{order.customer.phone}</div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2.5">
                                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                    <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                                        {(order.shippingAddress as any)?.detailedAddress || "No address details provided."}
                                    </div>
                                </div>

                                {order.note && (
                                    <div className="mt-2 text-xs bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 p-2.5 rounded-lg border border-yellow-100 dark:border-yellow-900/50">
                                        {order.note}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleUpdateDeliveryStatus(order.id, 'FAILED')}
                                    disabled={processingId === order.id}
                                    className="py-2.5 bg-white dark:bg-gray-800 border-2 border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    <XCircle className="w-4 h-4" />
                                    Fail / Return
                                </button>
                                <button
                                    onClick={() => handleUpdateDeliveryStatus(order.id, 'DELIVERED')}
                                    disabled={processingId === order.id}
                                    className="py-2.5 bg-green-600 hover:bg-green-700 text-white shadow-sm rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Delivered
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
