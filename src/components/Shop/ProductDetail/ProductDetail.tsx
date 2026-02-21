"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import styles from "./ProductDetail.module.css";
import Link from "next/link";
import { useCartStore } from "@/lib/store/cartStore";

export default function ProductDetail({ product }: { product: any }) {
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

                {/* Status / Stock */}
                {selectedVariant && (
                    <div className="mt-2 flex items-center gap-2">
                        {isOutOfStock ? (
                            <span className="text-red-500 font-medium text-sm">Out of Stock</span>
                        ) : (
                            <span className="text-green-600 font-medium text-sm">In Stock ({selectedVariant.stockOnHand} available)</span>
                        )}
                        {selectedVariant.sku && <span className="text-gray-400 text-xs ml-auto">SKU: {selectedVariant.sku}</span>}
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

                {/* Desktop Action Button */}
                <button
                    className={`${styles.desktopButton} mt-6 ${isOutOfStock ? 'opacity-50 cursor-not-allowed bg-gray-400 text-white' : 'bg-black text-white hover:bg-gray-800'}`}
                    onClick={handleAddToCart}
                    disabled={isOutOfStock || !selectedVariant}
                >
                    <span>{isOutOfStock ? "Out of Stock" : "Add to Cart"}</span>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                </button>
                <div className="mt-4 flex justify-center">
                    <button onClick={() => window.open('https://t.me/nearycollection', '_blank')} className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center gap-1">
                        Or Order via Telegram
                    </button>
                </div>
            </div>

            {/* Sticky Footer for Mobile */}
            <div className={`${styles.footer} md:hidden`}>
                <button
                    className={`${styles.chatButton} ${isOutOfStock ? 'opacity-50 cursor-not-allowed bg-gray-400 text-white' : 'bg-black text-white'}`}
                    onClick={handleAddToCart}
                    disabled={isOutOfStock || !selectedVariant}
                >
                    <span>{isOutOfStock ? "Out of Stock" : "Add to Cart"}</span>
                    {!isOutOfStock && (
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
}

