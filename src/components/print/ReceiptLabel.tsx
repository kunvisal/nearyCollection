import React from "react";
import { formatCambodiaDate } from "@/lib/utils/timezone";
import type { ShopInfo } from "@/lib/constants/shop";

const DELIVERY_SERVICE_KM: Record<string, string> = {
    JALAT: "ចល័ត",
    VET: "វីរៈប៉ុស្តិ៍",
    JT: "J&T",
};

const DELIVERY_ZONE_KM: Record<string, string> = {
    PP: "ភ្នំពេញ",
    PROVINCE: "ខេត្ត",
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
    COD: "COD",
    ABA: "ABA",
    WING: "WING",
};

const PAYMENT_STATUS_KM: Record<string, string> = {
    UNPAID: "មិនទាន់បង់",
    PENDING_VERIFICATION: "កំពុងផ្ទៀង",
    PAID: "បានបង់",
    REJECTED: "បដិសេធ",
};

type ReceiptOrder = {
    id: string;
    orderCode: string;
    createdAt: Date | string;
    customer: { fullName: string; phone: string };
    shippingAddress: unknown;
    deliveryZone: string;
    deliveryService: string | null;
    paymentMethod: string;
    paymentStatus: string;
    isFreeDelivery: boolean;
    subtotal: unknown;
    discount: unknown;
    deliveryFee: unknown;
    total: unknown;
    note: string | null;
    items: Array<{
        id: string;
        productNameSnapshot: string;
        skuSnapshot: string;
        colorSnapshot: string;
        sizeSnapshot: string;
        qty: number;
        salePriceSnapshot: unknown;
        lineTotal: unknown;
    }>;
};

function num(value: unknown): number {
    if (value === null || value === undefined) return 0;
    return Number(value);
}

function getAddress(shippingAddress: unknown): string {
    if (shippingAddress && typeof shippingAddress === "object" && "detailedAddress" in shippingAddress) {
        const a = (shippingAddress as { detailedAddress?: string }).detailedAddress;
        return a || "—";
    }
    return "—";
}

function formatHeaderDate(date: Date | string): string {
    return formatCambodiaDate(date, "dd MMM yyyy · HH:mm").toUpperCase();
}

