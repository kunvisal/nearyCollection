import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class ImageRepository {
    static async create(data: Prisma.ProductImageCreateInput) {
        return prisma.productImage.create({ data });
    }

    static async delete(id: number) {
        return prisma.productImage.delete({ where: { id } });
    }

    static async findById(id: number) {
        return prisma.productImage.findUnique({ where: { id } });
    }
}
