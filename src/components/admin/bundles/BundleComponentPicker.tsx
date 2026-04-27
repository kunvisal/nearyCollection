"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search, Trash2, Plus } from "lucide-react";

type Variant = {
    id: string;
    sku: string;
    size: string | null;
    color: string | null;
    salePrice: number | string;
    costPrice: number | string;
    stockOnHand: number;
    isActive: boolean;
};
type ProductWithVariants = {
    id: string;
    nameKm: string;
    nameEn: string | null;
    isBundle?: boolean;
    images: { url: string }[];
    variants: Variant[];
};

export type ComponentRow = {
    variantId: string;
    qty: number;
    /** UI-only snapshot for display; not sent to the API */
    snapshot?: {
        productNameKm: string;
        size: string;
        color: string;
        salePrice: number;
        stockOnHand: number;
        imageUrl?: string;
    };
};

type Props = {
    value: ComponentRow[];
    onChange: (next: ComponentRow[]) => void;
    /** Disable adding a row pointing to one of these bundle product ids (bundles can't contain other bundles) */
    excludeBundleId?: string;
};

export default function BundleComponentPicker({ value, onChange, excludeBundleId }: Props) {
    const [products, setProducts] = useState<ProductWithVariants[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [pickerOpen, setPickerOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;
        fetch("/api/admin/products")
            .then((r) => r.json())
            .then((j) => {
                if (cancelled) return;
                if (j.success) setProducts(j.data);
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    const candidateRows = useMemo(() => {
        const rows: Array<{ product: ProductWithVariants; variant: Variant }> = [];
        for (const p of products) {
            if (p.isBundle) continue;
            if (excludeBundleId && p.id === excludeBundleId) continue;
            for (const v of p.variants) {
                if (!v.isActive) continue;
                rows.push({ product: p, variant: v });
            }
        }
        if (!search) return rows;
        const q = search.toLowerCase();
        return rows.filter((r) =>
            r.product.nameKm.toLowerCase().includes(q) ||
            (r.product.nameEn?.toLowerCase() ?? "").includes(q) ||
            (r.variant.sku?.toLowerCase() ?? "").includes(q),
        );
    }, [products, search, excludeBundleId]);

    const addRow = (product: ProductWithVariants, variant: Variant) => {
        if (value.some((r) => r.variantId === variant.id)) return;
        const next: ComponentRow = {
            variantId: variant.id,
            qty: 1,
            snapshot: {
                productNameKm: product.nameKm,
                size: variant.size ?? "",
                color: variant.color ?? "",
                salePrice: Number(variant.salePrice),
                stockOnHand: variant.stockOnHand,
                imageUrl: product.images[0]?.url,
            },
        };
        onChange([...value, next]);
        setPickerOpen(false);
        setSearch("");
    };

    const setQty = (variantId: string, qty: number) => {
        onChange(
            value.map((r) =>
                r.variantId === variantId ? { ...r, qty: Math.max(1, qty) } : r,
            ),
        );
    };

    const removeRow = (variantId: string) => {
        onChange(value.filter((r) => r.variantId !== variantId));
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Components ({value.length})
                </span>
                <button
                    type="button"
                    onClick={() => setPickerOpen((o) => !o)}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center gap-1"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Add component
                </button>
            </div>

            {/* Selected rows */}
            <div className="space-y-2">
                {value.length === 0 && (
                    <p className="text-sm text-gray-500 italic">
                        No components yet. Click &quot;Add component&quot; to pick the variants that make up this set.
                    </p>
                )}
                {value.map((row) => {
                    const s = row.snapshot;
                    return (
                        <div
                            key={row.variantId}
                            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                        >
                            <div className="w-10 h-10 rounded bg-gray-100 dark:bg-gray-700 overflow-hidden shrink-0">
                                {s?.imageUrl && (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src={s.imageUrl} alt="" className="w-full h-full object-cover" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {s?.productNameKm ?? row.variantId}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                    {[s?.size, s?.color].filter(Boolean).join(" · ")}
                                    {s != null && (
                                        <>  ·  ${s.salePrice.toFixed(2)}  ·  stock {s.stockOnHand}</>
                                    )}
                                </div>
                            </div>
                            <input
                                type="number"
                                min={1}
                                value={row.qty}
                                onChange={(e) => setQty(row.variantId, parseInt(e.target.value) || 1)}
                                className="w-16 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white"
                                aria-label="Quantity per bundle"
                            />
                            <button
                                type="button"
                                onClick={() => removeRow(row.variantId)}
                                className="p-1 text-gray-400 hover:text-red-600"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Picker */}
            {pickerOpen && (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3 space-y-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by product name or SKU..."
                            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white"
                            autoFocus
                        />
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        {isLoading ? (
                            <div className="p-4 text-sm text-gray-500">Loading…</div>
                        ) : candidateRows.length === 0 ? (
                            <div className="p-4 text-sm text-gray-500">No matching variants.</div>
                        ) : (
                            candidateRows.slice(0, 50).map((r) => {
                                const already = value.some((row) => row.variantId === r.variant.id);
                                return (
                                    <button
                                        key={r.variant.id}
                                        type="button"
                                        disabled={already}
                                        onClick={() => addRow(r.product, r.variant)}
                                        className={`w-full text-left p-2 flex items-center gap-3 transition-colors ${already ? "opacity-40 cursor-not-allowed" : "hover:bg-blue-50 dark:hover:bg-gray-700"}`}
                                    >
                                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden shrink-0">
                                            {r.product.images[0]?.url && (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img src={r.product.images[0].url} alt="" className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {r.product.nameKm}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate">
                                                {[r.variant.size, r.variant.color, r.variant.sku].filter(Boolean).join(" · ")}  ·  ${Number(r.variant.salePrice).toFixed(2)}  ·  stock {r.variant.stockOnHand}
                                            </div>
                                        </div>
                                        {already && <span className="text-xs text-gray-500">added</span>}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