export default function ReceiptLabel({
    order,
    shop,
}: {
    order: ReceiptOrder;
    shop: ShopInfo;
}) {
    const address = getAddress(order.shippingAddress);
    const deliveryServiceKm = order.deliveryService
        ? DELIVERY_SERVICE_KM[order.deliveryService] || order.deliveryService
        : "—";
    const zoneKm = DELIVERY_ZONE_KM[order.deliveryZone] || order.deliveryZone;
    const paymentMethod = PAYMENT_METHOD_LABEL[order.paymentMethod] || order.paymentMethod;
    const paymentStatusKm = PAYMENT_STATUS_KM[order.paymentStatus] || order.paymentStatus;
    const discount = num(order.discount);
    const totalQty = order.items.reduce((sum, it) => sum + it.qty, 0);

    return (
        <div className="receipt-label">
            {/* ── Header: logo + order code / date ───────────── */}
            <div className="rl-header">
                <div className="rl-brand">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={shop.logoPath} alt="" className="rl-logo" />
                </div>
                <div className="rl-brand-meta">
                    <div className="rl-order-code">#{order.orderCode}</div>
                    <div className="rl-order-date">{formatHeaderDate(order.createdAt)}</div>
                </div>
            </div>

            {/* ── FROM / TO ──────────────────────────────────── */}
            <div className="rl-parties">
                <div className="rl-party">
                    <div className="rl-party-label">
                        <span className="rl-diamond">◆</span> អ្នកផ្ញើ <span className="rl-sep">·</span> FROM
                    </div>
                    <div className="rl-party-name">{shop.nameEn}</div>
                    <div className="rl-party-line">{shop.phone}</div>
                    <div className="rl-party-line">{shop.address}</div>
                </div>
                <div className="rl-party rl-party--to">
                    <div className="rl-party-label">
                        <span className="rl-diamond">◆</span> អ្នកទទួល <span className="rl-sep">·</span> TO
                    </div>
                    <div className="rl-party-name">{order.customer.fullName}</div>
                    <div className="rl-party-line">{order.customer.phone}</div>
                    <div className="rl-party-line rl-party-address">{address}</div>
                </div>
            </div>

            {/* ── Courier / Route / Payment ──────────────────── */}
            <div className="rl-meta3">
                <div className="rl-meta3-cell">
                    <div className="rl-meta3-label">COURIER</div>
                    <div className="rl-meta3-value">{deliveryServiceKm}</div>
                </div>
                <div className="rl-meta3-cell">
                    <div className="rl-meta3-label">ROUTE</div>
                    <div className="rl-meta3-value">{zoneKm}</div>
                </div>
                <div className="rl-meta3-cell">
                    <div className="rl-meta3-label">PAYMENT</div>
                    <div className="rl-meta3-value">
                        <span className="rl-pill">{paymentMethod}</span>
                        <span className="rl-pill-after">{paymentStatusKm}</span>
                    </div>
                </div>
            </div>

            {/* ── Items table header ─────────────────────────── */}
            <div className="rl-items-head">
                <div className="rl-items-head-title">បញ្ជីទំនិញ <span className="rl-sep">·</span> ITEMS</div>
                <div className="rl-items-head-qty">QTY</div>
                <div className="rl-items-head-amt">AMOUNT</div>
            </div>

            {/* ── Items list ─────────────────────────────────── */}
            <div className="rl-items">
                {order.items.map((item) => {
                    const details = [item.sizeSnapshot && `Size ${item.sizeSnapshot}`, item.colorSnapshot]
                        .filter(Boolean)
                        .join(" · ");
                    return (
                        <div key={item.id} className="rl-item">
                            <div className="rl-item-info">
                                <div className="rl-item-name">{item.productNameSnapshot}</div>
                                {details && <div className="rl-item-details">{details}</div>}
                            </div>
                            <div className="rl-item-qty">×{item.qty}</div>
                            <div className="rl-item-amt">${num(item.lineTotal).toFixed(2)}</div>
                        </div>
                    );
                })}
            </div>

            {/* ── Note + item count ──────────────────────────── */}
            <div className="rl-note-row">
                <div className="rl-note-text">
                    {order.note
                        ? <><span className="rl-note-icon">✦</span> កំណត់សម្គាល់៖ {order.note}</>
                        : <><span className="rl-note-icon">✦</span> កំណត់សម្គាល់៖ ផាក់វេចខ្ចប់ក្នុងសម្ភារ៉ៃទន់</>}
                </div>
                <div className="rl-note-count">{totalQty} items total</div>
            </div>

            {/* ── Subtotal / Delivery ────────────────────────── */}
            <div className="rl-totals">
                <div className="rl-total-row">
                    <span className="rl-total-label">សរុបរង <span className="rl-sep">·</span> Subtotal</span>
                    <span className="rl-total-value">${num(order.subtotal).toFixed(2)}</span>
                </div>
                {discount > 0 && (
                    <div className="rl-total-row">
                        <span className="rl-total-label">បញ្ចុះតម្លៃ <span className="rl-sep">·</span> Discount</span>
                        <span className="rl-total-value">-${discount.toFixed(2)}</span>
                    </div>
                )}
                <div className="rl-total-row">
                    <span className="rl-total-label">ដឹកជញ្ជូន <span className="rl-sep">·</span> Delivery</span>
                    <span className="rl-total-value">
                        {order.isFreeDelivery ? "ឥតគិតថ្លៃ" : `$${num(order.deliveryFee).toFixed(2)}`}
                    </span>
                </div>
            </div>

            {/* ── Grand total bar ────────────────────────────── */}
            <div className="rl-grand">
                <span className="rl-grand-label">សរុប</span>
                <span className="rl-grand-value">${num(order.total).toFixed(2)}</span>
            </div>

            {/* ── Footer ─────────────────────────────────────── */}
            <div className="rl-footer">
                <span>សូមអរគុណ 🙏</span>
                <span>NEARY.CO · @NEARYCOLLECTION</span>
            </div>
        </div>
    );
}
