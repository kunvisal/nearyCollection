import prisma from "../prisma";

export class DashboardRepository {
    static async getMetrics() {
        // Total customers
        const totalCustomers = await prisma.customer.count();

        // Total orders (excluding cancelled)
        const totalOrders = await prisma.order.count({
            where: {
                orderStatus: { not: 'CANCELLED' }
            }
        });

        // Total revenue (sum of totally paid orders)
        const revenueResult = await prisma.order.aggregate({
            _sum: {
                total: true
            },
            where: {
                paymentStatus: 'PAID',
                orderStatus: { not: 'CANCELLED' }
            }
        });

        const totalRevenue = revenueResult._sum.total ? Number(revenueResult._sum.total) : 0;

        // Recent 5 orders
        const recentOrders = await prisma.order.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                customer: true,
                items: {
                    include: {
                        variant: {
                            include: { product: { include: { images: true } } }
                        }
                    }
                }
            }
        });

        return {
            totalCustomers,
            totalOrders,
            totalRevenue,
            recentOrders,
        };
    }
}
