import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Grid,
    Button,
    Menu,
    MenuItem,
    IconButton,
    Typography,
    Fab,
} from '@mui/material';
import {
    ViewModule as ViewModuleIcon,
    ViewQuilt as ViewQuiltIcon,
    ViewStream as ViewStreamIcon,
    Save as SaveIcon,
    Restore as RestoreIcon,
    Search as SearchIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import DashboardWidgets from '../../components/dashboard/DashboardWidgets';
import ActivityFeed from '../../components/dashboard/ActivityFeed';
import QuickActions from '../../components/dashboard/QuickActions';
import GlobalSearch from '../../components/search/GlobalSearch';
import api from '../../services/api';

type DashboardLayout = 'default' | 'compact' | 'detailed';

const EnhancedDashboard: React.FC = () => {
    const [layout, setLayout] = useState<DashboardLayout>('default');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [searchOpen, setSearchOpen] = useState(false);
    const [userRole, setUserRole] = useState('');

    useEffect(() => {
        loadDashboardPreferences();
        loadUserRole();

        // Set up global search shortcut (Ctrl+/)
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === '/') {
                e.preventDefault();
                setSearchOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, []);

    const loadDashboardPreferences = async () => {
        try {
            const response = await api.get('/api/users/preferences/');
            const savedLayout = response.data.dashboard_layout || 'default';
            setLayout(savedLayout);
        } catch (error) {
            console.error('Error loading dashboard preferences:', error);
        }
    };

    const loadUserRole = async () => {
        try {
            const response = await api.get('/api/users/me/');
            setUserRole(response.data.role || '');
        } catch (error) {
            console.error('Error loading user role:', error);
        }
    };

    const handleLayoutChange = async (newLayout: DashboardLayout) => {
        setLayout(newLayout);
        setAnchorEl(null);

        try {
            await api.patch('/api/users/preferences/', {
                dashboard_layout: newLayout,
            });
        } catch (error) {
            console.error('Error saving layout preference:', error);
        }
    };

    const handleResetLayout = async () => {
        setLayout('default');
        setAnchorEl(null);

        try {
            await api.patch('/api/users/preferences/', {
                dashboard_layout: 'default',
                dashboard_widgets: [],
            });
            window.location.reload();
        } catch (error) {
            console.error('Error resetting layout:', error);
        }
    };

    const renderDashboard = () => {
        switch (layout) {
            case 'compact':
                return (
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <DashboardWidgets userRole={userRole} />
                        </Grid>
                    </Grid>
                );

            case 'detailed':
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12} lg={8}>
                            <DashboardWidgets userRole={userRole} />
                        </Grid>
                        <Grid item xs={12} lg={4}>
                            <ActivityFeed />
                        </Grid>
                    </Grid>
                );

            case 'default':
            default:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12} lg={9}>
                            <DashboardWidgets userRole={userRole} />
                        </Grid>
                        <Grid item xs={12} lg={3}>
                            <ActivityFeed />
                        </Grid>
                    </Grid>
                );
        }
    };

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            {/* Dashboard Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" gutterBottom>
                        Dashboard
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Welcome back! Here's what's happening today.
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton onClick={() => setSearchOpen(true)} color="primary">
                        <SearchIcon />
                    </IconButton>
                    <Button
                        startIcon={<ViewModuleIcon />}
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                        variant="outlined"
                    >
                        Layout
                    </Button>
                </Box>
            </Box>

            {/* Dashboard Content */}
            {renderDashboard()}

            {/* Layout Menu */}
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                <MenuItem onClick={() => handleLayoutChange('default')}>
                    <ViewModuleIcon sx={{ mr: 1 }} />
                    Default Layout
                </MenuItem>
                <MenuItem onClick={() => handleLayoutChange('compact')}>
                    <ViewQuiltIcon sx={{ mr: 1 }} />
                    Compact Layout
                </MenuItem>
                <MenuItem onClick={() => handleLayoutChange('detailed')}>
                    <ViewStreamIcon sx={{ mr: 1 }} />
                    Detailed Layout
                </MenuItem>
                <MenuItem onClick={handleResetLayout} sx={{ color: 'error.main' }}>
                    <RestoreIcon sx={{ mr: 1 }} />
                    Reset to Default
                </MenuItem>
            </Menu>

            {/* Global Search */}
            <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

            {/* Quick Actions */}
            <QuickActions />

            {/* Floating Search Button (Mobile) */}
            <Fab
                color="primary"
                sx={{
                    position: 'fixed',
                    bottom: 24,
                    left: 24,
                    display: { xs: 'flex', md: 'none' },
                }}
                onClick={() => setSearchOpen(true)}
            >
                <SearchIcon />
            </Fab>
        </Container>
    );
};

export default EnhancedDashboard;
