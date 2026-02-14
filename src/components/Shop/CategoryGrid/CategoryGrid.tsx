"use client";

import React from "react";
import Link from "next/link";
import styles from "./CategoryGrid.module.css";

// Mock Categories
const categories = [
    { id: 1, name: "Dresses", icon: "👗", slug: "dresses" },
    { id: 2, name: "Tops", icon: "👚", slug: "tops" },
    { id: 3, name: "Pants", icon: "👖", slug: "pants" },
    { id: 4, name: "Skirts", icon: "🩰", slug: "skirts" },
    { id: 5, name: "Sets", icon: "✨", slug: "sets" },
    { id: 6, name: "Outer", icon: "🧥", slug: "outerwear" },
    { id: 7, name: "Shoes", icon: "👠", slug: "shoes" },
    { id: 8, name: "Sale", icon: "🔥", slug: "sale" },
    { id: 9, name: "Bags", icon: "👜", slug: "bags" },
    { id: 10, name: "Accessories", icon: "💍", slug: "accessories" },
    { id: 11, name: "New", icon: "🆕", slug: "new-arrivals" },
    { id: 12, name: "Best Sellers", icon: "⭐", slug: "best-sellers" },
];

export default function CategoryGrid() {
    return (
        <div className={styles.gridContainer}>
            {categories.map((cat) => (
                <Link href={`/category/${cat.slug}`} key={cat.id} className={styles.categoryItem}>
                    <div className={styles.iconWrapper}>
                        {cat.icon}
                    </div>
                    <span className={styles.label}>{cat.name}</span>
                </Link>
            ))}
        </div>
    );
}
