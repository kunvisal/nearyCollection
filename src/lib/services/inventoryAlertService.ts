import { InventoryAlertRepository } from "../repositories/inventoryAlertRepository";

export class InventoryAlertService {
    static async getDashboardAlerts() {
        // Find variants with 5 or fewer items
        const lowStockVariants = await InventoryAlertRepository.getLowStockVariants(5);
        const recentMoves = await InventoryAlertRepository.getRecentInventoryTransactions(10);

        return {
            lowStockVariants,
            recentMoves
        };
    }
}
