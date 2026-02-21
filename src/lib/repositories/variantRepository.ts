import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class VariantRepository {
    static async create(data: Prisma.ProductVariantCreateInput) {
        return prisma.productVariant.create({ data });
    }

    static async update(id: string, data: Prisma.ProductVariantUpdateInput) {
        return prisma.productVariant.update({ where: { id }, data });
    }

    static async delete(id: string) {
        return prisma.productVariant.delete({ where: { id } });
    }

    static async findById(id: string) {
        return prisma.productVariant.findUnique({ where: { id } });
    }
}
