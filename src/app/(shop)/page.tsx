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
            <div className="p-4">
                {/* Header */}
                <header className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-100">
                            <Image
                                src="/images/logo/nearylogo.jpg"
                                alt="Neary Collection Logo"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 leading-tight">Neary Collection</h1>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Discover your style</p>
                        </div>
                    </div>
                    {/* Notification Bell */}
                    <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm">
                        <span className="text-sm">🔔</span>
                    </div>
                </header>

                <Hero title="" subtitle="" />

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
