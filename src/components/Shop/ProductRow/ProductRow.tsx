"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./ProductRow.module.css";

import { mockProducts, Product } from "@/data/mockData";

interface ProductRowProps {
    title: string;
    seeAllLink?: string;
    products?: Product[];
}

export default function ProductRow({ title, seeAllLink = "/products", products = mockProducts }: ProductRowProps) {
    return (
        <div className={styles.rowContainer}>
            <div className={styles.header}>
                <h3 className={styles.title}>{title}</h3>
                <Link href={seeAllLink} className={styles.seeAll}>
                    See All
                </Link>
            </div>

            <div className={styles.scrollContainer}>
                {products.slice(0, 6).map((product) => (
                    <Link href={`/product/${product.id}`} key={product.id} className={styles.productCard}>
                        <div className={styles.imageWrapper}>
                            <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className={styles.image}
                            />
                        </div>
                        <div className={styles.productName}>{product.name}</div>
                        <div className={styles.price}>${product.price.toFixed(2)}</div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

