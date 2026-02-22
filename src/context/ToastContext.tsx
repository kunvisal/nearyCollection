"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import {
    CheckCircle2,
    Info,
    AlertTriangle,
    XCircle,
    X
} from "lucide-react";

export type ToastType = "success" | "info" | "warning" | "error";

interface ToastProps {
    id: string;
    type: ToastType;
    title: string;
    message: string;
}

interface ToastContextType {
    addToast: (type: ToastType, title: string, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

const TOAST_DURATION = 4000;

function ToastItem({ toast, onRemove }: { toast: ToastProps; onRemove: (id: string) => void }) {
    const [progress, setProgress] = useState(100);
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        // Start CSS animation immediately after mount
        const animationTimer = setTimeout(() => {
            setProgress(0);
        }, 10);

        // Remove the toast when duration completes
        const removeTimer = setTimeout(() => {
            handleRemove();
        }, TOAST_DURATION);

        return () => {
            clearTimeout(animationTimer);
            clearTimeout(removeTimer);
        };
    }, []);

    const handleRemove = () => {
        setIsLeaving(true);
        setTimeout(() => onRemove(toast.id), 300); // Wait for exit animation
    };

    const colors = {
        success: {
            bg: "bg-gradient-to-r from-pink-50/90 to-rose-100/80 backdrop-blur-md dark:from-pink-900/40 dark:to-rose-800/30",
            border: "border-pink-200 dark:border-pink-800",
            icon: "text-pink-500",
            progress: "bg-pink-500"
        },
        info: { bg: "bg-blue-50/50", border: "border-blue-100", icon: "text-blue-500", progress: "bg-blue-500" },
        warning: { bg: "bg-yellow-50/50", border: "border-yellow-100", icon: "text-yellow-500", progress: "bg-yellow-500" },
        error: { bg: "bg-red-50/50", border: "border-red-100", icon: "text-red-500", progress: "bg-red-500" },
    };

    const icons = {
        success: <CheckCircle2 className="w-6 h-6" />,
        info: <Info className="w-6 h-6" />,
        warning: <AlertTriangle className="w-6 h-6" />,
        error: <XCircle className="w-6 h-6" />,
    };

    const theme = colors[toast.type];

    return (
        <div
            className={`relative w-full max-w-sm sm:w-96 flex items-start p-4 mb-3 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 ${theme.bg} dark:border-gray-700 transition-all duration-300 ease-in-out transform ${isLeaving ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"} ${toast.type !== 'success' && 'bg-white dark:bg-gray-800'}`}
        >
            <div className={`flex-shrink-0 ${theme.icon} mt-0.5`}>
                {icons[toast.type]}
            </div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {toast.title}
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {toast.message}
                </p>
            </div>
            <div className="ml-4 flex flex-shrink-0">
                <button
                    type="button"
                    onClick={handleRemove}
                    className="inline-flex rounded-md bg-transparent text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                    <span className="sr-only">Close</span>
                    <X className="h-5 w-5" aria-hidden="true" />
                </button>
            </div>
            {/* Progress Bar */}
            <div className="absolute bottom-0 right-0 h-1 w-full bg-gray-100 dark:bg-gray-700 rounded-b-xl overflow-hidden">
                <div
                    className={`h-full ${theme.progress} transition-[width] ease-linear ml-auto`}
                    style={{ width: `${progress}%`, transitionDuration: progress === 100 ? '0ms' : `${TOAST_DURATION}ms` }}
                />
            </div>
        </div>
    );
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastProps[]>([]);

    const addToast = useCallback((type: ToastType, title: string, message: string) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, type, title, message }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            {/* Toast Portal/Container */}
            <div
                aria-live="assertive"
                className="pointer-events-none fixed inset-0 z-[999999] flex items-start px-4 py-16 sm:p-6"
            >
                <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
                    {toasts.map((toast) => (
                        <div key={toast.id} className="pointer-events-auto w-full sm:w-auto">
                            <ToastItem toast={toast} onRemove={removeToast} />
                        </div>
                    ))}
                </div>
            </div>
        </ToastContext.Provider>
    );
}
