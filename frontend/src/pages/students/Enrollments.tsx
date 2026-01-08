/**
 * Enrollments Page
 * Manage student enrollments - view, create, and manage class assignments
 * Supports bulk enrollment and shows pending students
 */

import React, { useEffect, useState } from 'react';
import {
    Container,
    Typography,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Paper,
    TableContainer,
    CircularProgress,
    Alert,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Box,
    IconButton,
    Tooltip,
    Grid,
    Checkbox,
    Tabs,
    Tab,
    Card,
    CardContent
} from '@mui/material';
import { Add, Edit, Delete, Refresh, Search, People, CheckCircle } from '@mui/icons-material';
import api from '../../services/api';

interface Student {
    id: string;
    admission_number: string;
    first_name: string;
    last_name: string;
    full_name?: string;
}

interface Section {
    id: string;
    name: string;
    grade_level?: {
        id: string;
        name: string;
    };
}

interface AcademicYear {
    id: string;
    name: string;
    is_active: boolean;
}

interface GradeLevel {
    id: string;
    name: string;
    order?: number;
}

interface Enrollment {
    id: string;
    student: string;
    student_full_name?: string;
    student_admission_number?: string;
    section: string;
    section_name?: string;
    grade_level_name?: string;
    status?: string;
    enrollment_date?: string;
    exit_date?: string | null;
    academic_year?: string;
    academic_year_name?: string;
    roll_number?: string;
}

interface PendingStudent {
    id: string;
    admission_number: string;
    first_name: string;
    last_name: string;
    full_name: string;
    date_of_birth?: string;
}

