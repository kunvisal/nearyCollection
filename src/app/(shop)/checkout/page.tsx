"use client";

import React, { useState, useTransition } from "react";
import { useCartStore } from "@/lib/store/cartStore";
import Link from "next/link";
import { ArrowLeft, CreditCard } from "lucide-react";
import { createOrderAction } from "@/app/actions/orderActions";
import { useRouter } from "next/navigation";
import { DeliveryZone, PaymentMethod } from "@prisma/client";

export default function CheckoutPage() {
    const { items, getCartTotal, clearCart } = useCartStore();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [formData, setFormData] = useState({
        customerName: "",
        customerPhone: "",
        deliveryZone: "PP" as DeliveryZone,
        deliveryAddress: "",
        paymentMethod: "ABA" as PaymentMethod,
    });

    const deliveryFee = formData.deliveryZone === "PP" ? 1.50 : 2.50;
    const subtotal = getCartTotal();
    const total = subtotal + deliveryFee;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        startTransition(async () => {
            const payloadItems = items.map(item => ({
                variantId: item.variantId,
                qty: item.qty,
                salePrice: item.salePrice,
                discount: 0,
            }));

            const res = await createOrderAction(
                { fullName: formData.customerName, phone: formData.customerPhone },
                {
                    deliveryZone: formData.deliveryZone,
                    deliveryAddress: formData.deliveryAddress,
                    deliveryFee: deliveryFee,
                    paymentMethod: formData.paymentMethod,
                    items: payloadItems,
                    note: "",
                }
            );

            if (res.success && res.order) {
                clearCart();
                router.push(`/checkout/success?orderCode=${res.order.orderCode}`);
            } else {
                alert("Failed to create order: " + (res.error || "Unknown error"));
            }
        });
    };

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
                <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Your cart is empty</h2>
                <p className="text-gray-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
                <Link href="/" className="px-6 py-3 bg-black text-white rounded-full font-medium">
                    Continue Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 pb-24 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <header className="sticky top-0 bg-white dark:bg-gray-900 z-40 px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
                <Link href="/" className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-lg font-bold capitalize text-gray-900 dark:text-white">Checkout</h1>
            </header>

            <form onSubmit={handleSubmit} className="px-4 space-y-6 max-w-lg mx-auto w-full">

                {/* Contact INFO */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="font-bold text-gray-900 dark:text-white mb-4">Contact Details</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                            <input
                                required
                                type="text"
                                name="customerName"
                                value={formData.customerName}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-blue-500 outline-none transition-all dark:text-white"
                                placeholder="e.g. Sokha"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                            <input
                                required
                                type="tel"
                                name="customerPhone"
                                value={formData.customerPhone}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-blue-500 outline-none transition-all dark:text-white"
                                placeholder="012 345 678"
                            />
                        </div>
                    </div>
                </div>

                {/* Delivery INFO */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="font-bold text-gray-900 dark:text-white mb-4">Delivery</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zone / Province</label>
                            <select
                                name="deliveryZone"
                                value={formData.deliveryZone}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-blue-500 outline-none transition-all dark:text-white"
                            >
                                <option value="Phnom Penh">Phnom Penh ($1.50)</option>
                                <option value="Kandal">Kandal ($2.00)</option>
                                <option value="Other Provinces">Other Provinces ($2.50)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Detailed Address</label>
                            <textarea
                                required
                                name="deliveryAddress"
                                value={formData.deliveryAddress}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-blue-500 outline-none transition-all dark:text-white"
                                placeholder="Street, Sangkat, Khan, Neary location..."
                            />
                        </div>
                    </div>
                </div>

                {/* Payment INFO */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="font-bold text-gray-900 dark:text-white mb-4">Payment Method</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <label className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all ${formData.paymentMethod === 'ABA' ? 'border-black dark:border-blue-500 bg-gray-50 dark:bg-gray-700' : 'border-gray-100 dark:border-gray-700 hover:border-gray-300'}`}>
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="ABA"
                                checked={formData.paymentMethod === 'ABA'}
                                onChange={handleInputChange}
                                className="sr-only"
                            />
                            <CreditCard className={`w-6 h-6 ${formData.paymentMethod === 'ABA' ? 'text-black dark:text-blue-500' : 'text-gray-400'}`} />
                            <span className={`text-sm font-medium ${formData.paymentMethod === 'ABA' ? 'text-black dark:text-blue-500' : 'text-gray-600 dark:text-gray-400'}`}>ABA Pay</span>
                        </label>
                        <label className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all ${formData.paymentMethod === 'COD' ? 'border-black dark:border-blue-500 bg-gray-50 dark:bg-gray-700' : 'border-gray-100 dark:border-gray-700 hover:border-gray-300'}`}>
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="COD"
                                checked={formData.paymentMethod === 'COD'}
                                onChange={handleInputChange}
                                className="sr-only"
                            />
                            <svg className={`w-6 h-6 ${formData.paymentMethod === 'COD' ? 'text-black dark:text-blue-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span className={`text-sm font-medium ${formData.paymentMethod === 'COD' ? 'text-black dark:text-blue-500' : 'text-gray-600 dark:text-gray-400'}`}>Cash on Delivery</span>
                        </label>
                    </div>

                    {formData.paymentMethod === 'ABA' && (
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-sm text-blue-800 dark:text-blue-300">
                            You will be asked to upload a payment slip after confirming the order.
                        </div>
                    )}
                </div>

                {/* Order Summary */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="font-bold text-gray-900 dark:text-white mb-4">Summary</h2>
                    <div className="space-y-3 mb-4">
                        {items.map(item => (
                            <div key={item.variantId} className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400 line-clamp-1 pr-4">
                                    {item.qty}x {item.nameKm} {item.size ? `(${item.size})` : ''}
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">${(item.salePrice * item.qty).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-700 pt-3 space-y-2">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>Subtotal</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>Delivery</span>
                            <span>${deliveryFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
                            <span>Total</span>
                            <span className="text-blue-600 dark:text-blue-400">${total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Fixed Bottom Action */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 md:max-w-3xl lg:max-w-6xl mx-auto shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-none">
                    <button
                        type="submit"
                        className="w-full py-4 bg-black dark:bg-blue-600 text-white rounded-xl font-bold flex justify-center items-center shadow-md hover:bg-gray-900 transition-colors"
                    >
                        Confirm Order • ${total.toFixed(2)}
                    </button>
                </div>
            </form>
        </div>
    );
}
