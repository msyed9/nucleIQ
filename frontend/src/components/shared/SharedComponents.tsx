/**
 * Shared UI Components
 * Reusable components to reduce duplication across the application
 */

import React, { ReactNode } from 'react';
import './SharedComponents.css';

// ============================================
// PageHeader Component
// ============================================

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    icon?: ReactNode;
    actions?: ReactNode;
    breadcrumbs?: Array<{ label: string; href?: string }>;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    subtitle,
    icon,
    actions,
    breadcrumbs,
}) => {
    // Helper to render actions properly even if passed as simple objects
    const renderActions = () => {
        if (!actions) return null;

        if (Array.isArray(actions)) {
            return (
                <div className="page-header-actions">
                    {actions.map((action, index) => {
                        // If it's a valid React element (like a button or component)
                        if (React.isValidElement(action)) {
                            return <React.Fragment key={index}>{action}</React.Fragment>;
                        }

                        // If it's a plain object with the expected keys
                        if (typeof action === 'object' && action !== null && ('label' in action || 'onClick' in action)) {
                            const a = action as any;
                            return (
                                <button
                                    key={index}
                                    className={`btn btn-${a.variant || 'primary'}`}
                                    onClick={a.onClick}
                                >
                                    {a.icon && <span className="btn-icon">{a.icon}</span>}
                                    {a.label}
                                </button>
                            );
                        }

                        // Fallback for other types that React can render (strings, numbers)
                        return <React.Fragment key={index}>{action}</React.Fragment>;
                    })}
                </div>
            );
        }

        return <div className="page-header-actions">{actions}</div>;
    };

    return (
        <div className="page-header">
            {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="breadcrumbs">
                    {breadcrumbs.map((crumb, index) => (
                        <span key={index} className="breadcrumb-item">
                            {crumb.href ? (
                                <a href={crumb.href}>{crumb.label}</a>
                            ) : (
                                <span>{crumb.label}</span>
                            )}
                            {index < breadcrumbs.length - 1 && (
                                <span className="breadcrumb-separator">/</span>
                            )}
                        </span>
                    ))}
                </nav>
            )}
            <div className="page-header-content">
                <div className="page-header-title-section">
                    {icon && <div className="page-header-icon">{icon}</div>}
                    <div>
                        <h1 className="page-title">{title}</h1>
                        {subtitle && <p className="page-subtitle">{subtitle}</p>}
                    </div>
                </div>
                {renderActions()}
            </div>
        </div>
    );
};

// ============================================
// DataCard Component
// ============================================

interface DataCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: ReactNode;
    trend?: {
        value: number;
        direction: 'up' | 'down' | 'neutral';
        label?: string;
    };
    color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
    variant?: 'primary' | 'success' | 'warning' | 'error' | 'info';
    onClick?: () => void;
    loading?: boolean;
}

