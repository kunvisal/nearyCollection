"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./BottomNav.module.css";

// Simple icons (Placeholders, replace with Lucide or Heroicons later if available)
const HomeIcon = () => (
    <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

const SearchIcon = () => (
    <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const BagIcon = () => (
    <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
);

const UserIcon = () => (
    <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

import { useCartStore } from "@/lib/store/cartStore";

export default function BottomNav() {
    const pathname = usePathname();
    const { setIsDrawerOpen, getCartCount } = useCartStore();
    const cartCount = getCartCount();

    const isActive = (path: string) => pathname === path;

    return (
        <nav className={styles.bottomNav}>
            <Link href="/" className={`${styles.navItem} ${isActive("/") ? styles.active : ""}`}>
                <HomeIcon />
                <span>Home</span>
            </Link>
            <Link href="/search" className={`${styles.navItem} ${isActive("/search") ? styles.active : ""}`}>
                <SearchIcon />
                <span>Search</span>
            </Link>
            <button
                onClick={() => setIsDrawerOpen(true)}
                className={`${styles.navItem} relative`}
            >
                <div className="relative">
                    <BagIcon />
                    {cartCount > 0 && (
                        <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border-2 border-white dark:border-gray-900">
                            {cartCount}
                        </span>
                    )}
                </div>
                <span>Cart</span>
            </button>
            <Link href="/admin" className={`${styles.navItem} ${isActive("/admin") ? styles.active : ""}`}>
                <UserIcon />
                <span>Profile</span>
            </Link>
        </nav>
    );
}
