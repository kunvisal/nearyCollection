"use client";

import React, { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import { Plus, Minus, Search, ShoppingCart, Trash2, X, Loader2 } from "lucide-react";
import { createOrderAction } from "@/app/actions/orderActions";
import { useToast } from "@/context/ToastContext";
import { DeliveryZone, PaymentMethod } from "@prisma/client";

// Reusing types roughly matching the API response
type Variant = {
    id: string;
    size: string;
    color: string;
    sku: string;
    salePrice: number;
    stockOnHand: number;
    reservedQty: number;
};

type ProductImage = {
    url: string;
};

type Product = {
    id: string;
    nameKm: string;
    nameEn: string | null;
    variants: Variant[];
    images: ProductImage[];
    category?: { id: number; nameKm: string };
};

type CartItem = {
    variantId: string;
    productId: string;
    nameKm: string;
    size: string;
    color: string;
    salePrice: number;
    qty: number;
};

export default function POSPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const [cart, setCart] = useState<CartItem[]>([]);
    const [formData, setFormData] = useState({
        customerName: "",
        customerPhone: "",
        deliveryZone: "PP" as DeliveryZone,
        deliveryAddress: "",
        paymentMethod: "COD" as PaymentMethod,
        note: ""
    });

    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const [isPending, startTransition] = useTransition();
    const { addToast } = useToast();

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredProducts(products);
        } else {
            const lowerSearch = searchQuery.toLowerCase();
            setFilteredProducts(products.filter(p =>
                p.nameKm.toLowerCase().includes(lowerSearch) ||
                (p.nameEn && p.nameEn.toLowerCase().includes(lowerSearch))
            ));
        }
    }, [searchQuery, products]);

    const fetchProducts = async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/admin/products");
            const json = await res.json();
            if (json.success) {
                // Filter only products with active variants and stock
                const activeProds = json.data.map((p: any) => ({
                    ...p,
                    variants: p.variants.filter((v: any) => (v.stockOnHand - v.reservedQty) > 0)
                })).filter((p: any) => p.variants.length > 0 && p.isActive);

                setProducts(activeProds);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProductClick = (product: Product) => {
        setSelectedProduct(product);
        setIsProductModalOpen(true);
    };

    const addToCart = (variant: Variant, product: Product) => {
        setCart(prev => {
            const existingIndex = prev.findIndex(item => item.variantId === variant.id);
            if (existingIndex >= 0) {
                // check stock limit
                const currentQty = prev[existingIndex].qty;
                const maxStock = variant.stockOnHand - variant.reservedQty;
                if (currentQty >= maxStock) {
                    addToast("warning", "Stock Limit", 'Not enough stock available.');
                    return prev;
                }
                const newCart = [...prev];
                newCart[existingIndex] = { ...newCart[existingIndex], qty: currentQty + 1 };
                return newCart;
            }
            return [...prev, {
                variantId: variant.id,
                productId: product.id,
                nameKm: product.nameKm,
                size: variant.size,
                color: variant.color,
                salePrice: Number(variant.salePrice),
                qty: 1
            }];
        });
        setIsProductModalOpen(false);
        setSelectedProduct(null);
    };

    const updateCartQty = (variantId: string, delta: number) => {
        setCart(prev => {
            return prev.map(item => {
                if (item.variantId === variantId) {
                    const newQty = item.qty + delta;
                    if (newQty <= 0) return item; // Handled by remove
                    return { ...item, qty: newQty };
                }
                return item;
            });
        });
    };

    const removeFromCart = (variantId: string) => {
        setCart(prev => prev.filter(item => item.variantId !== variantId));
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.salePrice * item.qty), 0);
    const deliveryFee = formData.deliveryZone === "PP" ? 1.50 : 2.50;
    const total = subtotal + deliveryFee;

    const handleCheckout = (e: React.FormEvent) => {
        e.preventDefault();
        if (cart.length === 0) {
            addToast("warning", "Empty Cart", "Cart is empty.");
            return;
        }

        startTransition(async () => {
            const payloadItems = cart.map(item => ({
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
                    note: formData.note,
                    isPOS: true,
                }
            );

            if (res.success && res.order) {
                // Reset cart on success but keep staff on the same page
                setCart([]);
                setFormData({
                    customerName: "",
                    customerPhone: "",
                    deliveryZone: "PP",
                    deliveryAddress: "",
                    paymentMethod: "COD",
                    note: ""
                });
                addToast("success", "Order Placed", `POS Order ${res.order.orderCode} placed successfully!`);
                fetchProducts(); // refresh stock numbers
            } else {
                addToast("error", "Failed", "Failed to create order: " + (res.error || "Unknown error"));
            }
        });
    };

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] overflow-hidden bg-gray-50 dark:bg-gray-900 -m-6">

            {/* Left Col: Products */}
            <div className="flex-1 flex flex-col h-full border-r border-gray-200 dark:border-gray-800">
                {/* Search Bar */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search products by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                        />
                    </div>
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full">Loading products...</div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="flex justify-center items-center h-full text-gray-500">No active products with stock found.</div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredProducts.map(product => (
                                <div
                                    key={product.id}
                                    onClick={() => handleProductClick(product)}
                                    className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700 flex flex-col"
                                >
                                    <div className="aspect-square relative bg-gray-100 dark:bg-gray-700">
                                        {product.images?.[0]?.url ? (
                                            <Image
                                                src={product.images[0].url}
                                                alt={product.nameEn || product.nameKm}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                                        )}
                                    </div>
                                    <div className="p-3 flex flex-col justify-between flex-1">
                                        <div>
                                            <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2 text-sm leading-tight mb-1">{product.nameKm}</h3>
                                            <p className="text-xs text-gray-500">{product.category?.nameKm}</p>
                                        </div>
                                        <div className="mt-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
                                            {product.variants.length} variant(s)
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Col: Cart & Checkout */}
            <div className="w-full lg:w-[450px] bg-white dark:bg-gray-900 flex flex-col h-full shrink-0">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                        <ShoppingCart className="w-5 h-5" /> Current Order
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
                    {/* Cart Items */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Cart Items</h3>
                        {cart.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                                Cart is empty
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {cart.map(item => (
                                    <div key={item.variantId} className="flex gap-3 items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">{item.nameKm}</h4>
                                            <div className="text-xs text-gray-500 mt-0.5">Size: {item.size} | Color: {item.color}</div>
                                            <div className="font-medium text-blue-600 dark:text-blue-400 mt-1">${item.salePrice.toFixed(2)}</div>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white dark:bg-gray-700 rounded-lg p-1 border border-gray-200 dark:border-gray-600">
                                            <button
                                                onClick={() => {
                                                    if (item.qty > 1) updateCartQty(item.variantId, -1);
                                                    else removeFromCart(item.variantId);
                                                }}
                                                className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-black dark:hover:text-white"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="w-4 text-center text-sm font-medium">{item.qty}</span>
                                            <button
                                                onClick={() => updateCartQty(item.variantId, 1)}
                                                className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-black dark:hover:text-white"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.variantId)}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg ml-1"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Customer Info Form */}
                    <form id="pos-checkout-form" onSubmit={handleCheckout} className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer Details</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                <input required type="text" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" placeholder="Name" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                                <input required type="tel" value={formData.customerPhone} onChange={e => setFormData({ ...formData, customerPhone: e.target.value })} className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" placeholder="012..." />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Zone / Address</label>
                            <div className="flex gap-2">
                                <select value={formData.deliveryZone} onChange={e => setFormData({ ...formData, deliveryZone: e.target.value as DeliveryZone })} className="w-1/3 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white">
                                    <option value="PP">PP</option>
                                    <option value="PROVINCE">Prov.</option>
                                </select>
                                <input required type="text" value={formData.deliveryAddress} onChange={e => setFormData({ ...formData, deliveryAddress: e.target.value })} className="w-2/3 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" placeholder="Detailed Address" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Payment</label>
                                <select value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })} className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white">
                                    <option value="COD">COD</option>
                                    <option value="ABA">ABA</option>
                                    <option value="WING">WING</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Note (Opt)</label>
                                <input type="text" value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" placeholder="Notes..." />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-800 shrink-0 bg-gray-50 dark:bg-gray-800/50">
                    <div className="space-y-2 mb-4 text-sm">
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                            <span>Subtotal</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                            <span>Delivery Fee</span>
                            <span>${deliveryFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                            <span>Total</span>
                            <span className="text-blue-600">${total.toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        form="pos-checkout-form"
                        type="submit"
                        disabled={isPending || cart.length === 0}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-75 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center justify-center transition-colors shadow-sm"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            'Place Order & Auto-Confirm'
                        )}
                    </button>
                </div>
            </div>

            {/* Select Variant Modal */}
            {isProductModalOpen && selectedProduct && (
                <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center shrink-0">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white pr-4">{selectedProduct.nameKm}</h2>
                            <button onClick={() => { setIsProductModalOpen(false); setSelectedProduct(null); }} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto">
                            <h3 className="text-sm font-medium text-gray-500 mb-3">Select Variant to Add</h3>
                            <div className="space-y-3">
                                {selectedProduct.variants.map((variant) => {
                                    const availableStock = variant.stockOnHand - variant.reservedQty;
                                    return (
                                        <button
                                            key={variant.id}
                                            onClick={() => addToCart(variant, selectedProduct)}
                                            className="w-full text-left p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex justify-between items-center cursor-pointer group"
                                        >
                                            <div>
                                                <div className="font-semibold text-gray-900 dark:text-white capitalize flex items-center gap-2">
                                                    {variant.color} - {variant.size}
                                                    <span className="text-xs font-normal text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">Stock: {availableStock}</span>
                                                </div>
                                                <div className="text-sm text-gray-500 mt-1">SKU: {variant.sku}</div>
                                            </div>
                                            <div className="text-lg font-bold text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                                ${Number(variant.salePrice).toFixed(2)}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

