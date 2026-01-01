/**
 * NucleIQ Design System - Checkbox Component
 * Accessible checkbox with label and validation
 */

import React, { forwardRef } from 'react';
import { Check } from 'lucide-react';
import './Checkbox.css';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    /** Checkbox label */
    label?: string;

    /** Helper text below checkbox */
    helperText?: string;

    /** Error message (shows error state) */
    error?: string;

    /** Indeterminate state */
    indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    (
        {
            label,
            helperText,
            error,
            indeterminate = false,
            className = '',
            disabled,
            id,
            ...props
        },
        ref
    ) => {
        const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
        const hasError = !!error;

        const wrapperClasses = [
            'ds-checkbox-wrapper',
            className,
        ]
            .filter(Boolean)
            .join(' ');

        const checkboxClasses = [
            'ds-checkbox',
            hasError && 'ds-checkbox--error',
            disabled && 'ds-checkbox--disabled',
            indeterminate && 'ds-checkbox--indeterminate',
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <div className={wrapperClasses}>
                <div className="ds-checkbox__container">
                    <input
                        ref={ref}
                        type="checkbox"
                        id={checkboxId}
                        className="ds-checkbox__input"
                        disabled={disabled}
                        aria-invalid={hasError}
                        aria-describedby={
                            error
                                ? `${checkboxId}-error`
                                : helperText
                                    ? `${checkboxId}-helper`
                                    : undefined
                        }
                        {...props}
                    />
                    <div className={checkboxClasses}>
                        {indeterminate ? (
                            <div className="ds-checkbox__indeterminate-icon" />
                        ) : (
                            <Check size={16} className="ds-checkbox__check-icon" strokeWidth={3} />
                        )}
                    </div>
                    {label && (
                        <label htmlFor={checkboxId} className="ds-checkbox__label">
                            {label}
                        </label>
                    )}
                </div>

                {error && (
                    <p id={`${checkboxId}-error`} className="ds-checkbox__message ds-checkbox__message--error">
                        {error}
                    </p>
                )}

                {!error && helperText && (
                    <p id={`${checkboxId}-helper`} className="ds-checkbox__message ds-checkbox__message--helper">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

Checkbox.displayName = 'Checkbox';
