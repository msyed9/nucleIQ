/**
 * Custom React Hooks
 * Reusable hooks for common patterns across the application
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api from '../services/api';
import { PaginatedResponse, ApiError } from '../types/api';

// ============================================
// useApi - Generic API Hook
// ============================================

interface UseApiOptions<T> {
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    params?: Record<string, any>;
    body?: any;
    immediate?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: ApiError) => void;
    transformResponse?: (data: any) => T;
}

interface UseApiState<T> {
    data: T | null;
    loading: boolean;
    error: ApiError | null;
    execute: (overrideOptions?: Partial<UseApiOptions<T>>) => Promise<T | null>;
    reset: () => void;
    setData: React.Dispatch<React.SetStateAction<T | null>>;
}

export function useApi<T>({
    url,
    method = 'GET',
    params,
    body,
    immediate = false,
    onSuccess,
    onError,
    transformResponse,
}: UseApiOptions<T>): UseApiState<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<ApiError | null>(null);
    const isMounted = useRef(true);

    const execute = useCallback(async (overrideOptions?: Partial<UseApiOptions<T>>): Promise<T | null> => {
        const finalUrl = overrideOptions?.url ?? url;
        const finalMethod = overrideOptions?.method ?? method;
        const finalParams = { ...params, ...overrideOptions?.params };
        const finalBody = overrideOptions?.body ?? body;

        setLoading(true);
        setError(null);

        try {
            const response = await api.request({
                url: finalUrl,
                method: finalMethod,
                params: finalParams,
                data: finalBody,
            });

            if (!isMounted.current) return null;

            const result = transformResponse ? transformResponse(response.data) : response.data;
            setData(result);
            onSuccess?.(result);
            return result;
        } catch (err: any) {
            if (!isMounted.current) return null;

            const apiError: ApiError = {
                detail: err.response?.data?.detail || err.message,
                message: err.response?.data?.message || err.message,
                errors: err.response?.data?.errors,
                status: err.response?.status,
            };
            setError(apiError);
            onError?.(apiError);
            return null;
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, [url, method, params, body, onSuccess, onError, transformResponse]);

    const reset = useCallback(() => {
        setData(null);
        setError(null);
        setLoading(false);
    }, []);

    useEffect(() => {
        isMounted.current = true;
        if (immediate) {
            execute();
        }
        return () => {
            isMounted.current = false;
        };
    }, [immediate, execute]);

    return { data, loading, error, execute, reset, setData };
}

// ============================================
// usePaginatedApi - Paginated API Hook
// ============================================

interface UsePaginatedApiOptions<T> {
    url: string;
    params?: Record<string, any>;
    pageSize?: number;
    immediate?: boolean;
    onSuccess?: (data: PaginatedResponse<T>) => void;
    onError?: (error: ApiError) => void;
}

interface UsePaginatedApiState<T> {
    data: T[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
    loading: boolean;
    error: ApiError | null;
    fetchPage: (page: number) => Promise<void>;
    nextPage: () => Promise<void>;
    previousPage: () => Promise<void>;
    refresh: () => Promise<void>;
    updateParams: (newParams: Record<string, any>) => void;
}

export function usePaginatedApi<T>({
    url,
    params = {},
    pageSize = 20,
    immediate = true,
    onSuccess,
    onError,
}: UsePaginatedApiOptions<T>): UsePaginatedApiState<T> {
    const [data, setData] = useState<T[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<ApiError | null>(null);
    const [searchParams, setSearchParams] = useState(params);
    const isMounted = useRef(true);

    const totalPages = useMemo(() => Math.ceil(totalCount / pageSize), [totalCount, pageSize]);
    const hasNext = currentPage < totalPages;
    const hasPrevious = currentPage > 1;

    const fetchPage = useCallback(async (page: number) => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get<PaginatedResponse<T>>(url, {
                params: {
                    ...searchParams,
                    page,
                    page_size: pageSize,
                },
            });

            if (!isMounted.current) return;

            setData(response.data.results);
            setTotalCount(response.data.count);
            setCurrentPage(page);
            onSuccess?.(response.data);
        } catch (err: any) {
            if (!isMounted.current) return;

            const apiError: ApiError = {
                detail: err.response?.data?.detail || err.message,
                status: err.response?.status,
            };
            setError(apiError);
            onError?.(apiError);
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, [url, searchParams, pageSize, onSuccess, onError]);

    const nextPage = useCallback(async () => {
        if (hasNext) {
            await fetchPage(currentPage + 1);
        }
    }, [hasNext, currentPage, fetchPage]);

    const previousPage = useCallback(async () => {
        if (hasPrevious) {
            await fetchPage(currentPage - 1);
        }
    }, [hasPrevious, currentPage, fetchPage]);

    const refresh = useCallback(async () => {
        await fetchPage(currentPage);
    }, [currentPage, fetchPage]);

    const updateParams = useCallback((newParams: Record<string, any>) => {
        setSearchParams(prev => ({ ...prev, ...newParams }));
        setCurrentPage(1);
    }, []);

    useEffect(() => {
        isMounted.current = true;
        if (immediate) {
            fetchPage(1);
        }
        return () => {
            isMounted.current = false;
        };
    }, [immediate, fetchPage]);

    return {
        data,
        totalCount,
        currentPage,
        totalPages,
        hasNext,
        hasPrevious,
        loading,
        error,
        fetchPage,
        nextPage,
        previousPage,
        refresh,
        updateParams,
    };
}

// ============================================
// useDebounce - Debounced Value Hook
// ============================================

export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}

// ============================================
// useLocalStorage - Local Storage Hook
// ============================================

export function useLocalStorage<T>(
    key: string,
    initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    const setValue = useCallback((value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    const removeValue = useCallback(() => {
        try {
            window.localStorage.removeItem(key);
            setStoredValue(initialValue);
        } catch (error) {
            console.error(`Error removing localStorage key "${key}":`, error);
        }
    }, [key, initialValue]);

    return [storedValue, setValue, removeValue];
}

// ============================================
// useModal - Modal State Hook
// ============================================

interface UseModalState<T = undefined> {
    isOpen: boolean;
    data: T | null;
    open: (data?: T) => void;
    close: () => void;
    toggle: () => void;
}

export function useModal<T = undefined>(initialOpen = false): UseModalState<T> {
    const [isOpen, setIsOpen] = useState(initialOpen);
    const [data, setData] = useState<T | null>(null);

    const open = useCallback((modalData?: T) => {
        setData(modalData ?? null);
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
        setData(null);
    }, []);

    const toggle = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    return { isOpen, data, open, close, toggle };
}

// ============================================
// useForm - Form State Hook
// ============================================

interface UseFormOptions<T> {
    initialValues: T;
    validate?: (values: T) => Partial<Record<keyof T, string>>;
    onSubmit: (values: T) => Promise<void> | void;
}

interface UseFormState<T> {
    values: T;
    errors: Partial<Record<keyof T, string>>;
    touched: Partial<Record<keyof T, boolean>>;
    isSubmitting: boolean;
    isValid: boolean;
    isDirty: boolean;
    handleChange: (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    handleBlur: (field: keyof T) => () => void;
    setFieldValue: (field: keyof T, value: any) => void;
    setFieldError: (field: keyof T, error: string) => void;
    setValues: (values: Partial<T>) => void;
    resetForm: () => void;
    handleSubmit: (e?: React.FormEvent) => Promise<void>;
}

export function useForm<T extends Record<string, any>>({
    initialValues,
    validate,
    onSubmit,
}: UseFormOptions<T>): UseFormState<T> {
    const [values, setValuesState] = useState<T>(initialValues);
    const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
    const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isDirty = useMemo(() => {
        return JSON.stringify(values) !== JSON.stringify(initialValues);
    }, [values, initialValues]);

    const isValid = useMemo(() => {
        return Object.keys(errors).length === 0;
    }, [errors]);

    const handleChange = useCallback((field: keyof T) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const value = e.target.type === 'checkbox'
            ? (e.target as HTMLInputElement).checked
            : e.target.value;
        setValuesState(prev => ({ ...prev, [field]: value }));

        // Clear error when user types
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    }, [errors]);

    const handleBlur = useCallback((field: keyof T) => () => {
        setTouched(prev => ({ ...prev, [field]: true }));

        // Run validation on blur
        if (validate) {
            const validationErrors = validate(values);
            if (validationErrors[field]) {
                setErrors(prev => ({ ...prev, [field]: validationErrors[field] }));
            }
        }
    }, [values, validate]);

    const setFieldValue = useCallback((field: keyof T, value: any) => {
        setValuesState(prev => ({ ...prev, [field]: value }));
    }, []);

    const setFieldError = useCallback((field: keyof T, error: string) => {
        setErrors(prev => ({ ...prev, [field]: error }));
    }, []);

    const setValues = useCallback((newValues: Partial<T>) => {
        setValuesState(prev => ({ ...prev, ...newValues }));
    }, []);

    const resetForm = useCallback(() => {
        setValuesState(initialValues);
        setErrors({});
        setTouched({});
        setIsSubmitting(false);
    }, [initialValues]);

    const handleSubmit = useCallback(async (e?: React.FormEvent) => {
        e?.preventDefault();

        // Mark all fields as touched
        const allTouched = Object.keys(values).reduce((acc, key) => {
            acc[key as keyof T] = true;
            return acc;
        }, {} as Record<keyof T, boolean>);
        setTouched(allTouched);

        // Run validation
        if (validate) {
            const validationErrors = validate(values);
            if (Object.keys(validationErrors).length > 0) {
                setErrors(validationErrors);
                return;
            }
        }

        setIsSubmitting(true);
        try {
            await onSubmit(values);
        } finally {
            setIsSubmitting(false);
        }
    }, [values, validate, onSubmit]);

    return {
        values,
        errors,
        touched,
        isSubmitting,
        isValid,
        isDirty,
        handleChange,
        handleBlur,
        setFieldValue,
        setFieldError,
        setValues,
        resetForm,
        handleSubmit,
    };
}

// ============================================
// useConfirmDialog - Confirmation Dialog Hook
// ============================================

interface ConfirmDialogOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: 'primary' | 'error' | 'warning';
    onConfirm: () => Promise<void> | void;
    onCancel?: () => void;
}

interface UseConfirmDialogState {
    isOpen: boolean;
    options: ConfirmDialogOptions | null;
    isLoading: boolean;
    confirm: (options: ConfirmDialogOptions) => void;
    handleConfirm: () => Promise<void>;
    handleCancel: () => void;
}

export function useConfirmDialog(): UseConfirmDialogState {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmDialogOptions | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const confirm = useCallback((dialogOptions: ConfirmDialogOptions) => {
        setOptions(dialogOptions);
        setIsOpen(true);
    }, []);

    const handleConfirm = useCallback(async () => {
        if (!options) return;

        setIsLoading(true);
        try {
            await options.onConfirm();
            setIsOpen(false);
            setOptions(null);
        } finally {
            setIsLoading(false);
        }
    }, [options]);

    const handleCancel = useCallback(() => {
        options?.onCancel?.();
        setIsOpen(false);
        setOptions(null);
    }, [options]);

    return { isOpen, options, isLoading, confirm, handleConfirm, handleCancel };
}

// ============================================
// useClickOutside - Click Outside Hook
// ============================================

export function useClickOutside<T extends HTMLElement>(
    callback: () => void
): React.RefObject<T> {
    const ref = useRef<T>(null);

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                callback();
            }
        };

        document.addEventListener('mousedown', handleClick);
        return () => {
            document.removeEventListener('mousedown', handleClick);
        };
    }, [callback]);

    return ref;
}

// ============================================
// useWindowSize - Window Size Hook
// ============================================

interface WindowSize {
    width: number;
    height: number;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
}

export function useWindowSize(): WindowSize {
    const [windowSize, setWindowSize] = useState<WindowSize>({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth < 768,
        isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
        isDesktop: window.innerWidth >= 1024,
    });

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            setWindowSize({
                width,
                height,
                isMobile: width < 768,
                isTablet: width >= 768 && width < 1024,
                isDesktop: width >= 1024,
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowSize;
}

// ============================================
// useCopyToClipboard - Clipboard Hook
// ============================================

interface UseCopyToClipboardState {
    copied: boolean;
    copy: (text: string) => Promise<boolean>;
    reset: () => void;
}

export function useCopyToClipboard(resetDelay: number = 2000): UseCopyToClipboardState {
    const [copied, setCopied] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout>();

    const copy = useCallback(async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
                setCopied(false);
            }, resetDelay);

            return true;
        } catch (error) {
            console.error('Failed to copy:', error);
            return false;
        }
    }, [resetDelay]);

    const reset = useCallback(() => {
        setCopied(false);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    }, []);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return { copied, copy, reset };
}

// ============================================
// useInterval - Interval Hook
// ============================================

export function useInterval(callback: () => void, delay: number | null): void {
    const savedCallback = useRef(callback);

    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
        if (delay === null) return;

        const id = setInterval(() => savedCallback.current(), delay);
        return () => clearInterval(id);
    }, [delay]);
}

// Export all types
export type {
    UseApiOptions,
    UseApiState,
    UsePaginatedApiOptions,
    UsePaginatedApiState,
    UseModalState,
    UseFormOptions,
    UseFormState,
    ConfirmDialogOptions,
    UseConfirmDialogState,
    WindowSize,
    UseCopyToClipboardState,
};

// Re-export list page hooks
export {
    useListFilters,
    useSelection,
    useSorting,
    usePagination,
    useListData,
    useDeleteConfirmation,
    useBulkActions,
} from './useListPage';

export type {
    FilterConfig,
    SortDirection,
    UsePaginationOptions,
    UseListDataOptions,
    UseListDataState,
    UseDeleteConfirmationOptions,
    UseBulkActionsOptions,
} from './useListPage';
