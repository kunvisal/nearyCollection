import React from "react";
import { OrderRepository } from "@/lib/repositories/orderRepository";
import { format } from "date-fns";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import PrintButton from "./PrintButton";

export default async function PrintOrderReceipt({ params }: { params: { id: string } }) {
    const order = await OrderRepository.getOrderById(params.id);

    if (!order) {
        redirect("/admin/orders");
    }

    return (
        <div className="min-h-screen bg-white text-black p-8 max-w-3xl mx-auto print:p-0 print:max-w-none">
            {/* Header / Logo */}
            <div className="flex justify-between items-start mb-8 border-b-2 border-gray-900 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold uppercase tracking-tight">NEARY COLLECTION</h1>
                    <p className="text-gray-600 mt-1">Phnom Penh, Cambodia</p>
                    <p className="text-gray-600">Tel: +855 12 345 678</p>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-bold uppercase text-gray-800">RECEIPT</h2>
                    <p className="mt-2 text-sm font-medium">Order: #{order.orderCode}</p>
                    <p className="text-sm">Date: {format(new Date(order.createdAt), "dd MMM yyyy, HH:mm")}</p>
                </div>
            </div>

            {/* Customer & Shipping Info */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                    <h3 className="font-bold text-gray-800 mb-2 uppercase text-sm border-b pb-1">Billed To / Ship To</h3>
                    <p className="font-semibold">{order.customer.fullName}</p>
                    <p>{order.customer.phone}</p>
                    <p className="mt-1 whitespace-pre-wrap max-w-sm">{(order.shippingAddress as any)?.detailedAddress}</p>
                </div>
                <div>
                    <h3 className="font-bold text-gray-800 mb-2 uppercase text-sm border-b pb-1">Order Details</h3>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Payment Method:</span>
                            <span className="font-medium">{order.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Payment Status:</span>
                            <span className="font-medium">{order.paymentStatus}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Delivery Zone:</span>
                            <span className="font-medium">{order.deliveryZone}</span>
                        </div>
                        {order.note && (
                            <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                                <strong>Note:</strong> {order.note}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Order Items */}
            <table className="w-full mb-8 text-sm">
                <thead>
                    <tr className="border-b-2 border-gray-900">
                        <th className="py-2 text-left font-bold w-1/2">Item Description</th>
                        <th className="py-2 text-center font-bold">Qty</th>
                        <th className="py-2 text-right font-bold w-1/5">Unit Price</th>
                        <th className="py-2 text-right font-bold w-1/5">Total</th>
                    </tr>
                </thead>
                <tbody className="border-b-2 border-gray-200">
                    {order.items.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100 last:border-0">
                            <td className="py-3">
                                <p className="font-semibold">{item.productNameSnapshot}</p>
                                <p className="text-gray-500 text-xs mt-0.5">
                                    SKU: {item.skuSnapshot}
                                    {(item.colorSnapshot || item.sizeSnapshot) && " - "}
                                    {item.colorSnapshot && item.colorSnapshot}
                                    {item.colorSnapshot && item.sizeSnapshot && " / "}
                                    {item.sizeSnapshot && item.sizeSnapshot}
                                </p>
                            </td>
                            <td className="py-3 text-center">{item.qty}</td>
                            <td className="py-3 text-right">${Number(item.salePriceSnapshot).toFixed(2)}</td>
                            <td className="py-3 text-right font-semibold">${Number(item.lineTotal).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="w-1/2 ml-auto mb-12">
                <div className="flex justify-between py-1 text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>${Number(order.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 text-sm">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span>${Number(order.deliveryFee).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-gray-900 mt-2">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-lg">${Number(order.total).toFixed(2)}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-gray-500 border-t pt-8">
                <p className="font-medium text-gray-800 mb-1">Thank you for shopping with Neary Collection!</p>
                <p>If you have any questions about this receipt, please contact us.</p>

                {/* Print Button (hidden when actually printing) */}
                <div className="mt-8 print:hidden">
                    <PrintButton />
                    <p className="mt-2 text-xs text-gray-400">Wait until the page fully loads, then click Print.</p>
                </div>
            </div>

        </div>
    );
}
