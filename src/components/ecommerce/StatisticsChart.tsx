"use client";
import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import flatpickr from "flatpickr";
import { useRouter } from "next/navigation";
import ChartTab from "../common/ChartTab";
import { CalenderIcon } from "../../icons";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface StatisticsChartProps {
  dailyRevenue: {
    date: string;
    revenue: number;
    profit: number;
  }[];
  startDate?: string;
  endDate?: string;
}

export default function StatisticsChart({ dailyRevenue, startDate, endDate }: StatisticsChartProps) {
  const datePickerRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!datePickerRef.current) return;

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);

    const defaultStart = startDate ? new Date(startDate) : sevenDaysAgo;
    const defaultEnd = endDate ? new Date(endDate) : today;

    const fp = flatpickr(datePickerRef.current, {
      mode: "range",
      position: "auto right",
      monthSelectorType: "static",
      dateFormat: "Y-m-d", // Use a predictable format for URLs
      altFormat: "M d",
      altInput: true,
      defaultDate: [defaultStart, defaultEnd],
      clickOpens: true,
      prevArrow:
        '<svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.5 15L7.5 10L12.5 5" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      nextArrow:
        '<svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 15L12.5 10L7.5 5" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      onChange: (selectedDates) => {
        // Only trigger if both start and end dates are selected
        if (selectedDates.length === 2) {
          const from = selectedDates[0].toISOString().split('T')[0];
          const to = selectedDates[1].toISOString().split('T')[0];

          router.push(`/admin?from=${from}&to=${to}`);
        }
      }
    });

    return () => {
      if (!Array.isArray(fp)) {
        fp.destroy();
      }
    };
  }, [startDate, endDate, router]);

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
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative inline-flex items-center">
            <CalenderIcon className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:left-3 lg:top-1/2 lg:translate-x-0 lg:-translate-y-1/2  text-gray-500 dark:text-gray-400 pointer-events-none z-10" />
            <input
              ref={datePickerRef}
              className="h-10 w-10 lg:w-48 lg:h-auto lg:pl-10 lg:pr-3 lg:py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-transparent lg:text-gray-700 outline-none dark:border-gray-700 dark:bg-gray-800 dark:lg:text-gray-300 cursor-pointer"
              placeholder="Select date range"
            />
          </div>
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