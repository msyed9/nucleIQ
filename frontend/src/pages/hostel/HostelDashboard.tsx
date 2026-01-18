/**
 * Hostel Dashboard - Enhanced with Statistics and Quick Actions
 * Provides comprehensive overview of hostel operations
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Grid,
    Typography,
    Button,
    Chip,
    LinearProgress,
    Avatar,
    IconButton,
    Paper,
    Divider,
    Alert,
    Skeleton,
} from '@mui/material';
import {
    Home,
    Person,
    Bed,
    Restaurant,
    ReportProblem,
    ExitToApp,
    TrendingUp,
    Warning,
    CheckCircle,
    Schedule,
    Add,
} from '@mui/icons-material';
import api from '../../services/api';

interface DashboardStats {
    totalBuildings: number;
    totalRooms: number;
    totalBeds: number;
    occupiedBeds: number;
    occupancyRate: number;
    pendingComplaints: number;
    pendingGatePasses: number;
    messRegistrations: number;
}

interface BuildingSummary {
    id: string;
    name: string;
    building_type: string;
    total_rooms: number;
    total_beds: number;
    occupied_beds: number;
    occupancy_percentage: number;
}

interface RecentAllocation {
    id: string;
    student_name: string;
    admission_number: string;
    bed_detail: string;
    start_date: string;
    is_active: boolean;
}

interface PendingComplaint {
    id: string;
    complaint_type: string;
    priority: string;
    student_name: string;
    created_at: string;
}

const HostelDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<DashboardStats>({
        totalBuildings: 0,
        totalRooms: 0,
        totalBeds: 0,
        occupiedBeds: 0,
        occupancyRate: 0,
        pendingComplaints: 0,
        pendingGatePasses: 0,
        messRegistrations: 0,
    });
    const [buildings, setBuildings] = useState<BuildingSummary[]>([]);
    const [recentAllocations, setRecentAllocations] = useState<RecentAllocation[]>([]);
    const [pendingComplaints, setPendingComplaints] = useState<PendingComplaint[]>([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [buildingsRes, allocationsRes, complaintsRes, messRes] = await Promise.all([
                api.get('/api/hostel/buildings/'),
                api.get('/api/hostel/allocations/?is_active=true'),
                api.get('/api/hostel/complaints/?status=PENDING'),
                api.get('/api/hostel/mess-registrations/?is_active=true'),
            ]);

            const buildingsData = buildingsRes.data.results || buildingsRes.data || [];
            const allocationsData = allocationsRes.data.results || allocationsRes.data || [];
            const complaintsData = complaintsRes.data.results || complaintsRes.data || [];
            const messData = messRes.data.results || messRes.data || [];

            // Calculate stats from buildings
            let totalRooms = 0;
            let totalBeds = 0;
            let occupiedBeds = 0;

            const buildingSummaries: BuildingSummary[] = await Promise.all(
                buildingsData.map(async (building: any) => {
                    try {
                        const statsRes = await api.get(`/api/hostel/buildings/${building.id}/statistics/`);
                        const bStats = statsRes.data;
                        totalRooms += bStats.total_rooms || 0;
                        totalBeds += bStats.total_beds || 0;
                        occupiedBeds += bStats.occupied_beds || 0;
                        return {
                            id: building.id,
                            name: building.name,
                            building_type: building.building_type,
                            total_rooms: bStats.total_rooms || 0,
                            total_beds: bStats.total_beds || 0,
                            occupied_beds: bStats.occupied_beds || 0,
                            occupancy_percentage: bStats.occupancy_percentage || 0,
                        };
                    } catch {
                        return {
                            id: building.id,
                            name: building.name,
                            building_type: building.building_type,
                            total_rooms: 0,
                            total_beds: 0,
                            occupied_beds: 0,
                            occupancy_percentage: 0,
                        };
                    }
                })
            );

            setBuildings(buildingSummaries);
            setRecentAllocations(allocationsData.slice(0, 5));
            setPendingComplaints(complaintsData.slice(0, 5));

            setStats({
                totalBuildings: buildingsData.length,
                totalRooms,
                totalBeds,
                occupiedBeds,
                occupancyRate: totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0,
                pendingComplaints: complaintsData.length,
                pendingGatePasses: 0, // Would need separate API call
                messRegistrations: messData.length,
            });

        } catch (err: any) {
            console.error('Error fetching hostel dashboard:', err);
            setError(err.response?.data?.detail || 'Failed to load hostel dashboard');
        } finally {
            setLoading(false);
        }
    };

    const getOccupancyColor = (rate: number) => {
        if (rate >= 90) return '#ef4444';
        if (rate >= 70) return '#f59e0b';
        return '#22c55e';
    };

    const getBuildingTypeColor = (type: string) => {
        switch (type) {
            case 'BOYS': return '#3b82f6';
            case 'GIRLS': return '#ec4899';
            case 'STAFF': return '#8b5cf6';
            default: return '#6b7280';
        }
    };

    const getPriorityChip = (priority: string) => {
        const colors: Record<string, 'error' | 'warning' | 'info'> = {
            HIGH: 'error',
            MEDIUM: 'warning',
            LOW: 'info',
        };
        return <Chip label={priority} color={colors[priority] || 'default'} size="small" />;
    };

    if (loading) {
        return (
            <Box sx={{ p: 3 }}>
                <Skeleton variant="rectangular" height={60} sx={{ mb: 3, borderRadius: 2 }} />
                <Grid container spacing={3}>
                    {[1, 2, 3, 4].map((i) => (
                        <Grid item xs={12} sm={6} md={3} key={i}>
                            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, minHeight: '100vh', bgcolor: '#f8fafc' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
                        🏨 Hostel Dashboard
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Overview of hostel operations and occupancy
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => navigate('/hostel/allocations')}
                        sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                    >
                        New Allocation
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        borderRadius: 3,
                        boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                    <Typography variant="overline" sx={{ opacity: 0.8 }}>
                                        Total Buildings
                                    </Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                                        {stats.totalBuildings}
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                                    <Home fontSize="large" />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{
                        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                        color: 'white',
                        borderRadius: 3,
                        boxShadow: '0 10px 30px rgba(17, 153, 142, 0.3)',
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                    <Typography variant="overline" sx={{ opacity: 0.8 }}>
                                        Occupied / Total Beds
                                    </Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                                        {stats.occupiedBeds}/{stats.totalBeds}
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                                    <Bed fontSize="large" />
                                </Avatar>
                            </Box>
                            <Box sx={{ mt: 2 }}>
                                <LinearProgress
                                    variant="determinate"
                                    value={stats.occupancyRate}
                                    sx={{
                                        height: 8,
                                        borderRadius: 4,
                                        bgcolor: 'rgba(255,255,255,0.3)',
                                        '& .MuiLinearProgress-bar': {
                                            bgcolor: 'white',
                                            borderRadius: 4,
                                        }
                                    }}
                                />
                                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                    {stats.occupancyRate.toFixed(1)}% Occupancy
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        color: 'white',
                        borderRadius: 3,
                        boxShadow: '0 10px 30px rgba(240, 147, 251, 0.3)',
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                    <Typography variant="overline" sx={{ opacity: 0.8 }}>
                                        Pending Complaints
                                    </Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                                        {stats.pendingComplaints}
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                                    <ReportProblem fontSize="large" />
                                </Avatar>
                            </Box>
                            <Button
                                size="small"
                                sx={{ mt: 1, color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
                                variant="outlined"
                                onClick={() => navigate('/hostel/complaints')}
                            >
                                View All
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        color: 'white',
                        borderRadius: 3,
                        boxShadow: '0 10px 30px rgba(79, 172, 254, 0.3)',
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                    <Typography variant="overline" sx={{ opacity: 0.8 }}>
                                        Mess Registrations
                                    </Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                                        {stats.messRegistrations}
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                                    <Restaurant fontSize="large" />
                                </Avatar>
                            </Box>
                            <Button
                                size="small"
                                sx={{ mt: 1, color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
                                variant="outlined"
                                onClick={() => navigate('/hostel/mess')}
                            >
                                Manage Mess
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Buildings Overview & Recent Activity */}
            <Grid container spacing={3}>
                {/* Buildings */}
                <Grid item xs={12} md={7}>
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Buildings Overview
                            </Typography>
                            <Button size="small" onClick={() => navigate('/hostel/allocations')}>
                                View All
                            </Button>
                        </Box>

                        {buildings.length === 0 ? (
                            <Alert severity="info">No buildings configured. Add buildings to get started.</Alert>
                        ) : (
                            <Grid container spacing={2}>
                                {buildings.map((building) => (
                                    <Grid item xs={12} sm={6} key={building.id}>
                                        <Card sx={{
                                            borderRadius: 2,
                                            border: '1px solid #e2e8f0',
                                            '&:hover': { boxShadow: 3 }
                                        }}>
                                            <CardContent>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                        {building.name}
                                                    </Typography>
                                                    <Chip
                                                        label={building.building_type}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: getBuildingTypeColor(building.building_type),
                                                            color: 'white',
                                                            fontWeight: 500,
                                                        }}
                                                    />
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Rooms
                                                        </Typography>
                                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                            {building.total_rooms}
                                                        </Typography>
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Beds
                                                        </Typography>
                                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                            {building.occupied_beds}/{building.total_beds}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={building.occupancy_percentage}
                                                    sx={{
                                                        height: 8,
                                                        borderRadius: 4,
                                                        bgcolor: '#e2e8f0',
                                                        '& .MuiLinearProgress-bar': {
                                                            bgcolor: getOccupancyColor(building.occupancy_percentage),
                                                            borderRadius: 4,
                                                        }
                                                    }}
                                                />
                                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                                    {building.occupancy_percentage.toFixed(1)}% Occupied
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Paper>
                </Grid>

                {/* Right Column */}
                <Grid item xs={12} md={5}>
                    {/* Recent Allocations */}
                    <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                            Recent Allocations
                        </Typography>
                        {recentAllocations.length === 0 ? (
                            <Typography color="text.secondary">No recent allocations</Typography>
                        ) : (
                            recentAllocations.map((allocation, index) => (
                                <Box key={allocation.id}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                                        <Avatar sx={{ bgcolor: '#e0e7ff', color: '#4f46e5', mr: 2 }}>
                                            <Person />
                                        </Avatar>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                {allocation.student_name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {allocation.admission_number} • {allocation.bed_detail}
                                            </Typography>
                                        </Box>
                                        <Chip
                                            icon={allocation.is_active ? <CheckCircle fontSize="small" /> : <Schedule fontSize="small" />}
                                            label={allocation.is_active ? 'Active' : 'Inactive'}
                                            color={allocation.is_active ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </Box>
                                    {index < recentAllocations.length - 1 && <Divider />}
                                </Box>
                            ))
                        )}
                    </Paper>

                    {/* Pending Complaints */}
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Pending Complaints
                            </Typography>
                            {pendingComplaints.length > 0 && (
                                <Chip
                                    label={pendingComplaints.length}
                                    color="error"
                                    size="small"
                                />
                            )}
                        </Box>
                        {pendingComplaints.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 3 }}>
                                <CheckCircle sx={{ fontSize: 48, color: '#22c55e', mb: 1 }} />
                                <Typography color="text.secondary">No pending complaints</Typography>
                            </Box>
                        ) : (
                            pendingComplaints.map((complaint, index) => (
                                <Box key={complaint.id}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                                        <Avatar sx={{ bgcolor: '#fef3c7', color: '#d97706', mr: 2 }}>
                                            <Warning />
                                        </Avatar>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                {complaint.complaint_type}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {complaint.student_name}
                                            </Typography>
                                        </Box>
                                        {getPriorityChip(complaint.priority)}
                                    </Box>
                                    {index < pendingComplaints.length - 1 && <Divider />}
                                </Box>
                            ))
                        )}
                        {pendingComplaints.length > 0 && (
                            <Button
                                fullWidth
                                sx={{ mt: 2 }}
                                variant="outlined"
                                onClick={() => navigate('/hostel/complaints')}
                            >
                                View All Complaints
                            </Button>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Quick Actions */}
            <Paper sx={{ p: 3, borderRadius: 3, mt: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Quick Actions
                </Typography>
                <Grid container spacing={2}>
                    {[
                        { label: 'Room Allocation', icon: <Bed />, path: '/hostel/allocations', color: '#4f46e5' },
                        { label: 'Mess Management', icon: <Restaurant />, path: '/hostel/mess', color: '#059669' },
                        { label: 'Complaints', icon: <ReportProblem />, path: '/hostel/complaints', color: '#dc2626' },
                        { label: 'Gate Passes', icon: <ExitToApp />, path: '/security/gate-passes', color: '#7c3aed' },
                    ].map((action) => (
                        <Grid item xs={6} sm={3} key={action.label}>
                            <Button
                                fullWidth
                                variant="outlined"
                                sx={{
                                    py: 2,
                                    borderColor: action.color,
                                    color: action.color,
                                    '&:hover': {
                                        bgcolor: action.color,
                                        color: 'white',
                                        borderColor: action.color,
                                    }
                                }}
                                onClick={() => navigate(action.path)}
                                startIcon={action.icon}
                            >
                                {action.label}
                            </Button>
                        </Grid>
                    ))}
                </Grid>
            </Paper>
        </Box>
    );
};

export default HostelDashboard;
