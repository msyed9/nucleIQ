import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Dialog,
    DialogContent,
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Typography,
    Chip,
    InputAdornment,
    CircularProgress,
    Divider,
    Paper,
    IconButton,
} from '@mui/material';
import {
    Search as SearchIcon,
    Person as PersonIcon,
    School as SchoolIcon,
    AttachMoney as MoneyIcon,
    Book as BookIcon,
    Assignment as AssignmentIcon,
    Close as CloseIcon,
    History as HistoryIcon,
    TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { debounce } from 'lodash';

interface SearchResult {
    id: string;
    type: string;
    title: string;
    subtitle?: string;
    url: string;
    icon?: string;
}

interface GlobalSearchProps {
    open: boolean;
    onClose: () => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ open, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Load recent searches from localStorage
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            setRecentSearches(JSON.parse(saved));
        }
    }, []);

    const performSearch = useCallback(
        debounce(async (searchQuery: string) => {
            if (!searchQuery || searchQuery.length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const response = await api.get(`/api/search/global/?q=${encodeURIComponent(searchQuery)}`);
                setResults(response.data.results || []);
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300),
        []
    );

    useEffect(() => {
        performSearch(query);
    }, [query, performSearch]);

    const handleResultClick = (result: SearchResult) => {
        // Save to recent searches
        const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));

        // Navigate to result
        navigate(result.url);
        onClose();
    };

    const handleRecentSearchClick = (search: string) => {
        setQuery(search);
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem('recentSearches');
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'student':
                return <PersonIcon />;
            case 'staff':
                return <SchoolIcon />;
            case 'fee':
                return <MoneyIcon />;
            case 'book':
                return <BookIcon />;
            case 'exam':
                return <AssignmentIcon />;
            default:
                return <SearchIcon />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'student':
                return 'primary';
            case 'staff':
                return 'secondary';
            case 'fee':
                return 'success';
            case 'book':
                return 'info';
            case 'exam':
                return 'warning';
            default:
                return 'default';
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    position: 'fixed',
                    top: 100,
                    m: 0,
                    maxHeight: 'calc(100vh - 200px)',
                },
            }}
        >
            <Box sx={{ p: 2 }}>
                <TextField
                    fullWidth
                    autoFocus
                    placeholder="Search students, staff, fees, books, exams..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                        endAdornment: (
                            <InputAdornment position="end">
                                {loading && <CircularProgress size={20} />}
                                <IconButton size="small" onClick={onClose}>
                                    <CloseIcon />
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                        },
                    }}
                />
            </Box>

            <DialogContent sx={{ p: 0 }}>
                {query.length === 0 && recentSearches.length > 0 && (
                    <Box sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Recent Searches
                            </Typography>
                            <IconButton size="small" onClick={clearRecentSearches}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {recentSearches.map((search, index) => (
                                <Chip
                                    key={index}
                                    icon={<HistoryIcon />}
                                    label={search}
                                    onClick={() => handleRecentSearchClick(search)}
                                    size="small"
                                />
                            ))}
                        </Box>
                    </Box>
                )}

                {query.length > 0 && results.length === 0 && !loading && (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            No results found for "{query}"
                        </Typography>
                    </Box>
                )}

                {results.length > 0 && (
                    <List sx={{ p: 0 }}>
                        {results.map((result, index) => (
                            <React.Fragment key={result.id}>
                                {index > 0 && <Divider />}
                                <ListItem
                                    button
                                    onClick={() => handleResultClick(result)}
                                    sx={{
                                        py: 2,
                                        '&:hover': {
                                            bgcolor: 'action.hover',
                                        },
                                    }}
                                >
                                    <ListItemIcon>{getIcon(result.type)}</ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body1">{result.title}</Typography>
                                                <Chip label={result.type} size="small" color={getTypeColor(result.type) as any} />
                                            </Box>
                                        }
                                        secondary={result.subtitle}
                                    />
                                </ListItem>
                            </React.Fragment>
                        ))}
                    </List>
                )}

                {query.length === 0 && recentSearches.length === 0 && (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <SearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="body2" color="text.secondary">
                            Start typing to search across all modules
                        </Typography>
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Chip icon={<PersonIcon />} label="Students" size="small" />
                            <Chip icon={<SchoolIcon />} label="Staff" size="small" />
                            <Chip icon={<MoneyIcon />} label="Fees" size="small" />
                            <Chip icon={<BookIcon />} label="Books" size="small" />
                            <Chip icon={<AssignmentIcon />} label="Exams" size="small" />
                        </Box>
                    </Box>
                )}
            </DialogContent>

            <Box sx={{ p: 2, bgcolor: 'background.default', borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">
                    Press <kbd>ESC</kbd> to close • <kbd>↑</kbd> <kbd>↓</kbd> to navigate • <kbd>Enter</kbd> to select
                </Typography>
            </Box>
        </Dialog>
    );
};

export default GlobalSearch;
