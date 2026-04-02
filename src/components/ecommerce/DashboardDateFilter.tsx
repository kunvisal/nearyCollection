"use client";
import React, { useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import { format } from "date-fns";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CalenderIcon } from "../../icons";

export default function DashboardDateFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const datePickerRef = useRef<HTMLInputElement>(null);

    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const rangeParam = searchParams.get("range");
    const currentRange = rangeParam || (fromParam && toParam ? "custom" : "30d");

    const setRange = (range: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("range", range);
        params.delete("from");
        params.delete("to");
        router.push(`${pathname}?${params.toString()}`);
    };

    useEffect(() => {
        if (!datePickerRef.current) return;

        const today = new Date();
        const endOfToday = new Date(today);
        endOfToday.setHours(23, 59, 59, 999);

        let defaultStart = new Date(today);
        let defaultEnd = new Date(endOfToday);

        if (fromParam && toParam) {
            defaultStart = new Date(`${fromParam}T00:00:00`);
            defaultEnd = new Date(`${toParam}T23:59:59.999`);
        } else if (currentRange === "today") {
            defaultStart.setHours(0, 0, 0, 0);
        } else if (currentRange === "7d") {
            defaultStart.setDate(today.getDate() - 6);
            defaultStart.setHours(0, 0, 0, 0);
        } else {
            defaultStart.setDate(today.getDate() - 29);
            defaultStart.setHours(0, 0, 0, 0);
        }

        const isCustomActive = currentRange === "custom";
        const baseInputClass = "h-9 w-[165px] md:w-[220px] rounded-full border text-sm font-medium outline-none cursor-pointer pl-9 pr-3";
        const activeInputClass = isCustomActive
            ? "border-blue-400 text-blue-600 bg-blue-50 dark:border-blue-500/60 dark:text-blue-300 dark:bg-blue-900/30"
            : "border-gray-200 text-gray-700 bg-white dark:border-gray-700 dark:text-gray-300 dark:bg-gray-800";

        const fp = flatpickr(datePickerRef.current, {
            mode: "range",
            position: "auto right",
            monthSelectorType: "static",
            dateFormat: "Y-m-d",
            altFormat: "M d",
            altInput: true,
            altInputClass: `${baseInputClass} ${activeInputClass}`,
            defaultDate: [defaultStart, defaultEnd],
            clickOpens: true,
            prevArrow:
                '<svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.5 15L7.5 10L12.5 5" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
            nextArrow:
                '<svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 15L12.5 10L7.5 5" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
            onChange: (selectedDates) => {
                if (selectedDates.length === 2) {
                    // Use date-fns format() (browser local = Cambodia) instead of
                    // .toISOString() which returns UTC and can shift the date by -1 day
                    // for Cambodia users (UTC+7) picking midnight dates.
                    const from = format(selectedDates[0], "yyyy-MM-dd");
                    const to   = format(selectedDates[1], "yyyy-MM-dd");

                    const params = new URLSearchParams(searchParams.toString());
                    params.set("range", "custom");
                    params.set("from", from);
                    params.set("to", to);
                    router.push(`${pathname}?${params.toString()}`);
                }
            }
        });

        return () => {
            if (!Array.isArray(fp)) {
                fp.destroy();
            }
        };
    }, [currentRange, fromParam, toParam, pathname, router, searchParams]);

    const getPillStyle = (range: string) => {
        const isActive = currentRange === range;
        return `px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${isActive
                ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            }`;
    };

    return (
        <div className="flex items-center justify-between gap-1.5 mt-2 mb-4">
            <div className="flex items-center gap-1.5">
                <button onClick={() => setRange("7d")} className={getPillStyle("7d")}>
                    7 days
                </button>
                <button onClick={() => setRange("today")} className={getPillStyle("today")}>
                    Today
                </button>
            </div>
            <div className="relative inline-flex items-center shrink-0 ml-auto">
                <CalenderIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none z-10" />
                <input
                    ref={datePickerRef}
                    className="h-9 w-[165px] md:w-[220px] rounded-full border border-gray-200 bg-white text-sm font-medium text-transparent outline-none dark:border-gray-700 dark:bg-gray-800 cursor-pointer"
                    placeholder="Custom range"
                />
            </div>
        </div>
    );
}
