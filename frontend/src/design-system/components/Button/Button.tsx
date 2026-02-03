/**
 * NucleiQ Design System - Button Component
 * Accessible, responsive button with multiple variants
 */

import React, { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Button variant */
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning';

    /** Button size */
    size?: 'sm' | 'md' | 'lg' | 'small';

    /** Full width button */
    fullWidth?: boolean;

    /** Loading state */
    loading?: boolean;

    /** Icon to display before text */
    iconLeft?: LucideIcon;

    /** Icon to display after text */
    iconRight?: LucideIcon;

    /** Icon only button (no text) */
    iconOnly?: LucideIcon;

    /** Children (button text) */
    children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            fullWidth = false,
            loading = false,
            iconLeft: IconLeft,
            iconRight: IconRight,
            iconOnly: IconOnly,
            disabled,
            className = '',
            children,
            ...props
        },
        ref
    ) => {
        const isDisabled = disabled || loading;

        const resolvedSize = size === 'small' ? 'sm' : size;

        const classes = [
            'ds-button',
            `ds-button--${variant}`,
            `ds-button--${resolvedSize}`,
            fullWidth && 'ds-button--full-width',
            loading && 'ds-button--loading',
            IconOnly && 'ds-button--icon-only',
            className,
        ]
            .filter(Boolean)
            .join(' ');

        // Icon size based on button size
        const iconSize = resolvedSize === 'sm' ? 16 : resolvedSize === 'lg' ? 24 : 20;

        return (
            <button
                ref={ref}
                className={classes}
                disabled={isDisabled}
                aria-busy={loading}
                {...props}
            >
                {loading && (
                    <span className="ds-button__spinner" aria-hidden="true">
                        <svg className="ds-button__spinner-svg" viewBox="0 0 24 24">
                            <circle
                                className="ds-button__spinner-circle"
                                cx="12"
                                cy="12"
                                r="10"
                                fill="none"
                                strokeWidth="3"
                            />
                        </svg>
                    </span>
                )}

                {!loading && IconLeft && (
                    <IconLeft size={iconSize} className="ds-button__icon-left" aria-hidden="true" />
                )}

                {!loading && IconOnly && (
                    <IconOnly size={iconSize} aria-hidden="true" />
                )}

                {!IconOnly && <span className="ds-button__text">{children}</span>}

                {!loading && IconRight && (
                    <IconRight size={iconSize} className="ds-button__icon-right" aria-hidden="true" />
                )}
            </button>
        );
    }
);

Button.displayName = 'Button';
