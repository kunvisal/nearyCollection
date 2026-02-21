"use client";

import React, { useState, useTransition } from "react";
import { trackOrderAction } from "@/app/actions/trackingActions";
import Link from "next/link";
import { Search, Loader2, Package, Truck, CheckCircle, ArrowLeft } from "lucide-react";

export default function TrackOrderPage() {
    const [orderCode, setOrderCode] = useState("");
    const [phone, setPhone] = useState("");
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [orderInfo, setOrderInfo] = useState<any>(null);

    const handleTrack = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setOrderInfo(null);

        startTransition(async () => {
            const res = await trackOrderAction(orderCode, phone);
            if (res.success && res.order) {
                setOrderInfo(res.order);
            } else {
                setError(res.error || "Order not found");
            }
        });
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'NEW': return <Package className="w-8 h-8 text-blue-500" />;
            case 'PROCESSING': return <Package className="w-8 h-8 text-yellow-500" />;
            case 'PACKED': return <Package className="w-8 h-8 text-orange-500" />;
            case 'SHIPPED': return <Truck className="w-8 h-8 text-purple-500" />;
            case 'DELIVERED': return <CheckCircle className="w-8 h-8 text-green-500" />;
            case 'CANCELLED': return <XCircle className="w-8 h-8 text-red-500" />;
            default: return <Package className="w-8 h-8 text-gray-500" />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
            <header className="bg-white dark:bg-gray-900 px-4 py-3 flex items-center gap-4 border-b border-gray-100 dark:border-gray-800">
                <Link href="/" className="text-gray-600 dark:text-gray-300">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Track Your Order</h1>
            </header>

            <div className="max-w-md mx-auto px-4 py-8 space-y-6">

                {/* Search Form */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="font-bold text-gray-900 dark:text-white mb-4">Enter Order Details</h2>
                    <form onSubmit={handleTrack} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Order Code</label>
                            <input
                                required
                                type="text"
                                value={orderCode}
                                onChange={(e) => setOrderCode(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all dark:text-white"
                                placeholder="NC-20231015-1234"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                            <input
                                required
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all dark:text-white"
                                placeholder="Phone used at checkout"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 dark:bg-red-900/20 dark:border-red-800/50">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full py-4 bg-black dark:bg-blue-600 text-white rounded-xl font-bold flex justify-center items-center shadow-md hover:bg-gray-900 transition-colors disabled:opacity-50"
                        >
                            {isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
                                <><Search className="w-5 h-5 mr-2" /> Track Order</>
                            )}
                        </button>
                    </form>
                </div>

                {/* Status Result */}
                {orderInfo && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 animate-in slide-in-from-bottom-4 fade-in duration-300">
                        <div className="flex flex-col items-center text-center border-b border-gray-100 dark:border-gray-700 pb-6 mb-6">
                            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-3">
                                {getStatusIcon(orderInfo.orderStatus)}
                            </div>
                            <h3 className="font-bold text-xl text-gray-900 dark:text-white">Status: {orderInfo.orderStatus}</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Order Placed on {new Date(orderInfo.createdAt).toLocaleDateString()}</p>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-bold text-gray-900 dark:text-white">Order Summary</h4>
                            {orderInfo.items.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between text-sm py-2">
                                    <span className="text-gray-600 dark:text-gray-400">{item.qty}x {item.productNameSnapshot}</span>
                                    <span className="font-medium">${item.lineTotal.toFixed(2)}</span>
                                </div>
                            ))}
                            <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-gray-700">
                                <span>Total</span>
                                <span className="text-blue-600 dark:text-blue-400">${orderInfo.total.toFixed(2)}</span>
                            </div>
                        </div>

                        {orderInfo.paymentStatus === 'UNPAID' && (
                            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                                <Link
                                    href={`/checkout/payment?orderId=${orderCode}`} // Note: Ideally pass the actual UUID if we want to support direct upload again, but this needs order.id which we didn't expose for security. We might need to handle it.
                                    className="block text-center w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl font-medium transition-colors"
                                >
                                    Upload Payment Slip
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// Simple internal icon for cancelled
function XCircle(props: any) {
    return (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}
