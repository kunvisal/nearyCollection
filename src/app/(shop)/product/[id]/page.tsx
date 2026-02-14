import ProductDetail from "@/components/Shop/ProductDetail/ProductDetail";
import { mockProducts } from "@/data/mockData";
import React from "react";
import { notFound } from "next/navigation";

export default function ProductPage({ params }: { params: { id: string } }) {
    const product = mockProducts.find((p) => p.id === Number(params.id));

    if (!product) {
        notFound();
    }

    return <ProductDetail product={product} />;
}
