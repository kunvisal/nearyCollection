"use client";

import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Loader2, Search, Package } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import BundleComponentPicker, { type ComponentRow } from "@/components/admin/bundles/BundleComponentPicker";

type Category = { id: number; nameKm: string; nameEn: string | null };

type BundleListItem = {
    id: string;
    nameKm: string;
    nameEn: string | null;
    descriptionKm: string | null;
    descriptionEn: string | null;
    categoryId: number;
    isActive: boolean;
    bundleDiscount: number | string | null;
    category: Category;
    images: { url: string }[];
    bundleComponents: Array<{
        id: string;
        variantId: string;
        qty: number;
        variant: {
            id: string;
            sku: string;
            size: string | null;
            color: string | null;
            salePrice: number | string;
            stockOnHand: number;
            isActive: boolean;
            product: {
                id: string;
                nameKm: string;
                images: { url: string }[];
            };
        };
    }>;
    availableQty: number;
    suggestedUnitPrice: number;
};

type FormState = {
    nameKm: string;
    nameEn: string;
    descriptionKm: string;
    descriptionEn: string;
    categoryId: number;
    isActive: boolean;
    bundleDiscount: string; // text input → number on save
    components: ComponentRow[];
};

const emptyForm = (categoryId: number): FormState => ({
    nameKm: "",
    nameEn: "",
    descriptionKm: "",
    descriptionEn: "",
    categoryId,
    isActive: true,
    bundleDiscount: "",
    components: [],
});

