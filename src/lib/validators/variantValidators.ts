import { z } from "zod";

export const createVariantSchema = z.object({
    sku: z.string().min(1, "SKU is required"),
    color: z.string().catch(""),
    size: z.string().catch(""),
    costPrice: z.number().min(0).catch(0),
    salePrice: z.number().min(0, "Sale price must be positive"),
    stockOnHand: z.number().int().min(0).default(0),
    isActive: z.boolean().default(true),
});

export const updateVariantSchema = createVariantSchema.partial();

export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
