"use client";

import React, { useState, useEffect } from "react";
import { Package, Phone, CheckCircle2, Search, ArrowRight, User, Loader2 } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import { useToast } from "@/context/ToastContext";

type OrderItem = {
    id: string;
    productNameSnapshot: string;
    skuSnapshot: string;
    qty: number;
    colorSnapshot?: string;
    sizeSnapshot?: string;
    variant: {
        product: {
            images: { url: string }[];
        }
    }
};

type Order = {
    id: string;
    orderCode: string;
    createdAt: string;
    customer: {
        fullName: string;
        phone: string;
    };
    shippingAddress: any;
    note?: string;
    items: OrderItem[];
};

export default function PackagingWorkflowPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [processingId, setProcessingId] = useState<string | null>(null);
    const { addToast } = useToast();

    const fetchProcessingOrders = async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/admin/orders?status=PROCESSING&limit=50");
            const json = await res.json();
            if (json.data) {
                setOrders(json.data);
            }
        } catch (error) {
            console.error("Failed to fetch orders for packaging", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProcessingOrders();
    }, []);

    const handleConfirmPackaging = async (orderId: string) => {
        if (!confirm("Confirm this order is packed and ready for delivery?")) return;

        setProcessingId(orderId);
        try {
            const res = await fetch(`/api/admin/orders/${orderId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "SHIPPED" })
            });

            if (res.ok) {
                // Remove from local state immediately for snappy UI
                setOrders(prev => prev.filter(o => o.id !== orderId));
                addToast("success", "Success", "Order confirmed packed & ready for delivery.");
            } else {
                const json = await res.json();
                addToast("error", "Failed", json.error || "Update failed");
            }
        } catch (error) {
            console.error(error);
            addToast("error", "Error", "An unexpected error occurred.");
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
                        <Package className="w-6 h-6 text-blue-500" />
                        Packaging Workflow
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Orders currently processing and waiting to be packed.</p>
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search by code, name, phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading processing orders...</div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">All caught up!</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">There are no orders waiting to be packed right now.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {filteredOrders.map(order => (
                        <div key={order.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
                            {/* Header */}
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start bg-gray-50 dark:bg-gray-800/50">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-gray-900 dark:text-white">#{order.orderCode}</span>
                                        <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full font-medium">
                                            {format(new Date(order.createdAt), "HH:mm, dd MMM")}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm mt-2">
                                        <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 font-medium">
                                            <User className="w-4 h-4 text-gray-400" />
                                            {order.customer.fullName}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <a
                                        href={`tel:${order.customer.phone}`}
                                        className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 rounded-lg transition-colors flex items-center justify-center"
                                        title="Call Customer"
                                    >
                                        <Phone className="w-4 h-4" />
                                    </a>
                                    <a
                                        href={`https://t.me/+855${order.customer.phone.replace(/^0+/, '')}`}
                                        target="_blank" rel="noreferrer"
                                        className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 rounded-lg transition-colors flex items-center justify-center font-medium text-xs"
                                        title="Telegram Customer"
                                    >
                                        TG
                                    </a>
                                </div>
                            </div>

                            {/* Items List */}
                            <div className="p-4 flex-1">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Items to Pack</h4>
                                <div className="space-y-3">
                                    {order.items && order.items.map(item => (
                                        <div key={item.id} className="flex gap-3 items-center">
                                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden shrink-0">
                                                {item.variant?.product?.images?.[0] ? (
                                                    <Image src={item.variant.product.images[0].url} alt="Product" width={40} height={40} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Package className="w-5 h-5 m-2.5 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-900 dark:text-white text-sm truncate">{item.productNameSnapshot}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    {item.skuSnapshot} {item.colorSnapshot && `| ${item.colorSnapshot}`} {item.sizeSnapshot && `| ${item.sizeSnapshot}`}
                                                </div>
                                            </div>
                                            <div className="font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg">
                                                x{item.qty}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {order.note && (
                                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-900/50">
                                        <span className="text-xs font-bold text-yellow-800 dark:text-yellow-500 uppercase">Note: </span>
                                        <span className="text-sm text-yellow-800 dark:text-yellow-400">{order.note}</span>
                                    </div>
                                )}
                            </div>

                            {/* Action Footer */}
                            <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                                <button
                                    onClick={() => handleConfirmPackaging(order.id)}
                                    disabled={processingId === order.id}
                                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-75 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors w-full sm:w-auto min-w-[160px]"
                                >
                                    {processingId === order.id ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-5 h-5" />
                                            Confirm Packed
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

