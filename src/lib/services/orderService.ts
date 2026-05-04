import { OrderRepository, type OrderItemInput } from "../repositories/orderRepository";
import { BundleRepository } from "../repositories/bundleRepository";
import { TelegramService } from "./telegramService";
import { DeliveryService, DeliveryZone, PaymentMethod, OrderStatus, PaymentStatus } from "@prisma/client";

type OrderInput = {
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
    paymentStatus?: "PAID" | "UNPAID";
};

export class OrderService {
    static async createOrder(
        customerData: { fullName: string; phone: string },
        orderData: OrderInput,
    ) {
        try {
            OrderService.validateItems(orderData.items);
            await OrderService.preflightBundleAvailability(orderData.items);
            const order = await OrderRepository.createOrderTransaction(customerData, orderData);
            // Fire and forget telegram notification
            if (order) TelegramService.sendNewOrderNotification(order).catch(console.error);
            return order!;
        } catch (error) {
            console.error("Error creating order:", error);
            throw error;
        }
    }

    static async updateOrder(
        orderId: string,
        customerData: { fullName: string; phone: string },
        orderData: Omit<OrderInput, "isPOS">,
    ) {
        try {
            OrderService.validateItems(orderData.items);
            // No preflight here — the transaction restores old stock first, then validates
            // the new requirements against the post-restore stock. Running preflight before
            // the transaction would see stale stock and reject valid edits.
            const order = await OrderRepository.updateOrderTransaction(orderId, customerData, orderData);
            return order!;
        } catch (error) {
            console.error("Error updating order:", error);
            throw error;
        }
    }

    static async getOrders(params: {
        page?: number;
        limit?: number;
        status?: OrderStatus;
        paymentStatus?: PaymentStatus;
        searchTerm?: string;
        dateFrom?: Date;
        dateTo?: Date;
    }) {
        try {
            const page = Math.max(1, params.page || 1);
            const limit = Math.max(1, params.limit || 10);
            const skip = (page - 1) * limit;
            return await OrderRepository.getOrders({
                skip,
                take: limit,
                status: params.status,
                paymentStatus: params.paymentStatus,
                searchTerm: params.searchTerm,
                dateFrom: params.dateFrom,
                dateTo: params.dateTo,
            });
        } catch (error) {
            console.error("Error fetching orders:", error);
            throw error;
        }
    }

    static async getOrderById(id: string) {
        try {
            return await OrderRepository.getOrderById(id);
        } catch (error) {
            console.error(`Error fetching order ${id}:`, error);
            throw error;
        }
    }

    static async updateOrderStatus(id: string, status: OrderStatus) {
        try {
            return await OrderRepository.updateOrderStatus(id, status);
        } catch (error) {
            console.error(`Error updating order ${id} status:`, error);
            throw error;
        }
    }

    static async updatePaymentStatus(id: string, status: PaymentStatus) {
        try {
            return await OrderRepository.updatePaymentStatus(id, status);
        } catch (error) {
            console.error(`Error updating payment ${id} status:`, error);
            throw error;
        }
    }

    static async revertPaymentToUnpaid(
        id: string,
        reason: string,
        actor: { userId: string; name: string },
    ) {
        try {
            const trimmed = reason?.trim() ?? "";
            if (trimmed.length < 3) {
                throw new Error("A reason of at least 3 characters is required to revert payment.");
            }
            if (trimmed.length > 500) {
                throw new Error("Reason must be 500 characters or fewer.");
            }
            return await OrderRepository.revertPaymentToUnpaid(id, trimmed, actor, new Date());
        } catch (error) {
            console.error(`Error reverting payment ${id} to UNPAID:`, error);
            throw error;
        }
    }

    private static validateItems(items: OrderItemInput[]) {
        if (!Array.isArray(items) || items.length === 0) {
            throw new Error("Order must contain at least one item");
        }
        for (const item of items) {
            if (!Number.isInteger(item.qty) || item.qty < 1) {
                throw new Error("Each order item quantity must be a positive integer");
            }
            const hasVariant = !!item.variantId;
            const hasBundle = !!item.bundleProductId;
            if (!hasVariant && !hasBundle) {
                throw new Error("Each order item must have either variantId or bundleProductId");
            }
            if (hasVariant && hasBundle) {
                throw new Error("Each order item must have either variantId or bundleProductId, not both");
            }
        }
    }

    /**
     * Fail fast with a friendly error before opening the order transaction —
     * the repo also re-checks atomically inside the transaction.
     */
    private static async preflightBundleAvailability(items: OrderItemInput[]) {
        for (const item of items) {
            if (!item.bundleProductId) continue;
            const available = await BundleRepository.computeAvailableQty(item.bundleProductId);
            if (available < item.qty) {
                throw new Error(
                    `Insufficient stock for this bundle — only ${available} available`,
                );
            }
        }
    }
}
