import prisma from "@/lib/prisma";
import { Prisma, OrderStatus, PaymentStatus, DeliveryZone, PaymentMethod, DeliveryService } from "@prisma/client";

export class OrderRepository {
    static async createOrderTransaction(
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
        return prisma.$transaction(async (tx) => {
            // 1. Find or create customer (match both phone and name to avoid overwriting past orders)
            let customer = await tx.customer.findFirst({
                where: { 
                    phone: customerData.phone,
                    fullName: {
                        equals: customerData.fullName,
                        mode: 'insensitive'
                    }
                },
            });

            if (!customer) {
                customer = await tx.customer.create({
                    data: {
                        fullName: customerData.fullName,
                        phone: customerData.phone,
                    },
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

            const orderDiscount = orderData.discount || 0;
            const deliveryCharge = orderData.isFreeDelivery ? 0 : orderData.deliveryFee;
            // Total should not be negative
            const total = Math.max(0, subtotal - orderDiscount + deliveryCharge);

            // Use Cambodia date so order codes reflect the local business day,
            // not UTC (which can be a different calendar day before 07:00 Cambodia time).
            const { toCambodiaDateStr } = await import("@/lib/utils/timezone");
            const dateStr = toCambodiaDateStr(new Date()).replace(/-/g, '');
            const randomPart = Math.floor(1000 + Math.random() * 9000);
            const orderCode = `NC-${dateStr}-${randomPart}`;

            let orderStatus: OrderStatus = 'NEW';
            let paymentStatus: PaymentStatus = 'UNPAID';

            if (orderData.isPOS) {
                if (!orderData.deliveryService) {
                    throw new Error("Delivery service is required for POS orders.");
                }

                if (orderData.deliveryZone === 'PP') {
                    if (orderData.paymentMethod !== 'COD') {
                        throw new Error("For PP orders, payment method must be COD.");
                    }
                    if (orderData.deliveryService !== 'JALAT') {
                        throw new Error("For PP orders, delivery service must be JALAT.");
                    }
                }

                if (orderData.deliveryZone === 'PROVINCE') {
                    if (!['ABA', 'WING'].includes(orderData.paymentMethod)) {
                        throw new Error("For Province orders, payment method must be ABA or WING.");
                    }
                    if (!['VET', 'JT'].includes(orderData.deliveryService)) {
                        throw new Error("For Province orders, delivery service must be VET or JT.");
                    }
                }

                orderStatus = 'PROCESSING';
                if (orderData.deliveryZone === 'PROVINCE') {
                    paymentStatus = 'PAID';
                }
            }

            // 3. Create Order
            const order = await tx.order.create({
                data: {
                    orderCode,
                    customerId: customer.id,
                    deliveryZone: orderData.deliveryZone,
                    deliveryFee: new Prisma.Decimal(orderData.deliveryFee),

                    isFreeDelivery: orderData.isFreeDelivery || false,
                    subtotal: new Prisma.Decimal(subtotal),
                    discount: new Prisma.Decimal(orderDiscount),
                    total: new Prisma.Decimal(total),
                    paymentMethod: orderData.paymentMethod,
                    deliveryService: orderData.deliveryService,
                    paymentStatus,
                    orderStatus,
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
        }, { timeout: 15000 });
    }

    static async updateOrderTransaction(
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
        return prisma.$transaction(async (tx) => {
            const existingOrder = await tx.order.findUnique({
                where: { id: orderId },
                include: { items: true },
            });

            if (!existingOrder) {
                throw new Error("Order not found");
            }

            // 1. Update customer 
            let customer = await tx.customer.findFirst({
                where: { 
                    phone: customerData.phone,
                    fullName: {
                        equals: customerData.fullName,
                        mode: 'insensitive'
                    }
                },
            });

            if (!customer) {
                customer = await tx.customer.create({
                    data: {
                        fullName: customerData.fullName,
                        phone: customerData.phone,
                    },
                });
            }

            // 2. Restore stock for existing items
            if (existingOrder.orderStatus !== 'CANCELLED') {
                for (const item of existingOrder.items) {
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
                            refType: 'ORDER_EDIT',
                            refId: existingOrder.id,
                            note: `Order Edit - Restored Stock - ${existingOrder.orderCode}`
                        }
                    });
                }
            }

            // 3. Delete old items
            await tx.orderItem.deleteMany({
                where: { orderId: existingOrder.id }
            });

            // 4. Validate and prepare new items
            let subtotal = 0;
            const orderItemsData: any[] = [];

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

            const orderDiscount = orderData.discount || 0;
            const deliveryCharge = orderData.isFreeDelivery ? 0 : orderData.deliveryFee;
            const total = Math.max(0, subtotal - orderDiscount + deliveryCharge);

            // 5. Update Order
            const order = await tx.order.update({
                where: { id: existingOrder.id },
                data: {
                    customerId: customer.id,
                    deliveryZone: orderData.deliveryZone,
                    deliveryFee: new Prisma.Decimal(orderData.deliveryFee),
                    isFreeDelivery: orderData.isFreeDelivery || false,
                    subtotal: new Prisma.Decimal(subtotal),
                    discount: new Prisma.Decimal(orderDiscount),
                    total: new Prisma.Decimal(total),
                    paymentMethod: orderData.paymentMethod,
                    deliveryService: orderData.deliveryService,
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

            // 6. Deduct new stock
            if (existingOrder.orderStatus !== 'CANCELLED') {
                for (const item of orderData.items) {
                    await tx.productVariant.update({
                        where: { id: item.variantId },
                        data: {
                            stockOnHand: { decrement: item.qty },
                        },
                    });

                    await tx.inventoryTransaction.create({
                        data: {
                            variantId: item.variantId,
                            type: 'DEDUCT',
                            qty: -item.qty,
                            refType: 'ORDER_EDIT',
                            refId: order.id,
                            note: `Order Edit - Deducted Stock - ${order.orderCode}`,
                        },
                    });
                }
            }

            return order;
        }, { timeout: 15000 });
    }

    static async getOrders(params: {
        skip?: number;
        take?: number;
        status?: OrderStatus;
        paymentStatus?: PaymentStatus;
        searchTerm?: string;
        dateFrom?: Date;
        dateTo?: Date;
    }) {
        const { skip, take, status, paymentStatus, searchTerm, dateFrom, dateTo } = params;

        const where: Prisma.OrderWhereInput = {};

        if (status) where.orderStatus = status;
        if (paymentStatus) where.paymentStatus = paymentStatus;

        if (dateFrom || dateTo) {
            where.createdAt = {
                ...(dateFrom && { gte: dateFrom }),
                ...(dateTo && { lte: dateTo }),
            };
        }

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

    static async getOrdersByIds(ids: string[]) {
        return prisma.order.findMany({
            where: { id: { in: ids } },
            orderBy: { createdAt: 'desc' },
            include: {
                customer: true,
                items: true,
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
        }, { timeout: 15000 });
    }

    static async updatePaymentStatus(id: string, status: PaymentStatus) {
        return prisma.order.update({
            where: { id },
            data: { paymentStatus: status }
        });
    }
}
