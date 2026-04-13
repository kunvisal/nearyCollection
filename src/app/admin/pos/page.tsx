"use client";

import React, { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import { Plus, Minus, Search, ShoppingCart, Trash2, X, Loader2, ImageIcon, ExternalLink } from "lucide-react";
import { createOrderAction } from "@/app/actions/orderActions";
import { getDeliveryFeesAction } from "@/app/actions/shopActions";
import { useToast } from "@/context/ToastContext";
import { DeliveryService, DeliveryZone, PaymentMethod } from "@prisma/client";
import { MessengerImport } from "@/components/admin/pos/MessengerImport";
import { formatCambodiaDate } from "@/lib/utils/timezone";
import type { AdminVariant, AdminProductImage, AdminProduct, CartItem } from "@/types/admin";

const DELIVERY_SERVICE_LABELS: Record<DeliveryService, string> = {
    JALAT: "Jalat (ចល័ត)",
    VET: "VET (វីរប៊ុនថាំ)",
    JT: "J&T",
};

export default function POSPage() {
    const [products, setProducts] = useState<AdminProduct[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<AdminProduct[]>([]);
    const [categories, setCategories] = useState<{ id: number, nameKm: string }[]>([]);
    const [activeCategoryId, setActiveCategoryId] = useState<number | 'ALL'>('ALL');
    const [searchQuery, setSearchQuery] = useState("");
    const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK'>('ALL');
    const [isLoading, setIsLoading] = useState(true);

    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [formData, setFormData] = useState({
        customerName: "",
        customerPhone: "",
        deliveryZone: "PP" as DeliveryZone,
        deliveryAddress: "",
        paymentMethod: "COD" as PaymentMethod,
        deliveryService: "JALAT" as DeliveryService,
        note: "",
        discount: "",
        isFreeDelivery: false,
    });
    const [receiptData, setReceiptData] = useState<any>(null);

    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const [isPending, startTransition] = useTransition();
    const { addToast } = useToast();
    const [messengerRecipientId, setMessengerRecipientId] = useState<string | null>(null);
    const [sendingBlock, setSendingBlock] = useState<1 | 2 | null>(null);
    const [msgBlock1, setMsgBlock1] = useState("");
    const [msgBlock2, setMsgBlock2] = useState("");
    const [khrRate, setKhrRate] = useState(4000);
    const [sendRiel, setSendRiel] = useState(true);
    const [sendUsd, setSendUsd] = useState(true);
    const [sendingQR, setSendingQR] = useState(false);
    const [deliveryFees, setDeliveryFees] = useState({ pp: 1.5, province: 2.5 });

    useEffect(() => {
        fetchProducts();
        fetchCategories();
        getDeliveryFeesAction().then(res => {
            setDeliveryFees({ pp: res.deliveryFeePP, province: res.deliveryFeeProvince });
        });
        fetch("/api/admin/settings").then(r => r.json()).then(json => {
            if (json.data?.usdToKhrRate) setKhrRate(Number(json.data.usdToKhrRate));
        });
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
        if (stockFilter === 'IN_STOCK') {
            filtered = filtered.filter(p =>
                p.variants.some(v => (v.stockOnHand - v.reservedQty) > 0)
            );
        } else if (stockFilter === 'OUT_OF_STOCK') {
            filtered = filtered.filter(p =>
                p.variants.every(v => (v.stockOnHand - v.reservedQty) <= 0)
            );
        }
        setFilteredProducts(filtered);
    }, [searchQuery, products, activeCategoryId, stockFilter]);

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
                // Show all active products/variants, including out-of-stock ones
                const activeProds = json.data
                    .filter((p: any) => p.isActive)
                    .map((p: any) => ({
                        ...p,
                        variants: p.variants.filter((v: any) => v.isActive)
                    }))
                    .filter((p: any) => p.variants.length > 0);

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
            const maxStock = variant.stockOnHand - variant.reservedQty;
            const existingIndex = prev.findIndex(item => item.variantId === variant.id);
            if (existingIndex >= 0) {
                // check stock limit
                const currentQty = prev[existingIndex].qty;
                if (currentQty >= maxStock) {
                    addToast("warning", "Stock Limit", 'Not enough stock available.');
                    return prev;
                }
                const newCart = [...prev];
                newCart[existingIndex] = { ...newCart[existingIndex], qty: currentQty + 1 };
                return newCart;
            }
            if (maxStock <= 0) {
                addToast("warning", "Out of Stock", 'This item is out of stock.');
                return prev;
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
    const isPPZone = formData.deliveryZone === "PP";
    const deliveryFee = formData.deliveryZone === "PP" ? deliveryFees.pp : deliveryFees.province;
    const discountValue = Number(formData.discount) || 0;
    const appliedDeliveryFee = formData.isFreeDelivery ? 0 : deliveryFee;
    const total = Math.max(0, subtotal - discountValue + appliedDeliveryFee);

    const handleDeliveryZoneChange = (zone: DeliveryZone) => {
        if (zone === "PP") {
            setFormData(prev => ({
                ...prev,
                deliveryZone: zone,
                paymentMethod: "COD",
                deliveryService: "JALAT",
            }));
            return;
        }

        setFormData(prev => ({
            ...prev,
            deliveryZone: zone,
            paymentMethod: prev.paymentMethod === "COD" ? "ABA" : prev.paymentMethod,
            deliveryService: prev.deliveryService === "JALAT" ? "VET" : prev.deliveryService,
        }));
    };

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
                    isFreeDelivery: formData.isFreeDelivery,
                    paymentMethod: formData.paymentMethod,
                    deliveryService: formData.deliveryService,
                    items: payloadItems,
                    note: formData.note,
                    discount: discountValue,
                    isPOS: true,
                }
            );

            if (res.success && res.order) {
                // Show receipt instead of clearing immediately
                const newReceiptData = {
                    orderCode: res.order.orderCode,
                    date: formatCambodiaDate(new Date(), "dd/MM/yyyy, HH:mm"),
                    customerName: formData.customerName,
                    customerPhone: formData.customerPhone,
                    deliveryAddress: formData.deliveryAddress,
                    deliveryZone: formData.deliveryZone,
                    items: [...cart],
                    deliveryService: formData.deliveryService,
                    subtotal,
                    discount: discountValue,
                    deliveryFee: appliedDeliveryFee,
                    isFreeDelivery: formData.isFreeDelivery,
                    total,
                };
                setReceiptData(newReceiptData);
                const [b1, b2] = buildMessengerBlocks(newReceiptData, khrRate);
                setMsgBlock1(b1);
                setMsgBlock2(b2);
                fetchProducts(); // refresh stock numbers
                addToast("success", "Order Placed", `POS Order ${res.order.orderCode} placed successfully!`);
            } else {
                addToast("error", "Failed", "Failed to create order: " + (res.error || "Unknown error"));
            }
        });
    };

    const handleCloseCart = () => {
        setIsCartOpen(false);
        setMessengerRecipientId(null);
        setSendingBlock(null);
        setMsgBlock1("");
        setMsgBlock2("");
        setFormData({
            customerName: "",
            customerPhone: "",
            deliveryZone: "PP",
            deliveryAddress: "",
            paymentMethod: "COD",
            deliveryService: "JALAT",
            note: "",
            discount: "",
            isFreeDelivery: false,
        });
    };

    const handleNewOrder = () => {
        setCart([]);
        setReceiptData(null);
        setIsCartOpen(false);
        setFormData({
            customerName: "",
            customerPhone: "",
            deliveryZone: "PP",
            deliveryAddress: "",
            paymentMethod: "COD",
            deliveryService: "JALAT",
            note: "",
            discount: "",
            isFreeDelivery: false,
        });
    };

    const copyReceiptToClipboard = () => {
        if (!receiptData) return;
        const textToCopy = `===== Receipt =====\n` +
            `Order: ${receiptData.orderCode}\n` +
            `Date: ${receiptData.date}\n` +
            `Customer: ${receiptData.customerName} (${receiptData.customerPhone})\n` +
            `Address: ${receiptData.deliveryAddress || '-'}\n` +
            `Delivery Service: ${DELIVERY_SERVICE_LABELS[receiptData.deliveryService as DeliveryService] || '-'}\n` +
            `-------------------\n` +
            receiptData.items.map((i: any) => `${i.nameKm} (${i.size}, ${i.color}) x${i.qty} = $${(i.salePrice * i.qty).toFixed(2)}`).join('\n') +
            `\n-------------------\n` +
            `Subtotal: $${receiptData.subtotal.toFixed(2)}\n` +
            (receiptData.discount > 0 ? `Discount: -$${receiptData.discount.toFixed(2)}\n` : '') +
            (receiptData.isFreeDelivery ? `Delivery: FREE\n` : `Delivery: $${receiptData.deliveryFee.toFixed(2)}\n`) +
            `Total: $${receiptData.total.toFixed(2)}\n` +
            `===================`;

        navigator.clipboard.writeText(textToCopy).then(() => {
            addToast("success", "Copied", "Receipt text copied to clipboard!");
        });
    };

    const buildMessengerBlocks = (data: any, rate = khrRate): [string, string] => {
        const itemLines = data.items
            .map((item: any) => {
                const variant = [item.size, item.color].filter(Boolean).join("/");
                return `• ${item.nameKm}${variant ? ` (${variant})` : ""} x${item.qty} = $${(item.salePrice * item.qty).toFixed(2)}`;
            })
            .join("\n");

        const priceLines = [
            data.discount > 0 ? `តម្លៃដើម: $${data.subtotal.toFixed(2)}` : null,
            data.discount > 0 ? `បញ្ចុះតម្លៃ: -$${data.discount.toFixed(2)}` : null,
            data.isFreeDelivery ? `សេវាដឹក: ឥតគិតថ្លៃ` : `សេវាដឹក: $${data.deliveryFee.toFixed(2)}`,
            `សរុប: $${data.total.toFixed(2)} = ${Math.round(data.total * rate).toLocaleString()}រ ណា៎បង`,
        ].filter(Boolean).join("\n");

        const block1 = [itemLines, priceLines, ``, `📞 ${data.customerPhone}`, `📍 ${data.deliveryAddress}`].join("\n");

        const block2 = data.deliveryZone === "PROVINCE"
            ? `ចំពោះឥវ៉ាន់តាមខេត្តប្អូនសុំទូទាត់មុនណា៎បង បងទូទាត់រួចប្អូនចេញឥវ៉ាន់ជូនបងក្នុងថ្ងៃនឹង ឬយ៉ាងយូរស្អែកព្រឹក🥰\nបន្ទាប់ពីដាក់ឥវ៉ាន់រួចប្អូននឹងថតវិកយប័ត្រដឹកជញ្ជូនជូនបង\nអរគុណច្រើនបង ❤️🙏🏻`
            : `ចំពោះឥវ៉ាន់នៅភ្នំពេញបងអាចទូទាត់ជាមួយអ្នកដឹកបានអ្នក 🥰🙏🏻\nអរគុណច្រើនបង❤️`;

        return [block1, block2];
    };

    const handleSendBlock = async (block: 1 | 2) => {
        if (!messengerRecipientId) return;
        setSendingBlock(block);
        try {
            await fetch("/api/admin/messenger/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ recipientId: messengerRecipientId, message: block === 1 ? msgBlock1 : msgBlock2 }),
            });
            addToast("success", "បានផ្ញើ", `បានផ្ញើសារទី${block === 1 ? "១" : "២"}រួចរាល់!`);
        } catch {
            addToast("error", "មិនបានផ្ញើ", "មានបញ្ហាក្នុងការផ្ញើសារ");
        } finally {
            setSendingBlock(null);
        }
    };

    const handleSendQR = async () => {
        if (!messengerRecipientId || (!sendRiel && !sendUsd)) return;
        setSendingQR(true);
        try {
            if (sendRiel) {
                await fetch("/api/admin/messenger/send-image", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ recipientId: messengerRecipientId, imageFile: "riel.jpg" }),
                });
            }
            if (sendUsd) {
                await fetch("/api/admin/messenger/send-image", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ recipientId: messengerRecipientId, imageFile: "usd.jpg" }),
                });
            }
            addToast("success", "បានផ្ញើ", "បានផ្ញើ QR រួចរាល់!");
        } catch {
            addToast("error", "មិនបានផ្ញើ", "មានបញ្ហាក្នុងការផ្ញើ QR");
        } finally {
            setSendingQR(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] overflow-hidden relative w-full bg-white dark:bg-gray-950 shadow-sm rounded-2xl border border-gray-100 dark:border-gray-800 -mt-2 print:h-auto print:border-none print:shadow-none print:overflow-visible">
            <div className={`w-full h-full flex flex-col relative ${receiptData ? 'print:hidden' : ''}`}>

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
                    {/* Stock Filter Tabs */}
                    <div className="flex gap-2 pt-2 pb-3">
                        {([
                            { key: 'ALL', label: 'ទាំងអស់' },
                            { key: 'IN_STOCK', label: 'មានស្តុក' },
                            { key: 'OUT_OF_STOCK', label: 'អស់ស្តុក' },
                        ] as const).map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setStockFilter(key)}
                                className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                                    stockFilter === key
                                        ? key === 'OUT_OF_STOCK'
                                            ? 'bg-red-500 text-white border-red-500'
                                            : 'bg-[#e21b70] text-white border-[#e21b70]'
                                        : 'bg-transparent text-gray-500 border-gray-200 dark:border-gray-700 hover:border-gray-400'
                                }`}
                            >
                                {label}
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
                                const totalAvailableStock = product.variants.reduce((sum, v) => sum + (v.stockOnHand - v.reservedQty), 0);
                                const isOutOfStock = totalAvailableStock === 0;
                                const isLowStock = !isOutOfStock && totalAvailableStock <= 5;
                                return (
                                    <div key={product.id} className="relative group cursor-pointer" onClick={() => handleProductClick(product)}>
                                        <div className="aspect-square relative bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden mb-2">
                                            {product.images?.[0]?.url ? (
                                                <Image src={product.images[0].url} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon className="w-8 h-8 opacity-50" /></div>
                                            )}
                                            {/* Quick Update Stock Link */}
                                            <a
                                                href={`/admin/products/${product.id}#variants`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                title="Update stock"
                                                className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
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
                                        <div className="flex justify-between items-center mt-1">
                                            <div className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                                                from ${product.variants.length > 0 ? Math.min(...product.variants.map(v => Number(v.salePrice))).toFixed(2) : "0.00"}
                                            </div>
                                            <div className={`text-[11px] px-1.5 py-0.5 rounded-md border font-bold ${
                                                isOutOfStock
                                                    ? 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-800 dark:text-gray-600 dark:border-gray-700'
                                                    : isLowStock
                                                        ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50'
                                                        : 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                                            }`}>
                                                {totalAvailableStock} in stock
                                            </div>
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
                {isCartOpen && !receiptData && (
                    <div className="fixed inset-0 z-[999999] flex flex-col justify-end sm:justify-center sm:items-center sm:p-4">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseCart}></div>
                        <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full max-w-lg sm:max-w-2xl flex flex-col relative animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 max-h-[92vh] sm:max-h-[90vh] shadow-2xl overflow-hidden">
                            {/* Drawer Header */}
                            <div className="p-4 flex justify-between items-center shrink-0">
                                <button onClick={handleCloseCart} className="p-2 -ml-2 text-gray-900 dark:text-white">
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
                                        {discountValue > 0 && <div className="flex justify-between text-green-600 dark:text-green-400"><span>Discount</span><span>-${discountValue.toFixed(2)}</span></div>}
                                        <div className="flex justify-between">
                                            <span>Standard delivery {formData.isFreeDelivery && <span className="text-[#e21b70] text-xs font-bold bg-pink-50 px-2 py-0.5 rounded ml-2">FREE</span>}</span>
                                            <span className={formData.isFreeDelivery ? "line-through text-gray-400" : ""}>${deliveryFee.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white pt-2">
                                            <span>Total <span className="text-sm font-normal text-gray-500">(incl. fees and tax)</span></span>
                                            <span className="text-[#e21b70]">${total.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <hr className="border-gray-100 dark:border-gray-800" />

                                    {/* Import from Messenger */}
                                    <MessengerImport
                                        onFill={({ name, phone, address }) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                ...(name    ? { customerName: name }       : {}),
                                                ...(phone   ? { customerPhone: phone }     : {}),
                                                ...(address ? { deliveryAddress: address } : {}),
                                            }));
                                        }}
                                        onSelectConversation={(id) => setMessengerRecipientId(id)}
                                    />

                                    <hr className="border-gray-100 dark:border-gray-800" />

                                    {/* Checkout Form */}
                                    <form id="pos-checkout-form" onSubmit={handleCheckout} className="space-y-4 pb-4">
                                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">Delivery details</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input required placeholder="Customer Name" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-[15px] w-full focus:ring-2 focus:ring-[#e21b70] outline-none" />
                                            <input required placeholder="Phone Number" value={formData.customerPhone} onChange={e => setFormData({ ...formData, customerPhone: e.target.value })} className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-[15px] w-full focus:ring-2 focus:ring-[#e21b70] outline-none" />
                                        </div>
                                        <div className="flex gap-3">
                                            <select value={formData.deliveryZone} onChange={e => handleDeliveryZoneChange(e.target.value as DeliveryZone)} className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-[15px] w-1/3 focus:ring-2 focus:ring-[#e21b70] outline-none">
                                                <option value="PP">PP</option>
                                                <option value="PROVINCE">Province</option>
                                            </select>
                                            <input required placeholder="Detailed Address" value={formData.deliveryAddress} onChange={e => setFormData({ ...formData, deliveryAddress: e.target.value })} className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-[15px] w-2/3 focus:ring-2 focus:ring-[#e21b70] outline-none" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <select value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })} className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-[15px] w-full focus:ring-2 focus:ring-[#e21b70] outline-none">
                                                <option value="COD" disabled={!isPPZone}>COD (Cash)</option>
                                                <option value="ABA" disabled={isPPZone}>ABA Pay</option>
                                                <option value="WING" disabled={isPPZone}>WING</option>
                                            </select>
                                            <select value={formData.deliveryService} onChange={e => setFormData({ ...formData, deliveryService: e.target.value as DeliveryService })} className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-[15px] w-full focus:ring-2 focus:ring-[#e21b70] outline-none">
                                                <option value="JALAT" disabled={!isPPZone}>Jalat (ចល័ត)</option>
                                                <option value="VET" disabled={isPPZone}>VET (វីរប៊ុនថាំ)</option>
                                                <option value="JT" disabled={isPPZone}>J&T</option>
                                            </select>
                                        </div>
                                        <input placeholder="Note (Optional)" value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-[15px] w-full focus:ring-2 focus:ring-[#e21b70] outline-none" />
                                        <p className="text-xs text-gray-500">
                                            {isPPZone ? "PP orders are locked to COD + Jalat." : "Province orders allow ABA/WING and only VET or J&T."}
                                        </p>

                                        <h3 className="font-bold text-gray-900 dark:text-white text-lg mt-4">Discounts & Options</h3>
                                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700">
                                            <input type="checkbox" id="free-delivery" checked={formData.isFreeDelivery} onChange={e => setFormData({ ...formData, isFreeDelivery: e.target.checked })} className="w-5 h-5 rounded border-gray-300 text-[#e21b70] focus:ring-[#e21b70]" />
                                            <label htmlFor="free-delivery" className="flex-1 font-medium text-gray-900 dark:text-white text-[15px] cursor-pointer">Free Delivery (Shop pays)</label>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-full">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                                                <input
                                                    type="number"
                                                    placeholder="Cash Discount Amount"
                                                    value={formData.discount}
                                                    onChange={e => setFormData({ ...formData, discount: e.target.value })}
                                                    className="pl-8 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-[15px] w-full focus:ring-2 focus:ring-[#e21b70] outline-none"
                                                />
                                            </div>
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
            {/* Successful Order Receipt Modal (Moved outside the relative wrapper) */}
            {receiptData && (
                <div className="fixed inset-0 z-[999999] flex flex-col justify-end sm:justify-center sm:items-center sm:p-4 print:static print:inset-auto print:flex-none print:block">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm print:hidden"></div>
                    <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md flex flex-col relative animate-in zoom-in-95 duration-300 ease-out shadow-2xl overflow-hidden print:w-full print:max-w-none print:shadow-none print:rounded-none">
                        <div className="px-4 py-2 flex items-center justify-center gap-2 border-b border-gray-100 dark:border-gray-800 print:hidden">
                            <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center shrink-0">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <span className="font-black text-gray-900 dark:text-white text-sm">Order Confirmed!</span>
                            <span className="text-gray-400 text-xs">#{receiptData.orderCode}</span>
                        </div>

                        <div id="receipt-content" className="p-6 overflow-y-auto max-h-[50vh] bg-white text-gray-900">
                            <div className="text-center mb-6 hidden print:block">
                                <h2 className="text-2xl font-black">Neary Collection</h2>
                                <p className="text-sm text-gray-500">Order #{receiptData.orderCode}</p>
                            </div>

                            <div className="text-sm space-y-3 mb-6">
                                <div className="flex justify-between"><span>Date:</span> <span>{receiptData.date}</span></div>
                                <div className="flex justify-between"><span>Customer:</span> <span className="font-bold">{receiptData.customerName}</span></div>
                                <div className="flex justify-between"><span>Phone:</span> <span>{receiptData.customerPhone}</span></div>
                                <div className="flex justify-between"><span>Address:</span> <span className="text-right ml-4 break-words max-w-[60%]">{receiptData.deliveryAddress || "-"}</span></div>
                                <div className="flex justify-between"><span>Delivery Service:</span> <span>{DELIVERY_SERVICE_LABELS[receiptData.deliveryService as DeliveryService] || "-"}</span></div>
                            </div>

                            <div className="border-t border-b border-gray-200 py-4 space-y-3 mb-4">
                                {receiptData.items.map((item: any) => (
                                    <div key={item.variantId} className="flex justify-between text-sm">
                                        <div>
                                            <div className="font-medium">{item.nameKm}</div>
                                            <div className="text-gray-500 text-xs">{item.qty} x ${item.salePrice.toFixed(2)} ({item.size}, {item.color})</div>
                                        </div>
                                        <div className="font-medium">${(item.salePrice * item.qty).toFixed(2)}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span>Subtotal</span> <span>${receiptData.subtotal.toFixed(2)}</span></div>
                                {receiptData.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span> <span>-${receiptData.discount.toFixed(2)}</span></div>}
                                <div className="flex justify-between"><span>Delivery {receiptData.isFreeDelivery && '(Free)'}</span> <span>${receiptData.deliveryFee.toFixed(2)}</span></div>
                                <div className="flex justify-between text-lg font-black pt-2 border-t border-gray-200 mt-2">
                                    <span>Total</span>
                                    <span>${receiptData.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-gray-800 space-y-3 print:hidden shrink-0">

                            {messengerRecipientId && (
                                <div className="space-y-2">
                                    {/* Block 2 — payment text */}
                                    <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 flex gap-3 items-start">
                                        <textarea
                                            value={msgBlock2}
                                            onChange={e => setMsgBlock2(e.target.value)}
                                            rows={4}
                                            className="flex-1 text-xs text-gray-700 dark:text-gray-200 bg-transparent resize-none outline-none leading-relaxed font-sans"
                                        />
                                        <button
                                            onClick={() => handleSendBlock(2)}
                                            disabled={sendingBlock !== null || sendingQR}
                                            className="shrink-0 px-3 py-2 bg-[#e21b70] text-white text-xs font-bold rounded-lg hover:bg-[#c2145e] disabled:opacity-40 transition flex items-center gap-1"
                                        >
                                            {sendingBlock === 2 ? <Loader2 className="w-3 h-3 animate-spin" /> : "Send"}
                                        </button>
                                    </div>
                                    {/* QR Block */}
                                    <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 space-y-2">
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">QR Payment</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => { setSendRiel(true); setSendUsd(true); }}
                                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${sendRiel && sendUsd ? "bg-[#e21b70] text-white border-[#e21b70]" : "bg-transparent text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-500 hover:border-[#e21b70]"}`}
                                            >
                                                Both
                                            </button>
                                            <button
                                                onClick={() => { setSendRiel(true); setSendUsd(false); }}
                                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${sendRiel && !sendUsd ? "bg-[#e21b70] text-white border-[#e21b70]" : "bg-transparent text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-500 hover:border-[#e21b70]"}`}
                                            >
                                                រៀល only
                                            </button>
                                            <button
                                                onClick={() => { setSendRiel(false); setSendUsd(true); }}
                                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${!sendRiel && sendUsd ? "bg-[#e21b70] text-white border-[#e21b70]" : "bg-transparent text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-500 hover:border-[#e21b70]"}`}
                                            >
                                                USD only
                                            </button>
                                            <button
                                                onClick={handleSendQR}
                                                disabled={sendingQR || sendingBlock !== null || (!sendRiel && !sendUsd)}
                                                className="shrink-0 px-3 py-1.5 bg-[#e21b70] text-white text-xs font-bold rounded-lg hover:bg-[#c2145e] disabled:opacity-40 transition flex items-center gap-1"
                                            >
                                                {sendingQR ? <Loader2 className="w-3 h-3 animate-spin" /> : "Send"}
                                            </button>
                                        </div>
                                    </div>
                                    {/* Block 1 — order summary */}
                                    <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 flex gap-3 items-start">
                                        <textarea
                                            value={msgBlock1}
                                            onChange={e => setMsgBlock1(e.target.value)}
                                            rows={7}
                                            className="flex-1 text-xs text-gray-700 dark:text-gray-200 bg-transparent resize-none outline-none leading-relaxed font-sans"
                                        />
                                        <button
                                            onClick={() => handleSendBlock(1)}
                                            disabled={sendingBlock !== null || sendingQR}
                                            className="shrink-0 px-3 py-2 bg-[#e21b70] text-white text-xs font-bold rounded-lg hover:bg-[#c2145e] disabled:opacity-40 transition flex items-center gap-1"
                                        >
                                            {sendingBlock === 1 ? <Loader2 className="w-3 h-3 animate-spin" /> : "Send"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => window.print()} className="py-3 px-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-600 transition">
                                    Print
                                </button>
                                <button onClick={handleNewOrder} className="py-3 px-4 bg-[#e21b70] text-white rounded-xl font-bold hover:bg-[#c2145e] transition">
                                    New Order
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Select Variant Modal */}
            {isProductModalOpen && selectedProduct && (
                <div className="fixed inset-0 z-[999999] flex flex-col justify-end sm:justify-center sm:items-center sm:p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setIsProductModalOpen(false); setSelectedProduct(null); }}></div>
                    <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full max-w-md sm:max-w-xl mx-auto flex flex-col relative animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 max-h-[85vh] sm:max-h-[90vh] shadow-2xl overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center shrink-0 bg-white dark:bg-gray-900 z-10">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">{selectedProduct?.nameKm}</h2>
                            <div className="flex items-center gap-2">
                                <a
                                    href={`/admin/products/${selectedProduct?.id}#variants`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Update stock"
                                    className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 font-medium"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    <span className="hidden sm:inline">Update stock</span>
                                </a>
                                <button onClick={() => { setIsProductModalOpen(false); setSelectedProduct(null); }} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                                    <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                </button>
                            </div>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 min-h-0">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Choose variation</h3>
                            <div className="space-y-3">
                                {selectedProduct?.variants.map((variant) => {
                                    const availableStock = variant.stockOnHand - variant.reservedQty;
                                    const isOutOfStock = availableStock <= 0;
                                    return (
                                        <button
                                            key={variant.id}
                                            onClick={() => !isOutOfStock && selectedProduct && addToCart(variant, selectedProduct)}
                                            disabled={isOutOfStock}
                                            className={`w-full text-left p-4 rounded-xl border-2 transition-all flex justify-between items-center ${
                                                isOutOfStock
                                                    ? 'border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed'
                                                    : 'border-gray-100 dark:border-gray-800 hover:border-[#e21b70] hover:bg-[#e21b70]/5 cursor-pointer group'
                                            }`}
                                        >
                                            <div>
                                                <div className="font-semibold text-gray-900 dark:text-white capitalize flex items-center gap-2 text-[15px]">
                                                    {variant.color} - {variant.size}
                                                </div>
                                                <div className="text-sm text-gray-500 mt-1 flex gap-2 items-center">
                                                    <span>SKU: {variant.sku}</span>
                                                    <span>•</span>
                                                    <span className={`${isOutOfStock ? 'text-red-500 font-semibold' : availableStock <= 2 ? 'text-red-500' : 'text-gray-500'}`}>Stock: {availableStock}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-[17px] font-bold text-gray-900 dark:text-white">
                                                    ${Number(variant.salePrice).toFixed(2)}
                                                </div>
                                                {isOutOfStock ? (
                                                    <a
                                                        href={`/admin/products/${selectedProduct?.id}#variants`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="flex items-center gap-1 text-xs text-[#e21b70] font-semibold hover:underline"
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                        បំពេញស្តុក
                                                    </a>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-[#e21b70] text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                                        <Plus className="w-4 h-4" />
                                                    </div>
                                                )}
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

