"use client";

import React from "react";

export default function PrintButton() {
    return (
        <button
            onClick={() => window.print()}
            className="bg-black hover:bg-gray-800 text-white font-medium py-2 px-6 rounded-lg shadow-sm transition-colors"
        >
            Print Receipt
        </button>
    );
}
