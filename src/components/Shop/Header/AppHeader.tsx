import React from "react";
import Link from "next/link";
import { MessageSquare, Bell } from "lucide-react";
import styles from "./AppHeader.module.css";

export default function AppHeader() {
    return (
        <header className={styles.header}>
            <div className={styles.logoContainer}>
                <Link href="/" className={styles.logoLink}>
                    <span className={styles.logoText}>Shopline</span>
                </Link>
            </div>
            <div className={styles.actions}>
                <button className={styles.iconButton} aria-label="Messages">
                    <MessageSquare strokeWidth={1.5} className="w-6 h-6" />
                    <span className={styles.badge}>1</span>
                </button>
                <button className={styles.iconButton} aria-label="Notifications">
                    <Bell strokeWidth={1.5} className="w-6 h-6" />
                    <span className={styles.badge}>3</span>
                </button>
            </div>
        </header>
    );
}
