"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./ProductRow.module.css";

import { mockProducts } from "@/data/mockData";

interface MappedProduct {
    id: any;
    name: any;
    price: number;
    image: any;
    [key: string]: any;
}

interface ProductRowProps {
    title: string;
    seeAllLink?: string;
    products?: MappedProduct[];
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
                                width={300} // Responsive placeholder container bounds
                                height={400} // This will scale via CSS `height: auto`
                                className={styles.image}
                                unoptimized={true} // Allow natural sizes from ext sources
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

