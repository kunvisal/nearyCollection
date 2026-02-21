"use client";

import React from "react";
import { useCartStore } from "@/lib/store/cartStore";
import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function CartDrawer() {
    const { items, isDrawerOpen, setIsDrawerOpen, removeItem, updateQty, getCartTotal } = useCartStore();

    if (!isDrawerOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity opacity-100"
                onClick={() => setIsDrawerOpen(false)}
            />

            {/* Drawer */}
            <div className="relative ml-auto w-full max-w-md h-full bg-white dark:bg-gray-900 shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5" />
                        Your Cart ({items.reduce((acc, item) => acc + item.qty, 0)})
                    </h2>
                    <button
                        onClick={() => setIsDrawerOpen(false)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body / Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
                            <ShoppingBag className="w-12 h-12 text-gray-300" />
                            <p>Your cart is empty.</p>
                            <button
                                onClick={() => setIsDrawerOpen(false)}
                                className="px-6 py-2 bg-black text-white rounded-full font-medium"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.variantId} className="flex gap-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                                {/* Image Placeholder */}
                                <div className="w-20 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg shrink-0 overflow-hidden relative">
                                    {item.imageUrl ? (
                                        <img src={item.imageUrl} alt={item.nameKm} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center p-1">No Image</div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-2">{item.nameKm}</h3>
                                            <button
                                                onClick={() => removeItem(item.variantId)}
                                                className="text-gray-400 hover:text-red-500 p-1"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                                            {item.size && <p>Size: {item.size}</p>}
                                            {item.color && <p>Color: {item.color}</p>}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end mt-2">
                                        <div className="font-bold text-blue-600 dark:text-blue-400">
                                            ${item.salePrice.toFixed(2)}
                                        </div>

                                        {/* Qty Selector */}
                                        <div className="flex items-center bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                            <button
                                                onClick={() => updateQty(item.variantId, item.qty - 1)}
                                                disabled={item.qty <= 1}
                                                className="p-1 text-gray-500 hover:text-black dark:text-gray-300 dark:hover:text-white disabled:opacity-50"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                                            <button
                                                onClick={() => updateQty(item.variantId, item.qty + 1)}
                                                disabled={item.qty >= item.stockOnHand}
                                                className="p-1 text-gray-500 hover:text-black dark:text-gray-300 dark:hover:text-white disabled:opacity-50"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 shrink-0">
                        <div className="flex justify-between items-center mb-4 text-gray-900 dark:text-white">
                            <span className="font-medium">Subtotal</span>
                            <span className="font-bold text-xl">${getCartTotal().toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-4 text-center">Taxes and shipping calculated at checkout</p>
                        <Link
                            href="/checkout"
                            onClick={() => setIsDrawerOpen(false)}
                            className="w-full py-4 bg-black dark:bg-blue-600 hover:bg-gray-900 dark:hover:bg-blue-700 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition-colors"
                        >
                            Checkout Now
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
