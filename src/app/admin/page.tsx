import type { Metadata } from "next";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import React from "react";
import RecentOrders from "@/components/ecommerce/RecentOrders";
import { DashboardService } from "@/lib/services/dashboardService";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import DashboardAlerts from "@/components/ecommerce/DashboardAlerts";

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
  const from = resolvedParams.from as string | undefined;
  const to = resolvedParams.to as string | undefined;

  const metrics = await DashboardService.getDashboardMetrics(from, to);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Top Row: Summaries */}
      <EcommerceMetrics
        totalCustomers={metrics.totalCustomers}
        totalOrders={metrics.totalOrders}
        totalRevenue={metrics.totalRevenue}
      />

      {/* Middle Row: Trends */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
        <div className="md:col-span-8">
          <StatisticsChart
            dailyRevenue={metrics.dailyRevenue}
            startDate={from}
            endDate={to}
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
