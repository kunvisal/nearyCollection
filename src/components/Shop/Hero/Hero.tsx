import React from "react";
import styles from "./Hero.module.css";
import Image from "next/image";

interface HeroProps {
    title?: string;
    subtitle?: string;
    imageUrl?: string;
}

export default function Hero({
    title = "",
    subtitle = "",
    imageUrl = "/images/clothesDemo/banner.png"
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
                    {/* Avatar Overlapping Banner */}
                    <div className={styles.avatarContainer}>
                        <div className={styles.avatarWrapper}>
                            <Image
                                src="/images/logo/neary-logo-shop.svg"
                                alt="Profile"
                                fill
                                className={styles.avatar}
                            />
                        </div>
                        {/* Online Indicator */}
                        <div className={styles.onlineIndicator} title="Online"></div>
                    </div>

                    <div className={styles.titleArea}>
                        <h1 className={styles.title}>{title || "Neary Collection-នារី"}</h1>
                        <p className={styles.subtitle}>{subtitle || "Discover your unique style with us."}</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className={styles.actions}>
                    <button
                        className={styles.telegramBtn}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 512 512">
                            <path d="M470.435 45.423L16.827 221.249c-18.254 8.188-24.428 24.585-4.412 33.484l116.37 51.721l269.917-195.828c11.028-7.799 15.688-4.908 6.551 2.378L183.13 313.916l-8.006 96.11c6.121 0 10.426-3.08 17.152-9.616l45.409-44.15l94.524 69.832c21.574 11.58 35.539 5.864 40.519-19.497L467.487 73.18c7.408-33.805-11.854-46.736-41.979-27.757L470.435 45.423z" />
                        </svg>
                        <span>Telegram</span>
                    </button>
                    <button
                        className={styles.messengerBtn}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M0 7.76C0 3.301 3.493 0 8 0s8 3.301 8 7.76-3.493 7.76-8 7.76c-.81 0-1.586-.107-2.316-.307a.639.639 0 0 0-.427.03l-1.588.702a.64.64 0 0 1-.898-.566l-.044-1.423a.639.639 0 0 0-.215-.456C.956 12.108 0 10.092 0 7.76zm5.546-1.459-2.35 3.728c-.225.358.214.761.551.506l2.525-1.916a.48.48 0 0 1 .578-.002l1.869 1.402a1.2 1.2 0 0 0 1.735-.32l2.35-3.728c.226-.358-.214-.761-.551-.506L9.728 7.381a.48.48 0 0 1-.578.002L7.281 5.98a1.2 1.2 0 0 0-1.735.32z" />
                        </svg>
                        <span>Message</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
