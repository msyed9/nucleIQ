/**
 * Command Palette Component
 * Global search with Ctrl+K / Cmd+K keyboard shortcut
 */

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CommandPalette.css';

interface SearchResult {
    id: string;
    type: 'student' | 'staff' | 'page' | 'setting';
    title: string;
    subtitle?: string;
    url: string;
    icon?: string;
    rank?: number;
}

interface SearchResponse {
    students?: SearchResult[];
    staff?: SearchResult[];
    pages?: SearchResult[];
    settings?: SearchResult[];
    query: string;
    total_results: number;
}

export const CommandPalette: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResponse | null>(null);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    // Keyboard shortcut handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+K or Cmd+K
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }

            // Escape to close
            if (e.key === 'Escape') {
                setIsOpen(false);
                setQuery('');
                setResults(null);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Fetch recent searches
    useEffect(() => {
        if (isOpen && !query) {
            fetchRecentSearches();
        }
    }, [isOpen, query]);

    const fetchRecentSearches = async () => {
        try {
            const response = await axios.get('/api/search/recent/');
            setRecentSearches(response.data);
        } catch (error) {
            console.error('Failed to fetch recent searches:', error);
        }
    };

    // Debounced search
    useEffect(() => {
        if (!query || query.length < 2) {
            setResults(null);
            return;
        }

        const timer = setTimeout(() => {
            performSearch(query);
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const performSearch = async (searchQuery: string) => {
        setLoading(true);
        try {
            const response = await axios.get<SearchResponse>('/api/search/', {
                params: { q: searchQuery, limit: 5 }
            });
            setResults(response.data);
            setSelectedIndex(0);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get all results as flat array
    const getAllResults = (): SearchResult[] => {
        if (!results) return [];

        const allResults: SearchResult[] = [];
        if (results.students) allResults.push(...results.students);
        if (results.staff) allResults.push(...results.staff);
        if (results.pages) allResults.push(...results.pages);
        if (results.settings) allResults.push(...results.settings);

        return allResults;
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        const allResults = getAllResults();

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) =>
                prev < allResults.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (allResults[selectedIndex]) {
                handleResultClick(allResults[selectedIndex]);
            }
        }
    };

    const handleResultClick = (result: SearchResult) => {
        navigate(result.url);
        setIsOpen(false);
        setQuery('');
        setResults(null);
    };

    const handleRecentSearchClick = (search: string) => {
        setQuery(search);
    };

    const getIcon = (type: string, icon?: string) => {
        if (icon) return icon;

        const iconMap: Record<string, string> = {
            student: '👨‍🎓',
            staff: '👨‍💼',
            page: '📄',
            setting: '⚙️',
        };

        return iconMap[type] || '📄';
    };

    if (!isOpen) return null;

    const allResults = getAllResults();

    return (
        <div className="command-palette-overlay" onClick={() => setIsOpen(false)}>
            <div className="command-palette" onClick={(e) => e.stopPropagation()}>
                {/* Search Input */}
                <div className="command-palette-header">
                    <span className="search-icon">🔍</span>
                    <input
                        ref={inputRef}
                        type="text"
                        className="command-palette-input"
                        placeholder="Search students, staff, pages... (Ctrl+K)"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    {loading && <span className="loading-spinner">⏳</span>}
                    <kbd className="keyboard-hint">ESC</kbd>
                </div>

                {/* Results */}
                <div className="command-palette-results">
                    {!query && recentSearches.length > 0 && (
                        <div className="results-section">
                            <div className="section-title">Recent Searches</div>
                            {recentSearches.map((search, index) => (
                                <div
                                    key={index}
                                    className="result-item"
                                    onClick={() => handleRecentSearchClick(search)}
                                >
                                    <span className="result-icon">🕐</span>
                                    <span className="result-title">{search}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {results && allResults.length === 0 && (
                        <div className="no-results">
                            <span className="no-results-icon">🔍</span>
                            <p>No results found for "{query}"</p>
                        </div>
                    )}

                    {results?.students && results.students.length > 0 && (
                        <div className="results-section">
                            <div className="section-title">Students</div>
                            {results.students.map((result, index) => (
                                <div
                                    key={result.id}
                                    className={`result-item ${selectedIndex === index ? 'selected' : ''
                                        }`}
                                    onClick={() => handleResultClick(result)}
                                >
                                    <span className="result-icon">{getIcon(result.type, result.icon)}</span>
                                    <div className="result-content">
                                        <div className="result-title">{result.title}</div>
                                        {result.subtitle && (
                                            <div className="result-subtitle">{result.subtitle}</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {results?.staff && results.staff.length > 0 && (
                        <div className="results-section">
                            <div className="section-title">Staff</div>
                            {results.staff.map((result, index) => {
                                const globalIndex = (results.students?.length || 0) + index;
                                return (
                                    <div
                                        key={result.id}
                                        className={`result-item ${selectedIndex === globalIndex ? 'selected' : ''
                                            }`}
                                        onClick={() => handleResultClick(result)}
                                    >
                                        <span className="result-icon">{getIcon(result.type, result.icon)}</span>
                                        <div className="result-content">
                                            <div className="result-title">{result.title}</div>
                                            {result.subtitle && (
                                                <div className="result-subtitle">{result.subtitle}</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {results?.pages && results.pages.length > 0 && (
                        <div className="results-section">
                            <div className="section-title">Pages</div>
                            {results.pages.map((result, index) => {
                                const globalIndex =
                                    (results.students?.length || 0) +
                                    (results.staff?.length || 0) +
                                    index;
                                return (
                                    <div
                                        key={result.id}
                                        className={`result-item ${selectedIndex === globalIndex ? 'selected' : ''
                                            }`}
                                        onClick={() => handleResultClick(result)}
                                    >
                                        <span className="result-icon">{getIcon(result.type, result.icon)}</span>
                                        <div className="result-content">
                                            <div className="result-title">{result.title}</div>
                                            {result.subtitle && (
                                                <div className="result-subtitle">{result.subtitle}</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {results?.settings && results.settings.length > 0 && (
                        <div className="results-section">
                            <div className="section-title">Settings</div>
                            {results.settings.map((result, index) => {
                                const globalIndex =
                                    (results.students?.length || 0) +
                                    (results.staff?.length || 0) +
                                    (results.pages?.length || 0) +
                                    index;
                                return (
                                    <div
                                        key={result.id}
                                        className={`result-item ${selectedIndex === globalIndex ? 'selected' : ''
                                            }`}
                                        onClick={() => handleResultClick(result)}
                                    >
                                        <span className="result-icon">{getIcon(result.type, result.icon)}</span>
                                        <div className="result-content">
                                            <div className="result-title">{result.title}</div>
                                            {result.subtitle && (
                                                <div className="result-subtitle">{result.subtitle}</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="command-palette-footer">
                    <div className="footer-hint">
                        <kbd>↑</kbd> <kbd>↓</kbd> to navigate
                    </div>
                    <div className="footer-hint">
                        <kbd>↵</kbd> to select
                    </div>
                    <div className="footer-hint">
                        <kbd>ESC</kbd> to close
                    </div>
                </div>
            </div>
        </div>
    );
};
