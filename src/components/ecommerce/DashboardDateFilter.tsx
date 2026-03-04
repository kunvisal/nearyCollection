"use client";
import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function DashboardDateFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    // Default to 30d if range is not provided
    const currentRange = searchParams.get("range") || "30d";

    const setRange = (range: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("range", range);
        router.push(`${pathname}?${params.toString()}`);
    };

    const getPillStyle = (range: string) => {
        const isActive = currentRange === range;
        return `px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${isActive
                ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            }`;
    };

    return (
        <div className="flex items-center space-x-2 mt-2 mb-4">
            <button onClick={() => setRange("30d")} className={getPillStyle("30d")}>
                28 days
            </button>
            <button onClick={() => setRange("7d")} className={getPillStyle("7d")}>
                7 days
            </button>
            <button onClick={() => setRange("today")} className={getPillStyle("today")}>
                Today
            </button>
        </div>
    );
}
