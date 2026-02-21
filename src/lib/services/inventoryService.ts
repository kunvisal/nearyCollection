import { InventoryRepository } from "@/lib/repositories/inventoryRepository";
import { VariantRepository } from "@/lib/repositories/variantRepository";
import { LogInventoryInput, logInventorySchema } from "@/lib/validators/inventoryValidators";
import { Prisma } from "@prisma/client";

export class InventoryService {
    static async logTransaction(data: LogInventoryInput) {
        const validatedData = logInventorySchema.parse(data);

        const createData: Prisma.InventoryTransactionCreateInput = {
            type: validatedData.type,
            qty: validatedData.qty,
            refType: validatedData.refType,
            refId: validatedData.refId,
            note: validatedData.note,
            variant: { connect: { id: validatedData.variantId } },
        };

        if (validatedData.createdByUserId) {
            createData.createdByUser = { connect: { id: validatedData.createdByUserId } };
        }

        return InventoryRepository.create(createData);
    }

    static async adjustStock(
        variantId: string,
        newStock: number,
        oldStock: number,
        userId?: string
    ) {
        const diff = newStock - oldStock;
        if (diff === 0) return;

        await this.logTransaction({
            variantId,
            type: diff > 0 ? "IN" : "ADJUST",
            qty: Math.abs(diff),
            refType: "MANUAL_ADJUSTMENT",
            note: `Stock updated from ${oldStock} to ${newStock}`,
            createdByUserId: userId
        });
    }
}
