/**
 * Parent Portal Dashboard
 * 
 * Provides parents with read-only access to their children's information:
 * - Student details
 * - Attendance summary
 * - Fee status
 * - Exam results
 * - Remarks and documents
 * - Health records
 * 
 * All data is loaded from the new parent portal backend API.
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Grid,
    Card,
    CardContent,
    Typography,
    Avatar,
    Chip,
    Tab,
    Tabs,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    LinearProgress,
    Alert,
    CircularProgress,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
} from '@mui/material';
import {
    Person as PersonIcon,
    School as SchoolIcon,
    AttachMoney as MoneyIcon,
    Assignment as AssignmentIcon,
    Event as EventIcon,
    Download as DownloadIcon,
    Payment as PaymentIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    Schedule as ScheduleIcon,
    Description as DocumentIcon,
    LocalHospital as HealthIcon,
} from '@mui/icons-material';
import api from '../../services/api';

interface Student {
    id: number;
    admission_number: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    photo_url?: string;
    current_class: string;
    date_of_birth: string;
    blood_group?: string;
    gender: string;
}

interface Student360Data {
    student: {
        id: number;
        admission_number: string;
        full_name: string;
        photo_url?: string;
        current_class: string;
    };
    attendance: {
        total_days: number;
        present_days: number;
        absent_days: number;
        late_days: number;
        excused_days: number;
        attendance_percentage: number;
    };
    fees: {
        total_amount: number;
        paid_amount: number;
        balance: number;
        overdue_count: number;
        payment_percentage: number;
    };
    exams: {
        total_exams: number;
        average_percentage: number;
        highest_percentage: number;
        lowest_percentage: number;
        grade: string;
    };
}

interface Remark {
    id: number;
    student: number;
    student_name: string;
    remark_type: string;
    remark: string;
    created_by_name: string;
    created_at: string;
}

interface Document {
    id: number;
    document_type: string;
    document_name: string;
    file_url: string;
    uploaded_at: string;
    uploaded_by_name: string;
    verification_status: string;
    remarks?: string;
}

interface HealthRecord {
    id: number;
    record_type: string;
    record_date: string;
    height?: number;
    weight?: number;
    bmi?: number;
    blood_pressure?: string;
    temperature?: number;
    symptoms?: string;
    diagnosis?: string;
    treatment?: string;
    prescription?: string;
    follow_up_date?: string;
    remarks?: string;
    recorded_by_name: string;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

const ParentPortal: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
    const [tabValue, setTabValue] = useState(0);
    const [student360Data, setStudent360Data] = useState<Student360Data | null>(null);
    const [remarks, setRemarks] = useState<Remark[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStudents();
    }, []);

    useEffect(() => {
        if (selectedStudent) {
            fetch360Data();
        }
    }, [selectedStudent]);

    useEffect(() => {
        if (selectedStudent) {
            fetchTabData();
        }
    }, [selectedStudent, tabValue]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/parent/students/');
            setStudents(response.data);
            if (response.data.length > 0) {
                setSelectedStudent(response.data[0].id);
            }
        } catch (error: any) {
            console.error('Error fetching students:', error);
            setError(error.response?.data?.detail || 'Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const fetch360Data = async () => {
        if (!selectedStudent) return;
        
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/parent/students/${selectedStudent}/360/`);
            setStudent360Data(response.data);
        } catch (error: any) {
            console.error('Error fetching 360 data:', error);
            setError(error.response?.data?.detail || 'Failed to load student data');
        } finally {
            setLoading(false);
        }
    };

    const fetchTabData = async () => {
        if (!selectedStudent) return;

        try {
            setLoading(true);
            setError(null);

            switch (tabValue) {
                case 1: // Remarks
                    const remarksResponse = await api.get(`/parent/students/${selectedStudent}/remarks/`);
                    setRemarks(remarksResponse.data);
                    break;
                case 2: // Documents
                    const docsResponse = await api.get(`/parent/students/${selectedStudent}/documents/`);
                    setDocuments(docsResponse.data);
                    break;
                case 3: // Health Records
                    const healthResponse = await api.get(`/parent/students/${selectedStudent}/health-records/`);
                    setHealthRecords(healthResponse.data);
                    break;
            }
        } catch (error: any) {
            console.error('Error fetching tab data:', error);
            setError(error.response?.data?.detail || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadDocument = (url: string, filename: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        link.setAttribute('target', '_blank');
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const currentStudent = students.find((s) => s.id === selectedStudent);
    const fullName = currentStudent 
        ? `${currentStudent.first_name} ${currentStudent.middle_name || ''} ${currentStudent.last_name}`.trim()
        : '';

    if (loading && students.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error && students.length === 0) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                👨‍👩‍👧‍👦 Parent Portal
            </Typography>

            {/* Student Selection */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                {students.map((student) => (
                    <Grid item xs={12} sm={6} md={4} key={student.id}>
                        <Card
                            sx={{
                                cursor: 'pointer',
                                border: selectedStudent === student.id ? 2 : 0,
                                borderColor: 'primary.main',
                                transition: 'all 0.3s',
                                '&:hover': {
                                    boxShadow: 4,
                                    transform: 'translateY(-4px)',
                                },
                            }}
                            onClick={() => setSelectedStudent(student.id)}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar 
                                        src={student.photo_url} 
                                        sx={{ width: 64, height: 64 }}
                                    >
                                        <PersonIcon />
                                    </Avatar>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h6">
                                            {`${student.first_name} ${student.last_name}`}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {student.current_class}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {student.admission_number}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* 360° Summary Cards */}
            {student360Data && currentStudent && (
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    {/* Attendance Card */}
                    <Grid item xs={12} md={4}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <SchoolIcon color="primary" />
                                    <Typography variant="h6">Attendance</Typography>
                                </Box>
                                <Typography variant="h3" color="primary" gutterBottom>
                                    {student360Data.attendance.attendance_percentage.toFixed(1)}%
                                </Typography>
                                <Divider sx={{ my: 1 }} />
                                <Box sx={{ mt: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2">Present</Typography>
                                        <Typography variant="body2" color="success.main">
                                            {student360Data.attendance.present_days}/{student360Data.attendance.total_days}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2">Absent</Typography>
                                        <Typography variant="body2" color="error.main">
                                            {student360Data.attendance.absent_days}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">Late</Typography>
                                        <Typography variant="body2" color="warning.main">
                                            {student360Data.attendance.late_days}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Fees Card */}
                    <Grid item xs={12} md={4}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <MoneyIcon color="primary" />
                                    <Typography variant="h6">Fees</Typography>
                                </Box>
                                <Typography variant="h3" color={student360Data.fees.balance > 0 ? 'error' : 'success'} gutterBottom>
                                    ₹{student360Data.fees.balance.toLocaleString()}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Balance Due
                                </Typography>
                                <Divider sx={{ my: 1 }} />
                                <Box sx={{ mt: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2">Total</Typography>
                                        <Typography variant="body2">
                                            ₹{student360Data.fees.total_amount.toLocaleString()}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2">Paid</Typography>
                                        <Typography variant="body2" color="success.main">
                                            ₹{student360Data.fees.paid_amount.toLocaleString()}
                                        </Typography>
                                    </Box>
                                    {student360Data.fees.overdue_count > 0 && (
                                        <Alert severity="warning" sx={{ mt: 1 }}>
                                            {student360Data.fees.overdue_count} overdue invoice(s)
                                        </Alert>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Exams Card */}
                    <Grid item xs={12} md={4}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <AssignmentIcon color="primary" />
                                    <Typography variant="h6">Academic Performance</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                                    <Typography variant="h3" color="primary">
                                        {student360Data.exams.average_percentage.toFixed(1)}%
                                    </Typography>
                                    <Chip 
                                        label={student360Data.exams.grade} 
                                        color="primary" 
                                        size="small"
                                    />
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                    Average across {student360Data.exams.total_exams} exams
                                </Typography>
                                <Divider sx={{ my: 1 }} />
                                <Box sx={{ mt: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2">Highest</Typography>
                                        <Typography variant="body2" color="success.main">
                                            {student360Data.exams.highest_percentage}%
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">Lowest</Typography>
                                        <Typography variant="body2" color="error.main">
                                            {student360Data.exams.lowest_percentage}%
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Tabs for detailed information */}
            {currentStudent && (
                <Paper>
                    <Tabs 
                        value={tabValue} 
                        onChange={(_, newValue) => setTabValue(newValue)} 
                        variant="scrollable"
                        scrollButtons="auto"
                    >
                        <Tab icon={<SchoolIcon />} label="Overview" />
                        <Tab icon={<EventIcon />} label="Remarks" />
                        <Tab icon={<DocumentIcon />} label="Documents" />
                        <Tab icon={<HealthIcon />} label="Health Records" />
                    </Tabs>

                    {loading && <LinearProgress />}

                    {/* Overview Tab */}
                    <TabPanel value={tabValue} index={0}>
                        <Typography variant="h6" gutterBottom>
                            Student Details
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary">Full Name</Typography>
                                <Typography variant="body1">{fullName}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary">Admission Number</Typography>
                                <Typography variant="body1">{currentStudent.admission_number}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary">Date of Birth</Typography>
                                <Typography variant="body1">
                                    {new Date(currentStudent.date_of_birth).toLocaleDateString()}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary">Gender</Typography>
                                <Typography variant="body1">{currentStudent.gender}</Typography>
                            </Grid>
                            {currentStudent.blood_group && (
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="text.secondary">Blood Group</Typography>
                                    <Typography variant="body1">{currentStudent.blood_group}</Typography>
                                </Grid>
                            )}
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary">Current Class</Typography>
                                <Typography variant="body1">{currentStudent.current_class}</Typography>
                            </Grid>
                        </Grid>
                    </TabPanel>

                    {/* Remarks Tab */}
                    <TabPanel value={tabValue} index={1}>
                        <Typography variant="h6" gutterBottom>
                            Teacher Remarks
                        </Typography>
                        {remarks.length === 0 ? (
                            <Alert severity="info">No remarks available</Alert>
                        ) : (
                            <List>
                                {remarks.map((remark) => (
                                    <React.Fragment key={remark.id}>
                                        <ListItem alignItems="flex-start">
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Typography variant="subtitle1">
                                                            {remark.remark_type}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {new Date(remark.created_at).toLocaleDateString()}
                                                        </Typography>
                                                    </Box>
                                                }
                                                secondary={
                                                    <>
                                                        <Typography variant="body2" component="span">
                                                            {remark.remark}
                                                        </Typography>
                                                        <br />
                                                        <Typography variant="caption" color="text.secondary">
                                                            By: {remark.created_by_name}
                                                        </Typography>
                                                    </>
                                                }
                                            />
                                        </ListItem>
                                        <Divider />
                                    </React.Fragment>
                                ))}
                            </List>
                        )}
                    </TabPanel>

                    {/* Documents Tab */}
                    <TabPanel value={tabValue} index={2}>
                        <Typography variant="h6" gutterBottom>
                            Student Documents
                        </Typography>
                        {documents.length === 0 ? (
                            <Alert severity="info">No documents available</Alert>
                        ) : (
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Document Name</TableCell>
                                            <TableCell>Type</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Uploaded Date</TableCell>
                                            <TableCell>Action</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {documents.map((doc) => (
                                            <TableRow key={doc.id}>
                                                <TableCell>{doc.document_name}</TableCell>
                                                <TableCell>{doc.document_type}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={doc.verification_status}
                                                        size="small"
                                                        color={
                                                            doc.verification_status === 'VERIFIED' 
                                                                ? 'success' 
                                                                : doc.verification_status === 'REJECTED'
                                                                ? 'error'
                                                                : 'warning'
                                                        }
                                                        icon={
                                                            doc.verification_status === 'VERIFIED' 
                                                                ? <CheckIcon /> 
                                                                : doc.verification_status === 'REJECTED'
                                                                ? <CancelIcon />
                                                                : <ScheduleIcon />
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(doc.uploaded_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="small"
                                                        startIcon={<DownloadIcon />}
                                                        onClick={() => handleDownloadDocument(doc.file_url, doc.document_name)}
                                                    >
                                                        Download
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </TabPanel>

                    {/* Health Records Tab */}
                    <TabPanel value={tabValue} index={3}>
                        <Typography variant="h6" gutterBottom>
                            Health Records
                        </Typography>
                        {healthRecords.length === 0 ? (
                            <Alert severity="info">No health records available</Alert>
                        ) : (
                            <Grid container spacing={2}>
                                {healthRecords.map((record) => (
                                    <Grid item xs={12} key={record.id}>
                                        <Card>
                                            <CardContent>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                                    <Typography variant="h6">
                                                        {record.record_type}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {new Date(record.record_date).toLocaleDateString()}
                                                    </Typography>
                                                </Box>
                                                
                                                <Grid container spacing={2}>
                                                    {record.height && (
                                                        <Grid item xs={6} sm={3}>
                                                            <Typography variant="body2" color="text.secondary">Height</Typography>
                                                            <Typography variant="body1">{record.height} cm</Typography>
                                                        </Grid>
                                                    )}
                                                    {record.weight && (
                                                        <Grid item xs={6} sm={3}>
                                                            <Typography variant="body2" color="text.secondary">Weight</Typography>
                                                            <Typography variant="body1">{record.weight} kg</Typography>
                                                        </Grid>
                                                    )}
                                                    {record.bmi && (
                                                        <Grid item xs={6} sm={3}>
                                                            <Typography variant="body2" color="text.secondary">BMI</Typography>
                                                            <Typography variant="body1">{record.bmi}</Typography>
                                                        </Grid>
                                                    )}
                                                    {record.blood_pressure && (
                                                        <Grid item xs={6} sm={3}>
                                                            <Typography variant="body2" color="text.secondary">BP</Typography>
                                                            <Typography variant="body1">{record.blood_pressure}</Typography>
                                                        </Grid>
                                                    )}
                                                </Grid>

                                                {record.diagnosis && (
                                                    <Box sx={{ mt: 2 }}>
                                                        <Typography variant="body2" color="text.secondary">Diagnosis</Typography>
                                                        <Typography variant="body1">{record.diagnosis}</Typography>
                                                    </Box>
                                                )}

                                                {record.treatment && (
                                                    <Box sx={{ mt: 1 }}>
                                                        <Typography variant="body2" color="text.secondary">Treatment</Typography>
                                                        <Typography variant="body1">{record.treatment}</Typography>
                                                    </Box>
                                                )}

                                                {record.prescription && (
                                                    <Box sx={{ mt: 1 }}>
                                                        <Typography variant="body2" color="text.secondary">Prescription</Typography>
                                                        <Typography variant="body1">{record.prescription}</Typography>
                                                    </Box>
                                                )}

                                                <Divider sx={{ my: 2 }} />
                                                <Typography variant="caption" color="text.secondary">
                                                    Recorded by: {record.recorded_by_name}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </TabPanel>
                </Paper>
            )}
        </Container>
    );
};

export default ParentPortal;
