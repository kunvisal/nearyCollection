"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import styles from "./ProductDetail.module.css";
import Link from "next/link";
import { useCartStore } from "@/lib/store/cartStore";
import { MessageCircle, ShoppingBag, Send } from "lucide-react";

export default function ProductDetail({ product, settings }: { product: any, settings?: any }) {
    const { addItem } = useCartStore();

    // Group variants by color and size to build selectors
    const colors = Array.from(new Set(product.variants.map((v: any) => v.color).filter(Boolean))) as string[];
    const sizes = Array.from(new Set(product.variants.map((v: any) => v.size).filter(Boolean))) as string[];

    const [selectedColor, setSelectedColor] = useState<string | null>(colors.length > 0 ? colors[0] : null);
    const [selectedSize, setSelectedSize] = useState<string | null>(sizes.length > 0 ? sizes[0] : null);

    // Find the specific variant that matches the selections
    const selectedVariant = useMemo(() => {
        if (!product.variants || product.variants.length === 0) return null;

        let match = product.variants.find((v: any) => {
            const colorMatch = selectedColor ? v.color === selectedColor : true;
            const sizeMatch = selectedSize ? v.size === selectedSize : true;
            return colorMatch && sizeMatch && v.isActive;
        });

        // Fallback to first active variant if no exact match (helps when just navigating)
        if (!match) {
            match = product.variants.find((v: any) => v.isActive);
        }

        return match;
    }, [product.variants, selectedColor, selectedSize]);

    const displayImage = selectedVariant?.imageUrl || product.images?.[0]?.url || "/images/placeholder-product.svg";
    const isOutOfStock = selectedVariant ? Number(selectedVariant.stockOnHand) <= 0 : true;

    const handleAddToCart = () => {
        if (selectedVariant && !isOutOfStock) {
            addItem({
                variantId: selectedVariant.id,
                productId: product.id,
                nameKm: product.nameKm,
                nameEn: product.nameEn,
                salePrice: Number(selectedVariant.salePrice),
                imageUrl: selectedVariant.imageUrl || product.images?.[0]?.url,
                size: selectedVariant.size,
                color: selectedVariant.color,
                sku: selectedVariant.sku || "",
                stockOnHand: Number(selectedVariant.stockOnHand)
            });
        }
    };

    return (
        <div className={styles.container}>
            {/* Gallery */}
            <div className={styles.galleryContainer}>
                <Image
                    src={displayImage}
                    alt={product.nameKm}
                    fill
                    className={styles.galleryImage}
                    unoptimized
                />
                <Link href="/" className="absolute top-4 left-4 z-20 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-sm text-gray-900 border border-gray-200">
                    ←
                </Link>
            </div>

            {/* Content */}
            <div className={styles.infoSection}>
                <div className={styles.priceRow}>
                    {selectedVariant ? (
                        <>
                            <span className={styles.price}>${Number(selectedVariant.salePrice).toFixed(2)}</span>
                            {Number(selectedVariant.costPrice) > 0 && Number(selectedVariant.costPrice) > Number(selectedVariant.salePrice) && (
                                <span className="text-gray-400 text-sm line-through">${Number(selectedVariant.costPrice).toFixed(2)}</span>
                            )}
                        </>
                    ) : (
                        <span className={styles.price}>Not Available</span>
                    )}
                </div>

                <h1 className={styles.title}>{product.nameKm} {product.nameEn ? `| ${product.nameEn}` : ''}</h1>

                {/* Status / Stock (Hidden from customers on UI, just show Out of Stock if unavailable, or SKU) */}
                {selectedVariant && (
                    <div className="mt-2 flex items-center justify-between">
                        {isOutOfStock ? (
                            <span className="text-red-500 font-medium text-sm">Out of Stock</span>
                        ) : (
                            <span className="text-green-600 font-medium text-sm">In Stock</span>
                        )}
                        {selectedVariant.sku && <span className="text-gray-400 text-xs text-right">SKU: {selectedVariant.sku}</span>}
                    </div>
                )}

                {/* Color Selection */}
                {colors.length > 0 && (
                    <div className={styles.optionGroup}>
                        <h3 className={styles.optionTitle}>Color</h3>
                        <div className={styles.optionList}>
                            {colors.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setSelectedColor(color)}
                                    className={`${styles.optionPill} ${selectedColor === color ? styles.selected : ''}`}
                                >
                                    {color}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Size Selection */}
                {sizes.length > 0 && (
                    <div className={styles.optionGroup}>
                        <h3 className={styles.optionTitle}>Size</h3>
                        <div className={styles.optionList}>
                            {sizes.map((size) => (
                                <button
                                    key={size}
                                    onClick={() => setSelectedSize(size)}
                                    className={`${styles.optionPill} ${selectedSize === size ? styles.selected : ''}`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Description */}
                {(product.descriptionKm || product.descriptionEn) && (
                    <div className="mt-6">
                        <h3 className={styles.optionTitle}>Description</h3>
                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                            {product.descriptionKm || product.descriptionEn}
                        </p>
                    </div>
                )}

                {/* Direct Order Actions */}
                <div className="mt-6 space-y-3">
                    {/* Primary Order Action - Telegram */}
                    <button
                        className={`w-full py-3 px-6 rounded-lg font-medium text-lg flex items-center justify-center gap-2 transition-all ${isOutOfStock
                            ? 'opacity-50 cursor-not-allowed bg-gray-400 text-white'
                            : 'bg-[#0088cc] hover:bg-[#0077b5] text-white shadow-md'
                            }`}
                        onClick={() => {
                            if (!isOutOfStock && settings?.contactTelegram) {
                                // If the token doesn't have t.me/ or http, prepend t.me/
                                const link = settings.contactTelegram.includes('t.me') || settings.contactTelegram.includes('http')
                                    ? settings.contactTelegram
                                    : `https://t.me/${settings.contactTelegram.replace('@', '')}`;
                                window.open(link, '_blank');
                            } else if (!isOutOfStock) {
                                alert("Telegram contact is not set up yet.");
                            }
                        }}
                        disabled={isOutOfStock}
                    >
                        <Send className="w-5 h-5" />
                        <span>Order via Telegram</span>
                    </button>

                    <div className="flex gap-3">
                        {/* Secondary Order Action - Add to Cart */}
                        <button
                            className={`flex-[2] py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all border-2 ${isOutOfStock
                                ? 'opacity-50 cursor-not-allowed border-gray-300 text-gray-400'
                                : 'border-black text-black hover:bg-black hover:text-white'
                                }`}
                            onClick={handleAddToCart}
                            disabled={isOutOfStock || !selectedVariant}
                        >
                            <ShoppingBag className="w-5 h-5" />
                            <span>Add to Bag</span>
                        </button>

                        {/* Other Chat Options */}
                        <div className="flex gap-2 flex-1 items-center justify-end">
                            {settings?.contactMessenger && (
                                <button
                                    onClick={() => window.open(settings.contactMessenger.includes('http') ? settings.contactMessenger : `https://${settings.contactMessenger}`, '_blank')}
                                    className="w-12 h-12 rounded-full bg-[#00B2FF] hover:bg-[#0099e5] text-white flex items-center justify-center shadow-sm transition-transform hover:scale-105"
                                    title="Contact via Messenger"
                                >
                                    <MessageCircle className="w-6 h-6" />
                                </button>
                            )}
                            {settings?.contactFacebook && (
                                <button
                                    onClick={() => window.open(settings.contactFacebook.includes('http') ? settings.contactFacebook : `https://${settings.contactFacebook}`, '_blank')}
                                    className="w-12 h-12 rounded-full bg-[#1877F2] hover:bg-[#166fe5] text-white flex items-center justify-center shadow-sm transition-transform hover:scale-105"
                                    title="View Facebook Page"
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Footer for Mobile */}
            <div className={`${styles.footer} md:hidden`}>
                <div className="flex gap-2 w-full px-4 py-3 bg-white border-t border-gray-200">
                    <button
                        className={`flex-[2] py-2.5 px-4 rounded-lg font-medium text-base flex items-center justify-center gap-2 transition-all ${isOutOfStock
                            ? 'opacity-50 cursor-not-allowed bg-gray-400 text-white'
                            : 'bg-[#0088cc] text-white'
                            }`}
                        onClick={() => {
                            if (!isOutOfStock && settings?.contactTelegram) {
                                const link = settings.contactTelegram.includes('t.me') || settings.contactTelegram.includes('http')
                                    ? settings.contactTelegram
                                    : `https://t.me/${settings.contactTelegram.replace('@', '')}`;
                                window.open(link, '_blank');
                            }
                        }}
                        disabled={isOutOfStock}
                    >
                        <Send className="w-5 h-5" />
                        <span>Telegram</span>
                    </button>

                    <button
                        className={`flex-[1] py-2.5 px-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all border-2 ${isOutOfStock
                            ? 'opacity-50 cursor-not-allowed border-gray-300 text-gray-400'
                            : 'border-black text-black'
                            }`}
                        onClick={handleAddToCart}
                        disabled={isOutOfStock || !selectedVariant}
                        title="Add to Bag"
                    >
                        <ShoppingBag className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

