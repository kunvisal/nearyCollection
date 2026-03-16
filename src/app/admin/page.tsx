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
  const range = (resolvedParams.range as string)
    || ((resolvedParams.from && resolvedParams.to) ? "custom" : "30d");
  const fromParam = resolvedParams.from as string | undefined;
  const toParam = resolvedParams.to as string | undefined;

  const now = new Date();

  let currentStart = new Date(now);
  let currentEnd = new Date(now);
  let previousStart = new Date(now);
  let previousEnd = new Date(now);

  if (range === 'custom' && fromParam && toParam) {
    const parseLocalDate = (value: string, endOfDay: boolean) => {
      return new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00"}`);
    };

    currentStart = parseLocalDate(fromParam, false);
    currentEnd = parseLocalDate(toParam, true);

    const diffTime = currentEnd.getTime() - currentStart.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    previousEnd = new Date(currentStart);
    previousEnd.setMilliseconds(previousEnd.getMilliseconds() - 1);
    previousStart = new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - (diffDays - 1));
    previousStart.setHours(0, 0, 0, 0);
  } else if (range === 'today') {
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

  const MiniPercentageChange = ({ value }: { value: number }) => {
    if (value === 0 || isNaN(value) || !isFinite(value)) {
      return <span className="text-gray-500 font-medium text-[11px] dark:text-gray-400">--</span>;
    }
    const isPositive = value > 0;

    return (
      <span className={`text-[11px] font-medium flex items-center ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#c62828] dark:text-red-400'}`}>
        {isPositive ? (
          <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        ) : (
          <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        )}
        {isPositive ? "+" : "-"}{Math.abs(value).toFixed(0)}%
      </span>
    );
  };

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
      />

      {/* Middle Row: Trends */}
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-8">
          <MonthlySalesChart monthlySales={metrics.monthlySales} />
        </div>
        <div className="col-span-4 space-y-3 md:space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-2 flex flex-col justify-between dark:border-gray-800 dark:bg-white/[0.03]">
            <span className="text-[11px] text-gray-500 mb-1 dark:text-gray-400">Stock Cost</span>
            <div className="flex items-end justify-between gap-2">
              <h4 className="font-semibold text-gray-900 text-sm md:text-base dark:text-white/90">
                ${metrics.totalStockCost.toFixed(2)}
              </h4>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-2 flex flex-col justify-between dark:border-gray-800 dark:bg-white/[0.03]">
            <span className="text-[11px] text-gray-500 mb-1 dark:text-gray-400">Stock Selling Value</span>
            <div className="flex items-end justify-between gap-2">
              <h4 className="font-semibold text-gray-900 text-sm md:text-base dark:text-white/90">
                ${metrics.totalStockSellingValue.toFixed(2)}
              </h4>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-2 flex flex-col justify-between dark:border-gray-800 dark:bg-white/[0.03]">
            <span className="text-[11px] text-gray-500 mb-1 dark:text-gray-400">Total Delivery Fee</span>
            <div className="flex items-end justify-between gap-2">
              <h4 className="font-semibold text-gray-900 text-sm md:text-base dark:text-white/90">
                ${metrics.totalDeliveryFee.toFixed(2)}
              </h4>
              <MiniPercentageChange value={percentDeliveryFee} />
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-2 flex flex-col justify-between dark:border-gray-800 dark:bg-white/[0.03]">
            <span className="text-[11px] text-gray-500 mb-1 dark:text-gray-400">Total Discount</span>
            <div className="flex items-end justify-between gap-2">
              <h4 className="font-semibold text-gray-900 text-sm md:text-base dark:text-white/90">
                ${metrics.totalDiscount.toFixed(2)}
              </h4>
              <MiniPercentageChange value={percentDiscount} />
            </div>
          </div>
        </div>
      </div>

      <StatisticsChart
        dailyRevenue={metrics.dailyRevenue}
      />

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
