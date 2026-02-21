"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, Package, Truck, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;

    const [order, setOrder] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchOrder = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/admin/orders/${orderId}`);
            const json = await res.json();
            if (json.data) {
                setOrder(json.data);
            } else {
                alert(json.error || "Failed to load order");
                router.push("/admin/orders");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (orderId) {
            fetchOrder();
        }
    }, [orderId]);

    const handlePaymentUpdate = async (status: string) => {
        if (!confirm(`Are you sure you want to mark payment as ${status}?`)) return;
        setIsUpdating(true);
        try {
            const res = await fetch(`/api/admin/orders/${orderId}/payment`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                await fetchOrder();
            } else {
                const json = await res.json();
                alert(json.error || "Update failed");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleOrderUpdate = async (status: string) => {
        if (!confirm(`Are you sure you want to update order status to ${status}?`)) return;
        setIsUpdating(true);
        try {
            const res = await fetch(`/api/admin/orders/${orderId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                await fetchOrder();
            } else {
                const json = await res.json();
                alert(json.error || "Update failed");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading order details...</div>;
    if (!order) return null;

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push("/admin/orders")} className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            Order #{order.orderCode}
                            <span className={`px-2.5 py-1 text-sm rounded-full font-medium ${order.orderStatus === 'NEW' ? 'bg-blue-100 text-blue-800' :
                                    order.orderStatus === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                                        order.orderStatus === 'SHIPPED' ? 'bg-purple-100 text-purple-800' :
                                            order.orderStatus === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                                                'bg-red-100 text-red-800'
                                }`}>
                                {order.orderStatus}
                            </span>
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Placed on {format(new Date(order.createdAt), "dd MMM yyyy, HH:mm")}
                        </p>
                    </div>
                </div>
                <div>
                    <button onClick={() => window.open(`/print/order/${order.id}`, '_blank')} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg shadow-sm transition-colors font-medium">
                        Print Receipt
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Details & Items */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Items Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Order Items</h2>
                        <div className="overflow-x-auto border rounded-xl border-gray-200 dark:border-gray-700">
                            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Product</th>
                                        <th className="px-4 py-3 font-semibold text-center">Qty</th>
                                        <th className="px-4 py-3 font-semibold text-right">Price</th>
                                        <th className="px-4 py-3 font-semibold text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {order.items.map((item: any) => (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                                        {item.variant?.product?.images?.[0] ? (
                                                            <img src={item.variant.product.images[0].url} alt="Product" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Package className="w-6 h-6 m-3 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900 dark:text-white">{item.productNameSnapshot}</div>
                                                        <div className="text-xs text-gray-500 mt-0.5">
                                                            {item.colorSnapshot && `Color: ${item.colorSnapshot}`}
                                                            {item.colorSnapshot && item.sizeSnapshot && ' | '}
                                                            {item.sizeSnapshot && `Size: ${item.sizeSnapshot}`}
                                                            <br />
                                                            <span className="text-gray-400">SKU: {item.skuSnapshot}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">{item.qty}</td>
                                            <td className="px-4 py-3 text-right">${Number(item.salePriceSnapshot).toFixed(2)}</td>
                                            <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                                                ${Number(item.lineTotal).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="border-t-2 border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <td colSpan={3} className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">Subtotal</td>
                                        <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">${Number(order.subtotal).toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={3} className="px-4 py-2 text-right font-medium text-gray-700 dark:text-gray-300">Delivery Fee (Zone {order.deliveryZone})</td>
                                        <td className="px-4 py-2 text-right font-medium text-gray-900 dark:text-white">${Number(order.deliveryFee).toFixed(2)}</td>
                                    </tr>
                                    <tr className="bg-gray-50 dark:bg-gray-700/50">
                                        <td colSpan={3} className="px-4 py-4 text-right font-bold text-gray-900 dark:text-white text-lg">Total</td>
                                        <td className="px-4 py-4 text-right font-bold text-blue-600 dark:text-blue-400 text-lg">${Number(order.total).toFixed(2)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Order Workflow Actions */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Fulfillment Workflow</h2>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => handleOrderUpdate('PROCESSING')}
                                disabled={isUpdating || order.orderStatus === 'PROCESSING'}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${order.orderStatus === 'PROCESSING' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200'}`}
                            >
                                <Package className="w-4 h-4" /> Mark Processing
                            </button>
                            <button
                                onClick={() => handleOrderUpdate('SHIPPED')}
                                disabled={isUpdating || order.orderStatus === 'SHIPPED'}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${order.orderStatus === 'SHIPPED' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'}`}
                            >
                                <Truck className="w-4 h-4" /> Mark Shipped
                            </button>
                            <button
                                onClick={() => handleOrderUpdate('DELIVERED')}
                                disabled={isUpdating || order.orderStatus === 'DELIVERED'}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${order.orderStatus === 'DELIVERED' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'}`}
                            >
                                <CheckCircle2 className="w-4 h-4" /> Mark Delivered
                            </button>
                            <div className="flex-1"></div>
                            <button
                                onClick={() => handleOrderUpdate('CANCELLED')}
                                disabled={isUpdating || ['CANCELLED', 'DELIVERED'].includes(order.orderStatus)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${['CANCELLED', 'DELIVERED'].includes(order.orderStatus) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'}`}
                            >
                                <XCircle className="w-4 h-4" /> Cancel Order
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Customer & Payment */}
                <div className="lg:col-span-1 space-y-6">

                    {/* Payment Status Panel */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Payment Information</h2>

                        <div className="mb-4">
                            <p className="text-sm text-gray-500 mb-1">Method</p>
                            <p className="font-medium text-gray-900 dark:text-white uppercase">{order.paymentMethod}</p>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-gray-500 mb-1">Status</p>
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                                order.paymentStatus === 'PENDING_VERIFICATION' ? 'bg-orange-100 text-orange-800' :
                                    order.paymentStatus === 'FAILED' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                }`}>
                                {order.paymentStatus.replace('_', ' ')}
                            </span>
                        </div>

                        {/* Payment Slips Section */}
                        {order.paymentSlips?.length > 0 && (
                            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Uploaded Receipt</p>
                                <div className="space-y-3">
                                    {order.paymentSlips.map((slip: any) => (
                                        <div key={slip.id} className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group relative">
                                            <a href={slip.slipUrl} target="_blank" rel="noopener noreferrer">
                                                <img src={slip.slipUrl} alt="Payment Receipt" className="w-full h-48 object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <span className="text-white font-medium">View Full Size</span>
                                                </div>
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Payment Actions */}
                        <div className="mt-6 space-y-3">
                            {order.paymentStatus !== 'PAID' && (
                                <button
                                    onClick={() => handlePaymentUpdate('PAID')}
                                    disabled={isUpdating}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50"
                                >
                                    <CheckCircle className="w-4 h-4" /> Approve Payment
                                </button>
                            )}
                            {order.paymentStatus === 'PENDING_VERIFICATION' && (
                                <button
                                    onClick={() => handlePaymentUpdate('FAILED')}
                                    disabled={isUpdating}
                                    className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50"
                                >
                                    <XCircle className="w-4 h-4" /> Reject Slip
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Customer Details</h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500">Name</p>
                                <p className="font-medium text-gray-900 dark:text-white">{order.customer?.fullName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Phone</p>
                                <a href={`tel:${order.customer?.phone}`} className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400">
                                    {order.customer?.phone}
                                </a>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Delivery Address</p>
                                <p className="font-medium text-gray-900 dark:text-white mt-1">
                                    {(order.shippingAddress as any)?.detailedAddress || "No address provided"}
                                </p>
                            </div>
                            {order.note && (
                                <div>
                                    <p className="text-sm text-gray-500">Order Note</p>
                                    <p className="text-sm text-gray-800 dark:text-gray-200 mt-1 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-100 dark:border-yellow-900/50">
                                        {order.note}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
