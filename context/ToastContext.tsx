"use client";

import { createContext, useContext, useCallback, useState, useRef, ReactNode } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2, AlertCircle, Info, Trash2 } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextValue {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = "info") => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, type, message }]);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toasts.length > 0 &&
                createPortal(
                    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
                        {toasts.map((toast) => (
                            <div
                                key={toast.id}
                                className="animate-in slide-in-from-right-full fade-in flex w-80 items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-4 shadow-xl shadow-black/50"
                                role="alert"
                            >
                                {toast.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />}
                                {toast.type === "error" && <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />}
                                {toast.type === "info" && <Info className="h-5 w-5 text-blue-400 shrink-0" />}

                                <p className="flex-1 text-sm text-zinc-200">{toast.message}</p>

                                <button
                                    onClick={() => removeToast(toast.id)}
                                    className="text-zinc-500 hover:text-zinc-300 transition-colors"
                                    aria-label="Close notification"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>,
                    document.body
                )
            }
        </ToastContext.Provider>
    );
}
