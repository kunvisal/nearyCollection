import React from "react";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { CheckCircle, Clock } from "lucide-react";
import Image from "next/image";

export default async function CheckoutSuccessPage({
    searchParams,
}: {
    searchParams: { orderCode?: string };
}) {
    const { orderCode } = searchParams;

    if (!orderCode) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
                <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Order Not Found</h2>
                <Link href="/" className="px-6 py-3 bg-black text-white rounded-full font-medium">
                    Return to Shop
                </Link>
            </div>
        );
    }

    const order = await prisma.order.findUnique({
        where: { orderCode },
        include: { items: true, customer: true, paymentSlips: true },
    });

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
                <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Order Not Found</h2>
                <p className="text-gray-500 mb-6">We couldn't find an order with this code.</p>
                <Link href="/" className="px-6 py-3 bg-black text-white rounded-full font-medium">
                    Return to Shop
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
            <div className="max-w-xl mx-auto px-4 py-8 space-y-6">

                {/* Status Header */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm text-center border border-gray-100 dark:border-gray-700">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Order Confirmed!</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Thank you for shopping with Neary Collection.
                    </p>
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl font-mono font-medium text-lg text-gray-900 dark:text-white">
                        {order.orderCode}
                    </div>
                </div>

                {/* Next Steps / Payment Instructions */}
                {order.paymentMethod === 'ABA' && order.paymentStatus === 'UNPAID' && order.paymentSlips.length === 0 && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border-2 border-blue-500 dark:border-blue-600">
                        <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Clock className="text-blue-500 w-5 h-5" /> Pending Payment
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Please scan the QR code below or transfer <strong>${Number(order.total).toFixed(2)}</strong> to complete your order. Once paid, please upload your payment slip.
                        </p>
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 flex justify-center mb-4">
                            {/* Placeholder for ABA QR Code */}
                            <div className="w-48 h-48 bg-white border-4 border-red-600 rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-red-600 top-0 h-10 flex items-center justify-center text-white font-bold tracking-widest text-sm">ABA PAY</div>
                                <div className="mt-6 font-mono text-center opacity-50">QR Code Image Here</div>
                            </div>
                        </div>
                        <Link
                            href={`/checkout/payment?orderId=${order.id}`}
                            className="block text-center w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                        >
                            Upload Payment Slip
                        </Link>
                    </div>
                )}

                {/* If Slip uploaded and waiting for verification */}
                {order.paymentSlips.length > 0 && order.paymentStatus === 'UNPAID' && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-2xl border border-yellow-200 dark:border-yellow-800 text-center">
                        <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-800/50 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Clock className="w-6 h-6" />
                        </div>
                        <h2 className="font-bold text-yellow-800 dark:text-yellow-400 mb-2">Verifying Payment</h2>
                        <p className="text-sm text-yellow-700 dark:text-yellow-500">
                            We have received your payment slip and our team is currently verifying it. Your order will be processed shortly.
                        </p>
                    </div>
                )}

                {/* Order Details */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="font-bold text-gray-900 dark:text-white mb-4">Order Details</h2>
                    <div className="space-y-4 mb-4">
                        {order.items.map(item => (
                            <div key={item.id} className="flex justify-between text-sm py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                                <div className="pr-4">
                                    <span className="font-medium text-gray-900 dark:text-white">{item.productNameSnapshot}</span>
                                    <div className="text-gray-500 mt-0.5">
                                        Qty: {item.qty} {item.sizeSnapshot ? `| Size: ${item.sizeSnapshot}` : ''} {item.colorSnapshot ? `| Color: ${item.colorSnapshot}` : ''}
                                    </div>
                                </div>
                                <span className="font-medium whitespace-nowrap">${Number(item.lineTotal).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-2">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>Subtotal</span>
                            <span>${Number(order.subtotal).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>Delivery ({order.deliveryZone})</span>
                            <span>${Number(order.deliveryFee).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white pt-2">
                            <span>Total</span>
                            <span className="text-blue-600 dark:text-blue-400">${Number(order.total).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <Link href="/orders/track" className="w-full py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl font-medium text-center hover:bg-gray-50 transition-colors">
                        Track Order
                    </Link>
                    <Link href="/" className="w-full py-4 bg-black dark:bg-gray-700 text-white rounded-xl font-medium text-center hover:bg-gray-900 transition-colors">
                        Continue Shopping
                    </Link>
                </div>

            </div>
        </div>
    );
}
