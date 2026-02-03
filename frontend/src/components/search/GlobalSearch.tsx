/**
 * GlobalSearch Component
 * Command palette-style global search with keyboard navigation,
 * grouped results, filters, quick actions, and advanced filtering.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    Box,
    Dialog,
    DialogContent,
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemButton,
    Typography,
    Chip,
    InputAdornment,
    CircularProgress,
    Divider,
    IconButton,
    Tooltip,
    Collapse,
    Badge,
    Stack,
    alpha,
    useTheme,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Button,
    Popover,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
    Search as SearchIcon,
    Person as PersonIcon,
    Work as WorkIcon,
    AttachMoney as MoneyIcon,
    Book as BookIcon,
    Assignment as AssignmentIcon,
    Close as CloseIcon,
    History as HistoryIcon,
    FilterList as FilterIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Web as WebIcon,
    Settings as SettingsIcon,
    KeyboardArrowUp,
    KeyboardArrowDown,
    KeyboardReturn,
    Clear as ClearIcon,
    PersonAdd as PersonAddIcon,
    Payment as PaymentIcon,
    Edit as EditIcon,
    Visibility as VisibilityIcon,
    DateRange as DateRangeIcon,
    School as SchoolIcon,
    CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import api from '../../services/api';
import {
    SearchResult,
    SearchResponse,
    SearchResultType,
    SEARCH_TYPE_COLORS,
    SEARCH_TYPE_LABELS,
    GroupedResults,
} from './searchTypes';

interface GlobalSearchProps {
    open: boolean;
    onClose: () => void;
}

interface GradeLevel {
    id: string;
    name: string;
    short_name: string;
}

interface Section {
    id: string;
    name: string;
    grade_level: string;
}

interface QuickAction {
    id: string;
    label: string;
    icon: React.ReactNode;
    onClick: (result: SearchResult) => void;
    showFor: SearchResultType[];
}

/** Icon mapping for result types */
const TypeIcons: Record<SearchResultType, React.ReactNode> = {
    student: <PersonIcon />,
    staff: <WorkIcon />,
    fee: <MoneyIcon />,
    book: <BookIcon />,
    exam: <AssignmentIcon />,
    page: <WebIcon />,
    setting: <SettingsIcon />,
};

/** Highlight matched text in results */
const HighlightText: React.FC<{ text: string; highlight?: string }> = ({
    text,
    highlight,
}) => {
    if (!highlight) return <>{text}</>;

    // Use the highlight from metadata if available (contains <mark> tags)
    if (highlight.includes('<mark>')) {
        return (
            <span
                dangerouslySetInnerHTML={{ __html: highlight }}
                style={{ '& mark': { backgroundColor: 'yellow', padding: '0 2px' } } as any}
            />
        );
    }

    // Manual highlighting
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);

    return (
        <>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <Box
                        component="mark"
                        key={i}
                        sx={{
                            bgcolor: 'warning.light',
                            color: 'warning.contrastText',
                            px: 0.5,
                            borderRadius: 0.5,
                        }}
                    >
                        {part}
                    </Box>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </>
    );
};

