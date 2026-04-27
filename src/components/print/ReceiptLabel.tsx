import React from "react";
import { formatCambodiaDate } from "@/lib/utils/timezone";
import type { ShopInfo } from "@/lib/constants/shop";

const DELIVERY_SERVICE_KM: Record<string, string> = {
    JALAT: "ចល័ត",
    VET: "វិរៈប៊ុនថាំ",
    JT: "J&T Express",
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
    UNPAID: "មិនទាន់ទូទាត់",
    PENDING_VERIFICATION: "កំពុងផ្ទៀង",
    PAID: "បានទូទាត់រួច)",
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
        parentItemId?: string | null;
        isBundleParent?: boolean;
        bundleProductId?: string | null;
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
    const topLevelItems = order.items.filter((it) => !it.parentItemId);
    const childrenByParent = order.items.reduce<Record<string, typeof order.items>>((acc, it) => {
        if (it.parentItemId) {
            (acc[it.parentItemId] ||= []).push(it);
        }
        return acc;
    }, {});
    // Count physical pieces — each child carries its own qty already (bundleQty × componentQty),
    // so children alone represent the items inside a bundle. Sum children + standalone product rows.
    const totalQty = order.items.reduce(
        (sum, it) => sum + (it.isBundleParent ? 0 : it.qty),
        0,
    );
    const paidStatusKm = order.paymentStatus === "PAID" ? "បានទូទាត់រួច" : "មិនទាន់ទូទាត់";

    const isPP = order.deliveryZone === "PP";
    const termsTitle = isPP
        ? "លក្ខខណ្ឌប្តូរទំនិញ (ភ្នំពេញ)"
        : "លក្ខខណ្ឌប្តូរទំនិញ (តាមខេត្ត)";
    const termsItems = isPP
        ? [
              "អតិថិជនអាចហែកមើលអីវ៉ាន់ ភ្លាមៗបានពេលកំពុងដឹកជញ្ជូន។",
              "អតិថិជនអាចប្តូរម៉ូត និងទំហំបាន ក្នុងរយៈពេល ២ថ្ងៃ គិតពីថ្ងៃទទួលទំនិញ។",
              "អីវ៉ាន់ប្តូរត្រូវមិនទាន់ពាក់ មិនទាន់បោក មិនមានក្លិន និងហាមផ្តាច់ស្លាក ពួកយើងនឹងមិនប្តូរជូនវិញនោះទេ។",

          ]
        : [
              "អតិថិជនអាចថតវីដេអូពេលបើកកញ្ចប់ ដើម្បីជាភស្តុតាង ក្នុងករណីទំនិញខុសម៉ូតឬមានបញ្ហាពីខាងហាង។",
              "អតិថិជនអាចប្តូរម៉ូត និងទំហំបាន ក្នុងរយៈពេល ២ថ្ងៃ គិតពីថ្ងៃទទួលទំនិញ។",
              "អីវ៉ាន់ប្តូរត្រូវមិនទាន់ពាក់ មិនទាន់បោក មិនមានក្លិន និងហាមផ្តាច់ស្លាក ពួកយើងនឹងមិនប្តូរជូនវិញនោះទេ។",
          ];

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

            {/* ── Unified shipping card (FROM / TO / SHIP TO) ─ */}
            <div className="rl-ship-card">
                <div className="rl-ship-card-top">
                    <div className="rl-ship-col">
                        <div className="rl-ship-label">អ្នកផ្ញើ <span className="rl-sep">·</span> From</div>
                        <div className="rl-ship-name">{shop.nameEn}</div>
                        <div className="rl-ship-phone">{shop.phone}</div>
                    </div>
                    <div className="rl-ship-arrow" aria-hidden="true">→</div>
                    <div className="rl-ship-col rl-ship-col--right">
                        <div className="rl-ship-label">អ្នកទទួល <span className="rl-sep">·</span> To</div>
                        <div className="rl-ship-name">{order.customer.fullName}</div>
                        <div className="rl-ship-phone">{order.customer.phone}</div>
                    </div>
                </div>
                <div className="rl-ship-card-bottom">
                    <div className="rl-ship-address">ទីតាំង : {address}</div>
                </div>
            </div>

            {/* ── Courier / Route / Payment ──────────────────── */}
            <div className="rl-meta3">
                <div className="rl-meta3-cell">
                    <div className="rl-meta3-value">{deliveryServiceKm}</div>
                </div>
                <div className="rl-meta3-cell">
                    <div className="rl-meta3-value">{zoneKm}</div>
                </div>
                <div className="rl-meta3-cell">
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
                {topLevelItems.map((item) => {
                    const details = [item.sizeSnapshot && `Size ${item.sizeSnapshot}`, item.colorSnapshot]
                        .filter(Boolean)
                        .join(" · ");
                    const children = item.isBundleParent ? childrenByParent[item.id] || [] : [];
                    return (
                        <React.Fragment key={item.id}>
                            <div className="rl-item">
                                <div className="rl-item-info">
                                    <div className="rl-item-name">
                                        {item.isBundleParent && <span className="rl-bundle-tag">SET · ឈុត </span>}
                                        {item.productNameSnapshot}
                                    </div>
                                    {details && <div className="rl-item-details">{details}</div>}
                                </div>
                                <div className="rl-item-qty">×{item.qty}</div>
                                <div className="rl-item-amt">${num(item.lineTotal).toFixed(2)}</div>
                            </div>
                            {children.map((child) => {
                                const childDetails = [child.sizeSnapshot && `Size ${child.sizeSnapshot}`, child.colorSnapshot]
                                    .filter(Boolean)
                                    .join(" · ");
                                return (
                                    <div key={child.id} className="rl-item rl-bundle-child">
                                        <div className="rl-item-info">
                                            <div className="rl-item-name">↳ {child.productNameSnapshot}</div>
                                            {childDetails && <div className="rl-item-details">{childDetails}</div>}
                                        </div>
                                        <div className="rl-item-qty">×{child.qty}</div>
                                        <div className="rl-item-amt"></div>
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* ── Note + item count ──────────────────────────── */}
            <div className="rl-note-row">
                <div className="rl-note-text">
                    {order.note
                        ? <><span className="rl-note-icon">✦</span> កំណត់សម្គាល់៖ {order.note}</>
                        : <><span className="rl-note-icon">✦</span> កំណត់សម្គាល់៖ </>}
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
                <span className="rl-grand-value">
                    ${num(order.total).toFixed(2)}
                    <span className="rl-grand-status">({paidStatusKm})</span>
                </span>
            </div>

            {/* ── Terms & conditions (footer) ────────────────── */}
            <div className="rl-terms">
                <div className="rl-terms-title">{termsTitle}</div>
                <ul className="rl-terms-list">
                    {termsItems.map((t, i) => (
                        <li key={i} className="rl-terms-item">· {t}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
