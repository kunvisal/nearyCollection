import InfiniteProductGrid from "@/components/Shop/ProductGrid/InfiniteProductGrid";
import { getProductsByCategoryAction } from "@/app/actions/shopActions";
import prisma from "@/lib/prisma";
import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function CategoryPage({ params }: { params: { slug: string } }) {
    const categoryId = parseInt(params.slug);

    let categoryName = "All Products";
    if (!isNaN(categoryId)) {
        const category = await prisma.category.findUnique({
            where: { id: categoryId }
        });
        if (category) {
            categoryName = category.nameEn || category.nameKm;
        }
    }

    const { products, hasMore } = await getProductsByCategoryAction(categoryId, 1, 10);

    return (
        <div className="flex flex-col gap-4 pb-10">
            <header className="sticky top-0 bg-white dark:bg-gray-900 z-40 px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
                <Link href="/" className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-lg font-bold capitalize text-gray-900 dark:text-white">{categoryName}</h1>
            </header>

            <div className="px-2">
                <InfiniteProductGrid
                    initialProducts={products}
                    categoryId={categoryId}
                    initialHasMore={hasMore}
                />
            </div>
        </div>
    );
}
