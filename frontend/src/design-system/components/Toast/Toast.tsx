/**
 * NucleIQ Design System - Toast Notification Component
 * Toast notifications with auto-dismiss and animations
 */

import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import './Toast.css';

export interface ToastProps {
    /** Toast ID (for managing multiple toasts) */
    id?: string;

    /** Toast message */
    message: string;

    /** Toast variant */
    variant?: 'success' | 'error' | 'warning' | 'info';

    /** Duration in milliseconds (0 = no auto-dismiss) */
    duration?: number;

    /** Close handler */
    onClose?: () => void;

    /** Show close button */
    showCloseButton?: boolean;
}

const iconMap = {
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
    onClose,
    showCloseButton = true,
}) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                handleClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [duration]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            setIsVisible(false);
            onClose?.();
        }, 300); // Match animation duration
    };

    if (!isVisible) return null;

    const Icon = iconMap[variant];

    return (
        <div
            className={`ds-toast ds-toast--${variant} ${isExiting ? 'ds-toast--exiting' : ''}`}
            role="alert"
            aria-live="polite"
        >
            <Icon size={20} className="ds-toast__icon" />
            <p className="ds-toast__message">{message}</p>
            {showCloseButton && (
                <button
                    className="ds-toast__close"
                    onClick={handleClose}
                    aria-label="Close notification"
                >
                    <X size={18} />
                </button>
            )}
        </div>
    );
};

Toast.displayName = 'Toast';

// Toast Container Component
export interface ToastContainerProps {
    /** Toast position */
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

    /** Children (Toast components) */
    children: React.ReactNode;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
    position = 'top-right',
    children,
}) => {
    return (
        <div className={`ds-toast-container ds-toast-container--${position}`}>
            {children}
        </div>
    );
};

ToastContainer.displayName = 'ToastContainer';
