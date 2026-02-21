"use server";

import prisma from "@/lib/prisma";
import { PaymentMethod } from "@prisma/client";

export async function uploadPaymentSlipAction(
    orderId: string,
    slipUrl: string,
    paymentMethod: PaymentMethod
) {
    try {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) {
            return { success: false, error: "Order not found" };
        }

        const slip = await prisma.paymentSlip.create({
            data: {
                orderId,
                slipUrl,
                method: paymentMethod,
            }
        });

        // Update order status to indicate payment is under verification
        await prisma.order.update({
            where: { id: orderId },
            data: {
                paymentStatus: "PENDING_VERIFICATION"
            }
        });

        return { success: true, slip, orderCode: order.orderCode };
    } catch (error: any) {
        console.error("Payment slip upload failed", error);
        return {
            success: false,
            error: error?.message || "Internal server error"
        };
    }
}
