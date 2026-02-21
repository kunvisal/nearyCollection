import prisma from "@/lib/prisma";
import { Prisma, OrderStatus, PaymentStatus, DeliveryZone, PaymentMethod } from "@prisma/client";

export class OrderRepository {
    static async createOrderTransaction(
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
        }
    ) {
        return prisma.$transaction(async (tx) => {
            // 1. Find or create customer
            let customer = await tx.customer.findFirst({
                where: { phone: customerData.phone },
            });

            if (!customer) {
                customer = await tx.customer.create({
                    data: {
                        fullName: customerData.fullName,
                        phone: customerData.phone,
                    },
                });
            } else if (customer.fullName !== customerData.fullName) {
                customer = await tx.customer.update({
                    where: { id: customer.id },
                    data: { fullName: customerData.fullName },
                });
            }

            // 2. Validate stock and gather data
            let subtotal = 0;
            const orderItemsData: any[] = []; // Store temporary data to reduce queries

            for (const item of orderData.items) {
                const variant = await tx.productVariant.findUnique({
                    where: { id: item.variantId },
                    include: { product: true },
                });

                if (!variant) {
                    throw new Error(`Variant ${item.variantId} not found`);
                }

                if (variant.stockOnHand < item.qty) {
                    throw new Error(`Insufficient stock for ${variant.product.nameKm} - ${variant.color || ''} ${variant.size || ''}`);
                }

                const lineTotal = (item.salePrice - (item.discount || 0)) * item.qty;
                subtotal += lineTotal;

                orderItemsData.push({
                    variantId: item.variantId,
                    productNameSnapshot: variant.product.nameKm,
                    sizeSnapshot: variant.size || '',
                    colorSnapshot: variant.color || '',
                    skuSnapshot: variant.sku || '',
                    costPriceSnapshot: variant.costPrice,
                    salePriceSnapshot: item.salePrice,
                    discountSnapshot: item.discount || 0,
                    qty: item.qty,
                    lineTotal: new Prisma.Decimal(lineTotal),
                });
            }

            const total = subtotal + orderData.deliveryFee;

            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const randomPart = Math.floor(1000 + Math.random() * 9000);
            const orderCode = `NC-${dateStr}-${randomPart}`;

            // 3. Create Order
            const order = await tx.order.create({
                data: {
                    orderCode,
                    customerId: customer.id,
                    deliveryZone: orderData.deliveryZone,
                    deliveryFee: new Prisma.Decimal(orderData.deliveryFee),
                    subtotal: new Prisma.Decimal(subtotal),
                    total: new Prisma.Decimal(total),
                    paymentMethod: orderData.paymentMethod,
                    paymentStatus: 'UNPAID',
                    orderStatus: 'NEW',
                    shippingAddress: { detailedAddress: orderData.deliveryAddress },
                    note: orderData.note,
                    items: {
                        createMany: {
                            data: orderItemsData,
                        },
                    },
                },
                include: {
                    customer: true,
                    items: true,
                },
            });

            // 4. Deduct Stock & Create Inventory Transactions
            for (const item of orderData.items) {
                await tx.productVariant.update({
                    where: { id: item.variantId },
                    data: {
                        stockOnHand: {
                            decrement: item.qty,
                        },
                    },
                });

                await tx.inventoryTransaction.create({
                    data: {
                        variantId: item.variantId,
                        type: 'DEDUCT',
                        qty: -item.qty,
                        refType: 'ORDER',
                        refId: order.id,
                        note: `Order Placement ${orderCode}`,
                    },
                });
            }

            return order;
        });
    }

    static async getOrders(params: {
        skip?: number;
        take?: number;
        status?: OrderStatus;
        paymentStatus?: PaymentStatus;
        searchTerm?: string;
    }) {
        const { skip, take, status, paymentStatus, searchTerm } = params;

        const where: Prisma.OrderWhereInput = {};

        if (status) where.orderStatus = status;
        if (paymentStatus) where.paymentStatus = paymentStatus;

        if (searchTerm) {
            where.OR = [
                { orderCode: { contains: searchTerm, mode: 'insensitive' } },
                {
                    customer: {
                        OR: [
                            { fullName: { contains: searchTerm, mode: 'insensitive' } },
                            { phone: { contains: searchTerm, mode: 'insensitive' } },
                        ]
                    }
                }
            ];
        }

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    customer: true,
                    items: {
                        include: {
                            variant: {
                                include: {
                                    product: {
                                        include: {
                                            images: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
            }),
            prisma.order.count({ where }),
        ]);

        return { orders, total };
    }

    static async getOrderById(id: string) {
        return prisma.order.findUnique({
            where: { id },
            include: {
                customer: true,
                items: {
                    include: {
                        variant: {
                            include: {
                                product: {
                                    include: {
                                        images: true
                                    }
                                }
                            }
                        }
                    }
                },
                paymentSlips: true,
            },
        });
    }

    static async updateOrderStatus(id: string, status: OrderStatus) {
        return prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id },
                include: { items: true }
            });

            if (!order) throw new Error("Order not found");

            // If cancelling and not already cancelled, restore stock
            if (status === 'CANCELLED' && order.orderStatus !== 'CANCELLED') {
                for (const item of order.items) {
                    await tx.productVariant.update({
                        where: { id: item.variantId },
                        data: {
                            stockOnHand: { increment: item.qty }
                        }
                    });

                    await tx.inventoryTransaction.create({
                        data: {
                            variantId: item.variantId,
                            type: 'IN',
                            qty: item.qty,
                            refType: 'ORDER',
                            refId: order.id,
                            note: `Order Cancelled - ${order.orderCode}`
                        }
                    });
                }
            }

            return tx.order.update({
                where: { id },
                data: { orderStatus: status }
            });
        });
    }

    static async updatePaymentStatus(id: string, status: PaymentStatus) {
        return prisma.order.update({
            where: { id },
            data: { paymentStatus: status }
        });
    }
}
