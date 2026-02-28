import ProductDetail from "@/components/Shop/ProductDetail/ProductDetail";
import { ProductService } from "@/lib/services/productService";
import { SettingsRepository } from "@/lib/repositories/settingsRepository";
import React from "react";
import { notFound } from "next/navigation";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const product = await ProductService.getProductById(id);
        const settings = await SettingsRepository.getSettings();

        if (!product || !product.isActive) {
            notFound();
        }

        return <ProductDetail product={product as any} settings={settings} />;
    } catch (error) {
        notFound();
    }
}
