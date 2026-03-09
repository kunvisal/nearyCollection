"use client";
import React from "react";

interface EcommerceMetricsProps {
  totalCustomers: number;
  percentCustomers: number;
  totalOrders: number;
  percentOrders: number;
  totalRevenue: number;
  percentRevenue: number;
  totalProfit: number;
  percentProfit: number;
  totalDeliveryFee: number;
  percentDeliveryFee: number;
  totalDiscount: number;
  percentDiscount: number;
}

const PercentageChange = ({ value }: { value: number }) => {
  if (value === 0 || isNaN(value) || !isFinite(value)) {
    return <span className="text-gray-500 font-medium text-xs dark:text-gray-400">--</span>;
  }
  const isPositive = value > 0;

  return (
    <span className={`text-xs font-medium flex items-center ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#c62828] dark:text-red-400'}`}>
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

export const EcommerceMetrics: React.FC<EcommerceMetricsProps> = ({
  totalCustomers,
  percentCustomers,
  totalOrders,
  percentOrders,
  totalRevenue,
  percentRevenue,
  totalProfit,
  percentProfit,
  totalDeliveryFee,
  percentDeliveryFee,
  totalDiscount,
  percentDiscount
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
      {/* Customers Metric */}
      <div className="rounded-xl border border-gray-200 bg-white p-2.5 flex flex-col justify-between dark:border-gray-800 dark:bg-white/[0.03]">
        <span className="text-xs text-gray-500 mb-1.5 dark:text-gray-400">Total Customers</span>
        <div className="flex items-end justify-between">
          <h4 className="font-bold text-gray-900 text-base md:text-lg dark:text-white/90">{totalCustomers}</h4>
          <PercentageChange value={percentCustomers} />
        </div>
      </div>

      {/* Orders Metric */}
      <div className="rounded-xl border border-gray-200 bg-white p-2.5 flex flex-col justify-between dark:border-gray-800 dark:bg-white/[0.03]">
        <span className="text-xs text-gray-500 mb-1.5 dark:text-gray-400">Total Orders</span>
        <div className="flex items-end justify-between">
          <h4 className="font-bold text-gray-900 text-base md:text-lg dark:text-white/90">{totalOrders}</h4>
          <PercentageChange value={percentOrders} />
        </div>
      </div>

      {/* Revenue Metric */}
      <div className="rounded-xl border border-gray-200 bg-white p-2.5 flex flex-col justify-between dark:border-gray-800 dark:bg-white/[0.03]">
        <span className="text-xs text-gray-500 mb-1.5 dark:text-gray-400">Total Revenue</span>
        <div className="flex items-end justify-between">
          <h4 className="font-bold text-gray-900 text-base md:text-lg dark:text-white/90">
            ${totalRevenue.toFixed(2)}
          </h4>
          <PercentageChange value={percentRevenue} />
        </div>
      </div>

      {/* Profit Metric */}
      <div className="rounded-xl border border-gray-200 bg-white p-2.5 flex flex-col justify-between dark:border-gray-800 dark:bg-white/[0.03]">
        <span className="text-xs text-gray-500 mb-1.5 dark:text-gray-400">Total Profit</span>
        <div className="flex items-end justify-between">
          <h4 className="font-bold text-gray-900 text-base md:text-lg dark:text-white/90">
            ${totalProfit.toFixed(2)}
          </h4>
          <PercentageChange value={percentProfit} />
        </div>
      </div>
      {/* Delivery Fee Metric */}
      <div className="rounded-xl border border-gray-200 bg-white p-2.5 flex flex-col justify-between dark:border-gray-800 dark:bg-white/[0.03]">
        <span className="text-xs text-gray-500 mb-1.5 dark:text-gray-400">Total Delivery Fee</span>
        <div className="flex items-end justify-between">
          <h4 className="font-bold text-gray-900 text-base md:text-lg dark:text-white/90">
            ${totalDeliveryFee.toFixed(2)}
          </h4>
          <PercentageChange value={percentDeliveryFee} />
        </div>
      </div>

      {/* Discount Metric */}
      <div className="rounded-xl border border-gray-200 bg-white p-2.5 flex flex-col justify-between dark:border-gray-800 dark:bg-white/[0.03]">
        <span className="text-xs text-gray-500 mb-1.5 dark:text-gray-400">Total Discount</span>
        <div className="flex items-end justify-between">
          <h4 className="font-bold text-gray-900 text-base md:text-lg dark:text-white/90">
            ${totalDiscount.toFixed(2)}
          </h4>
          <PercentageChange value={percentDiscount} />
        </div>
      </div>
    </div>
  );
};
