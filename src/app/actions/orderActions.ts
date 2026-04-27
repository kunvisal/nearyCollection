"use server";

import { DeliveryService, DeliveryZone, PaymentMethod } from "@prisma/client";
import { OrderService } from "@/lib/services/orderService";
import type { OrderItemInput } from "@/lib/repositories/orderRepository";

export async function createOrderAction(
    customerData: { fullName: string; phone: string },
    orderData: {
        deliveryZone: DeliveryZone;
        deliveryAddress: string;
        deliveryFee: number;
        isFreeDelivery?: boolean;
        paymentMethod: PaymentMethod;
        deliveryService?: DeliveryService;
        items: OrderItemInput[];
        note?: string;
        discount?: number;
        isPOS?: boolean;
    }
) {
    try {
        const order = await OrderService.createOrder(customerData, orderData);
        return {
            success: true,
            order: { id: order.id, orderCode: order.orderCode },
        };
    } catch (error: unknown) {
        console.error("Order creation failed", error);
        const message = error instanceof Error ? error.message : "Internal server error during order creation";
        return { success: false, error: message };
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
        items: OrderItemInput[];
        note?: string;
        discount?: number;
    }
) {
    try {
        const order = await OrderService.updateOrder(orderId, customerData, orderData);
        return {
            success: true,
            order: { id: order.id, orderCode: order.orderCode },
        };
    } catch (error: unknown) {
        console.error("Order update failed", error);
        const message = error instanceof Error ? error.message : "Internal server error during order update";
        return { success: false, error: message };
    }
}
