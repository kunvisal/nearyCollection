import { OrderRepository } from "../repositories/orderRepository";
import { TelegramService } from "./telegramService";
import { DeliveryZone, PaymentMethod } from "@prisma/client";

export class OrderService {
    static async createOrder(
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
            const order = await OrderRepository.createOrderTransaction(customerData, orderData);

            // Fire and forget telegram notification
            TelegramService.sendNewOrderNotification(order).catch(console.error);

            return order;
        } catch (error) {
            console.error("Error creating order:", error);
            throw error;
        }
    }

    static async getOrders(params: {
        page?: number;
        limit?: number;
        status?: any;
        paymentStatus?: any;
        searchTerm?: string;
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

    static async updateOrderStatus(id: string, status: any) {
        try {
            return await OrderRepository.updateOrderStatus(id, status);
        } catch (error) {
            console.error(`Error updating order ${id} status:`, error);
            throw error;
        }
    }

    static async updatePaymentStatus(id: string, status: any) {
        try {
            return await OrderRepository.updatePaymentStatus(id, status);
        } catch (error) {
            console.error(`Error updating payment ${id} status:`, error);
            throw error;
        }
    }
}
