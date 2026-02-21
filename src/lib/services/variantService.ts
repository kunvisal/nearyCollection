import { VariantRepository } from "@/lib/repositories/variantRepository";
import { CreateVariantInput, UpdateVariantInput, createVariantSchema, updateVariantSchema } from "@/lib/validators/variantValidators";
import { InventoryService } from "@/lib/services/inventoryService";
import { Prisma } from "@prisma/client";

export class VariantService {
    static async createVariant(productId: string, data: CreateVariantInput, userId?: string) {
        const validatedData = createVariantSchema.parse(data);

        const createData: Prisma.ProductVariantCreateInput = {
            sku: validatedData.sku,
            color: validatedData.color,
            size: validatedData.size,
            costPrice: validatedData.costPrice,
            salePrice: validatedData.salePrice,
            stockOnHand: validatedData.stockOnHand,
            isActive: validatedData.isActive,
            product: {
                connect: { id: productId }
            }
        };

        const variant = await VariantRepository.create(createData);

        if (variant.stockOnHand > 0) {
            await InventoryService.logTransaction({
                variantId: variant.id,
                type: "IN",
                qty: variant.stockOnHand,
                refType: "INITIAL_STOCK",
                note: "Initial stock upon variant creation",
                createdByUserId: userId
            });
        }

        return variant;
    }

    static async updateVariant(id: string, data: UpdateVariantInput, userId?: string) {
        const validatedData = updateVariantSchema.parse(data);

        const oldVariant = await VariantRepository.findById(id);
        if (!oldVariant) throw new Error("Variant not found");

        if (validatedData.stockOnHand !== undefined && validatedData.stockOnHand !== oldVariant.stockOnHand) {
            await InventoryService.adjustStock(id, validatedData.stockOnHand, oldVariant.stockOnHand, userId);
        }

        const updateData: Prisma.ProductVariantUpdateInput = {
            sku: validatedData.sku,
            color: validatedData.color,
            size: validatedData.size,
            costPrice: validatedData.costPrice,
            salePrice: validatedData.salePrice,
            stockOnHand: validatedData.stockOnHand,
            isActive: validatedData.isActive,
        };

        return VariantRepository.update(id, updateData);
    }

    static async deleteVariant(id: string) {
        return VariantRepository.delete(id);
    }
}