const Enrollments: React.FC = () => {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [grades, setGrades] = useState<GradeLevel[]>([]);
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterSection, setFilterSection] = useState('');
    const [filterAcademicYear, setFilterAcademicYear] = useState('');

    // Tabs
    const [activeTab, setActiveTab] = useState(0);

    // Pending enrollments
    const [pendingStudents, setPendingStudents] = useState<PendingStudent[]>([]);
    const [selectedPendingStudents, setSelectedPendingStudents] = useState<Set<string>>(new Set());
    const [pendingLoading, setPendingLoading] = useState(false);

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingEnrollment, setEditingEnrollment] = useState<Enrollment | null>(null);
    const [formData, setFormData] = useState({
        student: '',
        section: '',
        academic_year: '',
        status: 'ACTIVE',
        enrollment_date: new Date().toISOString().split('T')[0],
        roll_number: ''
    });
    const [selectedGrade, setSelectedGrade] = useState('');
    const [saving, setSaving] = useState(false);

    // Bulk enrollment dialog
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
    const [bulkSection, setBulkSection] = useState('');
    const [bulkSaving, setBulkSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (activeTab === 1) {
            fetchPendingStudents();
        }
    }, [activeTab, filterAcademicYear]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Build query params for search
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (filterStatus) params.append('status', filterStatus);
            if (filterSection) params.append('section', filterSection);
            if (filterAcademicYear) params.append('academic_year', filterAcademicYear);

            const [enrollmentsRes, studentsRes, sectionsRes, yearsRes, gradesRes] = await Promise.all([
                api.get(`/students/enrollments/?${params.toString()}`),
                api.get('/students/students/'),
                api.get('/tenants/sections/'),
                api.get('/tenants/years/'),
                api.get('/tenants/grades/')
            ]);

            const enrollmentData = Array.isArray(enrollmentsRes.data)
                ? enrollmentsRes.data
                : enrollmentsRes.data.results || [];
            setEnrollments(enrollmentData);

            const studentData = Array.isArray(studentsRes.data)
                ? studentsRes.data
                : studentsRes.data.results || [];
            setStudents(studentData);

            const sectionData = Array.isArray(sectionsRes.data)
                ? sectionsRes.data
                : sectionsRes.data.results || [];
            setSections(sectionData);

            const yearData = Array.isArray(yearsRes.data)
                ? yearsRes.data
                : yearsRes.data.results || [];
            setAcademicYears(yearData);

            const gradeData = Array.isArray(gradesRes.data)
                ? gradesRes.data
                : gradesRes.data.results || [];
            setGrades(gradeData);

            // Set default academic year filter
            if (!filterAcademicYear && yearData.length > 0) {
                const activeYear = yearData.find((y: AcademicYear) => y.is_active);
                if (activeYear) {
                    setFilterAcademicYear(activeYear.id);
                }
            }

        } catch (err: any) {
            console.error('Error fetching data', err);
            setError(err.response?.data?.detail || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingStudents = async () => {
        try {
            setPendingLoading(true);
            const params = filterAcademicYear ? `?academic_year=${filterAcademicYear}` : '';
            const response = await api.get(`/students/enrollments/pending/${params}`);
            setPendingStudents(response.data.students || []);
        } catch (err: any) {
            console.error('Error fetching pending students', err);
        } finally {
            setPendingLoading(false);
        }
    };

    const handleOpenDialog = (enrollment?: Enrollment) => {
        if (enrollment) {
            setEditingEnrollment(enrollment);
            setFormData({
                student: enrollment.student,
                section: enrollment.section,
                academic_year: enrollment.academic_year || '',
                status: enrollment.status || 'ACTIVE',
                enrollment_date: enrollment.enrollment_date || new Date().toISOString().split('T')[0],
                roll_number: enrollment.roll_number || ''
            });
        } else {
            setEditingEnrollment(null);
            const activeYear = academicYears.find(y => y.is_active);
            setFormData({
                student: '',
                section: '',
                academic_year: activeYear?.id || '',
                status: 'ACTIVE',
                enrollment_date: new Date().toISOString().split('T')[0],
                roll_number: ''
            });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingEnrollment(null);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            if (editingEnrollment) {
                await api.patch(`/students/enrollments/${editingEnrollment.id}/`, formData);
            } else {
                await api.post('/students/enrollments/', formData);
            }
            handleCloseDialog();
            fetchData();
        } catch (err: any) {
            console.error('Error saving enrollment', err);
            const errorMsg = err.response?.data?.detail ||
                err.response?.data?.non_field_errors?.[0] ||
                JSON.stringify(err.response?.data) ||
                'Failed to save enrollment';
            setError(errorMsg);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (enrollmentId: string) => {
        if (!window.confirm('Are you sure you want to delete this enrollment?')) return;

        try {
            await api.delete(`/students/enrollments/${enrollmentId}/`);
            fetchData();
        } catch (err: any) {
            console.error('Error deleting enrollment', err);
            setError(err.response?.data?.detail || 'Failed to delete enrollment');
        }
    };

    const handleTogglePendingStudent = (studentId: string) => {
        setSelectedPendingStudents(prev => {
            const newSet = new Set(prev);
            if (newSet.has(studentId)) {
                newSet.delete(studentId);
            } else {
                newSet.add(studentId);
            }
            return newSet;
        });
    };

    const handleSelectAllPending = () => {
        if (selectedPendingStudents.size === pendingStudents.length) {
            setSelectedPendingStudents(new Set());
        } else {
            setSelectedPendingStudents(new Set(pendingStudents.map(s => s.id)));
        }
    };

    const handleBulkEnroll = async () => {
        if (selectedPendingStudents.size === 0 || !bulkSection || !filterAcademicYear) {
            setError('Please select students, section, and academic year');
            return;
        }

        try {
            setBulkSaving(true);
            setError(null);
            const response = await api.post('/students/enrollments/bulk_create/', {
                student_ids: Array.from(selectedPendingStudents),
                section: bulkSection,
                academic_year: filterAcademicYear,
                enrollment_date: new Date().toISOString().split('T')[0]
            });

            setBulkDialogOpen(false);
            setSelectedPendingStudents(new Set());
            setBulkSection('');
            fetchData();
            fetchPendingStudents();

            alert(`Successfully enrolled ${response.data.created} students. ${response.data.skipped} were already enrolled.`);
        } catch (err: any) {
            console.error('Error bulk enrolling', err);
            setError(err.response?.data?.error || 'Failed to bulk enroll students');
        } finally {
            setBulkSaving(false);
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status?.toUpperCase()) {
            case 'ACTIVE': return 'success';
            case 'PROMOTED': return 'info';
            case 'DETAINED': return 'warning';
            case 'LEFT': return 'error';
            case 'TRANSFERRED': return 'default';
            case 'COMPLETED': return 'primary';
            default: return 'default';
        }
    };

    const handleSearchKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            fetchData();
        }
    };

    if (loading && enrollments.length === 0) return (
        <Container sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
        </Container>
    );

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Student Enrollments
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Tooltip title="Refresh">
                        <IconButton onClick={() => { fetchData(); if (activeTab === 1) fetchPendingStudents(); }}>
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                    >
                        Add Enrollment
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
                <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                    <Tab label={`Current Enrollments (${enrollments.length})`} icon={<CheckCircle />} iconPosition="start" />
                    <Tab label={`Pending Enrollments (${pendingStudents.length})`} icon={<People />} iconPosition="start" />
                </Tabs>
            </Paper>

            {activeTab === 0 && (
                <>
                    {/* Filters */}
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Search by name or admission number..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={handleSearchKeyPress}
                                    InputProps={{
                                        startAdornment: <Search sx={{ color: 'action.disabled', mr: 1 }} />
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Academic Year</InputLabel>
                                    <Select
                                        value={filterAcademicYear}
                                        label="Academic Year"
                                        onChange={(e) => setFilterAcademicYear(e.target.value)}
                                    >
                                        <MenuItem value="">All Years</MenuItem>
                                        {academicYears.map(year => (
                                            <MenuItem key={year.id} value={year.id}>
                                                {year.name} {year.is_active && '(Current)'}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        value={filterStatus}
                                        label="Status"
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                    >
                                        <MenuItem value="">All Statuses</MenuItem>
                                        <MenuItem value="ACTIVE">Active</MenuItem>
                                        <MenuItem value="PROMOTED">Promoted</MenuItem>
                                        <MenuItem value="DETAINED">Detained</MenuItem>
                                        <MenuItem value="LEFT">Left</MenuItem>
                                        <MenuItem value="TRANSFERRED">Transferred</MenuItem>
                                        <MenuItem value="COMPLETED">Completed</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Section</InputLabel>
                                    <Select
                                        value={filterSection}
                                        label="Section"
                                        onChange={(e) => setFilterSection(e.target.value)}
                                    >
                                        <MenuItem value="">All Sections</MenuItem>
                                        {sections.map(section => (
                                            <MenuItem key={section.id} value={section.id}>
                                                {section.grade_level?.name} - {section.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Button variant="outlined" onClick={fetchData} fullWidth>
                                    Apply Filters
                                </Button>
                            </Grid>
                            <Grid item xs={12} md={1}>
                                <Typography variant="body2" color="text.secondary">
                                    {enrollments.length} result(s)
                                </Typography>
                            </Grid>
                        </Grid>
                    </Paper>

                    {enrollments.length === 0 ? (
                        <Paper sx={{ p: 4, textAlign: 'center' }}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                No Enrollments Found
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Start by adding students to classes for the current academic year.
                            </Typography>
                            <Button
                                variant="outlined"
                                startIcon={<Add />}
                                onClick={() => handleOpenDialog()}
                            >
                                Create First Enrollment
                            </Button>
                        </Paper>
                    ) : (
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: 'grey.100' }}>
                                        <TableCell><strong>Student</strong></TableCell>
                                        <TableCell><strong>Admission No.</strong></TableCell>
                                        <TableCell><strong>Class / Section</strong></TableCell>
                                        <TableCell><strong>Roll No.</strong></TableCell>
                                        <TableCell><strong>Academic Year</strong></TableCell>
                                        <TableCell><strong>Status</strong></TableCell>
                                        <TableCell><strong>Enrollment Date</strong></TableCell>
                                        <TableCell align="right"><strong>Actions</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {enrollments.map(e => (
                                        <TableRow key={e.id} hover>
                                            <TableCell>{e.student_full_name || '—'}</TableCell>
                                            <TableCell>{e.student_admission_number || '—'}</TableCell>
                                            <TableCell>
                                                {e.grade_level_name || '—'} / {e.section_name || '—'}
                                            </TableCell>
                                            <TableCell>{e.roll_number || '—'}</TableCell>
                                            <TableCell>{e.academic_year_name || '—'}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={e.status || 'Unknown'}
                                                    color={getStatusColor(e.status) as any}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {e.enrollment_date ? new Date(e.enrollment_date).toLocaleDateString() : '—'}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="Edit">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleOpenDialog(e)}
                                                    >
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleDelete(e.id)}
                                                    >
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </>
            )}

            {activeTab === 1 && (
                <>
                    {/* Pending Enrollments Tab */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">
                                    Students Without Enrollments for Current Year
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <FormControl size="small" sx={{ minWidth: 200 }}>
                                        <InputLabel>Academic Year</InputLabel>
                                        <Select
                                            value={filterAcademicYear}
                                            label="Academic Year"
                                            onChange={(e) => setFilterAcademicYear(e.target.value)}
                                        >
                                            {academicYears.map(year => (
                                                <MenuItem key={year.id} value={year.id}>
                                                    {year.name} {year.is_active && '(Current)'}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <Button
                                        variant="contained"
                                        disabled={selectedPendingStudents.size === 0}
                                        onClick={() => setBulkDialogOpen(true)}
                                        startIcon={<People />}
                                    >
                                        Bulk Enroll ({selectedPendingStudents.size})
                                    </Button>
                                </Box>
                            </Box>

                            {pendingLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                    <CircularProgress />
                                </Box>
                            ) : pendingStudents.length === 0 ? (
                                <Alert severity="success">
                                    All students are enrolled for the selected academic year!
                                </Alert>
                            ) : (
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: 'grey.100' }}>
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        checked={selectedPendingStudents.size === pendingStudents.length && pendingStudents.length > 0}
                                                        indeterminate={selectedPendingStudents.size > 0 && selectedPendingStudents.size < pendingStudents.length}
                                                        onChange={handleSelectAllPending}
                                                    />
                                                </TableCell>
                                                <TableCell><strong>Admission No.</strong></TableCell>
                                                <TableCell><strong>Student Name</strong></TableCell>
                                                <TableCell><strong>Date of Birth</strong></TableCell>
                                                <TableCell align="right"><strong>Actions</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {pendingStudents.map(student => (
                                                <TableRow key={student.id} hover>
                                                    <TableCell padding="checkbox">
                                                        <Checkbox
                                                            checked={selectedPendingStudents.has(student.id)}
                                                            onChange={() => handleTogglePendingStudent(student.id)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>{student.admission_number}</TableCell>
                                                    <TableCell>{student.full_name}</TableCell>
                                                    <TableCell>
                                                        {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : '—'}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            onClick={() => {
                                                                const activeYear = academicYears.find(y => y.is_active);
                                                                setFormData({
                                                                    student: student.id,
                                                                    section: '',
                                                                    academic_year: activeYear?.id || filterAcademicYear,
                                                                    status: 'ACTIVE',
                                                                    enrollment_date: new Date().toISOString().split('T')[0],
                                                                    roll_number: ''
                                                                });
                                                                setDialogOpen(true);
                                                            }}
                                                        >
                                                            Enroll
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingEnrollment ? 'Edit Enrollment' : 'Add Enrollment'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel>Student *</InputLabel>
                            <Select
                                value={formData.student}
                                label="Student *"
                                onChange={(e) => setFormData({ ...formData, student: e.target.value })}
                                disabled={!!editingEnrollment}
                            >
                                {students.map(student => (
                                    <MenuItem key={student.id} value={student.id}>
                                        {student.first_name} {student.last_name} ({student.admission_number})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Class *</InputLabel>
                            <Select
                                value={selectedGrade}
                                label="Class *"
                                onChange={(e) => {
                                    setSelectedGrade(e.target.value);
                                    setFormData({ ...formData, section: '' }); // Reset section when class changes
                                }}
                            >
                                {grades.map(grade => (
                                    <MenuItem key={grade.id} value={grade.id}>
                                        {grade.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Section *</InputLabel>
                            <Select
                                value={formData.section}
                                label="Section *"
                                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                                disabled={!selectedGrade}
                            >
                                {sections
                                    .filter(section => section.grade_level?.id === selectedGrade)
                                    .map(section => (
                                        <MenuItem key={section.id} value={section.id}>
                                            {section.name}
                                        </MenuItem>
                                    ))}
                            </Select>
                            {!selectedGrade && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                    Please select a class first
                                </Typography>
                            )}
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Academic Year *</InputLabel>
                            <Select
                                value={formData.academic_year}
                                label="Academic Year *"
                                onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                            >
                                {academicYears.map(year => (
                                    <MenuItem key={year.id} value={year.id}>
                                        {year.name} {year.is_active && '(Current)'}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="Roll Number"
                            value={formData.roll_number}
                            onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                        />

                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={formData.status}
                                label="Status"
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <MenuItem value="ACTIVE">Active</MenuItem>
                                <MenuItem value="PROMOTED">Promoted</MenuItem>
                                <MenuItem value="DETAINED">Detained</MenuItem>
                                <MenuItem value="LEFT">Left</MenuItem>
                                <MenuItem value="TRANSFERRED">Transferred</MenuItem>
                                <MenuItem value="COMPLETED">Completed</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            type="date"
                            label="Enrollment Date"
                            value={formData.enrollment_date}
                            onChange={(e) => setFormData({ ...formData, enrollment_date: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={saving || !formData.student || !formData.section || !formData.academic_year}
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Bulk Enrollment Dialog */}
            <Dialog open={bulkDialogOpen} onClose={() => setBulkDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Bulk Enroll {selectedPendingStudents.size} Students
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <Alert severity="info">
                            You are about to enroll {selectedPendingStudents.size} students for the academic year.
                        </Alert>

                        <FormControl fullWidth>
                            <InputLabel>Section *</InputLabel>
                            <Select
                                value={bulkSection}
                                label="Section *"
                                onChange={(e) => setBulkSection(e.target.value)}
                            >
                                {sections.map(section => (
                                    <MenuItem key={section.id} value={section.id}>
                                        {section.grade_level?.name} - {section.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Typography variant="body2" color="text.secondary">
                            Academic Year: {academicYears.find(y => y.id === filterAcademicYear)?.name || 'Not selected'}
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBulkDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleBulkEnroll}
                        disabled={bulkSaving || !bulkSection}
                    >
                        {bulkSaving ? 'Enrolling...' : `Enroll ${selectedPendingStudents.size} Students`}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Enrollments;
