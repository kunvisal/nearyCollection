"use client";

import React, { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import { Plus, Minus, Search, ShoppingCart, Trash2, X, Loader2, ImageIcon } from "lucide-react";
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
    const [categories, setCategories] = useState<{ id: number, nameKm: string }[]>([]);
    const [activeCategoryId, setActiveCategoryId] = useState<number | 'ALL'>('ALL');
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
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
        fetchCategories();
    }, []);

    useEffect(() => {
        let filtered = products;
        if (activeCategoryId !== 'ALL') {
            filtered = filtered.filter(p => p.category?.id === activeCategoryId);
        }
        if (searchQuery.trim() !== "") {
            const lowerSearch = searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                p.nameKm.toLowerCase().includes(lowerSearch) ||
                (p.nameEn && p.nameEn.toLowerCase().includes(lowerSearch))
            );
        }
        setFilteredProducts(filtered);
    }, [searchQuery, products, activeCategoryId]);

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/admin/categories");
            const json = await res.json();
            if (json.success) {
                setCategories(json.data);
            }
        } catch (error) {
            console.error("Failed to fetch categories");
        }
    };

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
                setIsCartOpen(false);
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
        <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] overflow-hidden relative w-full bg-white dark:bg-gray-950 shadow-sm rounded-2xl border border-gray-100 dark:border-gray-800 -mt-2">
            <div className="w-full h-full flex flex-col relative">

                {/* Fixed App Header & Categories */}
                <div className="pt-4 pb-0 px-4 bg-white dark:bg-gray-900 shadow-sm z-10 shrink-0">
                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search menu..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-[#e21b70] text-gray-900 dark:text-white"
                        />
                    </div>
                    {/* Horizontal Categories */}
                    <div className="flex overflow-x-auto hide-scrollbar gap-5 pb-1 -mx-4 px-4 snap-x">
                        <button
                            onClick={() => setActiveCategoryId('ALL')}
                            className={`whitespace-nowrap pb-2 font-bold text-sm border-b-2 transition-colors snap-start ${activeCategoryId === 'ALL' ? 'border-[#e21b70] text-gray-900 dark:text-white' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            Popular
                        </button>
                        {categories.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setActiveCategoryId(c.id)}
                                className={`whitespace-nowrap pb-2 font-bold text-sm border-b-2 transition-colors snap-start ${activeCategoryId === c.id ? 'border-[#e21b70] text-gray-900 dark:text-white' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                            >
                                {c.nameKm}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-4 pb-28 bg-white dark:bg-gray-950">
                    {/* Section Header */}
                    <div className="mb-4">
                        <h2 className="text-xl font-extrabold flex items-center gap-2 text-gray-900 dark:text-white">
                            <span className="text-[#e21b70]">🔥</span> {activeCategoryId === 'ALL' ? 'Popular' : categories.find(c => c.id === activeCategoryId)?.nameKm}
                        </h2>
                        <p className="text-gray-500 text-sm">Most ordered right now.</p>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center py-20 text-gray-400"><Loader2 className="w-8 h-8 animate-spin" /></div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="flex justify-center flex-col items-center py-20 text-gray-400">
                            <ShoppingCart className="w-12 h-12 mb-4 opacity-20" />
                            <p>No products found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                            {filteredProducts.map(product => {
                                const totalInCart = cart.filter(c => c.productId === product.id).reduce((sum, c) => sum + c.qty, 0);
                                return (
                                    <div key={product.id} className="relative group cursor-pointer" onClick={() => handleProductClick(product)}>
                                        <div className="aspect-square relative bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden mb-2">
                                            {product.images?.[0]?.url ? (
                                                <Image src={product.images[0].url} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon className="w-8 h-8 opacity-50" /></div>
                                            )}
                                            {/* Quick Add Button / Counter inside Image */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleProductClick(product); }}
                                                className={`absolute bottom-2 right-2 w-9 h-9 rounded-full shadow-lg flex items-center justify-center transition-all ${totalInCart > 0 ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-900' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-white'}`}
                                            >
                                                {totalInCart > 0 ? (
                                                    <span className="text-sm font-bold">{totalInCart}</span>
                                                ) : (
                                                    <Plus className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                        <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1 text-[15px]">{product.nameKm}</h3>
                                        <div className="text-gray-600 dark:text-gray-400 text-sm mt-0.5">
                                            from ${product.variants.length > 0 ? Math.min(...product.variants.map(v => Number(v.salePrice))).toFixed(2) : "0.00"}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Sticky Bottom Cart Bar */}
                {cart.length > 0 && (
                    <div className="absolute bottom-4 left-4 right-4 z-20">
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="w-full bg-[#e21b70] text-white py-3.5 px-4 rounded-xl shadow-xl flex items-center justify-between hover:bg-[#c2145e] transition-colors overflow-hidden relative"
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity"></div>
                            <div className="flex items-center gap-3 relative z-10">
                                <span className="border border-white/50 w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold">{cart.reduce((s, i) => s + i.qty, 0)}</span>
                                <span className="font-bold">View your cart</span>
                            </div>
                            <span className="font-bold relative z-10">${subtotal.toFixed(2)}</span>
                        </button>
                    </div>
                )}

                {/* Slide-Up Checkout Drawer */}
                {isCartOpen && (
                    <div className="fixed inset-0 z-[999999] flex flex-col justify-end sm:justify-center sm:items-center sm:p-4">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
                        <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full max-w-lg sm:max-w-2xl flex flex-col relative animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 max-h-[92vh] sm:max-h-[90vh] shadow-2xl overflow-hidden">
                            {/* Drawer Header */}
                            <div className="p-4 flex justify-between items-center shrink-0">
                                <button onClick={() => setIsCartOpen(false)} className="p-2 -ml-2 text-gray-900 dark:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Cart</h2>
                                <button onClick={() => setCart([])} className="p-2 -mr-2 text-gray-400 hover:text-red-500">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Drawer Body - Scrollable */}
                            <div className="flex-1 overflow-y-auto">
                                <div className="p-4 space-y-5">
                                    {/* Cart Items List */}
                                    <div className="space-y-4">
                                        {cart.map(item => (
                                            <div key={item.variantId} className="flex gap-4 items-center">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-gray-900 dark:text-white truncate">{item.nameKm}</h4>
                                                    <div className="text-sm text-gray-500">{item.size} • {item.color}</div>
                                                    <div className="font-semibold text-gray-900 dark:text-white mt-1">${(item.salePrice * item.qty).toFixed(2)}</div>
                                                </div>
                                                <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-1">
                                                    <button onClick={() => { if (item.qty > 1) updateCartQty(item.variantId, -1); else removeFromCart(item.variantId); }} className="w-8 h-8 flex items-center justify-center text-gray-900 dark:text-white"><Minus className="w-4 h-4" /></button>
                                                    <span className="w-4 text-center text-sm font-medium">{item.qty}</span>
                                                    <button onClick={() => updateCartQty(item.variantId, 1)} className="w-8 h-8 flex items-center justify-center text-[#e21b70]"><Plus className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <hr className="border-gray-100 dark:border-gray-800" />

                                    {/* Summary */}
                                    <div className="space-y-2 text-[15px] text-gray-700 dark:text-gray-300">
                                        <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                                        <div className="flex justify-between"><span>Standard delivery</span><span>${deliveryFee.toFixed(2)}</span></div>
                                        <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white pt-2">
                                            <span>Total <span className="text-sm font-normal text-gray-500">(incl. fees and tax)</span></span>
                                            <span className="text-[#e21b70]">${total.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <hr className="border-gray-100 dark:border-gray-800" />

                                    {/* Checkout Form */}
                                    <form id="pos-checkout-form" onSubmit={handleCheckout} className="space-y-4 pb-4">
                                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">Delivery details</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input required placeholder="Customer Name" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-[15px] w-full focus:ring-2 focus:ring-[#e21b70] outline-none" />
                                            <input required placeholder="Phone Number" value={formData.customerPhone} onChange={e => setFormData({ ...formData, customerPhone: e.target.value })} className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-[15px] w-full focus:ring-2 focus:ring-[#e21b70] outline-none" />
                                        </div>
                                        <div className="flex gap-3">
                                            <select value={formData.deliveryZone} onChange={e => setFormData({ ...formData, deliveryZone: e.target.value as DeliveryZone })} className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-[15px] w-1/3 focus:ring-2 focus:ring-[#e21b70] outline-none">
                                                <option value="PP">PP</option>
                                                <option value="PROVINCE">Province</option>
                                            </select>
                                            <input required placeholder="Detailed Address" value={formData.deliveryAddress} onChange={e => setFormData({ ...formData, deliveryAddress: e.target.value })} className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-[15px] w-2/3 focus:ring-2 focus:ring-[#e21b70] outline-none" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <select value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })} className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-[15px] w-full focus:ring-2 focus:ring-[#e21b70] outline-none">
                                                <option value="COD">COD (Cash)</option>
                                                <option value="ABA">ABA Pay</option>
                                                <option value="WING">WING</option>
                                            </select>
                                            <input placeholder="Note (Optional)" value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-[15px] w-full focus:ring-2 focus:ring-[#e21b70] outline-none" />
                                        </div>
                                    </form>
                                </div>
                            </div>

                            {/* Drawer Fixed Bottom Button */}
                            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] shrink-0 sm:rounded-b-3xl">
                                <button form="pos-checkout-form" type="submit" disabled={isPending || cart.length === 0} className="w-full bg-[#e21b70] hover:bg-[#c2145e] disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center transition-colors">
                                    {isPending ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Confirming...</> : 'Place Order & Auto-Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Select Variant Modal */}
            {isProductModalOpen && selectedProduct && (
                <div className="fixed inset-0 z-[999999] flex flex-col justify-end sm:justify-center sm:items-center sm:p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setIsProductModalOpen(false); setSelectedProduct(null); }}></div>
                    <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full max-w-md sm:max-w-xl mx-auto flex flex-col relative animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 max-h-[85vh] sm:max-h-[90vh] shadow-2xl overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center shrink-0 bg-white dark:bg-gray-900 z-10">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">{selectedProduct?.nameKm}</h2>
                            <button onClick={() => { setIsProductModalOpen(false); setSelectedProduct(null); }} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 min-h-0">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Choose variation</h3>
                            <div className="space-y-3">
                                {selectedProduct?.variants.map((variant) => {
                                    const availableStock = variant.stockOnHand - variant.reservedQty;
                                    return (
                                        <button
                                            key={variant.id}
                                            onClick={() => selectedProduct && addToCart(variant, selectedProduct)}
                                            className="w-full text-left p-4 rounded-xl border-2 border-gray-100 dark:border-gray-800 hover:border-[#e21b70] hover:bg-[#e21b70]/5 transition-all flex justify-between items-center cursor-pointer group"
                                        >
                                            <div>
                                                <div className="font-semibold text-gray-900 dark:text-white capitalize flex items-center gap-2 text-[15px]">
                                                    {variant.color} - {variant.size}
                                                </div>
                                                <div className="text-sm text-gray-500 mt-1 flex gap-2 items-center">
                                                    <span>SKU: {variant.sku}</span>
                                                    <span>•</span>
                                                    <span className={`${availableStock <= 2 ? 'text-red-500' : 'text-gray-500'}`}>Stock: {availableStock}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-[17px] font-bold text-gray-900 dark:text-white">
                                                    ${Number(variant.salePrice).toFixed(2)}
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-[#e21b70] text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                                    <Plus className="w-4 h-4" />
                                                </div>
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

