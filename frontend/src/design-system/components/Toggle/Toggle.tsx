/**
 * NucleiQ Design System - Toggle Component
 * Accessible switch/toggle component
 */

import React from 'react';
import './Toggle.css';

export interface ToggleProps {
    /** Whether the toggle is checked */
    checked: boolean;
    /** Callback when the toggle state changes */
    onChange: (checked: boolean) => void;
    /** Whether the toggle is disabled */
    disabled?: boolean;
    /** Optional label for the toggle */
    label?: string;
    /** Optional id for the toggle */
    id?: string;
    /** Optional className for the wrapper */
    className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
    checked,
    onChange,
    disabled = false,
    label,
    id,
    className = '',
}) => {
    const toggleId = id || `toggle-${Math.random().toString(36).substr(2, 9)}`;

    const handleChange = () => {
        if (!disabled) {
            onChange(!checked);
        }
    };

    return (
        <div className={`ds-toggle-wrapper ${className}`}>
            <div
                className={`ds-toggle ${checked ? 'ds-toggle--checked' : ''} ${disabled ? 'ds-toggle--disabled' : ''}`}
                onClick={handleChange}
                role="switch"
                aria-checked={checked}
                aria-disabled={disabled}
                tabIndex={disabled ? -1 : 0}
                onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        handleChange();
                    }
                }}
            >
                <div className="ds-toggle__slider" />
            </div>
            {label && (
                <label htmlFor={toggleId} className="ds-toggle__label" onClick={handleChange}>
                    {label}
                </label>
            )}
        </div>
    );
};

Toggle.displayName = 'Toggle';
