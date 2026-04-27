import ProductDetail from "@/components/Shop/ProductDetail/ProductDetail";
import { ProductService } from "@/lib/services/productService";
import { SettingsRepository } from "@/lib/repositories/settingsRepository";
import React from "react";
import { notFound, redirect } from "next/navigation";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const product = await ProductService.getProductById(id);
        const settings = await SettingsRepository.getSettings();

        if (!product || !product.isActive) {
            notFound();
        }

        // Bundles render via the dedicated /bundle/[id] route — components & pricing differ from regular products.
        if (product.isBundle) {
            redirect(`/bundle/${product.id}`);
        }

        return <ProductDetail product={product as any} settings={settings} />;
    } catch (error) {
        if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw error;
        notFound();
    }
}
