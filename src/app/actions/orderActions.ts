"use server";

import { DeliveryZone, PaymentMethod } from "@prisma/client";
import { OrderService } from "@/lib/services/orderService";

export async function createOrderAction(
    customerData: { fullName: string; phone: string },
    orderData: {
        deliveryZone: DeliveryZone;
        deliveryAddress: string;
        deliveryFee: number;
        paymentMethod: PaymentMethod;
        items: Array<{
            variantId: string;
            qty: number;
            salePrice: number;
            discount?: number;
        }>;
        note?: string;
        isPOS?: boolean;
    }
) {
    try {
        const order = await OrderService.createOrder(customerData, orderData);

        // We can't return complex Prisma models directly in Server Actions if they contain Decimals or Dates perfectly.
        // It's safer to serialize.
        return {
            success: true,
            order: {
                id: order.id,
                orderCode: order.orderCode,
            }
        };
    } catch (error: any) {
        console.error("Order creation failed", error);
        return {
            success: false,
            error: error?.message || "Internal server error during order creation"
        };
    }
}
