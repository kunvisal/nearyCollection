"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./ProductGrid.module.css";
import { getProductsByCategoryAction } from "@/app/actions/shopActions";

interface Product {
    id: string;
    name: string;
    price: number;
    image: string;
}

interface InfiniteProductGridProps {
    initialProducts: Product[];
    categoryId: number;
    initialHasMore: boolean;
}

export default function InfiniteProductGrid({ initialProducts, categoryId, initialHasMore }: InfiniteProductGridProps) {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [isLoading, setIsLoading] = useState(false);

    const loadMore = async () => {
        if (isLoading || !hasMore) return;
        setIsLoading(true);

        try {
            const nextPage = page + 1;
            const res = await getProductsByCategoryAction(categoryId, nextPage, 10);

            setProducts(prev => [...prev, ...res.products]);
            setHasMore(res.hasMore);
            setPage(nextPage);
        } catch (error) {
            console.error("Failed to load more products", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {products.length === 0 ? (
                <div className="text-center text-gray-500 py-10">No products found for this category.</div>
            ) : (
                <div className={styles.grid}>
                    {products.map((product) => (
                        <Link href={`/product/${product.id}`} key={product.id} className={styles.card}>
                            <div className={styles.imageWrapper}>
                                <Image
                                    src={product.image}
                                    alt={product.name}
                                    fill
                                    className={styles.image}
                                    unoptimized // Optional: if Next.js image optimization acts up with external domains locally
                                />
                            </div>
                            <h3 className={styles.title}>{product.name}</h3>
                            <span className={styles.price}>${product.price.toFixed(2)}</span>
                        </Link>
                    ))}
                </div>
            )}

            {hasMore && (
                <div className="flex justify-center mt-4 mb-8 text-sm">
                    <button
                        onClick={loadMore}
                        disabled={isLoading}
                        className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-full font-medium hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                        {isLoading ? "Loading..." : "Load More"}
                    </button>
                </div>
            )}
        </div>
    );
}
