import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    CardHeader,
    IconButton,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Checkbox,
    Typography,
    Menu,
    MenuItem,
    Chip,
    CircularProgress,
} from '@mui/material';
import {
    MoreVert as MoreIcon,
    Refresh as RefreshIcon,
    Settings as SettingsIcon,
    Close as CloseIcon,
    DragIndicator as DragIcon,
    Add as AddIcon,
    TrendingUp as TrendingUpIcon,
    People as PeopleIcon,
    AttachMoney as MoneyIcon,
    School as SchoolIcon,
    Assignment as AssignmentIcon,
    EventNote as EventIcon,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import api from '../../services/api';

interface Widget {
    id: string;
    type: string;
    title: string;
    icon: React.ReactNode;
    size: 'small' | 'medium' | 'large';
    refreshInterval?: number;
    enabled: boolean;
    data?: any;
}

interface DashboardWidgetsProps {
    userRole?: string;
}

const AVAILABLE_WIDGETS: Omit<Widget, 'enabled' | 'data'>[] = [
    {
        id: 'student-stats',
        type: 'stats',
        title: 'Student Statistics',
        icon: <PeopleIcon />,
        size: 'medium',
        refreshInterval: 300000, // 5 minutes
    },
    {
        id: 'fee-collection',
        type: 'stats',
        title: 'Fee Collection',
        icon: <MoneyIcon />,
        size: 'medium',
        refreshInterval: 300000,
    },
    {
        id: 'attendance-summary',
        type: 'chart',
        title: 'Attendance Summary',
        icon: <SchoolIcon />,
        size: 'large',
        refreshInterval: 600000, // 10 minutes
    },
    {
        id: 'upcoming-exams',
        type: 'list',
        title: 'Upcoming Exams',
        icon: <AssignmentIcon />,
        size: 'medium',
    },
    {
        id: 'recent-activities',
        type: 'list',
        title: 'Recent Activities',
        icon: <EventIcon />,
        size: 'large',
    },
    {
        id: 'performance-trends',
        type: 'chart',
        title: 'Performance Trends',
        icon: <TrendingUpIcon />,
        size: 'large',
        refreshInterval: 900000, // 15 minutes
    },
];

const DashboardWidgets: React.FC<DashboardWidgetsProps> = ({ userRole }) => {
    const [widgets, setWidgets] = useState<Widget[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
    const [loading, setLoading] = useState<Record<string, boolean>>({});

    useEffect(() => {
        loadWidgetConfiguration();
    }, []);

    useEffect(() => {
        // Set up refresh intervals for enabled widgets
        const intervals: NodeJS.Timeout[] = [];

        widgets.forEach((widget) => {
            if (widget.enabled && widget.refreshInterval) {
                const interval = setInterval(() => {
                    fetchWidgetData(widget.id);
                }, widget.refreshInterval);
                intervals.push(interval);
            }
        });

        return () => {
            intervals.forEach((interval) => clearInterval(interval));
        };
    }, [widgets]);

    const loadWidgetConfiguration = async () => {
        try {
            const response = await api.get('/api/users/preferences/');
            const savedWidgets = response.data.dashboard_widgets || [];

            // Merge saved configuration with available widgets
            const configured = AVAILABLE_WIDGETS.map((widget) => {
                const saved = savedWidgets.find((w: any) => w.id === widget.id);
                return {
                    ...widget,
                    enabled: saved?.enabled ?? true,
                    data: null,
                };
            });

            setWidgets(configured);

            // Fetch initial data for enabled widgets
            configured.forEach((widget) => {
                if (widget.enabled) {
                    fetchWidgetData(widget.id);
                }
            });
        } catch (error) {
            console.error('Error loading widget configuration:', error);
            // Use default configuration
            setWidgets(
                AVAILABLE_WIDGETS.map((w) => ({
                    ...w,
                    enabled: true,
                    data: null,
                }))
            );
        }
    };

    const fetchWidgetData = async (widgetId: string) => {
        setLoading((prev) => ({ ...prev, [widgetId]: true }));
        try {
            const response = await api.get(`/api/dashboard/widgets/${widgetId}/`);
            setWidgets((prev) =>
                prev.map((w) => (w.id === widgetId ? { ...w, data: response.data } : w))
            );
        } catch (error) {
            console.error(`Error fetching data for widget ${widgetId}:`, error);
        } finally {
            setLoading((prev) => ({ ...prev, [widgetId]: false }));
        }
    };

    const saveWidgetConfiguration = async (updatedWidgets: Widget[]) => {
        try {
            const config = updatedWidgets.map((w) => ({
                id: w.id,
                enabled: w.enabled,
            }));

            await api.patch('/api/users/preferences/', {
                dashboard_widgets: config,
            });
        } catch (error) {
            console.error('Error saving widget configuration:', error);
        }
    };

    const handleDragEnd = (result: any) => {
        if (!result.destination) return;

        const items = Array.from(widgets);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setWidgets(items);
        saveWidgetConfiguration(items);
    };

    const handleToggleWidget = (widgetId: string) => {
        const updated = widgets.map((w) =>
            w.id === widgetId ? { ...w, enabled: !w.enabled } : w
        );
        setWidgets(updated);
        saveWidgetConfiguration(updated);
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, widgetId: string) => {
        setAnchorEl(event.currentTarget);
        setSelectedWidget(widgetId);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedWidget(null);
    };

    const handleRefreshWidget = () => {
        if (selectedWidget) {
            fetchWidgetData(selectedWidget);
        }
        handleMenuClose();
    };

    const handleRemoveWidget = () => {
        if (selectedWidget) {
            handleToggleWidget(selectedWidget);
        }
        handleMenuClose();
    };

    const getGridSize = (size: string) => {
        switch (size) {
            case 'small':
                return { xs: 12, sm: 6, md: 4 };
            case 'medium':
                return { xs: 12, sm: 6, md: 6 };
            case 'large':
                return { xs: 12, md: 12 };
            default:
                return { xs: 12, sm: 6, md: 6 };
        }
    };

    const renderWidgetContent = (widget: Widget) => {
        if (loading[widget.id]) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                    <CircularProgress />
                </Box>
            );
        }

        if (!widget.data) {
            return (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        No data available
                    </Typography>
                </Box>
            );
        }

        // Render based on widget type
        switch (widget.type) {
            case 'stats':
                return (
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h3" color="primary" gutterBottom>
                            {widget.data.value || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {widget.data.label || 'Total'}
                        </Typography>
                        {widget.data.change && (
                            <Chip
                                label={`${widget.data.change > 0 ? '+' : ''}${widget.data.change}%`}
                                size="small"
                                color={widget.data.change > 0 ? 'success' : 'error'}
                                sx={{ mt: 1 }}
                            />
                        )}
                    </Box>
                );

            case 'list':
                return (
                    <List dense>
                        {(widget.data.items || []).slice(0, 5).map((item: any, index: number) => (
                            <ListItem key={index}>
                                <ListItemText primary={item.title} secondary={item.subtitle} />
                            </ListItem>
                        ))}
                    </List>
                );

            case 'chart':
                return (
                    <Box sx={{ p: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Chart visualization would go here
                        </Typography>
                    </Box>
                );

            default:
                return null;
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">Dashboard</Typography>
                <Button startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>
                    Customize Widgets
                </Button>
            </Box>

            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="widgets">
                    {(provided) => (
                        <Grid container spacing={3} {...provided.droppableProps} ref={provided.innerRef}>
                            {widgets
                                .filter((w) => w.enabled)
                                .map((widget, index) => (
                                    <Draggable key={widget.id} draggableId={widget.id} index={index}>
                                        {(provided, snapshot) => (
                                            <Grid
                                                item
                                                {...getGridSize(widget.size)}
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                            >
                                                <Card
                                                    sx={{
                                                        height: '100%',
                                                        opacity: snapshot.isDragging ? 0.8 : 1,
                                                        transform: snapshot.isDragging ? 'rotate(2deg)' : 'none',
                                                    }}
                                                >
                                                    <CardHeader
                                                        avatar={widget.icon}
                                                        title={widget.title}
                                                        action={
                                                            <Box>
                                                                <IconButton size="small" {...provided.dragHandleProps}>
                                                                    <DragIcon />
                                                                </IconButton>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={(e) => handleMenuOpen(e, widget.id)}
                                                                >
                                                                    <MoreIcon />
                                                                </IconButton>
                                                            </Box>
                                                        }
                                                    />
                                                    <CardContent sx={{ pt: 0 }}>{renderWidgetContent(widget)}</CardContent>
                                                </Card>
                                            </Grid>
                                        )}
                                    </Draggable>
                                ))}
                            {provided.placeholder}
                        </Grid>
                    )}
                </Droppable>
            </DragDropContext>

            {/* Widget Menu */}
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={handleRefreshWidget}>
                    <ListItemIcon>
                        <RefreshIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Refresh</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleRemoveWidget}>
                    <ListItemIcon>
                        <CloseIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Remove</ListItemText>
                </MenuItem>
            </Menu>

            {/* Widget Selection Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Customize Dashboard Widgets</DialogTitle>
                <DialogContent>
                    <List>
                        {widgets.map((widget) => (
                            <ListItem key={widget.id}>
                                <ListItemIcon>
                                    <Checkbox
                                        checked={widget.enabled}
                                        onChange={() => handleToggleWidget(widget.id)}
                                    />
                                </ListItemIcon>
                                <ListItemIcon>{widget.icon}</ListItemIcon>
                                <ListItemText
                                    primary={widget.title}
                                    secondary={`Size: ${widget.size}`}
                                />
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DashboardWidgets;
