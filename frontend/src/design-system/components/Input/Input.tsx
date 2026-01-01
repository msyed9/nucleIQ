/**
 * NucleIQ Design System - Input Component
 * Accessible form input with validation states
 */

import React, { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    /** Input label */
    label?: string;

    /** Helper text below input */
    helperText?: string;

    /** Error message (shows error state) */
    error?: string;

    /** Success message (shows success state) */
    success?: string;

    /** Icon to display before input */
    iconLeft?: LucideIcon;

    /** Icon to display after input */
    iconRight?: LucideIcon;

    /** Full width input */
    fullWidth?: boolean;

    /** Input size */
    size?: 'sm' | 'md' | 'lg';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            helperText,
            error,
            success,
            iconLeft: IconLeft,
            iconRight: IconRight,
            fullWidth = false,
            size = 'md',
            className = '',
            disabled,
            required,
            id,
            ...props
        },
        ref
    ) => {
        const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
        const hasError = !!error;
        const hasSuccess = !!success && !hasError;

        const wrapperClasses = [
            'ds-input-wrapper',
            fullWidth && 'ds-input-wrapper--full-width',
            className,
        ]
            .filter(Boolean)
            .join(' ');

        const inputClasses = [
            'ds-input',
            `ds-input--${size}`,
            hasError && 'ds-input--error',
            hasSuccess && 'ds-input--success',
            disabled && 'ds-input--disabled',
            IconLeft && 'ds-input--with-icon-left',
            IconRight && 'ds-input--with-icon-right',
        ]
            .filter(Boolean)
            .join(' ');

        const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;

        return (
            <div className={wrapperClasses}>
                {label && (
                    <label htmlFor={inputId} className="ds-input__label">
                        {label}
                        {required && <span className="ds-input__required" aria-label="required">*</span>}
                    </label>
                )}

                <div className="ds-input__container">
                    {IconLeft && (
                        <IconLeft
                            size={iconSize}
                            className="ds-input__icon ds-input__icon--left"
                            aria-hidden="true"
                        />
                    )}

                    <input
                        ref={ref}
                        id={inputId}
                        className={inputClasses}
                        disabled={disabled}
                        required={required}
                        aria-invalid={hasError}
                        aria-describedby={
                            error
                                ? `${inputId}-error`
                                : success
                                    ? `${inputId}-success`
                                    : helperText
                                        ? `${inputId}-helper`
                                        : undefined
                        }
                        {...props}
                    />

                    {IconRight && (
                        <IconRight
                            size={iconSize}
                            className="ds-input__icon ds-input__icon--right"
                            aria-hidden="true"
                        />
                    )}
                </div>

                {error && (
                    <p id={`${inputId}-error`} className="ds-input__message ds-input__message--error">
                        {error}
                    </p>
                )}

                {!error && success && (
                    <p id={`${inputId}-success`} className="ds-input__message ds-input__message--success">
                        {success}
                    </p>
                )}

                {!error && !success && helperText && (
                    <p id={`${inputId}-helper`} className="ds-input__message ds-input__message--helper">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
