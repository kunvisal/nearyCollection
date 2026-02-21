import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class ProductRepository {
    static async findAll() {
        return prisma.product.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                category: true,
                images: true,
                variants: true
            }
        });
    }

    static async findActive() {
        return prisma.product.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
            include: {
                category: true,
                images: {
                    orderBy: { sortOrder: 'asc' }
                },
                variants: {
                    where: { isActive: true }
                }
            }
        });
    }

    static async findById(id: string) {
        return prisma.product.findUnique({
            where: { id },
            include: {
                category: true,
                images: {
                    orderBy: { sortOrder: 'asc' }
                },
                variants: true
            }
        });
    }

    static async create(data: Prisma.ProductCreateInput) {
        return prisma.product.create({
            data,
            include: {
                category: true,
            }
        });
    }

    static async update(id: string, data: Prisma.ProductUpdateInput) {
        return prisma.product.update({
            where: { id },
            data,
            include: {
                category: true,
            }
        });
    }

    static async delete(id: string) {
        return prisma.product.delete({
            where: { id }
        });
    }
}
