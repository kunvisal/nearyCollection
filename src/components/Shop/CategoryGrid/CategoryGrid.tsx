"use client";

import React from "react";
import Link from "next/link";
import styles from "./CategoryGrid.module.css";
import { GridIcon } from "../../../icons"; // Import at least one icon for default

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
        { id: 0, name: "All", icon: <GridIcon />, slug: "all" },
        ...categories.map(cat => ({
            id: cat.id,
            name: cat.nameEn || cat.nameKm,
            icon: <GridIcon />, // We can customize icons later based on category name
            slug: cat.id.toString(), // Use ID as slug for now, or add slug field
        }))
    ];

    return (
        <div className={styles.gridContainer}>
            {displayCategories.map((cat) => (
                <Link
                    href={cat.slug === 'all' ? '/' : `/category/${cat.id}`}
                    key={`cat-${cat.id}`}
                    className={`${styles.categoryItem} ${cat.slug === 'all' ? styles.active : ''}`}
                >
                    <span className={styles.icon}>{cat.icon}</span>
                    <span className={styles.label}>{cat.name}</span>
                </Link>
            ))}
        </div>
    );
}
