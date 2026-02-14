"use client";

import React, { useState } from "react";
import Image from "next/image";
import styles from "./ProductDetail.module.css";
import Link from "next/link";
import { Product } from "@/data/mockData";

interface ProductDetailProps {
    product: Product;
}

export default function ProductDetail({ product }: ProductDetailProps) {
    const [selectedSize, setSelectedSize] = useState(product.sizes[0] || "M");
    const [selectedColor, setSelectedColor] = useState(product.colors[0] || "Default");

    return (
        <div className={styles.container}>
            {/* Gallery */}
            <div className={styles.galleryContainer}>
                <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className={styles.galleryImage}
                />
                {/* Simple Back Button Overlap */}
                <Link href="/" className="absolute top-4 left-4 z-20 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-sm">
                    ←
                </Link>
            </div>

            {/* Content */}
            <div className={styles.infoSection}>
                <div className={styles.priceRow}>
                    <span className={styles.price}>${product.price.toFixed(2)}</span>
                    {product.originalPrice && (
                        <span className="text-gray-400 text-sm line-through">${product.originalPrice.toFixed(2)}</span>
                    )}
                </div>

                <h1 className={styles.title}>{product.name}</h1>

                {/* Color Selection */}
                <div className={styles.optionGroup}>
                    <h3 className={styles.optionTitle}>Color</h3>
                    <div className={styles.optionList}>
                        {product.colors.map((color) => (
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

                {/* Size Selection */}
                <div className={styles.optionGroup}>
                    <h3 className={styles.optionTitle}>Size</h3>
                    <div className={styles.optionList}>
                        {product.sizes.map((size) => (
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

                {/* Description */}
                <div className="mt-6">
                    <h3 className={styles.optionTitle}>Description</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                        {product.description}
                    </p>
                </div>
            </div>

            {/* Sticky Footer */}
            <div className={styles.footer}>
                {/* Chat/Buy Button */}
                <button
                    className={styles.chatButton}
                    onClick={() => window.open('https://t.me/nearycollection', '_blank')}
                >
                    <span>Order via Chat</span>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

