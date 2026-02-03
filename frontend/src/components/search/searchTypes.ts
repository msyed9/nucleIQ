/**
 * Search Types for NucleiQ Global Search
 * Defines interfaces for search results, responses, and state management
 */

/**
 * Supported search result types
 */
export type SearchResultType =
    | 'student'
    | 'staff'
    | 'fee'
    | 'book'
    | 'exam'
    | 'page'
    | 'setting';

/**
 * Color mappings for result type chips
 */
export type SearchResultColor =
    | 'primary'
    | 'secondary'
    | 'success'
    | 'info'
    | 'warning'
    | 'error'
    | 'default';

/**
 * Metadata attached to search results
 */
export interface SearchResultMetadata {
    admission_number?: string;
    employee_id?: string;
    email?: string;
    phone?: string;
    designation?: string;
    department?: string;
    invoice_number?: string;
    student?: string;
    amount?: string;
    status?: string;
    date?: string;
    author?: string;
    isbn?: string;
    available?: number;
    total?: number;
    category?: string;
    subject?: string;
    term?: string;
    max_marks?: string;
    action?: string;
    highlight?: string;
}

/**
 * Individual search result item
 */
export interface SearchResult {
    id: string;
    type: SearchResultType;
    title: string;
    subtitle?: string;
    url: string;
    icon?: string;
    rank?: number;
    metadata?: SearchResultMetadata;
}

/**
 * Grouped results for a single type
 */
export interface GroupedResults {
    count: number;
    items: SearchResult[];
}

/**
 * Full search response from API (grouped format)
 */
export interface SearchResponse {
    students?: GroupedResults;
    staff?: GroupedResults;
    fees?: GroupedResults;
    books?: GroupedResults;
    exams?: GroupedResults;
    pages?: GroupedResults;
    settings?: GroupedResults;
    query: string;
    total_results: number;
    search_time_ms?: number;
}

/**
 * Flat search response from API
 */
export interface FlatSearchResponse {
    results: SearchResult[];
    query: string;
    total_results: number;
    search_time_ms?: number;
}

/**
 * Search suggestions response
 */
export interface SuggestionsResponse {
    suggestions: string[];
}

/**
 * Recent searches response
 */
export interface RecentSearchesResponse {
    searches: string[];
}

/**
 * Quick action that can be triggered from search results
 */
export interface QuickAction {
    id: string;
    label: string;
    icon: string;
    action: () => void;
    showFor: SearchResultType[];
}

/**
 * Search filters for advanced filtering
 */
export interface SearchFilters {
    types?: SearchResultType[];
    classId?: string;
    sectionId?: string;
    dateFrom?: string;
    dateTo?: string;
}

/**
 * Search state for the hook
 */
export interface SearchState {
    query: string;
    isOpen: boolean;
    isLoading: boolean;
    results: SearchResponse | null;
    suggestions: string[];
    recentSearches: string[];
    selectedIndex: number;
    filters: SearchFilters;
    error: string | null;
}

/**
 * Quick action that can be triggered from search
 */
export interface QuickAction {
    id: string;
    label: string;
    icon: string;
    action: () => void;
}

/**
 * Search result with quick actions
 */
export interface SearchResultWithActions extends SearchResult {
    quickActions?: QuickAction[];
}

/**
 * Icon mapping for result types
 */
export const SEARCH_TYPE_ICONS: Record<SearchResultType, string> = {
    student: 'Person',
    staff: 'Work',
    fee: 'AttachMoney',
    book: 'Book',
    exam: 'Assignment',
    page: 'Web',
    setting: 'Settings',
};

/**
 * Color mapping for result types
 */
export const SEARCH_TYPE_COLORS: Record<SearchResultType, SearchResultColor> = {
    student: 'primary',
    staff: 'secondary',
    fee: 'success',
    book: 'info',
    exam: 'warning',
    page: 'default',
    setting: 'default',
};

/**
 * Display labels for result types
 */
export const SEARCH_TYPE_LABELS: Record<SearchResultType, string> = {
    student: 'Students',
    staff: 'Staff',
    fee: 'Fees',
    book: 'Books',
    exam: 'Exams',
    page: 'Pages',
    setting: 'Settings',
};

/**
 * All searchable types
 */
export const ALL_SEARCH_TYPES: SearchResultType[] = [
    'student',
    'staff',
    'fee',
    'book',
    'exam',
    'page',
    'setting',
];

/**
 * Entity types (excludes pages and settings)
 */
export const ENTITY_SEARCH_TYPES: SearchResultType[] = [
    'student',
    'staff',
    'fee',
    'book',
    'exam',
];
