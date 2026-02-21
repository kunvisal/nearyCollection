import { z } from "zod";

export const createImageSchema = z.object({
    url: z.string().url("Must be a valid URL"),
    sortOrder: z.number().int().default(0),
    isPrimary: z.boolean().default(false),
});

export const updateImageSchema = z.object({
    sortOrder: z.number().int().optional(),
    isPrimary: z.boolean().optional(),
});

export type CreateImageInput = z.infer<typeof createImageSchema>;
export type UpdateImageInput = z.infer<typeof updateImageSchema>;
