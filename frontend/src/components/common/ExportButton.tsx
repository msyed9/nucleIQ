/**
 * ExportButton Component - Reusable Export Dropdown
 * 
 * Provides a dropdown menu with multiple export options:
 * - Excel (.xlsx)
 * - CSV
 * - PDF
 * - Copy to Clipboard
 * - JSON
 * - Print
 * 
 * Usage:
 * <ExportButton
 *   data={students}
 *   filename="students_list"
 *   title="Students List"
 *   columns={exportColumns}
 * />
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    exportToExcel,
    exportToCSV,
    exportToPDF,
    exportToJSON,
    copyToClipboard,
    printData,
    ExportColumn,
    ExportOptions
} from '@/utils/exportUtils';
import { useToast } from '@/design-system/components/Toast/useToast';
import './ExportButton.css';

interface ExportButtonProps {
    data: any[];
    filename?: string;
    title?: string;
    columns?: ExportColumn[];
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'small' | 'medium' | 'large';
    className?: string;
    onExportStart?: () => void;
    onExportComplete?: (format: string) => void;
    onExportError?: (error: Error) => void;
}

const ExportButton: React.FC<ExportButtonProps> = ({
    data,
    filename = 'export',
    title = 'Export',
    columns,
    disabled = false,
    variant = 'primary',
    size = 'medium',
    className = '',
    onExportStart,
    onExportComplete,
    onExportError
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { success, error: showError } = useToast();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleExport = async (
        format: 'excel' | 'csv' | 'pdf' | 'json' | 'copy' | 'print'
    ) => {
        if (data.length === 0) {
            showError('No data available to export');
            return;
        }

        setIsExporting(true);
        setIsOpen(false);
        onExportStart?.();

        try {
            const options: ExportOptions = {
                filename,
                title,
                columns,
                includeTimestamp: true
            };

            switch (format) {
                case 'excel':
                    exportToExcel(data, filename, options);
                    success(`Exported ${data.length} rows to Excel`);
                    break;

                case 'csv':
                    exportToCSV(data, filename, options);
                    success(`Exported ${data.length} rows to CSV`);
                    break;

                case 'pdf':
                    exportToPDF(data, title, {
                        ...options,
                        orientation: 'landscape',
                        pageSize: 'a4'
                    });
                    success(`Exported ${data.length} rows to PDF`);
                    break;

                case 'json':
                    exportToJSON(data, filename, options);
                    success(`Exported ${data.length} rows to JSON`);
                    break;

                case 'copy':
                    await copyToClipboard(data, options);
                    success(`Copied ${data.length} rows to clipboard`);
                    break;

                case 'print':
                    printData(data, title, options);
                    success('Print dialog opened');
                    break;

                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }

            onExportComplete?.(format);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Export failed';
            showError(errorMessage);
            onExportError?.(err instanceof Error ? err : new Error(errorMessage));
            console.error('Export error:', err);
        } finally {
            setIsExporting(false);
        }
    };

    const exportOptions = [
        {
            id: 'excel',
            label: 'Export to Excel',
            icon: '📊',
            description: 'Download as .xlsx file',
            action: () => handleExport('excel')
        },
        {
            id: 'csv',
            label: 'Export to CSV',
            icon: '📄',
            description: 'Download as .csv file',
            action: () => handleExport('csv')
        },
        {
            id: 'pdf',
            label: 'Export to PDF',
            icon: '📕',
            description: 'Download as .pdf file',
            action: () => handleExport('pdf')
        },
        {
            id: 'copy',
            label: 'Copy to Clipboard',
            icon: '📋',
            description: 'Copy data for pasting',
            action: () => handleExport('copy')
        },
        {
            id: 'json',
            label: 'Export to JSON',
            icon: '{ }',
            description: 'Download as .json file',
            action: () => handleExport('json')
        },
        {
            id: 'print',
            label: 'Print',
            icon: '🖨️',
            description: 'Open print dialog',
            action: () => handleExport('print')
        }
    ];

    return (
        <div className={`export-button-container ${className}`} ref={dropdownRef}>
            <button
                className={`export-button export-button--${variant} export-button--${size}`}
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled || isExporting || data.length === 0}
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <span className="export-button__icon">
                    {isExporting ? '⏳' : '📥'}
                </span>
                <span className="export-button__text">
                    {isExporting ? 'Exporting...' : 'Export'}
                </span>
                <span className={`export-button__chevron ${isOpen ? 'export-button__chevron--open' : ''}`}>
                    ▼
                </span>
            </button>

            {isOpen && (
                <div className="export-dropdown">
                    <div className="export-dropdown__header">
                        <span className="export-dropdown__title">Export Options</span>
                        <span className="export-dropdown__count">
                            {data.length} {data.length === 1 ? 'row' : 'rows'}
                        </span>
                    </div>
                    <div className="export-dropdown__divider" />
                    <ul className="export-dropdown__list">
                        {exportOptions.map(option => (
                            <li key={option.id} className="export-dropdown__item">
                                <button
                                    className="export-dropdown__button"
                                    onClick={option.action}
                                    disabled={isExporting}
                                >
                                    <span className="export-dropdown__icon">{option.icon}</span>
                                    <div className="export-dropdown__content">
                                        <span className="export-dropdown__label">{option.label}</span>
                                        <span className="export-dropdown__description">
                                            {option.description}
                                        </span>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default ExportButton;
