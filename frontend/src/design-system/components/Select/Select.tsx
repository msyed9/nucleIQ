/**
 * NucleiQ Design System - Select Component
 * Accessible dropdown select with search
 */

import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import './Select.css';

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'size'> {
    /** Select label */
    label?: string;

    /** Helper text below select */
    helperText?: string;

    /** Error message (shows error state) */
    error?: string;

    /** Options array */
    options: SelectOption[];

    /** Selected value */
    value?: string;

    /** Change handler */
    onChange?: (value: string) => void;

    /** Placeholder text */
    placeholder?: string;

    /** Enable search */
    searchable?: boolean;

    /** Full width select */
    fullWidth?: boolean;

    /** Select size */
    size?: 'sm' | 'md' | 'lg';
}

export const Select = forwardRef<HTMLDivElement, SelectProps>(
    (
        {
            label,
            helperText,
            error,
            options,
            value,
            onChange,
            placeholder = 'Select an option...',
            searchable = false,
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
        const [isOpen, setIsOpen] = useState(false);
        const [searchQuery, setSearchQuery] = useState('');
        const selectRef = useRef<HTMLDivElement>(null);
        const searchInputRef = useRef<HTMLInputElement>(null);

        const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
        const hasError = !!error;

        const selectedOption = options.find((opt) => opt.value === value);

        const filteredOptions = searchable
            ? options.filter((opt) =>
                opt.label.toLowerCase().includes(searchQuery.toLowerCase())
            )
            : options;

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                    setIsOpen(false);
                    setSearchQuery('');
                }
            };

            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);

        useEffect(() => {
            if (isOpen && searchable && searchInputRef.current) {
                searchInputRef.current.focus();
            }
        }, [isOpen, searchable]);

        const handleSelect = (optionValue: string) => {
            onChange?.(optionValue);
            setIsOpen(false);
            setSearchQuery('');
        };

        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
                setSearchQuery('');
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsOpen(!isOpen);
            }
        };

        const wrapperClasses = [
            'ds-select-wrapper',
            fullWidth && 'ds-select-wrapper--full-width',
            className,
        ]
            .filter(Boolean)
            .join(' ');

        const triggerClasses = [
            'ds-select__trigger',
            `ds-select__trigger--${size}`,
            hasError && 'ds-select__trigger--error',
            disabled && 'ds-select__trigger--disabled',
            isOpen && 'ds-select__trigger--open',
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <div className={wrapperClasses} ref={ref}>
                {label && (
                    <label htmlFor={selectId} className="ds-select__label">
                        {label}
                        {required && <span className="ds-select__required" aria-label="required">*</span>}
                    </label>
                )}

                <div className="ds-select__container" ref={selectRef}>
                    <button
                        type="button"
                        id={selectId}
                        className={triggerClasses}
                        onClick={() => !disabled && setIsOpen(!isOpen)}
                        onKeyDown={handleKeyDown}
                        disabled={disabled}
                        aria-haspopup="listbox"
                        aria-expanded={isOpen}
                        aria-labelledby={label ? `${selectId}-label` : undefined}
                    >
                        <span className="ds-select__value">
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                        <ChevronDown
                            size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20}
                            className="ds-select__icon"
                        />
                    </button>

                    {isOpen && (
                        <div className="ds-select__dropdown">
                            {searchable && (
                                <div className="ds-select__search">
                                    <Search size={16} className="ds-select__search-icon" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        className="ds-select__search-input"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            )}

                            <ul className="ds-select__options" role="listbox">
                                {filteredOptions.length > 0 ? (
                                    filteredOptions.map((option) => (
                                        <li
                                            key={option.value}
                                            className={`ds-select__option ${option.value === value ? 'ds-select__option--selected' : ''
                                                } ${option.disabled ? 'ds-select__option--disabled' : ''}`}
                                            onClick={() => !option.disabled && handleSelect(option.value)}
                                            role="option"
                                            aria-selected={option.value === value}
                                        >
                                            <span>{option.label}</span>
                                            {option.value === value && <Check size={16} />}
                                        </li>
                                    ))
                                ) : (
                                    <li className="ds-select__option ds-select__option--empty">
                                        No options found
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>

                {error && (
                    <p className="ds-select__message ds-select__message--error">
                        {error}
                    </p>
                )}

                {!error && helperText && (
                    <p className="ds-select__message ds-select__message--helper">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

Select.displayName = 'Select';
