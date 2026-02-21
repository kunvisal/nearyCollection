import { z } from "zod";
import { TransactionType } from "@prisma/client";

export const logInventorySchema = z.object({
    variantId: z.string(),
    type: z.nativeEnum(TransactionType),
    qty: z.number().int(),
    refType: z.string(),
    refId: z.string().optional().nullable(),
    note: z.string().optional().nullable(),
    createdByUserId: z.string().optional().nullable()
});

export type LogInventoryInput = z.infer<typeof logInventorySchema>;
