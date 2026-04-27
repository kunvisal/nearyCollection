import prisma from "@/lib/prisma";
import { Prisma, OrderStatus, PaymentStatus, DeliveryZone, PaymentMethod, DeliveryService } from "@prisma/client";
import { BundleRepository } from "./bundleRepository";

/**
 * Discriminated input shape for line items.
 * - When `bundleProductId` is set → the line is a bundle (parent OrderItem + N child OrderItems get created).
 * - Otherwise the line is a regular product variant (legacy shape — back-compat for existing callers).
 *
 * `salePrice` is the per-unit price the customer pays (the bundle's unit price for bundle lines, or the
 * variant sale price for product lines). `discount` is per-unit and applies to the parent line only.
 */
export type OrderItemInput = {
    variantId?: string;
    bundleProductId?: string;
    qty: number;
    salePrice: number;
    discount?: number;
};

type OrderTxInput = {
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
};

/**
 * Collect the total variant qty needed for a set of order items, expanding bundles.
 * Returns a Map of variantId → total qty required across all lines.
 * Used for aggregate stock validation before any row is persisted.
 */
async function collectVariantRequirements(
    tx: Prisma.TransactionClient,
    items: OrderItemInput[],
): Promise<Map<string, number>> {
    const needs = new Map<string, number>();
    for (const item of items) {
        if (item.bundleProductId) {
            const components = await BundleRepository.findComponentsForSale(item.bundleProductId);
            for (const c of components) {
                const needed = item.qty * c.qty;
                needs.set(c.variant.id, (needs.get(c.variant.id) ?? 0) + needed);
            }
        } else if (item.variantId) {
            needs.set(item.variantId, (needs.get(item.variantId) ?? 0) + item.qty);
        }
    }
    return needs;
}

/**
 * Validate that the current DB stock covers the aggregated variant requirements.
 * Throws a descriptive error on first insufficiency found.
 */
async function validateAggregateStock(
    tx: Prisma.TransactionClient,
    needs: Map<string, number>,
): Promise<void> {
    for (const [variantId, totalNeeded] of needs.entries()) {
        const variant = await tx.productVariant.findUnique({
            where: { id: variantId },
            include: { product: true },
        });
        if (!variant) throw new Error(`Variant ${variantId} not found`);
        if (variant.stockOnHand < totalNeeded) {
            throw new Error(
                `Insufficient stock for ${variant.product.nameKm} ${variant.color ?? ""} ${variant.size ?? ""} — need ${totalNeeded}, have ${variant.stockOnHand}`.trim(),
            );
        }
    }
}

/**
 * Build the OrderItem create-many shape for a single input line.
 * For bundles this returns 1 parent + N children. For products, 1 row.
 * Stock is NOT touched here — caller deducts after persistence by iterating saved rows.
 * NOTE: Stock level validation is done at the aggregate level before this is called;
 * this function only validates entity existence and active status.
 */
