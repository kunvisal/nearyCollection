"use server";

import prisma from "@/lib/prisma";

export async function trackOrderAction(orderCode: string, phone: string) {
    try {
        const order = await prisma.order.findUnique({
            where: { orderCode },
            include: {
                customer: true,
                items: true,
                paymentSlips: true,
            },
        });

        if (!order) {
            return { success: false, error: "Order not found. Please check your tracking code." };
        }

        if (order.customer.phone !== phone) {
            return { success: false, error: "Phone number does not match the order." };
        }

        // Returning only safe fields
        return {
            success: true,
            order: {
                orderCode: order.orderCode,
                orderStatus: order.orderStatus,
                paymentStatus: order.paymentStatus,
                paymentMethod: order.paymentMethod,
                total: Number(order.total),
                createdAt: order.createdAt.toISOString(),
                items: order.items.map(i => ({
                    productNameSnapshot: i.productNameSnapshot,
                    qty: i.qty,
                    lineTotal: Number(i.lineTotal),
                    sizeSnapshot: i.sizeSnapshot,
                    colorSnapshot: i.colorSnapshot,
                })),
            },
        };
    } catch (error: any) {
        console.error("Order tracking tracking failed", error);
        return {
            success: false,
            error: error?.message || "Internal server error"
        };
    }
}
