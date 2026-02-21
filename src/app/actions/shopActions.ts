"use server";

import prisma from "@/lib/prisma";

export async function getProductsByCategoryAction(categoryId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const products = await prisma.product.findMany({
        where: {
            isActive: true,
            categoryId: categoryId
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
            images: {
                orderBy: { sortOrder: 'asc' },
                take: 1
            },
            variants: {
                where: { isActive: true },
                select: { salePrice: true }
            }
        }
    });

    const total = await prisma.product.count({
        where: {
            isActive: true,
            categoryId: categoryId
        }
    });

    return {
        products: products.map((p: any) => {
            const price = p.variants.length > 0
                ? Math.min(...p.variants.map((v: any) => Number(v.salePrice)))
                : 0;
            return {
                id: p.id,
                name: p.nameKm,
                price: price,
                image: p.images?.[0]?.url || "/images/placeholder-product.svg",
            }
        }),
        hasMore: skip + products.length < total
    };
}
