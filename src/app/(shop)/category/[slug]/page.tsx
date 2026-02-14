import ProductGrid from "@/components/Shop/ProductGrid/ProductGrid";
import { mockProducts } from "@/data/mockData";
import React from "react";

export default function CategoryPage({ params }: { params: { slug: string } }) {
    // In a real app, fetch category name by slug
    const categoryName = params.slug.charAt(0).toUpperCase() + params.slug.slice(1);

    // Filter products by category
    // Note: mock data categories are lowercase (dresses, tops, etc)
    const categoryProducts = mockProducts.filter(p => p.category === params.slug.toLowerCase());

    return (
        <div className="flex flex-col gap-4 pb-10">
            <header className="sticky top-0 bg-white z-40 px-4 py-3 border-b border-gray-100 flex items-center gap-4">
                <a href="/" className="text-xl">←</a>
                <h1 className="text-lg font-bold capitalize">{categoryName}</h1>
            </header>

            <ProductGrid products={categoryProducts} />
        </div>
    );
}
