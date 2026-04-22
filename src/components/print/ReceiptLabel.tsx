import React from "react";
import { formatCambodiaDate } from "@/lib/utils/timezone";
import type { ShopInfo } from "@/lib/constants/shop";

const KHMER_MONTHS = [
    "មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា",
    "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ",
];

const DELIVERY_SERVICE_KM: Record<string, string> = {
    JALAT: "ចល័ត",
    VET: "វីរប៊ុនថាំ",
    JT: "J&T",
};

const DELIVERY_ZONE_KM: Record<string, string> = {
    PP: "ភ្នំពេញ",
    PROVINCE: "ខេត្ត",
};

const PAYMENT_METHOD_KM: Record<string, string> = {
    COD: "COD",
    ABA: "ABA",
    WING: "Wing",
};

const PAYMENT_STATUS_KM: Record<string, string> = {
    UNPAID: "មិនទាន់បង់",
    PENDING_VERIFICATION: "កំពុងផ្ទៀង",
    PAID: "បានបង់",
    REJECTED: "បដិសេធ",
};

function formatKhmerDate(date: Date | string): string {
    const day = formatCambodiaDate(date, "d");
    const monthIdx = Number(formatCambodiaDate(date, "M")) - 1;
    const time = formatCambodiaDate(date, "HH:mm");
    return `${day} ${KHMER_MONTHS[monthIdx]} · ${time}`;
}

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
    const paymentMethodKm = PAYMENT_METHOD_KM[order.paymentMethod] || order.paymentMethod;
    const paymentStatusKm = PAYMENT_STATUS_KM[order.paymentStatus] || order.paymentStatus;
    const discount = num(order.discount);

    return (
        <div className="receipt-label">
            {/* Header: logo · order code · date */}
            <div className="rl-row">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={shop.logoPath} alt="" className="rl-logo" />
                <div style={{ textAlign: "right" }}>
                    <div className="rl-order-code">#{order.orderCode}</div>
                    <div className="rl-date">{formatKhmerDate(order.createdAt)}</div>
                </div>
            </div>

            <div className="rl-divider" />

            {/* FROM | TO  — two columns side by side */}
            <div className="rl-col-2">
                <div className="rl-from">
                    <div className="rl-section-label">អ្នកផ្ញើ</div>
                    <div style={{ fontWeight: 700 }}>{shop.nameKm}</div>
                    <div>☎ {shop.phone}</div>
                    <div>{shop.address}</div>
                </div>
                <div>
                    <div className="rl-section-label">អ្នកទទួល</div>
                    <div className="rl-to-name">{order.customer.fullName}</div>
                    <div className="rl-to-phone">☎ {order.customer.phone}</div>
                </div>
            </div>

            {/* Address full-width under receiver (stays readable) */}
            <div className="rl-to-address" style={{ marginTop: "0.8mm" }}>
                📍 {address}
            </div>

            <div className="rl-divider-double" />

            {/* Delivery | Payment — two columns */}
            <div className="rl-col-2 rl-meta">
                <div>
                    <span className="rl-section-label">ដឹកជញ្ជូន៖ </span>
                    {deliveryServiceKm} · {zoneKm}
                </div>
                <div>
                    <span className="rl-section-label">ទូទាត់៖ </span>
                    {paymentMethodKm} · {paymentStatusKm}
                </div>
            </div>

            <div className="rl-divider" />

            {/* Items */}
            <div>
                <div className="rl-section-label" style={{ marginBottom: "0.5mm" }}>បញ្ជីទំនិញ</div>
                {order.items.map((item) => {
                    const variantParts = [item.colorSnapshot, item.sizeSnapshot].filter(Boolean).join(" / ");
                    return (
                        <div key={item.id} className="rl-item rl-row" style={{ alignItems: "flex-start" }}>
                            <span className="rl-checkbox" />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="rl-item-name">{item.productNameSnapshot}</div>
                                <div className="rl-item-meta">
                                    {variantParts || "—"}  ·  × {item.qty}
                                </div>
                            </div>
                            <div className="rl-item-meta" style={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                                ${num(item.lineTotal).toFixed(2)}
                            </div>
                        </div>
                    );
                })}
            </div>

            {order.note && (
                <div className="rl-note">
                    <strong>កំណត់សម្គាល់៖ </strong>{order.note}
                </div>
            )}

            <div className="rl-divider" />

            {/* Totals — subtotal/discount/delivery in a compact 2-col grid, grand total on its own row */}
            <div className="rl-totals">
                <div className="rl-col-2">
                    <div className="rl-row">
                        <span>សរុបរង</span>
                        <span>${num(order.subtotal).toFixed(2)}</span>
                    </div>
                    <div className="rl-row">
                        <span>ដឹកជញ្ជូន</span>
                        <span>
                            {order.isFreeDelivery
                                ? <span style={{ fontWeight: 700 }}>ឥតគិតថ្លៃ</span>
                                : `$${num(order.deliveryFee).toFixed(2)}`}
                        </span>
                    </div>
                </div>
                {discount > 0 && (
                    <div className="rl-row">
                        <span>បញ្ចុះតម្លៃ</span>
                        <span>-${discount.toFixed(2)}</span>
                    </div>
                )}
                <div className="rl-row rl-grand-total" style={{ marginTop: "0.8mm", borderTop: "0.35mm solid #000", paddingTop: "0.8mm" }}>
                    <span>សរុប</span>
                    <span>${num(order.total).toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
}
