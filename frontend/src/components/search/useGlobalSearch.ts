/**
 * useGlobalSearch Hook
 * Manages global search state, API calls, and keyboard navigation
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { debounce } from 'lodash';
import api from '../../services/api';
import {
    SearchState,
    SearchResponse,
    SearchFilters,
    SearchResult,
    SuggestionsResponse,
    RecentSearchesResponse,
} from './searchTypes';

interface UseGlobalSearchOptions {
    debounceMs?: number;
    minQueryLength?: number;
    defaultLimit?: number;
    autoFetchRecent?: boolean;
}

interface UseGlobalSearchReturn {
    // State
    state: SearchState;

    // Actions
    setQuery: (query: string) => void;
    setFilters: (filters: Partial<SearchFilters>) => void;
    clearFilters: () => void;
    open: () => void;
    close: () => void;
    toggle: () => void;

    // Keyboard navigation
    selectPrevious: () => void;
    selectNext: () => void;
    getSelectedResult: () => SearchResult | null;
    setSelectedIndex: (index: number) => void;

    // Data actions
    search: (query?: string) => Promise<void>;
    fetchSuggestions: (query: string) => Promise<void>;
    fetchRecentSearches: () => Promise<void>;
    clearRecentSearches: () => Promise<void>;

    // Computed
    flatResults: SearchResult[];
    totalCount: number;
    hasResults: boolean;
    isEmptyState: boolean;
}

const DEFAULT_STATE: SearchState = {
    query: '',
    isOpen: false,
    isLoading: false,
    results: null,
    suggestions: [],
    recentSearches: [],
    selectedIndex: -1,
    filters: {},
    error: null,
};

export function useGlobalSearch(
    options: UseGlobalSearchOptions = {}
): UseGlobalSearchReturn {
    const {
        debounceMs = 300,
        minQueryLength = 2,
        defaultLimit = 20,
        autoFetchRecent = true,
    } = options;

    const [state, setState] = useState<SearchState>(DEFAULT_STATE);
    const abortControllerRef = useRef<AbortController | null>(null);

    /**
     * Perform search API call
     */
    const performSearch = useCallback(
        async (query: string, filters: SearchFilters = {}) => {
            if (!query || query.length < minQueryLength) {
                setState((prev) => ({
                    ...prev,
                    results: null,
                    isLoading: false,
                }));
                return;
            }

            // Cancel previous request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            setState((prev) => ({ ...prev, isLoading: true, error: null }));

            try {
                // Build query params
                const params = new URLSearchParams();
                params.set('q', query);
                params.set('limit', String(defaultLimit));
                params.set('grouped', 'true');

                if (filters.types && filters.types.length > 0) {
                    params.set('types', filters.types.join(','));
                }
                if (filters.classId) {
                    params.set('class_id', filters.classId);
                }
                if (filters.sectionId) {
                    params.set('section_id', filters.sectionId);
                }
                if (filters.dateFrom) {
                    params.set('date_from', filters.dateFrom);
                }
                if (filters.dateTo) {
                    params.set('date_to', filters.dateTo);
                }

                const response = await api.get<SearchResponse>(
                    `/api/search/?${params.toString()}`,
                    { signal: abortControllerRef.current.signal }
                );

                setState((prev) => ({
                    ...prev,
                    results: response.data,
                    isLoading: false,
                    selectedIndex: -1,
                }));
            } catch (error: any) {
                if (error.name === 'AbortError' || error.name === 'CanceledError') {
                    return; // Request was cancelled
                }
                console.error('Search error:', error);
                setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    error: 'Failed to perform search',
                    results: null,
                }));
            }
        },
        [minQueryLength, defaultLimit]
    );

    /**
     * Debounced search
     */
    const debouncedSearch = useCallback(
        debounce((query: string, filters: SearchFilters) => {
            performSearch(query, filters);
        }, debounceMs),
        [performSearch, debounceMs]
    );

    /**
     * Set query and trigger search
     */
    const setQuery = useCallback(
        (query: string) => {
            setState((prev) => ({ ...prev, query }));
            debouncedSearch(query, state.filters);
        },
        [debouncedSearch, state.filters]
    );

    /**
     * Manual search trigger
     */
    const search = useCallback(
        async (query?: string) => {
            const searchQuery = query ?? state.query;
            await performSearch(searchQuery, state.filters);
        },
        [performSearch, state.query, state.filters]
    );

    /**
     * Set filters and re-search
     */
    const setFilters = useCallback(
        (filters: Partial<SearchFilters>) => {
            const newFilters = { ...state.filters, ...filters };
            setState((prev) => ({ ...prev, filters: newFilters }));
            if (state.query.length >= minQueryLength) {
                debouncedSearch(state.query, newFilters);
            }
        },
        [state.filters, state.query, minQueryLength, debouncedSearch]
    );

    /**
     * Clear all filters
     */
    const clearFilters = useCallback(() => {
        setState((prev) => ({ ...prev, filters: {} }));
        if (state.query.length >= minQueryLength) {
            debouncedSearch(state.query, {});
        }
    }, [state.query, minQueryLength, debouncedSearch]);

    /**
     * Fetch suggestions for autocomplete
     */
    const fetchSuggestions = useCallback(async (query: string) => {
        if (!query || query.length < minQueryLength) {
            setState((prev) => ({ ...prev, suggestions: [] }));
            return;
        }

        try {
            const response = await api.get<SuggestionsResponse>(
                `/api/search/suggestions/?q=${encodeURIComponent(query)}&limit=10`
            );
            setState((prev) => ({ ...prev, suggestions: response.data.suggestions }));
        } catch (error) {
            console.error('Suggestions error:', error);
        }
    }, [minQueryLength]);

    /**
     * Fetch recent searches from server
     */
    const fetchRecentSearches = useCallback(async () => {
        try {
            const response = await api.get<RecentSearchesResponse>('/api/search/recent/');
            setState((prev) => ({ ...prev, recentSearches: response.data.searches }));
        } catch (error) {
            // Fallback to localStorage
            const saved = localStorage.getItem('recentSearches');
            if (saved) {
                try {
                    setState((prev) => ({
                        ...prev,
                        recentSearches: JSON.parse(saved),
                    }));
                } catch {
                    // Invalid JSON
                }
            }
        }
    }, []);

    /**
     * Clear recent searches
     */
    const clearRecentSearches = useCallback(async () => {
        try {
            await api.delete('/api/search/recent/');
            setState((prev) => ({ ...prev, recentSearches: [] }));
            localStorage.removeItem('recentSearches');
        } catch (error) {
            console.error('Clear recent searches error:', error);
        }
    }, []);

    /**
     * Dialog controls
     */
    const open = useCallback(() => {
        setState((prev) => ({ ...prev, isOpen: true }));
        if (autoFetchRecent) {
            fetchRecentSearches();
        }
    }, [autoFetchRecent, fetchRecentSearches]);

    const close = useCallback(() => {
        setState((prev) => ({
            ...prev,
            isOpen: false,
            query: '',
            results: null,
            selectedIndex: -1,
            error: null,
        }));
        // Cancel any pending request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    }, []);

    const toggle = useCallback(() => {
        if (state.isOpen) {
            close();
        } else {
            open();
        }
    }, [state.isOpen, open, close]);

    /**
     * Flatten results for keyboard navigation
     */
    const flatResults = useCallback((): SearchResult[] => {
        if (!state.results) return [];

        const allResults: SearchResult[] = [];
        const order = ['students', 'staff', 'fees', 'books', 'exams', 'pages', 'settings'];

        for (const type of order) {
            const group = state.results[type as keyof SearchResponse];
            if (group && typeof group === 'object' && 'items' in group) {
                allResults.push(...group.items);
            }
        }

        return allResults;
    }, [state.results]);

    /**
     * Keyboard navigation
     */
    const selectPrevious = useCallback(() => {
        setState((prev) => {
            const results = flatResults();
            if (results.length === 0) return prev;

            let newIndex = prev.selectedIndex - 1;
            if (newIndex < 0) newIndex = results.length - 1;
            return { ...prev, selectedIndex: newIndex };
        });
    }, [flatResults]);

    const selectNext = useCallback(() => {
        setState((prev) => {
            const results = flatResults();
            if (results.length === 0) return prev;

            let newIndex = prev.selectedIndex + 1;
            if (newIndex >= results.length) newIndex = 0;
            return { ...prev, selectedIndex: newIndex };
        });
    }, [flatResults]);

    const setSelectedIndex = useCallback((index: number) => {
        setState((prev) => ({ ...prev, selectedIndex: index }));
    }, []);

    const getSelectedResult = useCallback((): SearchResult | null => {
        const results = flatResults();
        if (state.selectedIndex < 0 || state.selectedIndex >= results.length) {
            return null;
        }
        return results[state.selectedIndex];
    }, [flatResults, state.selectedIndex]);

    /**
     * Computed values
     */
    const results = flatResults();
    const totalCount = state.results?.total_results ?? 0;
    const hasResults = results.length > 0;
    const isEmptyState =
        state.query.length >= minQueryLength && !state.isLoading && !hasResults;

    /**
     * Cleanup on unmount
     */
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            debouncedSearch.cancel();
        };
    }, [debouncedSearch]);

    return {
        state,
        setQuery,
        setFilters,
        clearFilters,
        open,
        close,
        toggle,
        selectPrevious,
        selectNext,
        getSelectedResult,
        setSelectedIndex,
        search,
        fetchSuggestions,
        fetchRecentSearches,
        clearRecentSearches,
        flatResults: results,
        totalCount,
        hasResults,
        isEmptyState,
    };
}

export default useGlobalSearch;
