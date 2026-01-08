/**
 * NucleIQ Design System - Toast Notification Component
 * Accessible, animated toast notifications for user feedback
 */

import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import './Toast.css';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
    /** Unique ID for the toast */
    id: string;

    /** Toast message */
    message: string;

    /** Toast variant */
    variant?: ToastVariant;

    /** Duration in milliseconds (0 = no auto-dismiss) */
    duration?: number;

    /** Callback when toast is dismissed */
    onDismiss: (id: string) => void;

    /** Optional action button */
    action?: {
        label: string;
        onClick: () => void;
    };
}

const variantIcons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
};

export const Toast: React.FC<ToastProps> = ({
    id,
    message,
    variant = 'info',
    duration = 5000,
    onDismiss,
    action,
}) => {
    const Icon = variantIcons[variant];

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onDismiss(id);
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [id, duration, onDismiss]);

    return (
        <div
            className={`ds-toast ds-toast--${variant}`}
            role="alert"
            aria-live="polite"
            aria-atomic="true"
        >
            <div className="ds-toast__icon">
                <Icon size={20} />
            </div>

            <div className="ds-toast__content">
                <p className="ds-toast__message">{message}</p>

                {action && (
                    <button
                        className="ds-toast__action"
                        onClick={() => {
                            action.onClick();
                            onDismiss(id);
                        }}
                    >
                        {action.label}
                    </button>
                )}
            </div>

            <button
                className="ds-toast__close"
                onClick={() => onDismiss(id)}
                aria-label="Close notification"
            >
                <X size={16} />
            </button>
        </div>
    );
};

Toast.displayName = 'Toast';
