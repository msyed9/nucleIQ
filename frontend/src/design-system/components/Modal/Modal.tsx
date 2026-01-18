/**
 * NucleiQ Design System - Modal Component
 * Accessible dialog/modal with overlay
 */

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

export interface ModalProps {
    /** Modal open state */
    isOpen: boolean;

    /** Close handler */
    onClose: () => void;

    /** Modal title */
    title?: string;

    /** Modal content */
    children: React.ReactNode;

    /** Footer content (buttons, etc) */
    footer?: React.ReactNode;

    /** Modal size */
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';

    /** Close on overlay click */
    closeOnOverlayClick?: boolean;

    /** Close on escape key */
    closeOnEscape?: boolean;

    /** Show close button */
    showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'md',
    closeOnOverlayClick = true,
    closeOnEscape = true,
    showCloseButton = true,
}) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Store currently focused element
            previousActiveElement.current = document.activeElement as HTMLElement;

            // Prevent body scroll
            document.body.style.overflow = 'hidden';

            // Focus modal
            modalRef.current?.focus();
        } else {
            // Restore body scroll
            document.body.style.overflow = '';

            // Restore focus
            previousActiveElement.current?.focus();
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || !closeOnEscape) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, closeOnEscape, onClose]);

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="ds-modal-overlay" onClick={handleOverlayClick}>
            <div
                ref={modalRef}
                className={`ds-modal ds-modal--${size}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? 'modal-title' : undefined}
                tabIndex={-1}
            >
                {/* Header */}
                {(title || showCloseButton) && (
                    <div className="ds-modal__header">
                        {title && (
                            <h2 id="modal-title" className="ds-modal__title">
                                {title}
                            </h2>
                        )}
                        {showCloseButton && (
                            <button
                                className="ds-modal__close"
                                onClick={onClose}
                                aria-label="Close modal"
                            >
                                <X size={24} />
                            </button>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="ds-modal__content">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="ds-modal__footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

Modal.displayName = 'Modal';
