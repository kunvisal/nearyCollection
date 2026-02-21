"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { uploadPaymentSlipAction } from "@/app/actions/paymentActions";
import { UploadCloud, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { PaymentMethod } from "@prisma/client";

function PaymentUploadContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get("orderId");
    const router = useRouter();

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!orderId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
                <h2 className="text-xl font-bold mb-2">Invalid Request</h2>
                <Link href="/" className="px-6 py-3 bg-black text-white rounded-full mt-4">Return Home</Link>
            </div>
        );
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please select an image first.");
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            // 1. Upload to Supabase Storage (Assumes 'payment-slips' bucket exists and is public)
            const fileExt = file.name.split('.').pop();
            const fileName = `${orderId}-${Date.now()}.${fileExt}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('payment-slips')
                .upload(fileName, file, { cacheControl: '3600', upsert: false });

            if (uploadError) {
                console.error("Supabase Upload Error:", uploadError);
                throw new Error("Failed to upload image to storage. Make sure 'payment-slips' bucket exists.");
            }

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('payment-slips')
                .getPublicUrl(uploadData.path);

            // 3. Save to Database via Server Action
            const res = await uploadPaymentSlipAction(orderId, publicUrl, "ABA" as PaymentMethod);

            if (res.success) {
                router.push(`/checkout/success?orderCode=${res.orderCode}`);
            } else {
                throw new Error(res.error || "Failed to save payment record.");
            }

        } catch (err: any) {
            setError(err.message || "An error occurred during upload.");
            setIsUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
            <header className="bg-white dark:bg-gray-900 px-4 py-3 flex items-center gap-4">
                <button onClick={() => router.back()} className="text-gray-600 dark:text-gray-300">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Upload Payment Slip</h1>
            </header>

            <div className="max-w-md mx-auto px-4 py-8 space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                        Please upload a clear screenshot of your bank transfer receipt. Our team will verify it shortly.
                    </p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors relative cursor-pointer group">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        {preview ? (
                            <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-gray-100">
                                <img src={preview} alt="Slip Preview" className="w-full h-full object-contain" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                                    <UploadCloud className="w-8 h-8 mb-2" />
                                    <span className="font-medium text-sm">Change Image</span>
                                </div>
                            </div>
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center text-gray-500">
                                <UploadCloud className="w-12 h-12 mb-3 text-gray-400" />
                                <span className="font-medium text-gray-900 dark:text-white mb-1">Click to browse</span>
                                <span className="text-xs">Supports JPG, PNG</span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleUpload}
                        disabled={!file || isUploading}
                        className={`w-full mt-6 py-4 rounded-xl font-bold flex items-center justify-center transition-colors ${!file || isUploading
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                            }`}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Uploading...
                            </>
                        ) : (
                            'Submit Payment'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function PaymentUploadPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        }>
            <PaymentUploadContent />
        </Suspense>
    );
}
