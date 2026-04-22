import React from "react";
import "./receipt.css";

export default function PrintLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <div className="print-root text-black">{children}</div>;
}
