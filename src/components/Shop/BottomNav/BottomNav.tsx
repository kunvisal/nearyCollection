"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Heart, User, ShoppingCart } from "lucide-react";
import styles from "./BottomNav.module.css";
import { useCartStore } from "@/lib/store/cartStore";

export default function BottomNav() {
    const pathname = usePathname();
    const { setIsDrawerOpen, getCartCount } = useCartStore();
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    const cartCount = getCartCount();

    const isActive = (path: string) => pathname === path;

    return (
        <div className={styles.bottomNavContainer}>
            <nav className={styles.navPill}>
                <Link href="/" className={`${styles.navItem} ${isActive("/") ? styles.active : ""}`}>
                    <Home className={styles.icon} fill={isActive("/") ? "currentColor" : "none"} strokeWidth={isActive("/") ? 2 : 1.5} />
                    {isActive("/") && <span className={styles.label}>Home</span>}
                </Link>
                <Link href="/search" className={`${styles.navItem} ${isActive("/search") ? styles.active : ""}`}>
                    <Search className={styles.icon} strokeWidth={isActive("/search") ? 2 : 1.5} />
                    {isActive("/search") && <span className={styles.label}>Search</span>}
                </Link>
                <Link href="/favorites" className={`${styles.navItem} ${isActive("/favorites") ? styles.active : ""}`}>
                    <Heart className={styles.icon} fill={isActive("/favorites") ? "currentColor" : "none"} strokeWidth={isActive("/favorites") ? 2 : 1.5} />
                    {isActive("/favorites") && <span className={styles.label}>Favorites</span>}
                </Link>
                <Link href="/admin" className={`${styles.navItem} ${isActive("/admin") ? styles.active : ""}`}>
                    <User className={styles.icon} fill={isActive("/admin") ? "currentColor" : "none"} strokeWidth={isActive("/admin") ? 2 : 1.5} />
                    {isActive("/admin") && <span className={styles.label}>Admin</span>}
                </Link>
            </nav>

            <button
                onClick={() => setIsDrawerOpen(true)}
                className={styles.cartBtn}
                aria-label="Cart"
            >
                <ShoppingCart className={styles.icon} strokeWidth={1.5} />
                {isMounted && cartCount > 0 && (
                    <span className={styles.cartBadge}>
                        {cartCount}
                    </span>
                )}
            </button>
        </div>
    );
}
