import type { Metadata } from "next";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import React from "react";
import RecentOrders from "@/components/ecommerce/RecentOrders";
import { DashboardService } from "@/lib/services/dashboardService";

export const metadata: Metadata = {
  title: "Admin Dashboard | Neary Collection",
  description: "Dashboard view for Neary Collection admin settings",
};

export default async function Ecommerce() {
  const metrics = await DashboardService.getDashboardMetrics();

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6">
        <EcommerceMetrics
          totalCustomers={metrics.totalCustomers}
          totalOrders={metrics.totalOrders}
          totalRevenue={metrics.totalRevenue}
        />
      </div>

      <div className="col-span-12">
        <RecentOrders orders={metrics.recentOrders} />
      </div>
    </div>
  );
}
