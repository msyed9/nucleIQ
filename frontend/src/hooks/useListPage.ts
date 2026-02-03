/**
 * Common List Page Hooks
 * Reusable hooks for list pages with search, filter, pagination, and selection
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';

// ============================================
// useListFilters - URL-synced filters
// ============================================

export interface FilterConfig {
    [key: string]: {
        defaultValue: string;
        urlKey?: string;
    };
}

export function useListFilters<T extends Record<string, string>>(config: FilterConfig) {
    const [searchParams, setSearchParams] = useSearchParams();

    // Initialize filters from URL
    const [filters, setFilters] = useState<T>(() => {
        const initial: Record<string, string> = {};
        Object.entries(config).forEach(([key, conf]) => {
            const urlKey = conf.urlKey || key;
            initial[key] = searchParams.get(urlKey) || conf.defaultValue;
        });
        return initial as T;
    });

    // Update URL when filters change
    useEffect(() => {
        const params: Record<string, string> = {};
        Object.entries(filters).forEach(([key, value]) => {
            const conf = config[key];
            if (value && value !== conf?.defaultValue) {
                params[conf?.urlKey || key] = value;
            }
        });
        setSearchParams(params, { replace: true });
    }, [filters, config, setSearchParams]);

    const updateFilter = useCallback((key: keyof T, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    const resetFilters = useCallback(() => {
        const initial: Record<string, string> = {};
        Object.entries(config).forEach(([key, conf]) => {
            initial[key] = conf.defaultValue;
        });
        setFilters(initial as T);
    }, [config]);

    return { filters, updateFilter, resetFilters, setFilters };
}

// ============================================
// useSelection - Row selection management
// ============================================

export function useSelection<T extends { id: string | number }>(items: T[]) {
    const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

    const isSelected = useCallback((id: string | number) => selectedIds.has(id), [selectedIds]);

    const isAllSelected = useMemo(() =>
        items.length > 0 && selectedIds.size === items.length,
        [items.length, selectedIds.size]
    );

    const isSomeSelected = useMemo(() =>
        selectedIds.size > 0 && selectedIds.size < items.length,
        [items.length, selectedIds.size]
    );

    const toggleItem = useCallback((id: string | number) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);

    const selectItem = useCallback((id: string | number, selected: boolean) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (selected) {
                newSet.add(id);
            } else {
                newSet.delete(id);
            }
            return newSet;
        });
    }, []);

    const selectAll = useCallback(() => {
        setSelectedIds(new Set(items.map(item => item.id)));
    }, [items]);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const toggleAll = useCallback(() => {
        if (isAllSelected) {
            clearSelection();
        } else {
            selectAll();
        }
    }, [isAllSelected, selectAll, clearSelection]);

    return {
        selectedIds: Array.from(selectedIds),
        selectedCount: selectedIds.size,
        isSelected,
        isAllSelected,
        isSomeSelected,
        toggleItem,
        selectItem,
        selectAll,
        clearSelection,
        toggleAll,
    };
}

// ============================================
// useSorting - Column sorting
// ============================================

export type SortDirection = 'asc' | 'desc';

export function useSorting(defaultColumn = '', defaultDirection: SortDirection = 'asc') {
    const [sortColumn, setSortColumn] = useState(defaultColumn);
    const [sortDirection, setSortDirection] = useState<SortDirection>(defaultDirection);

    const handleSort = useCallback((column: string) => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    }, [sortColumn]);

    const getOrdering = useCallback(() => {
        if (!sortColumn) return undefined;
        return sortDirection === 'desc' ? `-${sortColumn}` : sortColumn;
    }, [sortColumn, sortDirection]);

    const resetSort = useCallback(() => {
        setSortColumn(defaultColumn);
        setSortDirection(defaultDirection);
    }, [defaultColumn, defaultDirection]);

    return {
        sortColumn,
        sortDirection,
        handleSort,
        getOrdering,
        resetSort,
    };
}

// ============================================
// usePagination - Client or server pagination
// ============================================

export interface UsePaginationOptions {
    defaultPage?: number;
    defaultPageSize?: number;
    totalItems?: number;
}

export function usePagination(options: UsePaginationOptions = {}) {
    const {
        defaultPage = 1,
        defaultPageSize = 20,
        totalItems = 0,
    } = options;

    const [page, setPage] = useState(defaultPage);
    const [pageSize, setPageSize] = useState(defaultPageSize);
    const [total, setTotal] = useState(totalItems);

    const totalPages = useMemo(() => Math.ceil(total / pageSize), [total, pageSize]);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const goToPage = useCallback((newPage: number) => {
        const clampedPage = Math.max(1, Math.min(newPage, totalPages || 1));
        setPage(clampedPage);
    }, [totalPages]);

    const nextPage = useCallback(() => {
        if (hasNextPage) setPage(prev => prev + 1);
    }, [hasNextPage]);

    const prevPage = useCallback(() => {
        if (hasPrevPage) setPage(prev => prev - 1);
    }, [hasPrevPage]);

    const changePageSize = useCallback((newSize: number) => {
        setPageSize(newSize);
        setPage(1); // Reset to first page when changing page size
    }, []);

    const reset = useCallback(() => {
        setPage(defaultPage);
        setPageSize(defaultPageSize);
    }, [defaultPage, defaultPageSize]);

    return {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
        goToPage,
        nextPage,
        prevPage,
        setTotal,
        changePageSize,
        reset,
    };
}

// ============================================
// useListData - Combined list data fetching
// ============================================

export interface UseListDataOptions<T> {
    endpoint: string;
    filters?: Record<string, string | boolean | number>;
    ordering?: string;
    page?: number;
    pageSize?: number;
    immediate?: boolean;
    transformResponse?: (data: any) => T[];
    onSuccess?: (data: any) => void;  // Called with full response when data is fetched
}

export interface UseListDataState<T> {
    data: T[];
    loading: boolean;
    error: string | null;
    total: number;
    refresh: () => Promise<void>;
}

export function useListData<T>(options: UseListDataOptions<T>): UseListDataState<T> {
    const {
        endpoint,
        filters = {},
        ordering,
        page = 1,
        pageSize = 20,
        immediate = true,
        transformResponse,
        onSuccess,
    } = options;

    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(immediate);
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState(0);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Build params
            const params: Record<string, any> = {
                page,
                page_size: pageSize,
            };

            // Add filters
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== '' && value !== undefined && value !== null) {
                    params[key] = value;
                }
            });

            // Add ordering
            if (ordering) {
                params.ordering = ordering;
            }

            const response = await api.get(endpoint, { params });

            // Handle response
            let items: T[] = [];
            let count = 0;

            if (Array.isArray(response.data)) {
                items = response.data;
                count = items.length;
            } else if (response.data?.results) {
                items = response.data.results;
                count = response.data.count || items.length;
            }

            if (transformResponse) {
                items = transformResponse(items);
            }

            setData(items);
            setTotal(count);

            // Call onSuccess with full response data
            if (onSuccess) {
                onSuccess(response.data);
            }
        } catch (err: any) {
            const message = err.response?.data?.detail || err.message || 'Failed to fetch data';
            setError(message);
            console.error('Error fetching list data:', err);
        } finally {
            setLoading(false);
        }
    }, [endpoint, filters, ordering, page, pageSize, transformResponse, onSuccess]);

    useEffect(() => {
        if (immediate) {
            fetchData();
        }
    }, [fetchData, immediate]);

    return {
        data,
        loading,
        error,
        total,
        refresh: fetchData,
    };
}

// ============================================
// useDeleteConfirmation - Delete with confirmation
// ============================================

export interface UseDeleteConfirmationOptions {
    endpoint: string;
    onSuccess?: () => void;
    onError?: (error: any) => void;
}

export function useDeleteConfirmation(options: UseDeleteConfirmationOptions) {
    const { endpoint, onSuccess, onError } = options;

    const [isOpen, setIsOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const requestDelete = useCallback((id: string | number) => {
        setItemToDelete(id);
        setIsOpen(true);
        setError(null);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        setError(null);

        try {
            await api.delete(`${endpoint}${itemToDelete}/`);
            setIsOpen(false);
            setItemToDelete(null);
            onSuccess?.();
        } catch (err: any) {
            const message = err.response?.data?.detail || 'Failed to delete';
            setError(message);
            onError?.(err);
        } finally {
            setIsDeleting(false);
        }
    }, [itemToDelete, endpoint, onSuccess, onError]);

    const cancelDelete = useCallback(() => {
        setIsOpen(false);
        setItemToDelete(null);
        setError(null);
    }, []);

    return {
        isOpen,
        itemToDelete,
        isDeleting,
        error,
        requestDelete,
        confirmDelete,
        cancelDelete,
    };
}

// ============================================
// useBulkActions - Bulk operations
// ============================================

export interface UseBulkActionsOptions {
    endpoint: string;
    onSuccess?: () => void;
    onError?: (error: any) => void;
}

export function useBulkActions(options: UseBulkActionsOptions) {
    const { endpoint, onSuccess, onError } = options;

    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const bulkDelete = useCallback(async (ids: (string | number)[]) => {
        if (ids.length === 0) return;

        setIsProcessing(true);
        setProgress(0);
        setError(null);

        try {
            const total = ids.length;
            let completed = 0;

            await Promise.all(
                ids.map(async (id) => {
                    await api.delete(`${endpoint}${id}/`);
                    completed++;
                    setProgress(Math.round((completed / total) * 100));
                })
            );

            onSuccess?.();
        } catch (err: any) {
            const message = err.response?.data?.detail || 'Failed to delete some items';
            setError(message);
            onError?.(err);
        } finally {
            setIsProcessing(false);
            setProgress(0);
        }
    }, [endpoint, onSuccess, onError]);

    const bulkUpdate = useCallback(async (ids: (string | number)[], data: Record<string, any>) => {
        if (ids.length === 0) return;

        setIsProcessing(true);
        setProgress(0);
        setError(null);

        try {
            const total = ids.length;
            let completed = 0;

            await Promise.all(
                ids.map(async (id) => {
                    await api.patch(`${endpoint}${id}/`, data);
                    completed++;
                    setProgress(Math.round((completed / total) * 100));
                })
            );

            onSuccess?.();
        } catch (err: any) {
            const message = err.response?.data?.detail || 'Failed to update some items';
            setError(message);
            onError?.(err);
        } finally {
            setIsProcessing(false);
            setProgress(0);
        }
    }, [endpoint, onSuccess, onError]);

    return {
        isProcessing,
        progress,
        error,
        bulkDelete,
        bulkUpdate,
    };
}

