import { z } from "zod";

export const updateSettingsSchema = z.object({
    deliveryFeePP: z.number().min(0).optional(),
    deliveryFeeProvince: z.number().min(0).optional(),
    paymentInstructionABA: z.string().optional(),
    paymentInstructionWing: z.string().optional(),
    telegramBotToken: z.string().optional(),
    telegramChatId: z.string().optional(),
    defaultLanguage: z.enum(["KM", "EN"]).optional(),
});
