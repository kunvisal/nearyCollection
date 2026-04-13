import React from "react";
import Hero from "@/components/Shop/Hero/Hero";
import ProductRowSkeleton from "@/components/Shop/ProductRow/ProductRowSkeleton";
import styles from "@/components/Shop/CategoryGrid/CategoryGrid.module.css";

function CategoryGridSkeleton() {
    return (
        <div className="py-6 sm:py-8 lg:py-10">
            <div className="flex justify-between items-end mb-4 px-4 sm:px-6">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">Categories</h2>
            </div>
            <div className="flex overflow-x-auto pb-4 px-4 sm:px-6 hide-scrollbar gap-4 sm:gap-6">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex-none w-20 sm:w-24 group cursor-pointer">
                        <div
                            className="skeleton-box relative w-20 h-20 sm:w-24 sm:h-24 overflow-hidden shadow-sm mb-3"
                            style={{ borderRadius: '50%' }}
                        ></div>
                        <div className="skeleton-box h-3 w-16 mx-auto"></div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function ShopLoading() {
    return (
        <div className="pb-10">
            <div className="p-1">
                <Hero
                    title="Neary Collection-នារី"
                    subtitle="Discover your unique style with us."
                />

                <CategoryGridSkeleton />

                <ProductRowSkeleton title="New Arrivals" />

                <ProductRowSkeleton title="Best Sellers" />
            </div>
        </div>
    );
}
