"use client";

import React from "react";
import Link from "next/link";
import styles from "./CategoryGrid.module.css";
import {
    GridIcon,
    PageIcon,
    FileIcon,
    DocsIcon,
    CopyIcon,
    BoxIcon,
    BoxIconLine,
    BoxCubeIcon,
    DollarLineIcon,
    PlugInIcon,
    BoltIcon,
    ShootingStarIcon
} from "../../../icons";

// Mock Categories
const categories = [
    { id: 0, name: "All", icon: <GridIcon />, slug: "all" },
    { id: 1, name: "Dresses", icon: <PageIcon />, slug: "dresses" },
    { id: 2, name: "Tops", icon: <FileIcon />, slug: "tops" },
    { id: 3, name: "Pants", icon: <DocsIcon />, slug: "pants" },
    { id: 4, name: "Skirts", icon: <CopyIcon />, slug: "skirts" },
    { id: 5, name: "Sets", icon: <BoxIcon />, slug: "sets" },
    { id: 6, name: "Outer", icon: <BoxIconLine />, slug: "outerwear" },
    { id: 7, name: "Shoes", icon: <BoxCubeIcon />, slug: "shoes" },
    { id: 8, name: "Sale", icon: <DollarLineIcon />, slug: "sale" },
    { id: 9, name: "Bags", icon: <BoxIcon />, slug: "bags" },
    { id: 10, name: "Accessories", icon: <PlugInIcon />, slug: "accessories" },
    { id: 11, name: "New", icon: <BoltIcon />, slug: "new-arrivals" },
    { id: 12, name: "Best Sellers", icon: <ShootingStarIcon />, slug: "best-sellers" },
];

export default function CategoryGrid() {
    return (
        <div className={styles.gridContainer}>
            {categories.map((cat) => (
                <Link
                    href={cat.slug === 'all' ? '/' : `/category/${cat.slug}`}
                    key={cat.id}
                    className={`${styles.categoryItem} ${cat.slug === 'all' ? styles.active : ''}`}
                >
                    <span className={styles.icon}>{cat.icon}</span>
                    <span className={styles.label}>{cat.name}</span>
                </Link>
            ))}
        </div>
    );
}
