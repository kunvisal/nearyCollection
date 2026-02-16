import Image from "next/image";
import Hero from "@/components/Shop/Hero/Hero";
import CategoryGrid from "@/components/Shop/CategoryGrid/CategoryGrid";
import ProductRow from "@/components/Shop/ProductRow/ProductRow";
import { mockProducts } from "@/data/mockData";

export default function ShopHome() {
    const newArrivals = mockProducts.filter(p => p.isNew);
    const bestSellers = mockProducts.filter(p => p.isBestSeller);

    return (
        <div className="pb-10">
            <div className="p-1">
                {/* Header Removed */}

                <Hero
                    title="Neary Collection-នារី"
                    subtitle="Discover your unique style with us."
                />

                <CategoryGrid />

                <ProductRow
                    title="New Arrivals"
                    seeAllLink="/new-arrivals"
                    products={newArrivals}
                />

                <ProductRow
                    title="Best Sellers"
                    seeAllLink="/best-sellers"
                    products={bestSellers}
                />
            </div>
        </div>
    );
}
