import { DashboardRepository } from "../repositories/dashboardRepository";

export class DashboardService {
    static async getDashboardMetrics(startDate?: Date | string, endDate?: Date | string) {
        return await DashboardRepository.getMetrics(startDate, endDate);
    }
}
