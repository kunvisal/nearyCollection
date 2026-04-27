import Image from "next/image";
import Hero from "@/components/Shop/Hero/Hero";
import CategoryGrid from "@/components/Shop/CategoryGrid/CategoryGrid";
import ProductRow from "@/components/Shop/ProductRow/ProductRow";
import { ProductService } from "@/lib/services/productService";
import { CategoryService } from "@/lib/services/categoryService";

export default async function ShopHome() {
    // Fetch real products and categories from the database
    const dbProducts = await ProductService.getActiveProducts();
    const dbCategories = await CategoryService.getActiveCategories();

    // Map DB products to the format expected by ProductRow.
    // For bundles, derive the unit price from components: Σ(component.salePrice × qty) − bundleDiscount.
    const mappedProducts = dbProducts.map((p: any) => {
        let price = 0;
        if (p.isBundle) {
            const sum = (p.bundleComponents || []).reduce(
                (acc: number, c: any) => acc + Number(c.variant.salePrice) * c.qty,
                0,
            );
            const discount = p.bundleDiscount != null ? Number(p.bundleDiscount) : 0;
            price = Math.max(0, sum - discount);
        } else {
            price = p.variants?.length > 0
                ? Math.min(...p.variants.map((v: any) => Number(v.salePrice)))
                : 0;
        }

        return {
            id: p.id,
            name: p.nameKm,
            price: price,
            image: p.images?.[0]?.url || "/images/placeholder-product.svg",
            isBundle: !!p.isBundle,
            isNew: true,
            isBestSeller: false,
        };
    });

    const newArrivals = mappedProducts.slice(0, 10);
    // As a placeholder, let's just reverse the array or use the same for best sellers
    const bestSellers = [...mappedProducts].reverse().slice(0, 10);

    return (
        <div className="pb-10">
            <div className="p-1">
                <Hero
                    title="Neary Collection-នារី"
                    subtitle="Discover your unique style with us."
                />

                <CategoryGrid categories={dbCategories} />

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
