"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Package, Send, MessageCircle } from "lucide-react";
import { useCartStore } from "@/lib/store/cartStore";

type SerializedBundle = {
    id: string;
    nameKm: string;
    nameEn: string | null;
    descriptionKm: string | null;
    descriptionEn: string | null;
    images: { url: string }[];
    bundleComponents: Array<{
        variantId: string;
        qty: number;
        variant: {
            id: string;
            size: string | null;
            color: string | null;
            salePrice: number;
            stockOnHand: number;
            product: {
                nameKm: string;
                images: { url: string }[];
            };
        };
    }>;
    availableQty: number;
    suggestedUnitPrice: number;
};

export default function BundleDetail({
    bundle,
    settings,
}: {
    bundle: SerializedBundle;
    settings?: { contactTelegram?: string; contactMessenger?: string; contactFacebook?: string };
}) {
    const { addItem } = useCartStore();
    const isOutOfStock = bundle.availableQty <= 0;
    const heroImage = bundle.images[0]?.url || bundle.bundleComponents[0]?.variant.product.images[0]?.url || "/images/placeholder-product.svg";

    const handleAddToCart = () => {
        if (isOutOfStock) return;
        addItem({
            kind: "bundle",
            bundleProductId: bundle.id,
            nameKm: bundle.nameKm,
            nameEn: bundle.nameEn,
            salePrice: bundle.suggestedUnitPrice,
            imageUrl: heroImage,
            availableQty: bundle.availableQty,
            components: bundle.bundleComponents.map((c) => ({
                variantId: c.variantId,
                nameKm: c.variant.product.nameKm,
                size: c.variant.size ?? "",
                color: c.variant.color ?? "",
                qty: c.qty,
            })),
        });
    };

    return (
        <div className="pb-32">
            <div className="relative w-full aspect-[3/4] bg-gray-100">
                <Image src={heroImage} alt={bundle.nameKm} fill className="object-cover" unoptimized />
                <Link href="/" className="absolute top-4 left-4 z-20 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-sm text-gray-900 border border-gray-200">←</Link>
                <span className="absolute top-4 right-4 z-20 inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-md bg-amber-100 text-amber-700 shadow">
                    <Package className="w-3.5 h-3.5" /> SET / ឈុត
                </span>
            </div>

            <div className="px-4 pt-4 max-w-xl mx-auto">
                <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">${bundle.suggestedUnitPrice.toFixed(2)}</span>
                </div>
                <h1 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">{bundle.nameKm} {bundle.nameEn ? `| ${bundle.nameEn}` : ""}</h1>

                <div className="mt-2">
                    {isOutOfStock ? (
                        <span className="text-red-500 font-medium text-sm">Out of Stock</span>
                    ) : (
                        <span className="text-green-600 font-medium text-sm">In Stock — {bundle.availableQty} sets available</span>
                    )}
                </div>

                {(bundle.descriptionKm || bundle.descriptionEn) && (
                    <div className="mt-6">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
                            {bundle.descriptionKm || bundle.descriptionEn}
                        </p>
                    </div>
                )}

                <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">What&apos;s inside ({bundle.bundleComponents.length})</h3>
                    <div className="space-y-2">
                        {bundle.bundleComponents.map((c) => (
                            <div key={c.variantId} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                <div className="w-12 h-12 rounded bg-gray-100 dark:bg-gray-700 overflow-hidden shrink-0">
                                    {c.variant.product.images[0]?.url && (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img src={c.variant.product.images[0].url} alt="" className="w-full h-full object-cover" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.variant.product.nameKm}</div>
                                    <div className="text-xs text-gray-500">
                                        {[c.variant.size, c.variant.color].filter(Boolean).join(" · ")}
                                    </div>
                                </div>
                                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">× {c.qty}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-8 space-y-3">
                    <button
                        className={`w-full py-3 px-6 rounded-lg font-medium text-lg flex items-center justify-center gap-2 transition-all ${isOutOfStock ? "opacity-50 cursor-not-allowed bg-gray-400 text-white" : "bg-[#0088cc] hover:bg-[#0077b5] text-white shadow-md"}`}
                        onClick={() => {
                            if (!isOutOfStock && settings?.contactTelegram) {
                                const t = settings.contactTelegram;
                                const link = t.includes("t.me") || t.includes("http") ? t : `https://t.me/${t.replace("@", "")}`;
                                window.open(link, "_blank");
                            }
                        }}
                        disabled={isOutOfStock}
                    >
                        <Send className="w-5 h-5" />
                        Order via Telegram
                    </button>

                    <div className="flex gap-3">
                        <button
                            className={`flex-[2] py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all border-2 ${isOutOfStock ? "opacity-50 cursor-not-allowed border-gray-300 text-gray-400" : "border-black text-black hover:bg-black hover:text-white"}`}
                            onClick={handleAddToCart}
                            disabled={isOutOfStock}
                        >
                            <ShoppingBag className="w-5 h-5" />
                            <span>Add to Bag</span>
                        </button>

                        <div className="flex gap-2 flex-1 items-center justify-end">
                            {settings?.contactMessenger && (
                                <button
                                    onClick={() => window.open(settings.contactMessenger!.includes("http") ? settings.contactMessenger! : `https://${settings.contactMessenger}`, "_blank")}
                                    className="w-12 h-12 rounded-full bg-[#00B2FF] hover:bg-[#0099e5] text-white flex items-center justify-center shadow-sm"
                                    title="Contact via Messenger"
                                >
                                    <MessageCircle className="w-6 h-6" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
