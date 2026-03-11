"use server";

import { DeliveryService, DeliveryZone, PaymentMethod } from "@prisma/client";
import { OrderService } from "@/lib/services/orderService";

export async function createOrderAction(
    customerData: { fullName: string; phone: string },
    orderData: {
        deliveryZone: DeliveryZone;
        deliveryAddress: string;
        deliveryFee: number;
        isFreeDelivery?: boolean;
        paymentMethod: PaymentMethod;
        deliveryService?: DeliveryService;
        items: Array<{
            variantId: string;
            qty: number;
            salePrice: number;
            discount?: number;
        }>;
        note?: string;
        discount?: number;
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

export async function updateOrderAction(
    orderId: string,
    customerData: { fullName: string; phone: string },
    orderData: {
        deliveryZone: DeliveryZone;
        deliveryAddress: string;
        deliveryFee: number;
        isFreeDelivery?: boolean;
        paymentMethod: PaymentMethod;
        deliveryService?: DeliveryService;
        items: Array<{
            variantId: string;
            qty: number;
            salePrice: number;
            discount?: number;
        }>;
        note?: string;
        discount?: number;
    }
) {
    try {
        const order = await OrderService.updateOrder(orderId, customerData, orderData);
        return {
            success: true,
            order: {
                id: order.id,
                orderCode: order.orderCode,
            }
        };
    } catch (error: any) {
        console.error("Order update failed", error);
        return {
            success: false,
            error: error?.message || "Internal server error during order update"
        };
    }
}
