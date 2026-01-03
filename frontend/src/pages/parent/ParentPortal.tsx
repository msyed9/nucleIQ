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
} from '@mui/material';
import {
    Person as PersonIcon,
    School as SchoolIcon,
    AttachMoney as MoneyIcon,
    Assignment as AssignmentIcon,
    Event as EventIcon,
    Download as DownloadIcon,
    Payment as PaymentIcon,
} from '@mui/icons-material';
import api from '../../services/api';

interface Child {
    id: string;
    name: string;
    class: string;
    section: string;
    roll_number: string;
    photo?: string;
    attendance_percentage: number;
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
    const [children, setChildren] = useState<Child[]>([]);
    const [selectedChild, setSelectedChild] = useState<string>('');
    const [tabValue, setTabValue] = useState(0);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [marks, setMarks] = useState<any[]>([]);
    const [fees, setFees] = useState<any>(null);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchChildren();
    }, []);

    useEffect(() => {
        if (selectedChild) {
            fetchChildData();
        }
    }, [selectedChild, tabValue]);

    const fetchChildren = async () => {
        try {
            const response = await api.get('/api/parents/children/');
            setChildren(response.data);
            if (response.data.length > 0) {
                setSelectedChild(response.data[0].id);
            }
        } catch (error) {
            console.error('Error fetching children:', error);
        }
    };

    const fetchChildData = async () => {
        setLoading(true);
        try {
            switch (tabValue) {
                case 0: // Attendance
                    const attResponse = await api.get(`/api/parents/children/${selectedChild}/attendance/`);
                    setAttendance(attResponse.data);
                    break;
                case 1: // Marks
                    const marksResponse = await api.get(`/api/parents/children/${selectedChild}/marks/`);
                    setMarks(marksResponse.data);
                    break;
                case 2: // Fees
                    const feesResponse = await api.get(`/api/parents/children/${selectedChild}/fees/`);
                    setFees(feesResponse.data);
                    break;
                case 3: // Assignments
                    const assignResponse = await api.get(`/api/parents/children/${selectedChild}/assignments/`);
                    setAssignments(assignResponse.data);
                    break;
            }
        } catch (error) {
            console.error('Error fetching child data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePayFees = async () => {
        try {
            const response = await api.post(`/api/parents/children/${selectedChild}/pay-fees/`, {
                amount: fees.pending_amount,
            });
            // Redirect to payment gateway
            window.location.href = response.data.payment_url;
        } catch (error) {
            console.error('Error initiating payment:', error);
        }
    };

    const handleDownloadReport = async () => {
        try {
            const response = await api.get(`/api/parents/children/${selectedChild}/report-card/`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'report-card.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading report:', error);
        }
    };

    const currentChild = children.find((c) => c.id === selectedChild);

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>
                Parent Portal
            </Typography>

            {/* Child Selection */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                {children.map((child) => (
                    <Grid item xs={12} sm={6} md={4} key={child.id}>
                        <Card
                            sx={{
                                cursor: 'pointer',
                                border: selectedChild === child.id ? 2 : 0,
                                borderColor: 'primary.main',
                            }}
                            onClick={() => setSelectedChild(child.id)}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar src={child.photo} sx={{ width: 60, height: 60 }}>
                                        <PersonIcon />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6">{child.name}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {child.class} - {child.section}
                                        </Typography>
                                        <Chip
                                            label={`${child.attendance_percentage}% Attendance`}
                                            size="small"
                                            color={child.attendance_percentage >= 75 ? 'success' : 'error'}
                                            sx={{ mt: 1 }}
                                        />
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {currentChild && (
                <Paper>
                    <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} variant="scrollable">
                        <Tab icon={<SchoolIcon />} label="Attendance" />
                        <Tab icon={<AssignmentIcon />} label="Marks" />
                        <Tab icon={<MoneyIcon />} label="Fees" />
                        <Tab icon={<EventIcon />} label="Assignments" />
                    </Tabs>

                    {loading && <LinearProgress />}

                    {/* Attendance Tab */}
                    <TabPanel value={tabValue} index={0}>
                        <Typography variant="h6" gutterBottom>
                            Attendance Record
                        </Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Remarks</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {attendance.map((record, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{record.date}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={record.status}
                                                    size="small"
                                                    color={record.status === 'Present' ? 'success' : 'error'}
                                                />
                                            </TableCell>
                                            <TableCell>{record.remarks || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </TabPanel>

                    {/* Marks Tab */}
                    <TabPanel value={tabValue} index={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6">Exam Results</Typography>
                            <Button startIcon={<DownloadIcon />} onClick={handleDownloadReport}>
                                Download Report Card
                            </Button>
                        </Box>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Subject</TableCell>
                                        <TableCell>Exam</TableCell>
                                        <TableCell>Marks Obtained</TableCell>
                                        <TableCell>Total Marks</TableCell>
                                        <TableCell>Percentage</TableCell>
                                        <TableCell>Grade</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {marks.map((mark, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{mark.subject}</TableCell>
                                            <TableCell>{mark.exam}</TableCell>
                                            <TableCell>{mark.obtained}</TableCell>
                                            <TableCell>{mark.total}</TableCell>
                                            <TableCell>{mark.percentage}%</TableCell>
                                            <TableCell>
                                                <Chip label={mark.grade} size="small" color="primary" />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </TabPanel>

                    {/* Fees Tab */}
                    <TabPanel value={tabValue} index={2}>
                        <Typography variant="h6" gutterBottom>
                            Fee Details
                        </Typography>
                        {fees && (
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={4}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="body2" color="text.secondary">
                                                Total Fees
                                            </Typography>
                                            <Typography variant="h4" color="primary">
                                                ₹{fees.total_amount}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="body2" color="text.secondary">
                                                Paid
                                            </Typography>
                                            <Typography variant="h4" color="success.main">
                                                ₹{fees.paid_amount}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="body2" color="text.secondary">
                                                Pending
                                            </Typography>
                                            <Typography variant="h4" color="error.main">
                                                ₹{fees.pending_amount}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {fees.pending_amount > 0 && (
                                    <Grid item xs={12}>
                                        <Alert severity="warning" sx={{ mb: 2 }}>
                                            You have pending fees of ₹{fees.pending_amount}. Please pay before the due date.
                                        </Alert>
                                        <Button
                                            variant="contained"
                                            startIcon={<PaymentIcon />}
                                            onClick={handlePayFees}
                                            size="large"
                                        >
                                            Pay Now
                                        </Button>
                                    </Grid>
                                )}

                                <Grid item xs={12}>
                                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                        Payment History
                                    </Typography>
                                    <TableContainer>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Date</TableCell>
                                                    <TableCell>Receipt No</TableCell>
                                                    <TableCell>Amount</TableCell>
                                                    <TableCell>Mode</TableCell>
                                                    <TableCell>Status</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {(fees.payment_history || []).map((payment: any, index: number) => (
                                                    <TableRow key={index}>
                                                        <TableCell>{payment.date}</TableCell>
                                                        <TableCell>{payment.receipt_no}</TableCell>
                                                        <TableCell>₹{payment.amount}</TableCell>
                                                        <TableCell>{payment.mode}</TableCell>
                                                        <TableCell>
                                                            <Chip label={payment.status} size="small" color="success" />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Grid>
                            </Grid>
                        )}
                    </TabPanel>

                    {/* Assignments Tab */}
                    <TabPanel value={tabValue} index={3}>
                        <Typography variant="h6" gutterBottom>
                            Homework & Assignments
                        </Typography>
                        <Grid container spacing={2}>
                            {assignments.map((assignment, index) => (
                                <Grid item xs={12} key={index}>
                                    <Card>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                <Box>
                                                    <Typography variant="h6">{assignment.title}</Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {assignment.subject} • Due: {assignment.due_date}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                                        {assignment.description}
                                                    </Typography>
                                                </Box>
                                                <Chip
                                                    label={assignment.status}
                                                    size="small"
                                                    color={assignment.status === 'Submitted' ? 'success' : 'warning'}
                                                />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </TabPanel>
                </Paper>
            )}
        </Container>
    );
};

export default ParentPortal;
