import React, { useState, useEffect } from 'react';
import {
    Box,
    SpeedDial,
    SpeedDialAction,
    SpeedDialIcon,
    Dialog,
    DialogTitle,
    DialogContent,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemButton,
    IconButton,
    Typography,
    Chip,
    Divider,
    TextField,
    InputAdornment,
} from '@mui/material';
import {
    Add as AddIcon,
    PersonAdd as PersonAddIcon,
    Payment as PaymentIcon,
    EventNote as EventIcon,
    Assignment as AssignmentIcon,
    Book as BookIcon,
    Message as MessageIcon,
    Settings as SettingsIcon,
    Star as StarIcon,
    StarBorder as StarBorderIcon,
    Search as SearchIcon,
    Close as CloseIcon,
    Keyboard as KeyboardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface QuickAction {
    id: string;
    label: string;
    icon: React.ReactNode;
    path: string;
    category: string;
    shortcut?: string;
    favorite?: boolean;
}

const ALL_ACTIONS: QuickAction[] = [
    {
        id: 'add-student',
        label: 'Add Student',
        icon: <PersonAddIcon />,
        path: '/students/add',
        category: 'Students',
        shortcut: 'Ctrl+Shift+S',
    },
    {
        id: 'collect-fee',
        label: 'Collect Fee',
        icon: <PaymentIcon />,
        path: '/fees/collect',
        category: 'Finance',
        shortcut: 'Ctrl+Shift+F',
    },
    {
        id: 'mark-attendance',
        label: 'Mark Attendance',
        icon: <EventIcon />,
        path: '/attendance',
        category: 'Attendance',
        shortcut: 'Ctrl+Shift+A',
    },
    {
        id: 'schedule-exam',
        label: 'Schedule Exam',
        icon: <AssignmentIcon />,
        path: '/exams',
        category: 'Exams',
        shortcut: 'Ctrl+Shift+E',
    },
    {
        id: 'issue-book',
        label: 'Issue Book',
        icon: <BookIcon />,
        path: '/library',
        category: 'Library',
    },
    {
        id: 'send-message',
        label: 'Send Message',
        icon: <MessageIcon />,
        path: '/communication/messages',
        category: 'Communication',
        shortcut: 'Ctrl+Shift+M',
    },
    {
        id: 'add-staff',
        label: 'Add Staff',
        icon: <PersonAddIcon />,
        path: '/staff/add',
        category: 'Staff',
    },
    {
        id: 'create-report',
        label: 'Create Report',
        icon: <AssignmentIcon />,
        path: '/reports/builder',
        category: 'Reports',
    },
];

const QuickActions: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [actions, setActions] = useState<QuickAction[]>(ALL_ACTIONS);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Load favorites from localStorage
        const saved = localStorage.getItem('favoriteActions');
        if (saved) {
            const favorites = JSON.parse(saved);
            setActions((prev) =>
                prev.map((action) => ({
                    ...action,
                    favorite: favorites.includes(action.id),
                }))
            );
        }

        // Set up keyboard shortcuts
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey) {
                const action = actions.find((a) => {
                    const shortcut = a.shortcut?.toLowerCase();
                    const key = e.key.toLowerCase();
                    return shortcut?.endsWith(key);
                });

                if (action) {
                    e.preventDefault();
                    navigate(action.path);
                }
            }

            // Open quick actions dialog with Ctrl+K
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                setDialogOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [actions, navigate]);

    const handleActionClick = (action: QuickAction) => {
        navigate(action.path);
        setOpen(false);
        setDialogOpen(false);

        // Save to recent actions
        const recent = JSON.parse(localStorage.getItem('recentActions') || '[]');
        const updated = [action.id, ...recent.filter((id: string) => id !== action.id)].slice(0, 5);
        localStorage.setItem('recentActions', JSON.stringify(updated));
    };

    const handleToggleFavorite = (actionId: string) => {
        const updated = actions.map((a) =>
            a.id === actionId ? { ...a, favorite: !a.favorite } : a
        );
        setActions(updated);

        // Save favorites
        const favorites = updated.filter((a) => a.favorite).map((a) => a.id);
        localStorage.setItem('favoriteActions', JSON.stringify(favorites));
    };

    const favoriteActions = actions.filter((a) => a.favorite);
    const filteredActions = actions.filter(
        (action) =>
            action.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            action.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groupedActions = filteredActions.reduce((acc, action) => {
        if (!acc[action.category]) {
            acc[action.category] = [];
        }
        acc[action.category].push(action);
        return acc;
    }, {} as Record<string, QuickAction[]>);

    return (
        <>
            {/* Speed Dial for Quick Actions */}
            <SpeedDial
                ariaLabel="Quick Actions"
                sx={{ position: 'fixed', bottom: 24, right: 24 }}
                icon={<SpeedDialIcon />}
                onClose={() => setOpen(false)}
                onOpen={() => setOpen(true)}
                open={open}
            >
                {favoriteActions.slice(0, 6).map((action) => (
                    <SpeedDialAction
                        key={action.id}
                        icon={action.icon}
                        tooltipTitle={action.label}
                        onClick={() => handleActionClick(action)}
                    />
                ))}
                <SpeedDialAction
                    icon={<SettingsIcon />}
                    tooltipTitle="All Actions"
                    onClick={() => {
                        setDialogOpen(true);
                        setOpen(false);
                    }}
                />
            </SpeedDial>

            {/* Quick Actions Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
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
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Quick Actions</Typography>
                        <IconButton size="small" onClick={() => setDialogOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                        <TextField
                            fullWidth
                            placeholder="Search actions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>

                    {favoriteActions.length > 0 && searchQuery === '' && (
                        <Box sx={{ p: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Favorites
                            </Typography>
                            <List dense>
                                {favoriteActions.map((action) => (
                                    <ListItem
                                        key={action.id}
                                        secondaryAction={
                                            <IconButton
                                                edge="end"
                                                size="small"
                                                onClick={() => handleToggleFavorite(action.id)}
                                            >
                                                <StarIcon color="warning" />
                                            </IconButton>
                                        }
                                        disablePadding
                                    >
                                        <ListItemButton onClick={() => handleActionClick(action)}>
                                            <ListItemIcon>{action.icon}</ListItemIcon>
                                            <ListItemText
                                                primary={action.label}
                                                secondary={action.shortcut}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                            <Divider sx={{ my: 2 }} />
                        </Box>
                    )}

                    <Box sx={{ p: 2 }}>
                        {Object.entries(groupedActions).map(([category, categoryActions]) => (
                            <Box key={category} sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    {category}
                                </Typography>
                                <List dense>
                                    {categoryActions.map((action) => (
                                        <ListItem
                                            key={action.id}
                                            secondaryAction={
                                                <IconButton
                                                    edge="end"
                                                    size="small"
                                                    onClick={() => handleToggleFavorite(action.id)}
                                                >
                                                    {action.favorite ? (
                                                        <StarIcon color="warning" />
                                                    ) : (
                                                        <StarBorderIcon />
                                                    )}
                                                </IconButton>
                                            }
                                            disablePadding
                                        >
                                            <ListItemButton onClick={() => handleActionClick(action)}>
                                                <ListItemIcon>{action.icon}</ListItemIcon>
                                                <ListItemText
                                                    primary={action.label}
                                                    secondary={
                                                        action.shortcut && (
                                                            <Chip
                                                                label={action.shortcut}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{ mt: 0.5 }}
                                                            />
                                                        )
                                                    }
                                                />
                                            </ListItemButton>
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        ))}
                    </Box>
                </DialogContent>

                <Box sx={{ p: 2, bgcolor: 'background.default', borderTop: 1, borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <KeyboardIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                            Press <kbd>Ctrl+K</kbd> to open • Use keyboard shortcuts for quick access
                        </Typography>
                    </Box>
                </Box>
            </Dialog>
        </>
    );
};

export default QuickActions;
