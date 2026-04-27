import { z } from "zod";

export const bundleComponentSchema = z.object({
    variantId: z.string().uuid("Variant id must be a valid UUID"),
    qty: z.number().int().positive("Component qty must be at least 1"),
});

export const createBundleSchema = z.object({
    nameKm: z.string().min(1, "Khmer name is required"),
    nameEn: z.string().optional().nullable(),
    descriptionKm: z.string().optional().nullable(),
    descriptionEn: z.string().optional().nullable(),
    categoryId: z.number().int().positive("Category ID must be positive"),
    isActive: z.boolean().default(true),
    bundleDiscount: z.number().min(0).optional().nullable(),
    components: z.array(bundleComponentSchema).min(1, "A bundle needs at least 1 component"),
});

export const updateBundleSchema = createBundleSchema.partial().extend({
    components: z.array(bundleComponentSchema).min(1, "A bundle needs at least 1 component").optional(),
});

export type BundleComponentInput = z.infer<typeof bundleComponentSchema>;
export type CreateBundleInput = z.infer<typeof createBundleSchema>;
export type UpdateBundleInput = z.infer<typeof updateBundleSchema>;
