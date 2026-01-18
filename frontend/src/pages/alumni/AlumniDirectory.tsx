/**
 * Alumni Directory - Search and Connect with Alumni
 * Features: Search, Filters, Profile Cards, Connection Requests
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Card,
    CardContent,
    Grid,
    Typography,
    TextField,
    Button,
    Avatar,
    Chip,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Skeleton,
    Pagination,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Divider,
    Paper,
    Alert,
} from '@mui/material';
import {
    Search,
    FilterList,
    LocationOn,
    Work,
    School,
    Email,
    LinkedIn,
    Phone,
    CalendarToday,
    PersonAdd,
    Close,
} from '@mui/icons-material';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { debounce } from 'lodash';

interface AlumniProfile {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    graduation_year: number;
    batch: string;
    current_company?: string;
    current_position?: string;
    location?: string;
    linkedin_url?: string;
    bio?: string;
    photo?: string;
    skills?: string[];
    is_available_for_mentoring: boolean;
}

const AlumniDirectory: React.FC = () => {
    const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        graduationYear: '',
        location: '',
        company: '',
        isMentor: '',
    });
    const [showFilters, setShowFilters] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedAlumni, setSelectedAlumni] = useState<AlumniProfile | null>(null);
    const [profileDialogOpen, setProfileDialogOpen] = useState(false);

    // Graduation year options
    const currentYear = new Date().getFullYear();
    const graduationYears = Array.from({ length: 30 }, (_, i) => currentYear - i);

    useEffect(() => {
        fetchAlumni();
    }, [page, filters]);

    const fetchAlumni = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append('page', page.toString());
            if (searchQuery) params.append('search', searchQuery);
            if (filters.graduationYear) params.append('graduation_year', filters.graduationYear);
            if (filters.location) params.append('location', filters.location);
            if (filters.company) params.append('current_company', filters.company);
            if (filters.isMentor === 'true') params.append('is_available_for_mentoring', 'true');

            const response = await api.get(`/api/alumni/profiles/?${params.toString()}`);
            const data = response.data;

            if (data.results) {
                setAlumni(data.results);
                setTotalPages(Math.ceil(data.count / 20));
            } else {
                setAlumni(data);
                setTotalPages(1);
            }
        } catch (err) {
            console.error('Error fetching alumni:', err);
            toast.error('Failed to load alumni directory');
        } finally {
            setLoading(false);
        }
    };

    const debouncedSearch = useCallback(
        debounce(() => {
            setPage(1);
            fetchAlumni();
        }, 500),
        [searchQuery]
    );

    useEffect(() => {
        debouncedSearch();
        return debouncedSearch.cancel;
    }, [searchQuery, debouncedSearch]);

    const handleViewProfile = (alum: AlumniProfile) => {
        setSelectedAlumni(alum);
        setProfileDialogOpen(true);
    };

    const handleConnect = async (alumniId: number) => {
        try {
            await api.post('/api/alumni/connections/', { alumni_id: alumniId });
            toast.success('Connection request sent!');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to send connection request');
        }
    };

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    const clearFilters = () => {
        setFilters({
            graduationYear: '',
            location: '',
            company: '',
            isMentor: '',
        });
        setPage(1);
    };

    return (
        <Box sx={{ p: 3, minHeight: '100vh', bgcolor: '#f8fafc' }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                    🎓 Alumni Directory
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Connect with fellow alumni, find mentors, and expand your network
                </Typography>
            </Box>

            {/* Search and Filters */}
            <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            placeholder="Search by name, company, or skills..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ bgcolor: 'white' }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Button
                                variant={showFilters ? 'contained' : 'outlined'}
                                startIcon={<FilterList />}
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                Filters
                            </Button>
                            {(filters.graduationYear || filters.location || filters.company || filters.isMentor) && (
                                <Button variant="text" color="error" onClick={clearFilters}>
                                    Clear Filters
                                </Button>
                            )}
                        </Box>
                    </Grid>
                </Grid>

                {/* Filter Options */}
                {showFilters && (
                    <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Graduation Year</InputLabel>
                                <Select
                                    value={filters.graduationYear}
                                    label="Graduation Year"
                                    onChange={(e) => setFilters({ ...filters, graduationYear: e.target.value })}
                                >
                                    <MenuItem value="">All Years</MenuItem>
                                    {graduationYears.map((year) => (
                                        <MenuItem key={year} value={year}>{year}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Location"
                                value={filters.location}
                                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Company"
                                value={filters.company}
                                onChange={(e) => setFilters({ ...filters, company: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Mentorship</InputLabel>
                                <Select
                                    value={filters.isMentor}
                                    label="Mentorship"
                                    onChange={(e) => setFilters({ ...filters, isMentor: e.target.value })}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    <MenuItem value="true">Available for Mentoring</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                )}
            </Paper>

            {/* Alumni Grid */}
            {loading ? (
                <Grid container spacing={3}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Grid item xs={12} sm={6} md={4} key={i}>
                            <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 3 }} />
                        </Grid>
                    ))}
                </Grid>
            ) : alumni.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
                    <School sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        No alumni found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Try adjusting your search or filters
                    </Typography>
                </Paper>
            ) : (
                <>
                    <Grid container spacing={3}>
                        {alumni.map((alum) => (
                            <Grid item xs={12} sm={6} md={4} key={alum.id}>
                                <Card sx={{
                                    borderRadius: 3,
                                    height: '100%',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                                    }
                                }}>
                                    <CardContent>
                                        {/* Profile Header */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <Avatar
                                                src={alum.photo}
                                                sx={{
                                                    width: 64,
                                                    height: 64,
                                                    bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    fontSize: '1.25rem',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {getInitials(alum.first_name, alum.last_name)}
                                            </Avatar>
                                            <Box sx={{ ml: 2, flex: 1 }}>
                                                <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                                                    {alum.first_name} {alum.last_name}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Class of {alum.graduation_year}
                                                </Typography>
                                            </Box>
                                            {alum.is_available_for_mentoring && (
                                                <Chip
                                                    label="Mentor"
                                                    size="small"
                                                    sx={{
                                                        bgcolor: '#dcfce7',
                                                        color: '#166534',
                                                        fontWeight: 600,
                                                    }}
                                                />
                                            )}
                                        </Box>

                                        {/* Info */}
                                        {alum.current_company && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <Work sx={{ fontSize: 18, color: '#64748b', mr: 1 }} />
                                                <Typography variant="body2" color="text.secondary" noWrap>
                                                    {alum.current_position} at {alum.current_company}
                                                </Typography>
                                            </Box>
                                        )}
                                        {alum.location && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                <LocationOn sx={{ fontSize: 18, color: '#64748b', mr: 1 }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {alum.location}
                                                </Typography>
                                            </Box>
                                        )}

                                        {/* Skills */}
                                        {alum.skills && alum.skills.length > 0 && (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                                                {alum.skills.slice(0, 3).map((skill, i) => (
                                                    <Chip
                                                        key={i}
                                                        label={skill}
                                                        size="small"
                                                        sx={{ bgcolor: '#f1f5f9', fontSize: '0.75rem' }}
                                                    />
                                                ))}
                                                {alum.skills.length > 3 && (
                                                    <Chip
                                                        label={`+${alum.skills.length - 3}`}
                                                        size="small"
                                                        sx={{ bgcolor: '#e2e8f0', fontSize: '0.75rem' }}
                                                    />
                                                )}
                                            </Box>
                                        )}

                                        {/* Actions */}
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                fullWidth
                                                onClick={() => handleViewProfile(alum)}
                                            >
                                                View Profile
                                            </Button>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                fullWidth
                                                startIcon={<PersonAdd />}
                                                onClick={() => handleConnect(alum.id)}
                                                sx={{
                                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                }}
                                            >
                                                Connect
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                            <Pagination
                                count={totalPages}
                                page={page}
                                onChange={(_, value) => setPage(value)}
                                color="primary"
                            />
                        </Box>
                    )}
                </>
            )}

            {/* Profile Dialog */}
            <Dialog
                open={profileDialogOpen}
                onClose={() => setProfileDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                {selectedAlumni && (
                    <>
                        <DialogTitle>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6">Alumni Profile</Typography>
                                <IconButton onClick={() => setProfileDialogOpen(false)}>
                                    <Close />
                                </IconButton>
                            </Box>
                        </DialogTitle>
                        <DialogContent>
                            <Box sx={{ textAlign: 'center', mb: 3 }}>
                                <Avatar
                                    src={selectedAlumni.photo}
                                    sx={{
                                        width: 100,
                                        height: 100,
                                        mx: 'auto',
                                        mb: 2,
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        fontSize: '2rem',
                                    }}
                                >
                                    {getInitials(selectedAlumni.first_name, selectedAlumni.last_name)}
                                </Avatar>
                                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                    {selectedAlumni.first_name} {selectedAlumni.last_name}
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    Class of {selectedAlumni.graduation_year}
                                </Typography>
                                {selectedAlumni.is_available_for_mentoring && (
                                    <Chip
                                        label="Available for Mentoring"
                                        color="success"
                                        sx={{ mt: 1 }}
                                    />
                                )}
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {selectedAlumni.bio && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        About
                                    </Typography>
                                    <Typography variant="body2">
                                        {selectedAlumni.bio}
                                    </Typography>
                                </Box>
                            )}

                            <Grid container spacing={2}>
                                {selectedAlumni.current_company && (
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Work color="action" />
                                            <Typography>
                                                {selectedAlumni.current_position} at {selectedAlumni.current_company}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                )}
                                {selectedAlumni.location && (
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <LocationOn color="action" />
                                            <Typography>{selectedAlumni.location}</Typography>
                                        </Box>
                                    </Grid>
                                )}
                                {selectedAlumni.email && (
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Email color="action" />
                                            <Typography>{selectedAlumni.email}</Typography>
                                        </Box>
                                    </Grid>
                                )}
                                {selectedAlumni.linkedin_url && (
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <LinkedIn color="action" />
                                            <a
                                                href={selectedAlumni.linkedin_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ color: '#0077b5' }}
                                            >
                                                LinkedIn Profile
                                            </a>
                                        </Box>
                                    </Grid>
                                )}
                            </Grid>

                            {selectedAlumni.skills && selectedAlumni.skills.length > 0 && (
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Skills
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {selectedAlumni.skills.map((skill, i) => (
                                            <Chip key={i} label={skill} size="small" />
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setProfileDialogOpen(false)}>Close</Button>
                            <Button
                                variant="contained"
                                startIcon={<PersonAdd />}
                                onClick={() => {
                                    handleConnect(selectedAlumni.id);
                                    setProfileDialogOpen(false);
                                }}
                            >
                                Connect
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
};

export default AlumniDirectory;
