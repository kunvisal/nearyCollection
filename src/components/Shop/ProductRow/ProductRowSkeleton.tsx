import React from "react";
import styles from "./ProductRow.module.css";
import skeletonStyles from "@/components/ui/Skeleton.module.css";

export default function ProductRowSkeleton({ title }: { title: string }) {
    // Generate an array of 6 skeleton cards, with random varying heights to emulate Pinterest style
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
                <div className={`${skeletonStyles.shimmer} w-16 h-4 rounded`}></div>
            </div>

            <div className={styles.scrollContainer}>
                {skeletons.map((skel) => (
                    <div key={skel.id} className={styles.productCard}>
                        {/* Image Skeleton */}
                        <div
                            className={`${styles.imageWrapper} ${skeletonStyles.shimmer}`}
                            style={{ height: skel.imageHeight, width: '100%', position: 'relative', overflow: 'hidden', borderRadius: '12px' }}
                        ></div>
                        {/* Title Skeleton */}
                        <div className={`mt-3 ${skeletonStyles.shimmer} h-3 w-3/4 rounded`}></div>
                        {/* Price Skeleton */}
                        <div className={`mt-2 ${skeletonStyles.shimmer} h-3 w-1/3 rounded`}></div>
                    </div>
                ))}
            </div>
        </div>
    );
}
