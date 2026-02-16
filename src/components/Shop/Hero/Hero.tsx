"use client";

import React from "react";
import styles from "./Hero.module.css";
import Image from "next/image";

interface HeroProps {
    title?: string;
    subtitle?: string;
    imageUrl?: string;
}

const SOCIAL_LINKS = [
    {
        name: "Telegram",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 512 512">
                <path d="M470.435 45.423L16.827 221.249c-18.254 8.188-24.428 24.585-4.412 33.484l116.37 51.721l269.917-195.828c11.028-7.799 15.688-4.908 6.551 2.378L183.13 313.916l-8.006 96.11c6.121 0 10.426-3.08 17.152-9.616l45.409-44.15l94.524 69.832c21.574 11.58 35.539 5.864 40.519-19.497L467.487 73.18c7.408-33.805-11.854-46.736-41.979-27.757L470.435 45.423z" />
            </svg>
        ),
        url: "#",
        color: "#0088cc"
    },
    {
        name: "Facebook",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z" />
            </svg>
        ),
        url: "#",
        color: "#1877f2"
    },
    {
        name: "Instagram",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.281.11-.705.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z" />
            </svg>
        ),
        url: "#",
        color: "#c32aa3"
    },
    {
        name: "TikTok",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3V0Z" />
            </svg>
        ),
        url: "#",
        color: "#000000"
    },
    {
        name: "Messenger",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M0 7.76C0 3.301 3.493 0 8 0s8 3.301 8 7.76-3.493 7.76-8 7.76c-.81 0-1.586-.107-2.316-.307a.639.639 0 0 0-.427.03l-1.588.702a.64.64 0 0 1-.898-.566l-.044-1.423a.639.639 0 0 0-.215-.456C.956 12.108 0 10.092 0 7.76zm5.546-1.459-2.35 3.728c-.225.358.214.761.551.506l2.525-1.916a.48.48 0 0 1 .578-.002l1.869 1.402a1.2 1.2 0 0 0 1.735-.32l2.35-3.728c.226-.358-.214-.761-.551-.506L9.728 7.381a.48.48 0 0 1-.578.002L7.281 5.98a1.2 1.2 0 0 0-1.735.32z" />
            </svg>
        ),
        url: "#",
        color: "#006AFF"
    }
];

export default function Hero({
    title = "",
    subtitle = "",
    imageUrl = "/images/clothesDemo/banner.png" // User provided banner
}: HeroProps) {
    return (
        <div className={styles.container}>
            {/* Cover Image */}
            <div className={styles.coverContainer}>
                <Image
                    src={imageUrl}
                    alt="Cover Photo"
                    fill
                    className={styles.coverImage}
                    priority
                />
            </div>

            {/* Profile Section */}
            <div className={styles.profileSection}>
                <div className={styles.profileHeader}>
                    {/* Avatar */}
                    <div className={styles.avatarContainer}>
                        <div className={styles.avatarWrapper}>
                            <Image
                                src="/images/logo/nearylogo.jpg" // Default to logo if no profile image provided
                                alt="Profile"
                                fill
                                className={styles.avatar}
                            />
                        </div>
                        {/* Online Indicator */}
                        <div className={styles.onlineIndicator} title="Online"></div>
                    </div>

                    {/* Shop Title - Inline with Avatar */}
                    <h1 className={styles.title}>{title || "Neary Collection"}</h1>
                </div>

                {/* Subtitle - Under the Profile */}
                <p className={styles.subtitle}>{subtitle || "Discover your unique style with us."}</p>

                {/* Action Buttons */}
                <div className={styles.actions}>
                    <a
                        href="#"
                        className={`${styles.actionBtn} ${styles.secondaryBtn}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 512 512">
                            <path d="M470.435 45.423L16.827 221.249c-18.254 8.188-24.428 24.585-4.412 33.484l116.37 51.721l269.917-195.828c11.028-7.799 15.688-4.908 6.551 2.378L183.13 313.916l-8.006 96.11c6.121 0 10.426-3.08 17.152-9.616l45.409-44.15l94.524 69.832c21.574 11.58 35.539 5.864 40.519-19.497L467.487 73.18c7.408-33.805-11.854-46.736-41.979-27.757L470.435 45.423z" />
                        </svg>
                        <span>Telegram</span>
                    </a>
                    <a
                        href="#"
                        className={`${styles.actionBtn} ${styles.primaryBtn}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M0 7.76C0 3.301 3.493 0 8 0s8 3.301 8 7.76-3.493 7.76-8 7.76c-.81 0-1.586-.107-2.316-.307a.639.639 0 0 0-.427.03l-1.588.702a.64.64 0 0 1-.898-.566l-.044-1.423a.639.639 0 0 0-.215-.456C.956 12.108 0 10.092 0 7.76zm5.546-1.459-2.35 3.728c-.225.358.214.761.551.506l2.525-1.916a.48.48 0 0 1 .578-.002l1.869 1.402a1.2 1.2 0 0 0 1.735-.32l2.35-3.728c.226-.358-.214-.761-.551-.506L9.728 7.381a.48.48 0 0 1-.578.002L7.281 5.98a1.2 1.2 0 0 0-1.735.32z" />
                        </svg>
                        <span>Message</span>
                    </a>


                </div>

                {/* Social Links Row */}
                <div className={styles.socialRow}>
                    {SOCIAL_LINKS.filter(link => ["Facebook", "Instagram", "TikTok"].includes(link.name)).map((link) => (
                        <a
                            key={link.name}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.socialIcn}
                            style={{ "--hover-color": link.color } as React.CSSProperties}
                            title={link.name}
                        >
                            {link.icon}
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}
