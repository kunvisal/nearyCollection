"use client";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface StatisticsChartProps {
  dailyRevenue: {
    date: string;
    revenue: number;
    profit: number;
  }[];
}

export default function StatisticsChart({ dailyRevenue }: StatisticsChartProps) {
  const categories = dailyRevenue.map(item => {
    // Format "YYYY-MM-DD" to "DD MMM"
    const date = new Date(item.date);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  });

  const revenueData = dailyRevenue.map(item => item.revenue);
  const profitData = dailyRevenue.map(item => item.profit || 0);

  const options: ApexOptions = {
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      markers: {
      },
    },
    colors: ["#fb6514", "#10B981"], // Orange for Revenue, Emerald Green for Profit
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "area",
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false
      }
    },
    stroke: {
      curve: "straight",
      width: [2, 2],
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
        shadeIntensity: 1,
        stops: [0, 100]
      },
    },
    markers: {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    grid: {
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 10
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
      x: {
        format: "dd MMM yyyy",
      },
    },
    xaxis: {
      type: "category",
      categories: categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    yaxis: {
      labels: {
        formatter: (value) => `$${value}`,
        style: {
          fontSize: "12px",
          colors: ["#6B7280"],
        },
      },
      title: {
        text: "",
        style: {
          fontSize: "0px",
        },
      },
    },
  };

  const series = [
    {
      name: "Revenue",
      data: revenueData,
    },
    {
      name: "Profit",
      data: profitData,
    }
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-row items-start justify-between gap-5 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Revenue & Profit
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Overview for selected date range
          </p>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[500px] xl:min-w-full">
          <Chart options={options} series={series} type="area" height={310} />
        </div>
      </div>
    </div>
  );
}
