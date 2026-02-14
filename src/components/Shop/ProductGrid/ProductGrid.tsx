"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./ProductGrid.module.css";
import { mockProducts, Product } from "@/data/mockData";

interface ProductGridProps {
    products?: Product[];
}

export default function ProductGrid({ products = mockProducts }: ProductGridProps) {
    return (
        <div className={styles.grid}>
            {products.map((product) => (
                <Link href={`/product/${product.id}`} key={product.id} className={styles.card}>
                    <div className={styles.imageWrapper}>
                        <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className={styles.image}
                        />
                    </div>
                    <h3 className={styles.title}>{product.name}</h3>
                    <span className={styles.price}>${product.price.toFixed(2)}</span>
                </Link>
            ))}
        </div>
    );
}

