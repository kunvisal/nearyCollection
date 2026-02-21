import prisma from "../prisma";
import { Settings } from "@prisma/client";

export class SettingsRepository {
    /**
     * Get the single settings record.
     * Since there's only one, we use findUnique with id: 1.
     */
    static async getSettings(): Promise<Settings | null> {
        return prisma.settings.findUnique({
            where: { id: 1 },
        });
    }

    /**
     * Create default settings if they don't exist
     */
    static async createDefaultSettings(): Promise<Settings> {
        return prisma.settings.create({
            data: {
                id: 1,
                deliveryFeePP: 1.5,
                deliveryFeeProvince: 2.5,
                paymentInstructionABA: "Please transfer to ABA account 012345678",
                paymentInstructionWing: "Please transfer to Wing account 012345678",
                telegramBotToken: "",
                telegramChatId: "",
                defaultLanguage: "KM",
            }
        });
    }

    /**
     * Update settings.
     */
    static async updateSettings(data: Partial<Settings>): Promise<Settings> {
        return prisma.settings.upsert({
            where: { id: 1 },
            update: data,
            create: {
                id: 1,
                deliveryFeePP: data.deliveryFeePP || 1.5,
                deliveryFeeProvince: data.deliveryFeeProvince || 2.5,
                paymentInstructionABA: data.paymentInstructionABA || "",
                paymentInstructionWing: data.paymentInstructionWing || "",
                telegramBotToken: data.telegramBotToken || "",
                telegramChatId: data.telegramChatId || "",
                defaultLanguage: data.defaultLanguage || "KM",
            }
        });
    }
}
