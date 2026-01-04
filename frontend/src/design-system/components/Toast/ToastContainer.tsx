/**
 * NucleIQ Design System - Toast Container
 * Manages multiple toast notifications with positioning
 */

import React from 'react';
import { Toast, ToastProps } from './Toast';
import './ToastContainer.css';

export interface ToastContainerProps {
    toasts: Omit<ToastProps, 'onDismiss'>[];
    onDismiss: (id: string) => void;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
    toasts,
    onDismiss,
    position = 'top-right',
}) => {
    if (toasts.length === 0) return null;

    return (
        <div className={`ds-toast-container ds-toast-container--${position}`}>
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    {...toast}
                    onDismiss={onDismiss}
                />
            ))}
        </div>
    );
};

ToastContainer.displayName = 'ToastContainer';
