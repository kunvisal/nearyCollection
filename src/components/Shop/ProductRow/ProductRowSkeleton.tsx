import React from "react";
import styles from "./ProductRow.module.css";

export default function ProductRowSkeleton({ title }: { title: string }) {
    const skeletons = [
        { id: 1, imageHeight: '180px' },
        { id: 2, imageHeight: '220px' },
        { id: 3, imageHeight: '200px' },
        { id: 4, imageHeight: '170px' },
    ];

    return (
        <div className={styles.rowContainer}>
            <div className={styles.header}>
                <h3 className={styles.title}>{title}</h3>
                <div className="skeleton-box w-16 h-4"></div>
            </div>

            <div className={styles.scrollContainer}>
                {skeletons.map((skel) => (
                    <div key={skel.id} className={styles.productCard}>
                        {/* Image Skeleton */}
                        <div
                            className={`${styles.imageWrapper} skeleton-box`}
                            style={{ height: skel.imageHeight, width: '100%', position: 'relative', overflow: 'hidden', borderRadius: '12px' }}
                        ></div>
                        {/* Title Skeleton */}
                        <div className="skeleton-box mt-3 h-3 w-3/4"></div>
                        {/* Price Skeleton */}
                        <div className="skeleton-box mt-2 h-3 w-1/3"></div>
                    </div>
                ))}
            </div>
        </div>
    );
}