const GlobalSearch: React.FC<GlobalSearchProps> = ({ open, onClose }) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

    // State
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResponse | null>(null);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [showFilters, setShowFilters] = useState(false);
    const [activeFilters, setActiveFilters] = useState<SearchResultType[]>([]);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
        new Set(['students', 'staff', 'pages', 'settings'])
    );

    // Advanced filters
    const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [selectedGradeLevel, setSelectedGradeLevel] = useState<string>('');
    const [selectedSection, setSelectedSection] = useState<string>('');
    const [dateFrom, setDateFrom] = useState<Date | null>(null);
    const [dateTo, setDateTo] = useState<Date | null>(null);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    // Quick action popover
    const [actionAnchor, setActionAnchor] = useState<HTMLElement | null>(null);
    const [actionResult, setActionResult] = useState<SearchResult | null>(null);

    // Define quick actions
    const quickActions: QuickAction[] = useMemo(() => [
        {
            id: 'view',
            label: 'View Details',
            icon: <VisibilityIcon fontSize="small" />,
            onClick: (result) => {
                navigate(result.url);
                onClose();
            },
            showFor: ['student', 'staff', 'fee', 'book', 'exam'],
        },
        {
            id: 'edit',
            label: 'Edit',
            icon: <EditIcon fontSize="small" />,
            onClick: (result) => {
                navigate(`${result.url}/edit`);
                onClose();
            },
            showFor: ['student', 'staff', 'book'],
        },
        {
            id: 'collect-fee',
            label: 'Collect Fee',
            icon: <PaymentIcon fontSize="small" />,
            onClick: (result) => {
                navigate(`/fees/collect?student_id=${result.id}`);
                onClose();
            },
            showFor: ['student'],
        },
        {
            id: 'view-attendance',
            label: 'View Attendance',
            icon: <CalendarIcon fontSize="small" />,
            onClick: (result) => {
                navigate(`/attendance?student_id=${result.id}`);
                onClose();
            },
            showFor: ['student'],
        },
        {
            id: 'view-results',
            label: 'View Results',
            icon: <AssignmentIcon fontSize="small" />,
            onClick: (result) => {
                navigate(`/exams/results?student_id=${result.id}`);
                onClose();
            },
            showFor: ['student'],
        },
    ], [navigate, onClose]);

    // Flatten results for keyboard navigation
    const flatResults = useMemo((): SearchResult[] => {
        if (!results) return [];

        const allResults: SearchResult[] = [];
        const order: (keyof SearchResponse)[] = [
            'students',
            'staff',
            'fees',
            'books',
            'exams',
            'pages',
            'settings',
        ];

        for (const type of order) {
            const group = results[type];
            if (group && typeof group === 'object' && 'items' in group) {
                // Only include if group is expanded
                if (expandedGroups.has(type)) {
                    allResults.push(...(group as GroupedResults).items);
                }
            }
        }

        return allResults;
    }, [results, expandedGroups]);

    // Load grade levels and sections
    useEffect(() => {
        if (open) {
            loadRecentSearches();
            loadGradeLevels();
            // Focus input after dialog opens
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [open]);

    // Load sections when grade level changes
    useEffect(() => {
        if (selectedGradeLevel) {
            loadSections(selectedGradeLevel);
        } else {
            setSections([]);
            setSelectedSection('');
        }
    }, [selectedGradeLevel]);

    const loadGradeLevels = async () => {
        try {
            const response = await api.get('/api/academics/grade-levels/');
            setGradeLevels(response.data.results || response.data || []);
        } catch (error) {
            console.error('Failed to load grade levels:', error);
            setGradeLevels([]);
        }
    };

    const loadSections = async (gradeLevelId: string) => {
        try {
            const response = await api.get(`/api/academics/sections/?grade_level=${gradeLevelId}`);
            setSections(response.data.results || response.data || []);
        } catch (error) {
            console.error('Failed to load sections:', error);
            setSections([]);
        }
    };

    const loadRecentSearches = async () => {
        try {
            const response = await api.get('/api/search/recent/');
            setRecentSearches(response.data.searches || []);
        } catch (error) {
            // Fallback to localStorage
            const saved = localStorage.getItem('recentSearches');
            if (saved) {
                try {
                    setRecentSearches(JSON.parse(saved));
                } catch {
                    // Invalid JSON
                }
            }
        }
    };

    // Debounced search
    const performSearch = useCallback(
        debounce(async (
            searchQuery: string,
            filters: SearchResultType[],
            gradeLevel?: string,
            section?: string,
            fromDate?: Date | null,
            toDate?: Date | null
        ) => {
            if (!searchQuery || searchQuery.length < 2) {
                setResults(null);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const params = new URLSearchParams();
                params.set('q', searchQuery);
                params.set('limit', '20');
                params.set('grouped', 'true');

                if (filters.length > 0) {
                    // Map frontend types to backend types
                    const typeMap: Record<string, string> = {
                        student: 'students',
                        staff: 'staff',
                        fee: 'fees',
                        book: 'books',
                        exam: 'exams',
                        page: 'pages',
                        setting: 'settings',
                    };
                    const backendTypes = filters.map((f) => typeMap[f] || f);
                    params.set('types', backendTypes.join(','));
                }

                // Add advanced filters
                if (gradeLevel) {
                    params.set('class_id', gradeLevel);
                }
                if (section) {
                    params.set('section_id', section);
                }
                if (fromDate) {
                    params.set('date_from', fromDate.toISOString().split('T')[0]);
                }
                if (toDate) {
                    params.set('date_to', toDate.toISOString().split('T')[0]);
                }

                const response = await api.get<SearchResponse>(
                    `/api/search/?${params.toString()}`
                );
                setResults(response.data);
                setSelectedIndex(-1);
            } catch (error) {
                console.error('Search error:', error);
                setResults(null);
            } finally {
                setLoading(false);
            }
        }, 300),
        []
    );

    // Trigger search on query or filter change
    useEffect(() => {
        performSearch(query, activeFilters, selectedGradeLevel, selectedSection, dateFrom, dateTo);
    }, [query, activeFilters, selectedGradeLevel, selectedSection, dateFrom, dateTo, performSearch]);

    // Handle result click
    const handleResultClick = (result: SearchResult, event?: React.MouseEvent) => {
        // Save to recent searches
        saveToRecent(query);
        // Navigate to result
        navigate(result.url);
        onClose();
    };

    // Handle quick action click
    const handleQuickActionClick = (event: React.MouseEvent<HTMLElement>, result: SearchResult) => {
        event.stopPropagation();
        setActionAnchor(event.currentTarget);
        setActionResult(result);
    };

    const handleCloseActions = () => {
        setActionAnchor(null);
        setActionResult(null);
    };

    const getActionsForResult = (result: SearchResult) => {
        return quickActions.filter(action => action.showFor.includes(result.type));
    };

    const saveToRecent = (searchQuery: string) => {
        if (!searchQuery || searchQuery.length < 2) return;

        const updated = [
            searchQuery,
            ...recentSearches.filter((s) => s !== searchQuery),
        ].slice(0, 10);
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
    };

    const handleRecentSearchClick = (search: string) => {
        setQuery(search);
    };

    const clearRecentSearches = async () => {
        try {
            await api.delete('/api/search/recent/');
        } catch {
            // Ignore
        }
        setRecentSearches([]);
        localStorage.removeItem('recentSearches');
    };

    const toggleFilter = (type: SearchResultType) => {
        setActiveFilters((prev) =>
            prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
        );
    };

    const toggleGroupExpand = (group: string) => {
        setExpandedGroups((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(group)) {
                newSet.delete(group);
            } else {
                newSet.add(group);
            }
            return newSet;
        });
    };

    const clearAdvancedFilters = () => {
        setSelectedGradeLevel('');
        setSelectedSection('');
        setDateFrom(null);
        setDateTo(null);
    };

    const hasAdvancedFilters = selectedGradeLevel || selectedSection || dateFrom || dateTo;

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex((prev) => {
                    const max = flatResults.length - 1;
                    return prev < max ? prev + 1 : 0;
                });
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex((prev) => {
                    return prev > 0 ? prev - 1 : flatResults.length - 1;
                });
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < flatResults.length) {
                    handleResultClick(flatResults[selectedIndex]);
                }
                break;
            case 'Escape':
                onClose();
                break;
        }
    };

    // Calculate total results
    const totalResults = results?.total_results ?? 0;

    // Group order for display
    const groupOrder: { key: keyof SearchResponse; label: string }[] = [
        { key: 'students', label: 'Students' },
        { key: 'staff', label: 'Staff' },
        { key: 'fees', label: 'Fees' },
        { key: 'books', label: 'Books' },
        { key: 'exams', label: 'Exams' },
        { key: 'pages', label: 'Pages' },
        { key: 'settings', label: 'Settings' },
    ];

    // Get color for chip
    const getChipColor = (type: SearchResultType) => {
        return SEARCH_TYPE_COLORS[type] || 'default';
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="md"
                fullWidth
                onKeyDown={handleKeyDown}
                PaperProps={{
                    sx: {
                        position: 'fixed',
                        top: 80,
                        m: 0,
                        maxHeight: 'calc(100vh - 160px)',
                        borderRadius: 2,
                        overflow: 'hidden',
                        boxShadow: theme.shadows[24],
                    },
                }}
            >
                {/* Search Input */}
                <Box
                    sx={{
                        p: 2,
                        borderBottom: 1,
                        borderColor: 'divider',
                        bgcolor: alpha(theme.palette.primary.main, 0.02),
                    }}
                >
                    <TextField
                        inputRef={inputRef}
                        fullWidth
                        autoFocus
                        placeholder="Search students, staff, fees, books, exams..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                        {loading && <CircularProgress size={20} />}
                                        {query && (
                                            <IconButton size="small" onClick={() => setQuery('')}>
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                        <Tooltip title="Type Filters">
                                            <IconButton
                                                size="small"
                                                onClick={() => setShowFilters(!showFilters)}
                                                color={activeFilters.length > 0 ? 'primary' : 'default'}
                                            >
                                                <Badge badgeContent={activeFilters.length} color="primary">
                                                    <FilterIcon fontSize="small" />
                                                </Badge>
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Advanced Filters">
                                            <IconButton
                                                size="small"
                                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                                color={hasAdvancedFilters ? 'secondary' : 'default'}
                                            >
                                                <Badge
                                                    variant="dot"
                                                    color="secondary"
                                                    invisible={!hasAdvancedFilters}
                                                >
                                                    <DateRangeIcon fontSize="small" />
                                                </Badge>
                                            </IconButton>
                                        </Tooltip>
                                        <IconButton size="small" onClick={onClose}>
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    </Stack>
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                bgcolor: 'background.paper',
                            },
                        }}
                    />

                    {/* Type Filter chips */}
                    <Collapse in={showFilters}>
                        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ mr: 1, alignSelf: 'center' }}>
                                Filter by type:
                            </Typography>
                            {(['student', 'staff', 'fee', 'book', 'exam', 'page', 'setting'] as SearchResultType[]).map(
                                (type) => (
                                    <Chip
                                        key={type}
                                        size="small"
                                        icon={TypeIcons[type] as React.ReactElement}
                                        label={SEARCH_TYPE_LABELS[type]}
                                        onClick={() => toggleFilter(type)}
                                        color={activeFilters.includes(type) ? getChipColor(type) as any : 'default'}
                                        variant={activeFilters.includes(type) ? 'filled' : 'outlined'}
                                        sx={{ cursor: 'pointer' }}
                                    />
                                )
                            )}
                            {activeFilters.length > 0 && (
                                <Chip
                                    size="small"
                                    label="Clear all"
                                    onClick={() => setActiveFilters([])}
                                    color="error"
                                    variant="outlined"
                                />
                            )}
                        </Box>
                    </Collapse>

                    {/* Advanced Filters (Class/Section, Date Range) */}
                    <Collapse in={showAdvancedFilters}>
                        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                            {/* Class/Grade Level Filter */}
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <InputLabel id="grade-level-label">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <SchoolIcon fontSize="small" />
                                        Class
                                    </Box>
                                </InputLabel>
                                <Select
                                    labelId="grade-level-label"
                                    value={selectedGradeLevel}
                                    onChange={(e) => setSelectedGradeLevel(e.target.value)}
                                    label="Class"
                                >
                                    <MenuItem value="">
                                        <em>All Classes</em>
                                    </MenuItem>
                                    {gradeLevels.map((gl) => (
                                        <MenuItem key={gl.id} value={gl.id}>
                                            {gl.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Section Filter */}
                            <FormControl size="small" sx={{ minWidth: 120 }} disabled={!selectedGradeLevel}>
                                <InputLabel id="section-label">Section</InputLabel>
                                <Select
                                    labelId="section-label"
                                    value={selectedSection}
                                    onChange={(e) => setSelectedSection(e.target.value)}
                                    label="Section"
                                >
                                    <MenuItem value="">
                                        <em>All Sections</em>
                                    </MenuItem>
                                    {sections.map((s) => (
                                        <MenuItem key={s.id} value={s.id}>
                                            {s.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Date From */}
                            <DatePicker
                                label="From Date"
                                value={dateFrom}
                                onChange={(date) => setDateFrom(date)}
                                slotProps={{
                                    textField: {
                                        size: 'small',
                                        sx: { width: 150 },
                                    },
                                }}
                            />

                            {/* Date To */}
                            <DatePicker
                                label="To Date"
                                value={dateTo}
                                onChange={(date) => setDateTo(date)}
                                minDate={dateFrom || undefined}
                                slotProps={{
                                    textField: {
                                        size: 'small',
                                        sx: { width: 150 },
                                    },
                                }}
                            />

                            {/* Clear Advanced Filters */}
                            {hasAdvancedFilters && (
                                <Button
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                    onClick={clearAdvancedFilters}
                                    startIcon={<ClearIcon />}
                                >
                                    Clear
                                </Button>
                            )}
                        </Box>
                    </Collapse>
                </Box>

                <DialogContent sx={{ p: 0, overflow: 'auto' }}>
                    {/* Quick Add Actions */}
                    {query.length === 0 && (
                        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                                Quick Actions
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                <Chip
                                    icon={<PersonAddIcon />}
                                    label="Add Student"
                                    onClick={() => { navigate('/students/add'); onClose(); }}
                                    color="primary"
                                    variant="outlined"
                                    sx={{ cursor: 'pointer' }}
                                />
                                <Chip
                                    icon={<PersonAddIcon />}
                                    label="Add Staff"
                                    onClick={() => { navigate('/staff/add'); onClose(); }}
                                    color="secondary"
                                    variant="outlined"
                                    sx={{ cursor: 'pointer' }}
                                />
                                <Chip
                                    icon={<PaymentIcon />}
                                    label="Collect Fee"
                                    onClick={() => { navigate('/fees/collect'); onClose(); }}
                                    color="success"
                                    variant="outlined"
                                    sx={{ cursor: 'pointer' }}
                                />
                                <Chip
                                    icon={<BookIcon />}
                                    label="Issue Book"
                                    onClick={() => { navigate('/library/issue'); onClose(); }}
                                    color="info"
                                    variant="outlined"
                                    sx={{ cursor: 'pointer' }}
                                />
                            </Stack>
                        </Box>
                    )}

                    {/* Recent Searches */}
                    {query.length === 0 && recentSearches.length > 0 && (
                        <Box sx={{ p: 2 }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    mb: 1.5,
                                }}
                            >
                                <Typography variant="subtitle2" color="text.secondary">
                                    Recent Searches
                                </Typography>
                                <IconButton size="small" onClick={clearRecentSearches}>
                                    <ClearIcon fontSize="small" />
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
                                        sx={{ cursor: 'pointer' }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}

                    {/* No Results */}
                    {query.length >= 2 && !loading && totalResults === 0 && (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <SearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                No results found for "{query}"
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Try different keywords or check your filters
                            </Typography>
                            {(activeFilters.length > 0 || hasAdvancedFilters) && (
                                <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
                                    {activeFilters.length > 0 && (
                                        <Chip
                                            label="Clear type filters"
                                            onClick={() => setActiveFilters([])}
                                            color="primary"
                                            variant="outlined"
                                        />
                                    )}
                                    {hasAdvancedFilters && (
                                        <Chip
                                            label="Clear advanced filters"
                                            onClick={clearAdvancedFilters}
                                            color="secondary"
                                            variant="outlined"
                                        />
                                    )}
                                </Stack>
                            )}
                        </Box>
                    )}

                    {/* Grouped Results */}
                    {results && totalResults > 0 && (
                        <List sx={{ p: 0 }}>
                            {groupOrder.map(({ key, label }) => {
                                const group = results[key];
                                if (!group || typeof group !== 'object' || !('items' in group)) return null;
                                const groupData = group as GroupedResults;
                                if (groupData.count === 0) return null;

                                const isExpanded = expandedGroups.has(key);

                                return (
                                    <React.Fragment key={key}>
                                        {/* Group Header */}
                                        <ListItemButton
                                            onClick={() => toggleGroupExpand(key)}
                                            sx={{
                                                bgcolor: alpha(theme.palette.primary.main, 0.04),
                                                py: 1,
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 36 }}>
                                                {TypeIcons[key.slice(0, -1) as SearchResultType] || <WebIcon />}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography variant="subtitle2">{label}</Typography>
                                                        <Chip
                                                            size="small"
                                                            label={groupData.count}
                                                            color={getChipColor(key.slice(0, -1) as SearchResultType) as any}
                                                            sx={{ height: 20, fontSize: '0.75rem' }}
                                                        />
                                                    </Box>
                                                }
                                            />
                                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                        </ListItemButton>

                                        {/* Group Items */}
                                        <Collapse in={isExpanded}>
                                            {groupData.items.map((result, idx) => {
                                                const globalIndex = flatResults.indexOf(result);
                                                const isSelected = globalIndex === selectedIndex;
                                                const actions = getActionsForResult(result);

                                                return (
                                                    <ListItemButton
                                                        key={result.id}
                                                        onClick={(e) => handleResultClick(result, e)}
                                                        selected={isSelected}
                                                        sx={{
                                                            py: 1.5,
                                                            pl: 4,
                                                            '&.Mui-selected': {
                                                                bgcolor: alpha(theme.palette.primary.main, 0.12),
                                                            },
                                                            '&:hover': {
                                                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                                                            },
                                                        }}
                                                    >
                                                        <ListItemIcon sx={{ minWidth: 40 }}>
                                                            {TypeIcons[result.type] || <SearchIcon />}
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <Typography variant="body1">
                                                                        <HighlightText
                                                                            text={result.title}
                                                                            highlight={result.metadata?.highlight ? query : undefined}
                                                                        />
                                                                    </Typography>
                                                                    <Chip
                                                                        label={result.type}
                                                                        size="small"
                                                                        color={getChipColor(result.type) as any}
                                                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                                                    />
                                                                </Box>
                                                            }
                                                            secondary={result.subtitle}
                                                        />

                                                        {/* Quick Actions Button */}
                                                        {actions.length > 0 && (
                                                            <Tooltip title="Quick actions">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={(e) => handleQuickActionClick(e, result)}
                                                                    sx={{ ml: 1 }}
                                                                >
                                                                    <ExpandMoreIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </ListItemButton>
                                                );
                                            })}
                                        </Collapse>
                                        <Divider />
                                    </React.Fragment>
                                );
                            })}
                        </List>
                    )}

                    {/* Empty State */}
                    {query.length === 0 && recentSearches.length === 0 && (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <SearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="body1" color="text.secondary" gutterBottom>
                                Start typing to search across all modules
                            </Typography>
                            <Box
                                sx={{
                                    mt: 3,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    gap: 1,
                                    flexWrap: 'wrap',
                                }}
                            >
                                {(['student', 'staff', 'fee', 'book', 'exam'] as SearchResultType[]).map((type) => (
                                    <Chip
                                        key={type}
                                        icon={TypeIcons[type] as React.ReactElement}
                                        label={SEARCH_TYPE_LABELS[type]}
                                        size="small"
                                        variant="outlined"
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}
                </DialogContent>

                {/* Quick Actions Popover */}
                <Popover
                    open={Boolean(actionAnchor)}
                    anchorEl={actionAnchor}
                    onClose={handleCloseActions}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                >
                    <List dense sx={{ minWidth: 160 }}>
                        {actionResult && getActionsForResult(actionResult).map((action) => (
                            <ListItemButton
                                key={action.id}
                                onClick={() => {
                                    action.onClick(actionResult);
                                    handleCloseActions();
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                    {action.icon}
                                </ListItemIcon>
                                <ListItemText primary={action.label} />
                            </ListItemButton>
                        ))}
                    </List>
                </Popover>

                {/* Footer with keyboard hints */}
                <Box
                    sx={{
                        p: 1.5,
                        bgcolor: alpha(theme.palette.background.default, 0.8),
                        borderTop: 1,
                        borderColor: 'divider',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <Stack direction="row" spacing={2}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <KeyboardArrowUp fontSize="small" />
                            <KeyboardArrowDown fontSize="small" />
                            navigate
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <KeyboardReturn fontSize="small" />
                            select
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            <kbd style={{
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: alpha(theme.palette.text.primary, 0.08),
                                fontSize: '0.7rem'
                            }}>
                                ESC
                            </kbd>{' '}
                            close
                        </Typography>
                    </Stack>

                    {results && (
                        <Typography variant="caption" color="text.secondary">
                            {totalResults} results
                            {results.search_time_ms && ` in ${results.search_time_ms}ms`}
                        </Typography>
                    )}
                </Box>
            </Dialog>
        </LocalizationProvider>
    );
};

export default GlobalSearch;
