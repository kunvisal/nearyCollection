"use client";
import React from "react";
import Badge from "../ui/badge/Badge";
import { ArrowDownIcon, ArrowUpIcon, BoxIconLine, GroupIcon } from "@/icons";

interface EcommerceMetricsProps {
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
}

export const EcommerceMetrics: React.FC<EcommerceMetricsProps> = ({
  totalCustomers,
  totalOrders,
  totalRevenue
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
      {/* Customers Metric */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Customers</span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{totalCustomers}</h4>
          </div>
        </div>
      </div>

      {/* Orders Metric */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Orders</span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{totalOrders}</h4>
          </div>
        </div>
      </div>

      {/* Revenue Metric */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-green-100 text-green-700 rounded-xl dark:bg-green-900/30 dark:text-green-400">
          <span className="font-bold text-xl">$</span>
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">${totalRevenue.toFixed(2)}</h4>
          </div>
        </div>
      </div>
    </div>
  );
};
