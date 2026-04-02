"use client";

import React, { useState, useEffect } from "react";
import { Package, Phone, CheckCircle2, Search, User, Loader2 } from "lucide-react";
import { formatCambodiaDate } from "@/lib/utils/timezone";
import Image from "next/image";
import { useToast } from "@/context/ToastContext";
import { Modal } from "@/components/ui/modal";

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
    paymentMethod: string;
    paymentStatus: string;
    deliveryService?: string;
    subtotal: number;
    deliveryFee: number;
    discount: number;
    total: number;
    isFreeDelivery: boolean;
};

const DELIVERY_SERVICES: Record<string, string> = {
    JALAT: "JALAT Logistics",
    VET: "VET (វីរប៊ុនថាំ)",
    JT: "J&T Express"
};

export default function PackagingWorkflowPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [confirmOrderId, setConfirmOrderId] = useState<string | null>(null);
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

    const handleConfirmPackaging = async () => {
        if (!confirmOrderId) return;

        const orderId = confirmOrderId;
        setConfirmOrderId(null); // Close modal
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
                                            {formatCambodiaDate(order.createdAt, "HH:mm, dd MMM")}
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

                            {/* Customer & Delivery Details */}
                            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white dark:bg-gray-800">
                                <div>
                                    <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-2">Payment & Delivery</h4>
                                    <div className="space-y-2.5 text-sm mt-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">Method</span>
                                            <div className="flex-1 border-b border-dashed border-gray-300 dark:border-gray-600"></div>
                                            <span className="font-bold text-gray-900 dark:text-white">{order.paymentMethod}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">Service</span>
                                            <div className="flex-1 border-b border-dashed border-gray-300 dark:border-gray-600"></div>
                                            <span className="font-bold text-gray-900 dark:text-white">
                                                {order.deliveryService ? (DELIVERY_SERVICES[order.deliveryService] || order.deliveryService) : 'None'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">Status</span>
                                            <div className="flex-1 border-b border-dashed border-gray-300 dark:border-gray-600"></div>
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                order.paymentStatus === 'UNPAID' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                }`}>
                                                {order.paymentStatus || 'UNKNOWN'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-2">Customer Details</h4>
                                    <div className="space-y-2.5 text-sm mt-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">Phone</span>
                                            <div className="flex-1 border-b border-dashed border-gray-300 dark:border-gray-600"></div>
                                            <span className="font-bold text-gray-900 dark:text-white">{order.customer.phone}</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap mt-0.5">Address</span>
                                            <div className="flex-1 border-b border-dashed border-gray-300 dark:border-gray-600 mt-2.5"></div>
                                            <span className="font-bold text-gray-900 dark:text-white text-right max-w-[65%]" title={order.shippingAddress?.detailedAddress}>
                                                {order.shippingAddress?.detailedAddress || 'No address provided'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Price Information */}
                            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                                <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-2">Price Summary</h4>
                                <div className="space-y-2.5 text-sm mt-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">Subtotal</span>
                                        <div className="flex-1 border-b border-dashed border-gray-300 dark:border-gray-600"></div>
                                        <span className="font-medium text-gray-900 dark:text-white">${Number(order.subtotal || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">Delivery</span>
                                        <div className="flex-1 border-b border-dashed border-gray-300 dark:border-gray-600"></div>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {order.isFreeDelivery ? (
                                                <span className="text-green-600 dark:text-green-400 font-bold text-xs uppercase bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">Free</span>
                                            ) : (
                                                `$${Number(order.deliveryFee || 0).toFixed(2)}`
                                            )}
                                        </span>
                                    </div>
                                    {Number(order.discount) > 0 && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">Discount</span>
                                            <div className="flex-1 border-b border-dashed border-gray-300 dark:border-gray-600"></div>
                                            <span className="font-medium text-red-600 dark:text-red-400">-${Number(order.discount).toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 pt-1">
                                        <span className="text-gray-900 dark:text-white font-bold whitespace-nowrap uppercase text-xs">Total</span>
                                        <div className="flex-1 border-b border-dashed border-gray-300 dark:border-gray-600"></div>
                                        <span className="font-bold text-lg text-blue-600 dark:text-blue-400">${Number(order.total || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Items List */}
                            <div className="p-4 flex-1">
                                <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">Items to Pack</h4>
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
                                    onClick={() => setConfirmOrderId(order.id)}
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

            {/* Confirmation Modal */}
            <Modal isOpen={!!confirmOrderId} onClose={() => setConfirmOrderId(null)} className="max-w-[400px] p-6">
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 dark:bg-blue-900/30 dark:text-blue-500">
                        <Package className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Confirm Order Packed</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Are you sure this order has been fully packed and is ready for delivery? This action will mark it as shipped.
                    </p>
                    <div className="flex w-full gap-3">
                        <button
                            onClick={() => setConfirmOrderId(null)}
                            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmPackaging}
                            className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Yes, Confirm
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

