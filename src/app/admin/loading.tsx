import React from "react";

export default function Loading() {
    return (
        <div className="flex h-[calc(100vh-100px)] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-brand-500 dark:border-gray-700 dark:border-t-brand-400"></div>
        </div>
    );
}
