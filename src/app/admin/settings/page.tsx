"use client";

import React, { useState, useEffect } from "react";
import { Save, Loader2, Send } from "lucide-react";

export default function SettingsPage() {
    const [settings, setSettings] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form inputs
    const [formData, setFormData] = useState({
        deliveryFeePP: 1.5,
        deliveryFeeProvince: 2.5,
        paymentInstructionABA: "",
        paymentInstructionWing: "",
        telegramBotToken: "",
        telegramChatId: "",
        defaultLanguage: "KM"
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/admin/settings");
            const json = await res.json();
            if (json.data) {
                setSettings(json.data);
                setFormData({
                    deliveryFeePP: Number(json.data.deliveryFeePP),
                    deliveryFeeProvince: Number(json.data.deliveryFeeProvince),
                    paymentInstructionABA: json.data.paymentInstructionABA || "",
                    paymentInstructionWing: json.data.paymentInstructionWing || "",
                    telegramBotToken: json.data.telegramBotToken || "",
                    telegramChatId: json.data.telegramChatId || "",
                    defaultLanguage: json.data.defaultLanguage || "KM"
                });
            }
        } catch (error) {
            console.error("Failed to load settings:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setIsSaving(true);

        try {
            const res = await fetch("/api/admin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Settings updated successfully!' });
                await fetchSettings();
            } else {
                const json = await res.json();
                setMessage({ type: 'error', text: json.error || 'Failed to update settings.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An unexpected error occurred.' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage(null), 5000);
        }
    };

    const testTelegramAlert = async () => {
        try {
            const res = await fetch('/api/admin/settings/test-telegram', { method: 'POST' });
            const data = await res.json();
            if (res.ok && data.success) {
                alert("Test message sent! Check your Telegram.");
            } else {
                alert(`Failed to send test message: ${data.error}`);
            }
        } catch (error) {
            alert("Error sending test message");
        }
    };

    if (isLoading) {
        return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    }

    return (
        <div className="space-y-6 pb-10 max-w-4xl">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Application Settings</h1>

            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                    <span className="font-medium">{message.text}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Store Preferences */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Store Preferences</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default Language</label>
                            <select
                                name="defaultLanguage"
                                value={formData.defaultLanguage}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="KM">Khmer</option>
                                <option value="EN">English</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Delivery Fees */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Delivery Fees ($)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phnom Penh</label>
                            <input
                                type="number"
                                step="0.5"
                                min="0"
                                name="deliveryFeePP"
                                value={formData.deliveryFeePP}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Provinces</label>
                            <input
                                type="number"
                                step="0.5"
                                min="0"
                                name="deliveryFeeProvince"
                                value={formData.deliveryFeeProvince}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Payment Instructions */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Instructions</h2>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ABA Bank Details</label>
                            <textarea
                                name="paymentInstructionABA"
                                value={formData.paymentInstructionABA}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Account Name: Neary Collection&#10;Account Number: 000 000 000"
                            />
                            <p className="text-xs text-gray-500 mt-1">Displayed to customers when they select ABA payment at checkout.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Wing Details</label>
                            <textarea
                                name="paymentInstructionWing"
                                value={formData.paymentInstructionWing}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Wing Number: 012 345 678"
                            />
                            <p className="text-xs text-gray-500 mt-1">Displayed to customers when they select Wing payment at checkout.</p>
                        </div>
                    </div>
                </div>

                {/* Telegram Bot Integration */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Telegram Alerts Config</h2>
                        {(formData.telegramBotToken && formData.telegramChatId) ? (
                            <button
                                type="button"
                                onClick={testTelegramAlert}
                                className="flex items-center gap-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-md font-medium transition-colors"
                            >
                                <Send className="w-4 h-4" /> Test Alert
                            </button>
                        ) : null}
                    </div>
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Receive instant notifications for new orders directly in Telegram.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bot Token</label>
                                <input
                                    type="text"
                                    name="telegramBotToken"
                                    value={formData.telegramBotToken}
                                    onChange={handleChange}
                                    placeholder="e.g. 123456789:ABCdefGHIjklMNOpqrSTU"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                                <p className="text-xs text-gray-500 mt-1">Create a bot using @BotFather on Telegram to get a token.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Chat ID</label>
                                <input
                                    type="text"
                                    name="telegramChatId"
                                    value={formData.telegramChatId}
                                    onChange={handleChange}
                                    placeholder="e.g. -1001234567890"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                                <p className="text-xs text-gray-500 mt-1">The ID of the group or user chat where alerts will be sent.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={fetchSettings}
                        disabled={isSaving}
                        className="px-6 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
                    >
                        Reset Changes
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-8 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
}
