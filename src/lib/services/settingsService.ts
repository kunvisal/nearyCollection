import { SettingsRepository } from "../repositories/settingsRepository";
import { Settings } from "@prisma/client";

export class SettingsService {
    /**
     * Get application settings, creating defaults if none exist
     */
    static async getSettings(): Promise<Settings> {
        const settings = await SettingsRepository.getSettings();
        if (!settings) {
            return SettingsRepository.createDefaultSettings();
        }
        return settings;
    }

    /**
     * Update application settings
     */
    static async updateSettings(data: Partial<Settings>): Promise<Settings> {
        return SettingsRepository.updateSettings(data);
    }
}
