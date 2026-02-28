"use client";

import React from "react";
import Link from "next/link";
import styles from "./CategoryGrid.module.css";

interface CategoryItem {
    id: number;
    nameEn?: string | null;
    nameKm: string;
    [key: string]: any;
}

interface CategoryGridProps {
    categories?: CategoryItem[];
}

export default function CategoryGrid({ categories = [] }: CategoryGridProps) {
    // Prepend 'All' category
    const displayCategories = [
        { id: 0, name: "All", slug: "all" },
        ...categories.map(cat => ({
            id: cat.id,
            name: cat.nameEn || cat.nameKm,
            slug: cat.id.toString(),
        }))
    ];

    return (
        <div className={styles.gridContainer}>
            {displayCategories.map((cat) => (
                <Link
                    href={cat.slug === 'all' ? '/' : `/category/${cat.id}`}
                    key={`cat-${cat.id}`}
                    className={`${styles.categoryPill} ${cat.slug === 'all' ? styles.active : ''}`}
                >
                    <span className={styles.label}>{cat.name}</span>
                </Link>
            ))}
        </div>
    );
}