async function buildOrderItemsForInput(
    tx: Prisma.TransactionClient,
    item: OrderItemInput,
): Promise<{
    rows: Array<{
        kind: "product" | "bundleParent" | "bundleChild";
        data: Omit<Prisma.OrderItemCreateManyInput, "orderId">;
        // for parents we need a temporary key so children can attach after persistence
        parentKey?: string;
    }>;
    lineTotal: number; // contribution to subtotal (parents + standalone product lines)
}> {
    if (item.bundleProductId) {
        const bundle = await tx.product.findUnique({
            where: { id: item.bundleProductId },
            include: {
                images: { orderBy: { sortOrder: "asc" }, take: 1 },
            },
        });
        if (!bundle || !bundle.isBundle) {
            throw new Error(`Bundle ${item.bundleProductId} not found`);
        }
        if (!bundle.isActive) {
            throw new Error(`Bundle "${bundle.nameKm}" is not active`);
        }
        const components = await BundleRepository.findComponentsForSale(item.bundleProductId);
        if (components.length === 0) {
            throw new Error(`Bundle "${bundle.nameKm}" has no components configured`);
        }

        // Compute the authoritative bundle unit price from DB data — never trust the client-supplied salePrice.
        // bundleDiscount is the amount already subtracted from the component sum when the bundle was configured.
        const componentSum = components.reduce(
            (acc, c) => acc + Number(c.variant.salePrice) * c.qty,
            0,
        );
        const trustedUnitPrice = Math.max(0, componentSum - Number(bundle.bundleDiscount ?? 0));
        const parentCostSnapshot = components.reduce(
            (acc, c) => acc + Number(c.variant.costPrice) * c.qty,
            0,
        );
        const parentLineTotal = trustedUnitPrice * item.qty;
        const parentKey = `bundle-${bundle.id}-${Math.random().toString(36).slice(2, 8)}`;

        const rows: Array<{
            kind: "product" | "bundleParent" | "bundleChild";
            data: Omit<Prisma.OrderItemCreateManyInput, "orderId">;
            parentKey?: string;
        }> = [
            {
                kind: "bundleParent",
                parentKey,
                data: {
                    variantId: null,
                    bundleProductId: bundle.id,
                    parentItemId: null,
                    isBundleParent: true,
                    productNameSnapshot: bundle.nameKm,
                    sizeSnapshot: "",
                    colorSnapshot: "",
                    skuSnapshot: "",
                    costPriceSnapshot: new Prisma.Decimal(parentCostSnapshot),
                    salePriceSnapshot: new Prisma.Decimal(trustedUnitPrice),
                    discountSnapshot: new Prisma.Decimal(0),
                    qty: item.qty,
                    lineTotal: new Prisma.Decimal(parentLineTotal),
                },
            },
            ...components.map((c) => ({
                kind: "bundleChild" as const,
                parentKey,
                data: {
                    variantId: c.variant.id,
                    bundleProductId: null,
                    parentItemId: null, // will be wired up after parent persistence
                    isBundleParent: false,
                    productNameSnapshot: c.variant.product.nameKm,
                    sizeSnapshot: c.variant.size || "",
                    colorSnapshot: c.variant.color || "",
                    skuSnapshot: c.variant.sku || "",
                    // Children carry zero financial weight — see schema docs for the parent-carries-finance pattern.
                    costPriceSnapshot: new Prisma.Decimal(0),
                    salePriceSnapshot: new Prisma.Decimal(0),
                    discountSnapshot: new Prisma.Decimal(0),
                    qty: item.qty * c.qty,
                    lineTotal: new Prisma.Decimal(0),
                } satisfies Omit<Prisma.OrderItemCreateManyInput, "orderId">,
            })),
        ];

        return { rows, lineTotal: parentLineTotal };
    }

    // Regular product line
    if (!item.variantId) {
        throw new Error("OrderItem must have either variantId or bundleProductId");
    }

    const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId },
        include: { product: true },
    });
    if (!variant) throw new Error(`Variant ${item.variantId} not found`);

    const lineTotal = (item.salePrice - (item.discount || 0)) * item.qty;
    return {
        rows: [
            {
                kind: "product",
                data: {
                    variantId: item.variantId,
                    bundleProductId: null,
                    parentItemId: null,
                    isBundleParent: false,
                    productNameSnapshot: variant.product.nameKm,
                    sizeSnapshot: variant.size || "",
                    colorSnapshot: variant.color || "",
                    skuSnapshot: variant.sku || "",
                    costPriceSnapshot: variant.costPrice,
                    salePriceSnapshot: new Prisma.Decimal(item.salePrice),
                    discountSnapshot: new Prisma.Decimal(item.discount || 0),
                    qty: item.qty,
                    lineTotal: new Prisma.Decimal(lineTotal),
                },
            },
        ],
        lineTotal,
    };
}

