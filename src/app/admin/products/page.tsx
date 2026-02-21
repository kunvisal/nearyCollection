"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, List } from "lucide-react";

type Category = { id: number; nameKm: string; nameEn: string | null; };
type Product = {
    id: string;
    nameKm: string;
    nameEn: string | null;
    descriptionKm: string | null;
    descriptionEn: string | null;
    categoryId: number;
    isActive: boolean;
    category: Category;
    variants: any[]; // To be typed properly later
};

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState({
        nameKm: "", nameEn: "", descriptionKm: "", descriptionEn: "", categoryId: 0, isActive: true
    });

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [prodRes, catRes] = await Promise.all([
                fetch("/api/admin/products"),
                fetch("/api/admin/categories")
            ]);
            const prodJson = await prodRes.json();
            const catJson = await catRes.json();

            if (prodJson.success) setProducts(prodJson.data);
            if (catJson.success) {
                setCategories(catJson.data);
                if (catJson.data.length > 0 && formData.categoryId === 0) {
                    setFormData(prev => ({ ...prev, categoryId: catJson.data[0].id }));
                }
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openAddModal = () => {
        setEditingProduct(null);
        setFormData({
            nameKm: "", nameEn: "", descriptionKm: "", descriptionEn: "",
            categoryId: categories.length > 0 ? categories[0].id : 0,
            isActive: true
        });
        if (categories.length === 0) {
            alert("Please create a category first!");
            return;
        }
        setIsModalOpen(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            nameKm: product.nameKm,
            nameEn: product.nameEn || "",
            descriptionKm: product.descriptionKm || "",
            descriptionEn: product.descriptionEn || "",
            categoryId: product.categoryId,
            isActive: product.isActive,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : "/api/admin/products";
            const method = editingProduct ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                await fetchData();
                closeModal();
            } else {
                const json = await res.json();
                alert(json.error || "Something went wrong.");
            }
        } catch (error) {
            console.error(error);
            alert("Error saving product.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this product? All its variants and images will be permanently deleted.")) return;
        try {
            const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
            if (res.ok) {
                await fetchData();
            } else {
                const json = await res.json();
                alert(json.error || "Failed to delete.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Products</h1>
                <button
                    onClick={openAddModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Product
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Product Name</th>
                                <th className="px-6 py-4 font-semibold">Category</th>
                                <th className="px-6 py-4 font-semibold text-center">Variants</th>
                                <th className="px-6 py-4 font-semibold text-center">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        Loading products...
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No products found. Click "Add Product" to create one.
                                    </td>
                                </tr>
                            ) : (
                                products.map((prod) => (
                                    <tr key={prod.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900 dark:text-white">{prod.nameKm}</div>
                                            <div className="text-xs text-gray-500">{prod.nameEn}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {prod.category?.nameKm || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                                                <List className="w-3.5 h-3.5" />
                                                {prod.variants?.length || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${prod.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                                }`}>
                                                {prod.isActive ? "Active" : "Hidden"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <a href={`/admin/products/${prod.id}`} className="text-gray-400 hover:text-green-600 transition-colors" title="Manage Variants & Images">
                                                    <List className="w-4 h-4" />
                                                </a>
                                                <button onClick={() => openEditModal(prod)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Edit Info">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(prod.id)} className="text-gray-400 hover:text-red-600 transition-colors" title="Delete Product">
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editingProduct ? "Edit Product" : "Add Product"}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Name (Khmer) *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.nameKm}
                                        onChange={(e) => setFormData({ ...formData, nameKm: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Name (English)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nameEn}
                                        onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Description (Khmer)
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={formData.descriptionKm}
                                        onChange={(e) => setFormData({ ...formData, descriptionKm: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Description (English)
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={formData.descriptionEn}
                                        onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Category *
                                    </label>
                                    <select
                                        value={formData.categoryId}
                                        onChange={(e) => setFormData({ ...formData, categoryId: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.nameKm} {cat.nameEn && `(${cat.nameEn})`}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="w-32">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Status
                                    </label>
                                    <label className="flex items-center mt-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                        <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                                            {formData.isActive ? "Active" : "Hidden"}
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700 shrink-0">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700"
                                >
                                    Save Product
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
