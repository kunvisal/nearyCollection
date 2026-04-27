import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const bundleInclude = {
    category: true,
    images: { orderBy: { sortOrder: "asc" } },
    bundleComponents: {
        include: {
            variant: {
                include: {
                    product: {
                        include: {
                            images: { orderBy: { sortOrder: "asc" } },
                        },
                    },
                },
            },
        },
    },
} satisfies Prisma.ProductInclude;

export class BundleRepository {
    static async findAll() {
        return prisma.product.findMany({
            where: { isBundle: true },
            orderBy: { createdAt: "desc" },
            include: bundleInclude,
        });
    }

    static async findActive() {
        return prisma.product.findMany({
            where: { isBundle: true, isActive: true },
            orderBy: { createdAt: "desc" },
            include: bundleInclude,
        });
    }

    static async findById(id: string) {
        return prisma.product.findFirst({
            where: { id, isBundle: true },
            include: bundleInclude,
        });
    }

    static async createBundleTransaction(
        productData: Prisma.ProductCreateInput,
        components: Array<{ variantId: string; qty: number }>,
    ) {
        return prisma.$transaction(async (tx) => {
            const created = await tx.product.create({ data: productData });
            await tx.bundleComponent.createMany({
                data: components.map((c) => ({
                    bundleProductId: created.id,
                    variantId: c.variantId,
                    qty: c.qty,
                })),
            });
            return tx.product.findUnique({
                where: { id: created.id },
                include: bundleInclude,
            });
        });
    }

    static async updateBundleTransaction(
        id: string,
        productData: Prisma.ProductUpdateInput,
        components?: Array<{ variantId: string; qty: number }>,
    ) {
        return prisma.$transaction(async (tx) => {
            await tx.product.update({ where: { id }, data: productData });
            if (components) {
                await tx.bundleComponent.deleteMany({ where: { bundleProductId: id } });
                if (components.length > 0) {
                    await tx.bundleComponent.createMany({
                        data: components.map((c) => ({
                            bundleProductId: id,
                            variantId: c.variantId,
                            qty: c.qty,
                        })),
                    });
                }
            }
            return tx.product.findUnique({ where: { id }, include: bundleInclude });
        });
    }

    /**
     * Bundle has no own stock — availability is the integer floor of
     * MIN(component.stockOnHand / component.qty) across all components.
     */
    static async computeAvailableQty(bundleProductId: string): Promise<number> {
        const components = await prisma.bundleComponent.findMany({
            where: { bundleProductId },
            include: { variant: { select: { stockOnHand: true, isActive: true } } },
        });
        if (components.length === 0) return 0;
        let min = Number.POSITIVE_INFINITY;
        for (const c of components) {
            if (!c.variant.isActive) return 0;
            const possible = Math.floor(c.variant.stockOnHand / Math.max(1, c.qty));
            if (possible < min) min = possible;
        }
        return Number.isFinite(min) ? min : 0;
    }

    /**
     * Snapshot of (component variant + parent product + first image) used to
     * persist OrderItem children at sale time.
     */
    static async findComponentsForSale(bundleProductId: string) {
        return prisma.bundleComponent.findMany({
            where: { bundleProductId },
            include: {
                variant: {
                    include: {
                        product: {
                            include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
                        },
                    },
                },
            },
        });
    }
}
