import React from "react";
import { OrderRepository } from "@/lib/repositories/orderRepository";
import { redirect } from "next/navigation";
import ReceiptLabel from "@/components/print/ReceiptLabel";
import { SHOP_INFO } from "@/lib/constants/shop";
import PrintButton from "./PrintButton";

export default async function PrintOrderReceipt({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const order = await OrderRepository.getOrderById(id);

    if (!order) {
        redirect("/admin/orders");
    }

    return (
        <>
            <ReceiptLabel order={order} shop={SHOP_INFO} />
            <div className="print-toolbar print:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
                <PrintButton />
            </div>
        </>
    );
}
