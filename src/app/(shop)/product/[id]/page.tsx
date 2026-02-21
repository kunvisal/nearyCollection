import ProductDetail from "@/components/Shop/ProductDetail/ProductDetail";
import { ProductService } from "@/lib/services/productService";
import React from "react";
import { notFound } from "next/navigation";

export default async function ProductPage({ params }: { params: { id: string } }) {
    try {
        const product = await ProductService.getProductById(params.id);

        if (!product || !product.isActive) {
            notFound();
        }

        return <ProductDetail product={product as any} />;
    } catch (error) {
        notFound();
    }
}
