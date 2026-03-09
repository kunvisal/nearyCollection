import type { Metadata } from "next";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import React, { Suspense } from "react";
import RecentOrders from "@/components/ecommerce/RecentOrders";
import { DashboardService } from "@/lib/services/dashboardService";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import DashboardAlerts from "@/components/ecommerce/DashboardAlerts";
import DashboardDateFilter from "@/components/ecommerce/DashboardDateFilter";

export const metadata: Metadata = {
  title: "Admin Dashboard | Neary Collection",
  description: "Dashboard view for Neary Collection admin settings",
};

// Next.js config to force dynamic rendering for real-time dashboard data
export const dynamic = "force-dynamic";

export default async function Ecommerce({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams;
  const range = (resolvedParams.range as string) || "30d";

  const now = new Date();

  let currentStart = new Date(now);
  let currentEnd = new Date(now);
  let previousStart = new Date(now);
  let previousEnd = new Date(now);

  if (range === 'today') {
    currentStart.setHours(0, 0, 0, 0);
    previousEnd = new Date(currentStart);
    previousEnd.setMilliseconds(previousEnd.getMilliseconds() - 1);
    previousStart = new Date(previousEnd);
    previousStart.setHours(0, 0, 0, 0);
  } else if (range === '7d') {
    currentStart.setDate(now.getDate() - 6);
    currentStart.setHours(0, 0, 0, 0);
    previousEnd = new Date(currentStart);
    previousEnd.setMilliseconds(previousEnd.getMilliseconds() - 1);
    previousStart = new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - 6);
    previousStart.setHours(0, 0, 0, 0);
  } else { // default 30d
    currentStart.setDate(now.getDate() - 29);
    currentStart.setHours(0, 0, 0, 0);
    previousEnd = new Date(currentStart);
    previousEnd.setMilliseconds(previousEnd.getMilliseconds() - 1);
    previousStart = new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - 29);
    previousStart.setHours(0, 0, 0, 0);
  }

  const [metrics, previousMetrics] = await Promise.all([
    DashboardService.getDashboardMetrics(currentStart, currentEnd),
    DashboardService.getDashboardMetrics(previousStart, previousEnd)
  ]);

  const calculatePercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const percentCustomers = calculatePercentage(metrics.totalCustomers, previousMetrics.totalCustomers);
  const percentOrders = calculatePercentage(metrics.totalOrders, previousMetrics.totalOrders);
  const percentRevenue = calculatePercentage(metrics.totalRevenue, previousMetrics.totalRevenue);
  const percentProfit = calculatePercentage(metrics.totalProfit, previousMetrics.totalProfit);
  const percentDeliveryFee = calculatePercentage(metrics.totalDeliveryFee, previousMetrics.totalDeliveryFee);
  const percentDiscount = calculatePercentage(metrics.totalDiscount, previousMetrics.totalDiscount);

  return (
    <div className="space-y-4 md:space-y-6">
      <Suspense fallback={<div className="h-10"></div>}>
        <DashboardDateFilter />
      </Suspense>

      {/* Top Row: Summaries */}
      <EcommerceMetrics
        totalCustomers={metrics.totalCustomers}
        percentCustomers={percentCustomers}
        totalOrders={metrics.totalOrders}
        percentOrders={percentOrders}
        totalRevenue={metrics.totalRevenue}
        percentRevenue={percentRevenue}
        totalProfit={metrics.totalProfit}
        percentProfit={percentProfit}
        totalDeliveryFee={metrics.totalDeliveryFee}
        percentDeliveryFee={percentDeliveryFee}
        totalDiscount={metrics.totalDiscount}
        percentDiscount={percentDiscount}
      />

      {/* Middle Row: Trends */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
        <div className="md:col-span-8">
          <StatisticsChart
            dailyRevenue={metrics.dailyRevenue}
            startDate={currentStart.toISOString()}
            endDate={currentEnd.toISOString()}
          />
        </div>
        <div className="md:col-span-4">
          <MonthlySalesChart monthlySales={metrics.monthlySales} />
        </div>
      </div>

      {/* Bottom Row: Alerts and Operations */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
        <div className="md:col-span-4">
          <DashboardAlerts
            lowStockAlerts={metrics.lowStockAlerts as any}
            pendingVerifications={metrics.pendingVerifications as any}
          />
        </div>
        <div className="md:col-span-8">
          <RecentOrders orders={metrics.recentOrders} />
        </div>
      </div>
    </div>
  );
}
