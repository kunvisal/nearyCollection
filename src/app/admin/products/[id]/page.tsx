"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, ArrowLeft, Upload, Image as ImageIcon, History, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/context/ToastContext";
import imageCompression from 'browser-image-compression';

type Variant = {
    id: string;
    sku: string;
    color: string | null;
    size: string | null;
    costPrice: number | null;
    salePrice: number;
    stockOnHand: number;
    isActive: boolean;
};

type ProductImage = {
    id: string;
    url: string;
    sortOrder: number;
    isPrimary: boolean;
};

export default function ManageProductPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params.id as string;

    const [product, setProduct] = useState<any>(null);
    const [variants, setVariants] = useState<Variant[]>([]);
    const [images, setImages] = useState<ProductImage[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Variant Modal
    const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
    const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
    const [variantForm, setVariantForm] = useState({
        sku: "", color: "", size: "", costPrice: 0, salePrice: 0, stockOnHand: 0, isActive: true
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addToast } = useToast();

    // Inventory Modal
    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
    const [selectedVariantForInventory, setSelectedVariantForInventory] = useState<Variant | null>(null);
    const [inventoryLogs, setInventoryLogs] = useState<any[]>([]);
    const [isLoadingInventory, setIsLoadingInventory] = useState(false);

    // Image Upload
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        fetchProduct();
    }, [productId]);

    const fetchProduct = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/admin/products/${productId}`);
            const json = await res.json();
            if (json.success) {
                setProduct(json.data);
                setVariants(json.data.variants || []);
                setImages(json.data.images || []);
            } else {
                alert(json.error || "Failed to load product");
                router.push("/admin/products");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Image Handling ---
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        setIsUploading(true);
        try {
            // 1. Compress Image
            const options = {
                maxSizeMB: 0.5,          // Target max size 500KB
                maxWidthOrHeight: 1080,  // Good quality display size
                useWebWorker: true
            };
            const compressedFile = await imageCompression(file, options);

            // 2. Upload to Supabase Storage
            const fileExt = compressedFile.name.split('.').pop() || 'jpg';
            const fileName = `${productId}/${Math.random().toString(36).substring(2)}.${fileExt}`;

            const { data, error } = await supabase.storage
                .from('products')
                .upload(fileName, compressedFile);

            if (error) throw error;

            // 3. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(fileName);

            // 3. Save to Base Database
            const res = await fetch(`/api/admin/products/${productId}/images`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: publicUrl,
                    sortOrder: images.length,
                    isPrimary: images.length === 0, // First image is primary
                })
            });

            if (res.ok) {
                fetchProduct();
            } else {
                const json = await res.json();
                throw new Error(json.error);
            }
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Failed to upload image");
        } finally {
            setIsUploading(false);
            e.target.value = ''; // reset input
        }
    };

    const handleDeleteImage = async (imageId: string) => {
        if (!confirm("Delete this image?")) return;
        try {
            // Ideal implementation would also delete from Supabase storage,
            // but for now we just remove the database reference
            const res = await fetch(`/api/admin/images/${imageId}`, { method: "DELETE" });
            if (res.ok) {
                setImages(images.filter(img => img.id !== imageId));
            }
        } catch (error) {
            console.error(error);
        }
    };

    // --- Variant Handling ---
    const openVariantModal = (variant?: Variant) => {
        if (variant) {
            setEditingVariant(variant);
            setVariantForm({
                sku: variant.sku,
                color: variant.color || "",
                size: variant.size || "",
                costPrice: variant.costPrice || 0,
                salePrice: variant.salePrice,
                stockOnHand: variant.stockOnHand,
                isActive: variant.isActive
            });
        } else {
            setEditingVariant(null);
            setVariantForm({
                sku: "", color: "", size: "", costPrice: 0, salePrice: 0, stockOnHand: 0, isActive: true
            });
        }
        setIsVariantModalOpen(true);
    };

    const handleVariantSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const url = editingVariant
                ? `/api/admin/variants/${editingVariant.id}`
                : `/api/admin/products/${productId}/variants`;
            const method = editingVariant ? "PUT" : "POST";

            // Properly serialize numbers to satisfy backend strict Zod schema validation
            const payload = {
                ...variantForm,
                costPrice: parseFloat(variantForm.costPrice as any) || 0,
                salePrice: parseFloat(variantForm.salePrice as any) || 0,
                stockOnHand: parseInt(variantForm.stockOnHand as any, 10) || 0,
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setIsVariantModalOpen(false);
                fetchProduct();
                addToast("success", "Success", `Variant ${editingVariant ? "updated" : "created"} successfully.`);
            } else {
                const json = await res.json();
                addToast("error", "Failed", json.error || "Failed to save variant");
            }
        } catch (error) {
            console.error(error);
            addToast("error", "Error", "An unexpected error occurred saving the variant.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteVariant = async (id: string) => {
        if (!confirm("Are you sure you want to delete this variant?")) return;
        try {
            const res = await fetch(`/api/admin/variants/${id}`, { method: "DELETE" });
            if (res.ok) {
                setVariants(variants.filter(v => v.id !== id));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const openInventoryModal = async (variant: Variant) => {
        setSelectedVariantForInventory(variant);
        setIsInventoryModalOpen(true);
        setIsLoadingInventory(true);
        try {
            const res = await fetch(`/api/admin/variants/${variant.id}/inventory`);
            const json = await res.json();
            if (json.success) {
                setInventoryLogs(json.data);
            } else {
                alert("Failed to load inventory logs.");
            }
        } catch (error) {
            console.error("Failed to load inventory logs.", error);
        } finally {
            setIsLoadingInventory(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center">Loading product details...</div>;
    if (!product) return null;

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => router.push("/admin/products")} className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{product.nameKm}</h1>
                    <p className="text-sm text-gray-500">{product.category?.nameKm}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Images */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <ImageIcon className="w-5 h-5" /> Images
                        </h2>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {images.map(img => (
                                <div key={img.id} className="relative group rounded-lg overflow-hidden bg-gray-100 aspect-square border border-gray-200 dark:border-gray-700">
                                    <img src={img.url} alt="Product" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => handleDeleteImage(img.id)}
                                        className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    {img.isPrimary && (
                                        <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 text-white text-[10px] rounded-full backdrop-blur-sm">
                                            Primary
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>

                        <label className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${isUploading ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 hover:border-blue-500 dark:border-gray-700 dark:hover:border-blue-500"}`}>
                            <Upload className={`w-8 h-8 mb-2 ${isUploading ? "text-blue-500 animate-bounce" : "text-gray-400"}`} />
                            <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                {isUploading ? "Uploading..." : "Click to upload image"}
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
                        </label>
                    </div>
                </div>

                {/* Right Column: Variants */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Variants & Inventory</h2>
                            <button
                                onClick={() => openVariantModal()}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"
                            >
                                <Plus className="w-4 h-4" /> Add Variant
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold rounded-tl-lg">SKU / Attributes</th>
                                        <th className="px-4 py-3 font-semibold text-right">Cost Price</th>
                                        <th className="px-4 py-3 font-semibold text-right">Sale Price</th>
                                        <th className="px-4 py-3 font-semibold text-center">Stock</th>
                                        <th className="px-4 py-3 font-semibold text-center">Status</th>
                                        <th className="px-4 py-3 font-semibold text-right rounded-tr-lg">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {variants.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                                No variants added yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        variants.map(variant => (
                                            <tr key={variant.id} className="border-t border-gray-100 dark:border-gray-700">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-gray-900 dark:text-white">{variant.sku}</div>
                                                    <div className="text-xs text-gray-500 mt-1 flex gap-2">
                                                        {variant.size && <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">Size: {variant.size}</span>}
                                                        {variant.color && <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">Color: {variant.color}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">${variant.costPrice ? Number(variant.costPrice).toFixed(2) : "0.00"}</td>
                                                <td className="px-4 py-3 text-right font-medium text-blue-600 dark:text-blue-400">${Number(variant.salePrice || 0).toFixed(2)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline - flex px - 2 py - 1 rounded - full text - xs font - semibold ${variant.stockOnHand > 10 ? 'bg-green-100 text-green-800' : variant.stockOnHand > 0 ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>
                                                        {variant.stockOnHand}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`px - 2 py - 1 rounded - full text - [10px] font - bold uppercase ${variant.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                                                        {variant.isActive ? 'Active' : 'Hidden'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => openInventoryModal(variant)} className="p-1.5 text-gray-400 hover:text-green-600 rounded bg-gray-50 dark:bg-gray-800 hover:bg-green-50 transition-colors" title="View Inventory Logs">
                                                            <History className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button onClick={() => openVariantModal(variant)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 transition-colors" title="Edit Variant">
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button onClick={() => handleDeleteVariant(variant.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded bg-gray-50 dark:bg-gray-800 hover:bg-red-50 transition-colors">
                                                            <Trash2 className="w-3.5 h-3.5" />
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
                </div>
            </div>

            {/* Variant Modal */}
            {isVariantModalOpen && (
                <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editingVariant ? "Edit Variant" : "Add Variant"}
                            </h2>
                        </div>

                        <form onSubmit={handleVariantSubmit} className="p-6 space-y-4 overflow-y-auto">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    SKU (Stock Keeping Unit) *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={variantForm.sku}
                                    onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white uppercase"
                                    placeholder="e.g. DRESS-RED-S"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Size
                                    </label>
                                    <input
                                        type="text"
                                        value={variantForm.size}
                                        onChange={(e) => setVariantForm({ ...variantForm, size: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="S, M, L, XL"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Color
                                    </label>
                                    <input
                                        type="text"
                                        value={variantForm.color}
                                        onChange={(e) => setVariantForm({ ...variantForm, color: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="Red, Blue..."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Cost Price ($)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={variantForm.costPrice}
                                        onChange={(e) => setVariantForm({ ...variantForm, costPrice: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Sale Price ($) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        min="0"
                                        value={variantForm.salePrice}
                                        onChange={(e) => setVariantForm({ ...variantForm, salePrice: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Initial Stock
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={variantForm.stockOnHand}
                                        onChange={(e) => setVariantForm({ ...variantForm, stockOnHand: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Status
                                    </label>
                                    <div className="flex items-center mt-2">
                                        <label htmlFor="variant-status-toggle" className="flex items-center cursor-pointer relative">
                                            <input
                                                type="checkbox"
                                                id="variant-status-toggle"
                                                checked={variantForm.isActive}
                                                onChange={(e) => setVariantForm({ ...variantForm, isActive: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                            <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300 select-none">
                                                {variantForm.isActive ? "Active" : "Hidden"}
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsVariantModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save Variant"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Inventory Logs Modal */}
            {isInventoryModalOpen && selectedVariantForInventory && (
                <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Inventory History
                                </h2>
                                <p className="text-sm text-gray-500">
                                    SKU: {selectedVariantForInventory.sku}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsInventoryModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                Close
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {isLoadingInventory ? (
                                <div className="text-center py-8 text-gray-500">Loading logs...</div>
                            ) : inventoryLogs.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No inventory transactions found.</div>
                            ) : (
                                <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold rounded-tl-lg">Date</th>
                                            <th className="px-4 py-3 font-semibold">Type</th>
                                            <th className="px-4 py-3 font-semibold text-right">Qty</th>
                                            <th className="px-4 py-3 font-semibold">Reference</th>
                                            <th className="px-4 py-3 font-semibold">User</th>
                                            <th className="px-4 py-3 font-semibold rounded-tr-lg">Note</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inventoryLogs.map(log => (
                                            <tr key={log.id} className="border-t border-gray-100 dark:border-gray-700">
                                                <td className="px-4 py-3 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px - 2 py - 0.5 rounded text - xs font - semibold ${log.type === "IN" ? "bg-green-100 text-green-800" :
                                                        log.type === "OUT" ? "bg-red-100 text-red-800" :
                                                            log.type === "ADJUST" ? "bg-blue-100 text-blue-800" :
                                                                "bg-gray-100 text-gray-800"
                                                        }`}>
                                                        {log.type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium">{log.qty}</td>
                                                <td className="px-4 py-3 text-xs">{log.refType} {log.refId ? `(${log.refId})` : ""}</td>
                                                <td className="px-4 py-3 text-xs">{log.createdByUser?.fullName || "System"}</td>
                                                <td className="px-4 py-3 text-xs">{log.note || "-"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
