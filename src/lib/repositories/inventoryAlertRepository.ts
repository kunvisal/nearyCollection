import prisma from "../prisma";

export class InventoryAlertRepository {
    static async getLowStockVariants(threshold: number = 5) {
        return await prisma.productVariant.findMany({
            where: {
                stockOnHand: {
                    lte: threshold
                }
            },
            include: {
                product: true,
            },
            orderBy: {
                stockOnHand: 'asc'
            }
        });
    }

    static async getRecentInventoryTransactions(take: number = 20) {
        return await prisma.inventoryTransaction.findMany({
            take,
            orderBy: { createdAt: 'desc' },
            include: {
                variant: {
                    include: {
                        product: true
                    }
                }
            }
        });
    }
}
