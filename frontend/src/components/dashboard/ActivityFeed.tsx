import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Typography,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    TextField,
    FormControl,
    InputLabel,
    Select,
    Button,
    Divider,
    CircularProgress,
} from '@mui/material';
import {
    MoreVert as MoreIcon,
    FilterList as FilterIcon,
    Refresh as RefreshIcon,
    PersonAdd as PersonAddIcon,
    Payment as PaymentIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    CheckCircle as CheckCircleIcon,
    Schedule as ScheduleIcon,
    Assignment as AssignmentIcon,
    Message as MessageIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import api from '../../services/api';

interface Activity {
    id: string;
    type: string;
    action: string;
    description: string;
    user: {
        name: string;
        avatar?: string;
    };
    module: string;
    timestamp: string;
    metadata?: any;
}

const ActivityFeed: React.FC = () => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterModule, setFilterModule] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        fetchActivities();
    }, [filterModule, filterType, page]);

    const fetchActivities = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterModule !== 'all') params.append('module', filterModule);
            if (filterType !== 'all') params.append('type', filterType);
            params.append('page', page.toString());

            const response = await api.get(`/api/activities/?${params.toString()}`);
            const newActivities = response.data.results || response.data;

            if (page === 1) {
                setActivities(newActivities);
            } else {
                setActivities((prev) => [...prev, ...newActivities]);
            }

            setHasMore(response.data.next != null);
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        setPage(1);
        fetchActivities();
    };

    const handleLoadMore = () => {
        setPage((prev) => prev + 1);
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'create':
                return <PersonAddIcon />;
            case 'update':
                return <EditIcon />;
            case 'delete':
                return <DeleteIcon />;
            case 'payment':
                return <PaymentIcon />;
            case 'approval':
                return <CheckCircleIcon />;
            case 'schedule':
                return <ScheduleIcon />;
            case 'assignment':
                return <AssignmentIcon />;
            case 'message':
                return <MessageIcon />;
            default:
                return <CheckCircleIcon />;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'create':
                return 'success';
            case 'update':
                return 'info';
            case 'delete':
                return 'error';
            case 'payment':
                return 'success';
            case 'approval':
                return 'primary';
            default:
                return 'default';
        }
    };

    const getModuleColor = (module: string) => {
        const colors: Record<string, any> = {
            students: 'primary',
            staff: 'secondary',
            finance: 'success',
            library: 'info',
            exams: 'warning',
            attendance: 'error',
        };
        return colors[module.toLowerCase()] || 'default';
    };

    return (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Activity Feed</Typography>
                    <Box>
                        <IconButton size="small" onClick={() => setShowFilters(!showFilters)}>
                            <FilterIcon />
                        </IconButton>
                        <IconButton size="small" onClick={handleRefresh}>
                            <RefreshIcon />
                        </IconButton>
                    </Box>
                </Box>

                {showFilters && (
                    <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Module</InputLabel>
                            <Select
                                value={filterModule}
                                label="Module"
                                onChange={(e) => {
                                    setFilterModule(e.target.value);
                                    setPage(1);
                                }}
                            >
                                <MenuItem value="all">All Modules</MenuItem>
                                <MenuItem value="students">Students</MenuItem>
                                <MenuItem value="staff">Staff</MenuItem>
                                <MenuItem value="finance">Finance</MenuItem>
                                <MenuItem value="library">Library</MenuItem>
                                <MenuItem value="exams">Exams</MenuItem>
                                <MenuItem value="attendance">Attendance</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Type</InputLabel>
                            <Select
                                value={filterType}
                                label="Type"
                                onChange={(e) => {
                                    setFilterType(e.target.value);
                                    setPage(1);
                                }}
                            >
                                <MenuItem value="all">All Types</MenuItem>
                                <MenuItem value="create">Created</MenuItem>
                                <MenuItem value="update">Updated</MenuItem>
                                <MenuItem value="delete">Deleted</MenuItem>
                                <MenuItem value="payment">Payment</MenuItem>
                                <MenuItem value="approval">Approval</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                )}

                <List sx={{ maxHeight: 600, overflow: 'auto' }}>
                    {activities.map((activity, index) => (
                        <React.Fragment key={activity.id}>
                            {index > 0 && <Divider variant="inset" component="li" />}
                            <ListItem alignItems="flex-start">
                                <ListItemAvatar>
                                    <Avatar
                                        src={activity.user.avatar}
                                        sx={{
                                            bgcolor: `${getActivityColor(activity.type)}.light`,
                                            color: `${getActivityColor(activity.type)}.dark`,
                                        }}
                                    >
                                        {getActivityIcon(activity.type)}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                            <Typography variant="body2" component="span">
                                                <strong>{activity.user.name}</strong> {activity.action}
                                            </Typography>
                                            <Chip
                                                label={activity.module}
                                                size="small"
                                                color={getModuleColor(activity.module) as any}
                                            />
                                        </Box>
                                    }
                                    secondary={
                                        <>
                                            <Typography variant="body2" color="text.secondary" component="span">
                                                {activity.description}
                                            </Typography>
                                            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                                                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                                            </Typography>
                                        </>
                                    }
                                />
                            </ListItem>
                        </React.Fragment>
                    ))}

                    {loading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                            <CircularProgress size={24} />
                        </Box>
                    )}

                    {!loading && activities.length === 0 && (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                                No activities found
                            </Typography>
                        </Box>
                    )}
                </List>

                {hasMore && !loading && (
                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                        <Button onClick={handleLoadMore} variant="outlined" size="small">
                            Load More
                        </Button>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default ActivityFeed;