/**
 * Persist all order items (regular + bundle parents + bundle children) and wire children to parents.
 * Returns the saved OrderItems so the caller can iterate them for stock deduction.
 */
async function persistOrderItems(
    tx: Prisma.TransactionClient,
    orderId: string,
    grouped: Array<Awaited<ReturnType<typeof buildOrderItemsForInput>>["rows"]>,
) {
    const persisted: Array<{ id: string; variantId: string | null; qty: number; orderCode?: string }> = [];

    for (const group of grouped) {
        const parent = group.find((r) => r.kind === "bundleParent");
        if (parent) {
            const created = await tx.orderItem.create({
                data: { ...parent.data, orderId },
            });
            persisted.push({ id: created.id, variantId: created.variantId, qty: created.qty });

            const children = group.filter((r) => r.kind === "bundleChild");
            for (const child of children) {
                const childCreated = await tx.orderItem.create({
                    data: { ...child.data, orderId, parentItemId: created.id },
                });
                persisted.push({ id: childCreated.id, variantId: childCreated.variantId, qty: childCreated.qty });
            }
        } else {
            // Pure product line(s)
            for (const row of group) {
                const created = await tx.orderItem.create({
                    data: { ...row.data, orderId },
                });
                persisted.push({ id: created.id, variantId: created.variantId, qty: created.qty });
            }
        }
    }
    return persisted;
}

export class OrderRepository {
    static async createOrderTransaction(
        customerData: { fullName: string; phone: string },
        orderData: OrderTxInput,
    ) {
        // Business intent: Atomically place a new order.
        // Sequence: find/create customer → validate stock + build line items (incl. bundle expansion) →
        //           generate order code → create order → create items (parents first, then wire children) →
        //           deduct stock from every persisted row whose variantId IS NOT NULL.
        // If any step fails the entire transaction rolls back — no partial orders, no phantom stock deductions.
        return prisma.$transaction(async (tx) => {
            // 1. Find or create customer
            let customer = await tx.customer.findFirst({
                where: {
                    phone: customerData.phone,
                    fullName: { equals: customerData.fullName, mode: "insensitive" },
                },
            });
            if (!customer) {
                customer = await tx.customer.create({
                    data: { fullName: customerData.fullName, phone: customerData.phone },
                });
            }

            // 2. Aggregate stock validation — checks shared components across all lines in one pass.
            const variantNeeds = await collectVariantRequirements(tx, orderData.items);
            await validateAggregateStock(tx, variantNeeds);

            // 3. Build line item rows (bundle expansion; existence checks only — stock already validated)
            let subtotal = 0;
            const groups: Array<Awaited<ReturnType<typeof buildOrderItemsForInput>>["rows"]> = [];
            for (const item of orderData.items) {
                const built = await buildOrderItemsForInput(tx, item);
                groups.push(built.rows);
                subtotal += built.lineTotal;
            }

            const orderDiscount = orderData.discount || 0;
            const deliveryCharge = orderData.isFreeDelivery ? 0 : orderData.deliveryFee;
            const total = Math.max(0, subtotal - orderDiscount + deliveryCharge);

            // Use Cambodia date so order codes reflect the local business day,
            // not UTC (which can be a different calendar day before 07:00 Cambodia time).
            const { toCambodiaDateStr } = await import("@/lib/utils/timezone");
            const dateStr = toCambodiaDateStr(new Date()).replace(/-/g, "");
            const randomPart = Math.floor(1000 + Math.random() * 9000);
            const orderCode = `NC-${dateStr}-${randomPart}`;

            let orderStatus: OrderStatus = "NEW";
            let paymentStatus: PaymentStatus = "UNPAID";

            if (orderData.isPOS) {
                // POS business rules (enforced at point of sale by staff):
                // - PP zone: COD + JALAT only.
                // - Province zone: ABA or WING + VET or JT.
                // - POS orders skip NEW status and go straight to PROCESSING.
                // - Province POS orders are also marked PAID immediately.
                if (!orderData.deliveryService) {
                    throw new Error("Delivery service is required for POS orders.");
                }
                if (orderData.deliveryZone === "PP") {
                    if (orderData.paymentMethod !== "COD") {
                        throw new Error("For PP orders, payment method must be COD.");
                    }
                    if (orderData.deliveryService !== "JALAT") {
                        throw new Error("For PP orders, delivery service must be JALAT.");
                    }
                }
                if (orderData.deliveryZone === "PROVINCE") {
                    if (!["ABA", "WING"].includes(orderData.paymentMethod)) {
                        throw new Error("For Province orders, payment method must be ABA or WING.");
                    }
                    if (!["VET", "JT"].includes(orderData.deliveryService)) {
                        throw new Error("For Province orders, delivery service must be VET or JT.");
                    }
                }
                orderStatus = "PROCESSING";
                if (orderData.deliveryZone === "PROVINCE") paymentStatus = "PAID";
            }

            // 3. Create order shell
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
                },
            });

