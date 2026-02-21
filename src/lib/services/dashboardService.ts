import { DashboardRepository } from "../repositories/dashboardRepository";

export class DashboardService {
    static async getDashboardMetrics() {
        return await DashboardRepository.getMetrics();
    }
}
