/**
 * NucleIQ Design System - Toast Hook
 * React hook for managing toast notifications
 */

import { useState, useCallback } from 'react';
import { ToastVariant } from './Toast';

export interface ToastOptions {
    variant?: ToastVariant;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export interface ToastItem {
    id: string;
    message: string;
    variant: ToastVariant;
    duration: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

let toastId = 0;

export const useToast = () => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const addToast = useCallback((message: string, options: ToastOptions = {}) => {
        const id = `toast-${++toastId}`;
        const newToast: ToastItem = {
            id,
            message,
            variant: options.variant || 'info',
            duration: options.duration ?? 5000,
            action: options.action,
        };

        setToasts((prev) => [...prev, newToast]);
        return id;
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const success = useCallback((message: string, options?: Omit<ToastOptions, 'variant'>) => {
        return addToast(message, { ...options, variant: 'success' });
    }, [addToast]);

    const error = useCallback((message: string, options?: Omit<ToastOptions, 'variant'>) => {
        return addToast(message, { ...options, variant: 'error' });
    }, [addToast]);

    const warning = useCallback((message: string, options?: Omit<ToastOptions, 'variant'>) => {
        return addToast(message, { ...options, variant: 'warning' });
    }, [addToast]);

    const info = useCallback((message: string, options?: Omit<ToastOptions, 'variant'>) => {
        return addToast(message, { ...options, variant: 'info' });
    }, [addToast]);

    const clearAll = useCallback(() => {
        setToasts([]);
    }, []);

    return {
        toasts,
        addToast,
        removeToast,
        success,
        error,
        warning,
        info,
        clearAll,
    };
};
