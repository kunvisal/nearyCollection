import { z } from "zod";

export const createCategorySchema = z.object({
    nameKm: z.string().min(1, "Khmer name is required"),
    nameEn: z.string().optional(),
    sortOrder: z.number().int().default(0),
    isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
