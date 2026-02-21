import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class InventoryRepository {
    static async create(data: Prisma.InventoryTransactionCreateInput) {
        return prisma.inventoryTransaction.create({ data });
    }

    static async findByVariantId(variantId: string) {
        return prisma.inventoryTransaction.findMany({
            where: { variantId },
            orderBy: { createdAt: 'desc' },
            include: {
                createdByUser: {
                    select: { fullName: true }
                }
            }
        });
    }
}
