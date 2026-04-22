import React from "react";
import { OrderRepository } from "@/lib/repositories/orderRepository";
import { redirect } from "next/navigation";
import ReceiptLabel from "@/components/print/ReceiptLabel";
import { SHOP_INFO } from "@/lib/constants/shop";
import PrintButton from "../order/[id]/PrintButton";

export default async function PrintBulkOrders({
    searchParams,
}: {
    searchParams: Promise<{ ids?: string }>;
}) {
    const { ids: idsParam } = await searchParams;

    if (!idsParam) {
        redirect("/admin/orders");
    }

    const ids = idsParam.split(",").filter(Boolean);

    if (ids.length === 0) {
        redirect("/admin/orders");
    }

    const orders = await OrderRepository.getOrdersByIds(ids);

    if (orders.length === 0) {
        redirect("/admin/orders");
    }

    return (
        <>
            <div className="print-toolbar print:hidden flex items-center gap-3 bg-gray-100 border-b px-6 py-3 sticky top-0 z-50">
                <span className="text-sm font-medium text-gray-700">
                    {orders.length} receipt{orders.length > 1 ? "s" : ""} ready to print
                </span>
                <PrintButton />
            </div>

            {orders.map((order) => (
                <ReceiptLabel key={order.id} order={order} shop={SHOP_INFO} />
            ))}
        </>
    );
}