            // 4. Persist line items (bundle parent → children wiring is handled inside)
            const persisted = await persistOrderItems(tx, order.id, groups);

            // 5. Deduct stock for every persisted row that points to a real variant.
            //    Bundle parent rows (variantId === null) are skipped — their children carry the deduction.
            for (const row of persisted) {
                if (!row.variantId) continue;
                await tx.productVariant.update({
                    where: { id: row.variantId },
                    data: { stockOnHand: { decrement: row.qty } },
                });
                await tx.inventoryTransaction.create({
                    data: {
                        variantId: row.variantId,
                        type: "DEDUCT",
                        qty: -row.qty,
                        refType: "ORDER",
                        refId: order.id,
                        note: `Order Placement ${orderCode}`,
                    },
                });
            }

            return tx.order.findUnique({
                where: { id: order.id },
                include: { customer: true, items: { include: { variant: true } } },
            });
        }, { timeout: 15000 });
    }

    static async updateOrderTransaction(
        orderId: string,
        customerData: { fullName: string; phone: string },
        orderData: Omit<OrderTxInput, "isPOS">,
    ) {
        // Business intent: Replace an existing order's items while preserving the order record and code.
        // Pattern: restore old stock → delete old items → validate + write new items → deduct new stock.
        // CANCELLED orders skip restore/deduct — stock was already returned when the order was cancelled.
        return prisma.$transaction(async (tx) => {
            const existingOrder = await tx.order.findUnique({
                where: { id: orderId },
                include: { items: true },
            });
            if (!existingOrder) throw new Error("Order not found");

            // 1. Customer
            let customer = await tx.customer.findFirst({
                where: {
                    phone: customerData.phone,
                    fullName: { equals: customerData.fullName, mode: "insensitive" },
                },
            });
            if (!customer) {
                customer = await tx.customer.create({
                    data: { fullName: customerData.fullName, phone: customerData.phone },
                });
            }

            // 2. Restore stock for existing items (only those with a real variant)
            if (existingOrder.orderStatus !== "CANCELLED") {
                for (const item of existingOrder.items) {
                    if (!item.variantId) continue;
                    await tx.productVariant.update({
                        where: { id: item.variantId },
                        data: { stockOnHand: { increment: item.qty } },
                    });
                    await tx.inventoryTransaction.create({
                        data: {
                            variantId: item.variantId,
                            type: "IN",
                            qty: item.qty,
                            refType: "ORDER_EDIT",
                            refId: existingOrder.id,
                            note: `Order Edit - Restored Stock - ${existingOrder.orderCode}`,
                        },
                    });
                }
            }

            // 3. Delete old items (cascade removes bundle children automatically due to parentItemId FK)
            await tx.orderItem.deleteMany({ where: { orderId: existingOrder.id } });

            // 4. Aggregate stock validation (runs AFTER old stock is restored — sees correct available qty).
            const variantNeeds = await collectVariantRequirements(tx, orderData.items);
            await validateAggregateStock(tx, variantNeeds);

            // 5. Build new rows
            let subtotal = 0;
            const groups: Array<Awaited<ReturnType<typeof buildOrderItemsForInput>>["rows"]> = [];
            for (const item of orderData.items) {
                const built = await buildOrderItemsForInput(tx, item);
                groups.push(built.rows);
                subtotal += built.lineTotal;
            }

            const orderDiscount = orderData.discount || 0;
            const deliveryCharge = orderData.isFreeDelivery ? 0 : orderData.deliveryFee;
            const total = Math.max(0, subtotal - orderDiscount + deliveryCharge);

            // 5. Update order shell
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
                },
            });

            // 6. Persist new items
            const persisted = await persistOrderItems(tx, order.id, groups);

            // 7. Deduct new stock (skip bundle parent rows; children carry the deduction)
            if (existingOrder.orderStatus !== "CANCELLED") {
                for (const row of persisted) {
                    if (!row.variantId) continue;
                    await tx.productVariant.update({
                        where: { id: row.variantId },
                        data: { stockOnHand: { decrement: row.qty } },
                    });
                    await tx.inventoryTransaction.create({
                        data: {
                            variantId: row.variantId,
                            type: "DEDUCT",
                            qty: -row.qty,
                            refType: "ORDER_EDIT",
                            refId: order.id,
                            note: `Order Edit - Deducted Stock - ${order.orderCode}`,
                        },
                    });
                }
            }

            return tx.order.findUnique({
                where: { id: order.id },
                include: { customer: true, items: { include: { variant: true } } },
            });
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
                { orderCode: { contains: searchTerm, mode: "insensitive" } },
                {
                    customer: {
                        OR: [
                            { fullName: { contains: searchTerm, mode: "insensitive" } },
                            { phone: { contains: searchTerm, mode: "insensitive" } },
                        ],
                    },
                },
            ];
        }

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: "desc" },
                include: {
                    customer: true,
                    items: {
                        include: {
                            variant: { include: { product: { include: { images: true } } } },
                            bundleProduct: { include: { images: true } },
                        },
                    },
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
                        variant: { include: { product: { include: { images: true } } } },
                        bundleProduct: { include: { images: true } },
                    },
                },
                paymentSlips: true,
            },
        });
    }

    static async getOrdersByIds(ids: string[]) {
        return prisma.order.findMany({
            where: { id: { in: ids } },
            orderBy: { createdAt: "desc" },
            include: {
                customer: true,
                items: { include: { bundleProduct: true } },
                paymentSlips: true,
            },
        });
    }

    static async updateOrderStatus(id: string, status: OrderStatus) {
        // Business intent: Status changes are usually a simple update, except CANCELLED.
        // Cancelling an order automatically restores all item stock to inventory in the same transaction,
        // skipping bundle parent rows (variantId === null) — children carry the inventory data.
        return prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id },
                include: { items: true },
            });
            if (!order) throw new Error("Order not found");

            if (status === "CANCELLED" && order.orderStatus !== "CANCELLED") {
                for (const item of order.items) {
                    if (!item.variantId) continue;
                    await tx.productVariant.update({
                        where: { id: item.variantId },
                        data: { stockOnHand: { increment: item.qty } },
                    });
                    await tx.inventoryTransaction.create({
                        data: {
                            variantId: item.variantId,
                            type: "IN",
                            qty: item.qty,
                            refType: "ORDER",
                            refId: order.id,
                            note: `Order Cancelled - ${order.orderCode}`,
                        },
                    });
                }
            }

            return tx.order.update({
                where: { id },
                data: { orderStatus: status },
            });
        }, { timeout: 15000 });
    }

    static async updatePaymentStatus(id: string, status: PaymentStatus) {
        return prisma.order.update({
            where: { id },
            data: { paymentStatus: status },
        });
    }
}