export default function AdminBundlesPage() {
    const { addToast } = useToast();
    const [bundles, setBundles] = useState<BundleListItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<BundleListItem | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm(0));
    const [search, setSearch] = useState("");

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [bRes, cRes] = await Promise.all([
                fetch("/api/admin/bundles"),
                fetch("/api/admin/categories"),
            ]);
            const bJson = await bRes.json();
            const cJson = await cRes.json();
            if (bJson.success) setBundles(bJson.data);
            if (cJson.success) setCategories(cJson.data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const componentsSum = form.components.reduce((acc, c) => {
        const s = c.snapshot?.salePrice ?? 0;
        return acc + s * c.qty;
    }, 0);
    const discount = parseFloat(form.bundleDiscount || "0") || 0;
    const suggestedPrice = Math.max(0, componentsSum - discount);

    const filtered = bundles.filter((b) =>
        !search ||
        b.nameKm.toLowerCase().includes(search.toLowerCase()) ||
        (b.nameEn ?? "").toLowerCase().includes(search.toLowerCase()),
    );

    const openAdd = () => {
        if (categories.length === 0) {
            addToast("error", "No categories", "Please create at least one category first.");
            return;
        }
        setEditing(null);
        setForm(emptyForm(categories[0].id));
        setIsModalOpen(true);
    };

    const openEdit = (b: BundleListItem) => {
        setEditing(b);
        setForm({
            nameKm: b.nameKm,
            nameEn: b.nameEn ?? "",
            descriptionKm: b.descriptionKm ?? "",
            descriptionEn: b.descriptionEn ?? "",
            categoryId: b.categoryId,
            isActive: b.isActive,
            bundleDiscount: b.bundleDiscount != null ? String(b.bundleDiscount) : "",
            components: b.bundleComponents.map((c) => ({
                variantId: c.variantId,
                qty: c.qty,
                snapshot: {
                    productNameKm: c.variant.product.nameKm,
                    size: c.variant.size ?? "",
                    color: c.variant.color ?? "",
                    salePrice: Number(c.variant.salePrice),
                    stockOnHand: c.variant.stockOnHand,
                    imageUrl: c.variant.product.images[0]?.url,
                },
            })),
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditing(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.components.length === 0) {
            addToast("error", "Missing components", "A bundle must contain at least 1 component.");
            return;
        }
        try {
            setIsSubmitting(true);
            const url = editing ? `/api/admin/bundles/${editing.id}` : "/api/admin/bundles";
            const method = editing ? "PUT" : "POST";
            const body = {
                nameKm: form.nameKm,
                nameEn: form.nameEn || null,
                descriptionKm: form.descriptionKm || null,
                descriptionEn: form.descriptionEn || null,
                categoryId: form.categoryId,
                isActive: form.isActive,
                bundleDiscount: form.bundleDiscount.trim() === "" ? null : Number(form.bundleDiscount),
                components: form.components.map((c) => ({ variantId: c.variantId, qty: c.qty })),
            };
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const json = await res.json();
            if (res.ok && json.success) {
                addToast("success", "Saved", `Bundle ${editing ? "updated" : "created"}.`);
                closeModal();
                fetchData();
            } else {
                addToast("error", "Failed", json.error || "Could not save the bundle.");
            }
        } catch (e) {
            console.error(e);
            addToast("error", "Error", "Unexpected error saving the bundle.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this bundle? Past orders that contain it will keep their snapshots — only the bundle definition is removed.")) return;
        try {
            const res = await fetch(`/api/admin/bundles/${id}`, { method: "DELETE" });
            const json = await res.json();
            if (res.ok && json.success) {
                addToast("success", "Deleted", "Bundle removed.");
                fetchData();
            } else {
                addToast("error", "Failed", json.error || "Could not delete.");
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Bundles / Sets</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Sell multiple products together as one set. Stock is automatically deducted from each component.
                    </p>
                </div>
                <button
                    onClick={openAdd}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Add Bundle
                </button>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search bundle..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm dark:text-white"
                />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Bundle</th>
                                <th className="px-6 py-4 font-semibold">Category</th>
                                <th className="px-6 py-4 font-semibold text-center">Components</th>
                                <th className="px-6 py-4 font-semibold text-right">Suggested Price</th>
                                <th className="px-6 py-4 font-semibold text-center">Available</th>
                                <th className="px-6 py-4 font-semibold text-center">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={7} className="px-6 py-8 text-center">Loading…</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                    {bundles.length === 0 ? "No bundles yet. Click \"Add Bundle\"." : "No bundles match your search."}
                                </td></tr>
                            ) : (
                                filtered.map((b) => (
                                    <tr key={b.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                                    <Package className="w-3 h-3" /> SET
                                                </span>
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white">{b.nameKm}</div>
                                                    {b.nameEn && <div className="text-xs text-gray-500">{b.nameEn}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{b.category?.nameKm || "-"}</td>
                                        <td className="px-6 py-4 text-center">{b.bundleComponents.length}</td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                                            ${Number(b.suggestedUnitPrice).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${b.availableQty > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                                {b.availableQty}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${b.isActive ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"}`}>
                                                {b.isActive ? "Active" : "Hidden"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button onClick={() => openEdit(b)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Edit">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(b.id)} className="text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-3xl overflow-y-auto max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editing ? "Edit Bundle" : "Add Bundle"}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name (Khmer) *</label>
                                    <input
                                        required
                                        type="text"
                                        value={form.nameKm}
                                        onChange={(e) => setForm({ ...form, nameKm: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name (English)</label>
                                    <input
                                        type="text"
                                        value={form.nameEn}
                                        onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
                                    <select
                                        value={form.categoryId}
                                        onChange={(e) => setForm({ ...form, categoryId: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>{c.nameKm}{c.nameEn ? ` (${c.nameEn})` : ""}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bundle discount ($, optional)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={form.bundleDiscount}
                                        onChange={(e) => setForm({ ...form, bundleDiscount: e.target.value })}
                                        placeholder="0.00"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Subtracted from the sum of component prices. Sale price never goes below $0.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <BundleComponentPicker
                                    value={form.components}
                                    onChange={(next) => setForm({ ...form, components: next })}
                                    excludeBundleId={editing?.id}
                                />
                            </div>

                            {/* Live price preview */}
                            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 text-sm text-blue-900 dark:text-blue-200 grid grid-cols-3 gap-3">
                                <div>
                                    <div className="text-xs uppercase opacity-70">Components total</div>
                                    <div className="font-semibold">${componentsSum.toFixed(2)}</div>
                                </div>
                                <div>
                                    <div className="text-xs uppercase opacity-70">Discount</div>
                                    <div className="font-semibold">-${discount.toFixed(2)}</div>
                                </div>
                                <div>
                                    <div className="text-xs uppercase opacity-70">Suggested unit price</div>
                                    <div className="font-bold text-base">${suggestedPrice.toFixed(2)}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Khmer)</label>
                                    <textarea
                                        rows={2}
                                        value={form.descriptionKm}
                                        onChange={(e) => setForm({ ...form, descriptionKm: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (English)</label>
                                    <textarea
                                        rows={2}
                                        value={form.descriptionEn}
                                        onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.isActive}
                                        onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 relative" />
                                    <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300 select-none">
                                        {form.isActive ? "Active" : "Hidden"}
                                    </span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-75 disabled:cursor-not-allowed flex items-center gap-2 min-w-[120px] justify-center"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                                        </>
                                    ) : (
                                        "Save Bundle"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
