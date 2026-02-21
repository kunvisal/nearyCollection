import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class CategoryRepository {
    static async findAll() {
        return prisma.category.findMany({
            orderBy: { sortOrder: 'asc' }
        });
    }

    static async findActive() {
        return prisma.category.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' }
        });
    }

    static async findById(id: number) {
        return prisma.category.findUnique({
            where: { id }
        });
    }

    static async create(data: Prisma.CategoryCreateInput) {
        return prisma.category.create({ data });
    }

    static async update(id: number, data: Prisma.CategoryUpdateInput) {
        return prisma.category.update({
            where: { id },
            data
        });
    }

    static async delete(id: number) {
        return prisma.category.delete({
            where: { id }
        });
    }
}
