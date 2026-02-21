import { z } from "zod";

export const createProductSchema = z.object({
    nameKm: z.string().min(1, "Khmer name is required"),
    nameEn: z.string().optional().nullable(),
    descriptionKm: z.string().optional().nullable(),
    descriptionEn: z.string().optional().nullable(),
    categoryId: z.number().int().positive("Category ID must be positive"),
    isActive: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
