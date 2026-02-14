"use client";

import React from "react";
import styles from "./Hero.module.css";
import Image from "next/image";

interface HeroProps {
    title?: string;
    subtitle?: string;
    imageUrl?: string;
}

export default function Hero({
    title = "New Collection",
    subtitle = "Summer 2026",
    imageUrl = "/images/clothesDemo/banner1.png" // User provided banner
}: HeroProps) {
    return (
        <div className={styles.heroContainer}>
            <Image
                src={imageUrl}
                alt={title}
                fill
                className={styles.image}
                priority
            />
            <div className={styles.heroContent}>
                <h2 className={styles.title}>{title}</h2>
                <p className={styles.subtitle}>{subtitle}</p>
            </div>
        </div>
    );
}
