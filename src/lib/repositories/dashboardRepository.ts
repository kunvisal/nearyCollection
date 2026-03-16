import prisma from "../prisma";

export class DashboardRepository {
    static async getMetrics(startDateArg?: string | Date, endDateArg?: string | Date) {
        // Resolve date boundaries
        const today = new Date();
        const endDate = endDateArg ? new Date(endDateArg) : new Date(today);
        if (!endDateArg) endDate.setHours(23, 59, 59, 999);

        const startDate = startDateArg ? new Date(startDateArg) : new Date(today);
        if (!startDateArg) {
            startDate.setDate(today.getDate() - 6);
            startDate.setHours(0, 0, 0, 0);
        }

        // Calculate total days in range to build map correctly
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const daysToMap = diffDays === 0 ? 1 : diffDays;

        // Total customers
        const totalCustomers = await prisma.customer.count({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        // Total orders (excluding cancelled) within date range
        const totalOrders = await prisma.order.count({
            where: {
                orderStatus: { not: 'CANCELLED' },
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        // Total revenue, delivery fee, and discount within date range
        const revenueResult = await prisma.order.aggregate({
            _sum: {
                total: true,
                deliveryFee: true,
                discount: true
            },
            where: {
                paymentStatus: 'PAID',
                orderStatus: { not: 'CANCELLED' },
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        const totalRevenue = revenueResult._sum.total ? Number(revenueResult._sum.total) : 0;
        const totalDeliveryFee = revenueResult._sum.deliveryFee ? Number(revenueResult._sum.deliveryFee) : 0;
        const totalDiscount = revenueResult._sum.discount ? Number(revenueResult._sum.discount) : 0;

        // Daily Revenue & Profit (in the selected date range)
        const recentPaidOrders = await prisma.order.findMany({
            where: {
                paymentStatus: 'PAID',
                orderStatus: { not: 'CANCELLED' },
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            select: {
                createdAt: true,
                total: true,
                items: {
                    select: {
                        costPriceSnapshot: true,
                        qty: true,
                        lineTotal: true
                    }
                }
            }
        });

        const toLocalDateStr = (d: Date) => {
            const pad = (n: number) => n.toString().padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        };

        // Group by day string 'YYYY-MM-DD'
        const metricsByDayMap: Record<string, { revenue: number, profit: number }> = {};
        for (let i = 0; i < daysToMap; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            const dateStr = toLocalDateStr(d);
            metricsByDayMap[dateStr] = { revenue: 0, profit: 0 };
        }

        recentPaidOrders.forEach(order => {
            const dateStr = toLocalDateStr(order.createdAt);
            if (metricsByDayMap[dateStr] !== undefined) {
                // Revenue is just the order total
                metricsByDayMap[dateStr].revenue += Number(order.total);

                // Profit is lineTotal (sale) minus the base cost (costPrice * qty)
                let orderProfit = 0;
                order.items.forEach(item => {
                    const cost = Number(item.costPriceSnapshot) * item.qty;
                    const saleTotal = Number(item.lineTotal);
                    orderProfit += (saleTotal - cost);
                });

                metricsByDayMap[dateStr].profit += orderProfit;
            }
        });

        const dailyRevenue = Object.entries(metricsByDayMap).map(([date, metrics]) => ({
            date,
            revenue: metrics.revenue,
            profit: metrics.profit
        })).sort((a, b) => a.date.localeCompare(b.date));

        const totalProfit = dailyRevenue.reduce((sum, day) => sum + day.profit, 0);

        // Monthly Sales (orders count per month for current year)
        const currentYear = today.getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);

        const thisYearOrders = await prisma.order.findMany({
            where: {
                orderStatus: { not: 'CANCELLED' },
                createdAt: {
                    gte: startOfYear,
                    lte: new Date(currentYear, 11, 31, 23, 59, 59, 999)
                }
            },
            select: { createdAt: true }
        });

        const salesByMonthMap: Record<number, number> = {
            1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0
        };

        thisYearOrders.forEach(order => {
            const month = order.createdAt.getMonth() + 1; // 1-12
            salesByMonthMap[month]++;
        });

        const monthlySales = Object.entries(salesByMonthMap).map(([month, count]) => ({
            month: Number(month),
            count
        })).sort((a, b) => a.month - b.month);

        // Low stock alerts
        const lowStockAlerts = await prisma.productVariant.findMany({
            where: {
                stockOnHand: {
                    lte: prisma.productVariant.fields.lowStockThreshold
                },
                isActive: true
            },
            include: {
                product: true
            }
        });

        const serializedLowStockAlerts = lowStockAlerts.map(alert => ({
            ...alert,
            costPrice: Number(alert.costPrice),
            salePrice: Number(alert.salePrice),
            discountAmount: Number(alert.discountAmount)
        }));

        // Pending verifications
        const pendingVerifications = await prisma.paymentSlip.findMany({
            where: {
                verifyStatus: 'PENDING'
            },
            include: {
                order: true
            }
        });

        const serializedPendingVerifications = pendingVerifications.map(slip => ({
            ...slip,
            order: slip.order ? {
                ...slip.order,
                total: Number(slip.order.total),
                deliveryFee: Number(slip.order.deliveryFee),
                subtotal: Number(slip.order.subtotal),
                discount: Number(slip.order.discount)
            } : undefined
        }));

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

        const serializedOrders = recentOrders.map(order => ({
            ...order,
            total: Number(order.total),
            subtotal: Number(order.subtotal),
            discount: Number(order.discount),
            deliveryFee: Number(order.deliveryFee),
            items: order.items.map(item => ({
                ...item,
                costPriceSnapshot: Number(item.costPriceSnapshot),
                salePriceSnapshot: Number(item.salePriceSnapshot),
                discountSnapshot: Number(item.discountSnapshot),
                lineTotal: Number(item.lineTotal),
                variant: item.variant ? {
                    ...item.variant,
                    costPrice: Number(item.variant.costPrice),
                    salePrice: Number(item.variant.salePrice),
                    discountAmount: Number(item.variant.discountAmount),
                } : undefined
            }))
        }));

        // Stock inventory values (snapshot, not date-filtered)
        const activeVariants = await prisma.productVariant.findMany({
            where: {
                isActive: true,
                stockOnHand: { gt: 0 }
            },
            select: {
                costPrice: true,
                salePrice: true,
                discountAmount: true,
                stockOnHand: true
            }
        });

        let totalStockCost = 0;
        let totalStockSellingValue = 0;
        activeVariants.forEach(v => {
            const qty = v.stockOnHand;
            totalStockCost += Number(v.costPrice) * qty;
            totalStockSellingValue += (Number(v.salePrice) - Number(v.discountAmount)) * qty;
        });

        return {
            dailyRevenue,
            monthlySales,
            lowStockAlerts: serializedLowStockAlerts,
            pendingVerifications: serializedPendingVerifications,
            totalCustomers,
            totalOrders,
            totalRevenue,
            totalProfit,
            totalDeliveryFee,
            totalDiscount,
            recentOrders: serializedOrders,
            totalStockCost,
            totalStockSellingValue,
        };
    }
}