export const DataCard: React.FC<DataCardProps> = ({
    title,
    value,
    subtitle,
    icon,
    trend,
    color = 'primary',
    variant,
    onClick,
    loading = false,
}) => {
    const finalColor = variant || color;
    return (
        <div
            className={`data-card data-card-${finalColor} ${onClick ? 'data-card-clickable' : ''}`}
            onClick={onClick}
        >
            {loading ? (
                <div className="data-card-skeleton">
                    <div className="skeleton skeleton-title" />
                    <div className="skeleton skeleton-value" />
                </div>
            ) : (
                <>
                    <div className="data-card-header">
                        <span className="data-card-title">{title}</span>
                        {icon && <div className="data-card-icon">{icon}</div>}
                    </div>
                    <div className="data-card-value">{value}</div>
                    {(subtitle || trend) && (
                        <div className="data-card-footer">
                            {trend && (
                                <span className={`data-card-trend trend-${trend.direction}`}>
                                    {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}
                                    {Math.abs(trend.value)}%
                                    {trend.label && <span className="trend-label">{trend.label}</span>}
                                </span>
                            )}
                            {subtitle && <span className="data-card-subtitle">{subtitle}</span>}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

// ============================================
// EmptyState Component
// ============================================

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    action,
}) => {
    return (
        <div className="empty-state">
            {icon && <div className="empty-state-icon">{icon}</div>}
            <h3 className="empty-state-title">{title}</h3>
            {description && <p className="empty-state-description">{description}</p>}
            {action && (
                <button className="btn btn-primary" onClick={action.onClick}>
                    {action.label}
                </button>
            )}
        </div>
    );
};

// ============================================
// LoadingSpinner Component
// ============================================

interface LoadingSpinnerProps {
    size?: 'small' | 'medium' | 'large';
    text?: string;
    fullPage?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'medium',
    text,
    fullPage = false,
}) => {
    const spinner = (
        <div className={`loading-spinner loading-spinner-${size}`}>
            <div className="spinner" />
            {text && <p className="loading-text">{text}</p>}
        </div>
    );

    if (fullPage) {
        return <div className="loading-fullpage">{spinner}</div>;
    }

    return spinner;
};

// ============================================
// StatusBadge Component
// ============================================

interface StatusBadgeProps {
    status: string;
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'dot' | 'outline';
    size?: 'small' | 'medium';
    customColors?: {
        background: string;
        text: string;
    };
}

const statusColors: Record<string, { bg: string; text: string }> = {
    active: { bg: '#dcfce7', text: '#166534' },
    inactive: { bg: '#f3f4f6', text: '#4b5563' },
    pending: { bg: '#fef3c7', text: '#92400e' },
    completed: { bg: '#dbeafe', text: '#1e40af' },
    paid: { bg: '#dcfce7', text: '#166534' },
    partial: { bg: '#fef3c7', text: '#92400e' },
    overdue: { bg: '#fee2e2', text: '#991b1b' },
    cancelled: { bg: '#f3f4f6', text: '#4b5563' },
    failed: { bg: '#fee2e2', text: '#991b1b' },
    present: { bg: '#dcfce7', text: '#166534' },
    absent: { bg: '#fee2e2', text: '#991b1b' },
    late: { bg: '#fef3c7', text: '#92400e' },
    approved: { bg: '#dcfce7', text: '#166534' },
    rejected: { bg: '#fee2e2', text: '#991b1b' },
    draft: { bg: '#f3f4f6', text: '#4b5563' },
    published: { bg: '#dbeafe', text: '#1e40af' },
    open: { bg: '#dbeafe', text: '#1e40af' },
    closed: { bg: '#f3f4f6', text: '#4b5563' },
    resolved: { bg: '#dcfce7', text: '#166534' },
};

const variantColors: Record<string, { bg: string; text: string }> = {
    success: { bg: '#dcfce7', text: '#166534' },
    warning: { bg: '#fef3c7', text: '#92400e' },
    error: { bg: '#fee2e2', text: '#991b1b' },
    info: { bg: '#dbeafe', text: '#1e40af' },
    default: { bg: '#f3f4f6', text: '#4b5563' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
    status,
    variant = 'default',
    size = 'medium',
    customColors,
}) => {
    const normalizedStatus = status.toLowerCase().replace(/_/g, '');
    const semanticVariant = ['success', 'warning', 'error', 'info'].includes(variant) ? variant : null;

    const colors = customColors ||
        (semanticVariant ? variantColors[semanticVariant] : null) ||
        statusColors[normalizedStatus] ||
        statusColors.inactive;

    const isDot = variant === 'dot';
    const isOutline = variant === 'outline';

    return (
        <span
            className={`status-badge ${isDot ? 'status-badge-dot' : ''} ${isOutline ? 'status-badge-outline' : ''} status-badge-${size}`}
            style={{
                backgroundColor: isOutline ? 'transparent' : (colors as any).bg || (colors as any).background,
                color: colors.text,
                borderColor: isOutline ? colors.text : 'transparent',
            }}
        >
            {isDot && (
                <span className="status-dot" style={{ backgroundColor: colors.text }} />
            )}
            {status.replace(/_/g, ' ')}
        </span>
    );
};

// ============================================
// ConfirmDialog Component
// ============================================

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: 'primary' | 'error' | 'warning';
    isLoading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmColor = 'primary',
    isLoading = false,
    onConfirm,
    onCancel,
}) => {
    if (!isOpen) return null;

    return (
        <div className="dialog-overlay" onClick={onCancel}>
            <div className="dialog-container" onClick={(e) => e.stopPropagation()}>
                <h3 className="dialog-title">{title}</h3>
                <p className="dialog-message">{message}</p>
                <div className="dialog-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        {cancelText}
                    </button>
                    <button
                        className={`btn btn-${confirmColor}`}
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? <LoadingSpinner size="small" /> : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================
// DataTable Component
// ============================================

interface Column<T> {
    key: string;
    title: ReactNode;
    render?: (item: T) => ReactNode;
    sortable?: boolean;
    width?: string;
    align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    loading?: boolean;
    emptyMessage?: string;
    emptyState?: ReactNode;
    onRowClick?: (item: T) => void;
    selectedIds?: (string | number)[];
    onSelectionChange?: (ids: (string | number)[]) => void;
    selectable?: boolean;
    idKey?: keyof T;
    stickyHeader?: boolean;
    compact?: boolean;
    pagination?: {
        currentPage: number;
        pageSize: number;
        totalItems: number;
        onPageChange: (page: number) => void;
        onPageSizeChange?: (size: number) => void;
    };
    onSort?: (column: string) => void;
    sortColumn?: string;
    sortDirection?: 'asc' | 'desc';
}

export function DataTable<T extends Record<string, any>>({
    data,
    columns,
    loading = false,
    emptyMessage = 'No data available',
    emptyState,
    onRowClick,
    selectedIds = [],
    onSelectionChange,
    selectable = false,
    idKey = 'id' as keyof T,
    stickyHeader = false,
    compact = false,
    pagination,
    onSort,
    sortColumn,
    sortDirection,
}: DataTableProps<T>): JSX.Element {
    const handleSelectAll = () => {
        if (!onSelectionChange) return;
        if (selectedIds.length === data.length && data.length > 0) {
            onSelectionChange([]);
        } else {
            onSelectionChange(data.map((item) => item[idKey] as any));
        }
    };

    const handleSelectRow = (id: string | number) => {
        if (!onSelectionChange) return;
        const newSelection = selectedIds.includes(id)
            ? selectedIds.filter((i) => i !== id)
            : [...selectedIds, id];
        onSelectionChange(newSelection);
    };

    return (
        <div className="data-table-wrapper">
            <div className={`data-table-container ${compact ? 'compact' : ''} ${stickyHeader ? 'sticky-header' : ''}`}>
                <table className="data-table">
                    <thead>
                        <tr>
                            {selectable && (
                                <th className="th-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={data.length > 0 && selectedIds.length === data.length}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                            )}
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    style={{ width: col.width, textAlign: col.align || 'left' }}
                                    className={col.sortable ? 'sortable' : ''}
                                    onClick={() => col.sortable && onSort?.(col.key)}
                                >
                                    <div className="th-content">
                                        {col.title}
                                        {col.sortable && sortColumn === col.key && (
                                            <span className={`sort-icon ${sortDirection}`}>
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={`skeleton-${i}`}>
                                    <td colSpan={columns.length + (selectable ? 1 : 0)}>
                                        <div className="skeleton skeleton-row" />
                                    </td>
                                </tr>
                            ))
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (selectable ? 1 : 0)}>
                                    {emptyState ? emptyState : <EmptyState title={emptyMessage} />}
                                </td>
                            </tr>
                        ) : (
                            data.map((item, index) => {
                                const id = item[idKey] as any;
                                const isSelected = selectedIds.includes(id);
                                return (
                                    <tr
                                        key={id || index}
                                        className={`${onRowClick ? 'clickable' : ''} ${isSelected ? 'selected' : ''}`}
                                        onClick={() => onRowClick?.(item)}
                                    >
                                        {selectable && (
                                            <td className="td-checkbox" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleSelectRow(id)}
                                                />
                                            </td>
                                        )}
                                        {columns.map((col) => (
                                            <td key={col.key} style={{ textAlign: col.align || 'left' }}>
                                                {col.render ? col.render(item) : item[col.key]}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
            {pagination && (
                <div className="table-pagination">
                    <Pagination
                        currentPage={pagination.currentPage}
                        totalPages={Math.ceil(pagination.totalItems / pagination.pageSize)}
                        totalItems={pagination.totalItems}
                        pageSize={pagination.pageSize}
                        onPageChange={pagination.onPageChange}
                    />
                    {pagination.onPageSizeChange && (
                        <div className="page-size-selector">
                            <span>Rows per page:</span>
                            <select
                                value={pagination.pageSize}
                                onChange={(e) => pagination.onPageSizeChange?.(Number(e.target.value))}
                            >
                                {[10, 25, 50, 100].map(size => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ============================================
// Pagination Component
// ============================================

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    showInfo?: boolean;
    totalItems?: number;
    pageSize?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    showInfo = true,
    totalItems,
    pageSize = 20,
}) => {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems || 0);

    return (
        <div className="pagination-container">
            {showInfo && totalItems !== undefined && (
                <span className="pagination-info">
                    Showing {startItem} to {endItem} of {totalItems} entries
                </span>
            )}
            <div className="pagination">
                <button
                    className="pagination-btn"
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                >
                    ««
                </button>
                <button
                    className="pagination-btn"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    «
                </button>
                {startPage > 1 && (
                    <>
                        <button className="pagination-btn" onClick={() => onPageChange(1)}>
                            1
                        </button>
                        {startPage > 2 && <span className="pagination-ellipsis">...</span>}
                    </>
                )}
                {pages.map((page) => (
                    <button
                        key={page}
                        className={`pagination-btn ${page === currentPage ? 'active' : ''}`}
                        onClick={() => onPageChange(page)}
                    >
                        {page}
                    </button>
                ))}
                {endPage < totalPages && (
                    <>
                        {endPage < totalPages - 1 && <span className="pagination-ellipsis">...</span>}
                        <button className="pagination-btn" onClick={() => onPageChange(totalPages)}>
                            {totalPages}
                        </button>
                    </>
                )}
                <button
                    className="pagination-btn"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    »
                </button>
                <button
                    className="pagination-btn"
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                >
                    »»
                </button>
            </div>
        </div>
    );
};

// ============================================
// SearchInput Component
// ============================================

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    debounceMs?: number;
    onSearch?: (value: string) => void;
    loading?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
    value,
    onChange,
    placeholder = 'Search...',
    debounceMs = 300,
    onSearch,
    loading = false,
}) => {
    const [localValue, setLocalValue] = React.useState(value);
    const timeoutRef = React.useRef<NodeJS.Timeout>();

    React.useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setLocalValue(newValue);

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            onChange(newValue);
            onSearch?.(newValue);
        }, debounceMs);
    };

    const handleClear = () => {
        setLocalValue('');
        onChange('');
        onSearch?.('');
    };

    return (
        <div className="search-input-container">
            <span className="search-icon">🔍</span>
            <input
                type="text"
                className="search-input"
                value={localValue}
                onChange={handleChange}
                placeholder={placeholder}
            />
            {loading && <span className="search-loading">⟳</span>}
            {localValue && !loading && (
                <button className="search-clear" onClick={handleClear}>
                    ✕
                </button>
            )}
        </div>
    );
};

// ============================================
// FilterDropdown Component
// ============================================

interface FilterOption {
    value: string;
    label: string;
}

interface FilterDropdownProps {
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
    allLabel?: string;
    placeholder?: string;
    disabled?: boolean;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
    label,
    value,
    options,
    onChange,
    allLabel = 'All',
    placeholder,
    disabled = false,
}) => {
    return (
        <div className={`filter-dropdown ${disabled ? 'disabled' : ''}`}>
            <label className="filter-label">{label}</label>
            <select
                className="filter-select"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
            >
                <option value="">{placeholder || allLabel}</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

// ============================================
// Tabs Component
// ============================================

interface Tab {
    id: string;
    label: string;
    icon?: ReactNode;
    badge?: number;
    disabled?: boolean;
}

interface TabsProps {
    tabs: Tab[];
    activeTab: string;
    onChange: (tabId: string) => void;
    variant?: 'default' | 'pills' | 'underline';
}

export const Tabs: React.FC<TabsProps> = ({
    tabs,
    activeTab,
    onChange,
    variant = 'default',
}) => {
    return (
        <div className={`tabs tabs-${variant}`}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    className={`tab ${activeTab === tab.id ? 'active' : ''} ${tab.disabled ? 'disabled' : ''}`}
                    onClick={() => !tab.disabled && onChange(tab.id)}
                    disabled={tab.disabled}
                >
                    {tab.icon && <span className="tab-icon">{tab.icon}</span>}
                    <span className="tab-label">{tab.label}</span>
                    {tab.badge !== undefined && tab.badge > 0 && (
                        <span className="tab-badge">{tab.badge}</span>
                    )}
                </button>
            ))}
        </div>
    );
};

// Export types
export type {
    PageHeaderProps,
    DataCardProps,
    EmptyStateProps,
    LoadingSpinnerProps,
    StatusBadgeProps,
    ConfirmDialogProps,
    Column,
    DataTableProps,
    PaginationProps,
    SearchInputProps,
    FilterOption,
    FilterDropdownProps,
    Tab,
    TabsProps,
};
