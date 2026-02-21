import React from "react";

export default function PrintLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="print-layout min-h-screen bg-gray-50 print:bg-white text-black font-sans">
            {children}
        </div>
    );
}
