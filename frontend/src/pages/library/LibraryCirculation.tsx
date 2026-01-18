/**
 * Library Circulation - Book Issue/Return Management
 * Handles book checkouts, returns, renewals, and fine management
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
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    IconButton,
    InputAdornment,
    Tabs,
    Tab,
    Avatar,
    Divider,
    LinearProgress,
    Tooltip,
    Skeleton,
} from '@mui/material';
import {
    QrCodeScanner,
    Search,
    Book,
    Person,
    CheckCircle,
    Warning,
    Schedule,
    Refresh,
    Assignment,
    LocalLibrary,
    ArrowForward,
    ArrowBack,
} from '@mui/icons-material';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { format, differenceInDays, addDays, isAfter } from 'date-fns';

interface BookCopy {
    id: number;
    barcode: string;
    book_title: string;
    book_author: string;
    book_isbn: string;
    status: string;
    location: string;
}

interface LibraryMember {
    id: number;
    member_id: string;
    member_type: string;
    student_name?: string;
    staff_name?: string;
    books_issued_count: number;
    max_books_allowed: number;
    total_fines_due: number;
}

interface BookIssue {
    id: number;
    copy: BookCopy;
    member: LibraryMember;
    issued_date: string;
    due_date: string;
    returned_date?: string;
    status: string;
    fine_amount: number;
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
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    );
}

const LibraryCirculation: React.FC = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Issue Book State
    const [barcodeInput, setBarcodeInput] = useState('');
    const [memberIdInput, setMemberIdInput] = useState('');
    const [selectedBook, setSelectedBook] = useState<BookCopy | null>(null);
    const [selectedMember, setSelectedMember] = useState<LibraryMember | null>(null);
    const [issueDialogOpen, setIssueDialogOpen] = useState(false);

    // Return Book State
    const [returnBarcodeInput, setReturnBarcodeInput] = useState('');
    const [issueToReturn, setIssueToReturn] = useState<BookIssue | null>(null);
    const [returnDialogOpen, setReturnDialogOpen] = useState(false);

    // Active Issues
    const [activeIssues, setActiveIssues] = useState<BookIssue[]>([]);
    const [overdueIssues, setOverdueIssues] = useState<BookIssue[]>([]);

    useEffect(() => {
        fetchActiveIssues();
    }, []);

    const fetchActiveIssues = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/library/issues/?status=ISSUED');
            const issues = response.data.results || response.data || [];

            const now = new Date();
            const overdue: BookIssue[] = [];
            const active: BookIssue[] = [];

            issues.forEach((issue: BookIssue) => {
                if (isAfter(now, new Date(issue.due_date))) {
                    overdue.push(issue);
                } else {
                    active.push(issue);
                }
            });

            setActiveIssues(active);
            setOverdueIssues(overdue);
        } catch (err: any) {
            console.error('Error fetching issues:', err);
        } finally {
            setLoading(false);
        }
    };

    // Lookup book by barcode
    const lookupBook = async () => {
        if (!barcodeInput.trim()) return;

        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/api/library/copies/?barcode=${barcodeInput}`);
            const copies = response.data.results || response.data || [];

            if (copies.length > 0) {
                setSelectedBook(copies[0]);
                if (copies[0].status !== 'AVAILABLE') {
                    setError(`Book is currently ${copies[0].status}`);
                }
            } else {
                setError('Book not found with this barcode');
                setSelectedBook(null);
            }
        } catch (err: any) {
            setError('Failed to lookup book');
            setSelectedBook(null);
        } finally {
            setLoading(false);
        }
    };

    // Lookup member by ID
    const lookupMember = async () => {
        if (!memberIdInput.trim()) return;

        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/api/library/members/?search=${memberIdInput}`);
            const members = response.data.results || response.data || [];

            if (members.length > 0) {
                setSelectedMember(members[0]);
                if (members[0].books_issued_count >= members[0].max_books_allowed) {
                    setError('Member has reached maximum book limit');
                }
            } else {
                setError('Member not found');
                setSelectedMember(null);
            }
        } catch (err: any) {
            setError('Failed to lookup member');
            setSelectedMember(null);
        } finally {
            setLoading(false);
        }
    };

    // Issue Book
    const handleIssueBook = async () => {
        if (!selectedBook || !selectedMember) return;

        try {
            setLoading(true);
            const response = await api.post('/api/library/issues/issue/', {
                barcode: selectedBook.barcode,
                member_id: selectedMember.id,
            });

            setSuccess('Book issued successfully!');
            toast.success('Book issued successfully!');
            setIssueDialogOpen(false);
            resetIssueForm();
            fetchActiveIssues();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to issue book');
            toast.error(err.response?.data?.error || 'Failed to issue book');
        } finally {
            setLoading(false);
        }
    };

    // Lookup issue for return
    const lookupIssueForReturn = async () => {
        if (!returnBarcodeInput.trim()) return;

        try {
            setLoading(true);
            setError(null);

            // First get the copy
            const copyResponse = await api.get(`/api/library/copies/?barcode=${returnBarcodeInput}`);
            const copies = copyResponse.data.results || copyResponse.data || [];

            if (copies.length === 0) {
                setError('Book not found');
                return;
            }

            const copy = copies[0];
            if (copy.status !== 'ISSUED') {
                setError('This book is not currently issued');
                return;
            }

            // Find the active issue for this copy
            const issueResponse = await api.get(`/api/library/issues/?copy=${copy.id}&status=ISSUED`);
            const issues = issueResponse.data.results || issueResponse.data || [];

            if (issues.length > 0) {
                setIssueToReturn(issues[0]);
                setReturnDialogOpen(true);
            } else {
                setError('No active issue found for this book');
            }
        } catch (err: any) {
            setError('Failed to lookup issue');
        } finally {
            setLoading(false);
        }
    };

    // Return Book
    const handleReturnBook = async () => {
        if (!issueToReturn) return;

        try {
            setLoading(true);
            const response = await api.post(`/api/library/issues/${issueToReturn.id}/return_book/`);

            const returnedIssue = response.data;
            if (returnedIssue.fine_amount > 0) {
                setSuccess(`Book returned. Fine due: ₹${returnedIssue.fine_amount}`);
                toast.success(`Book returned. Fine: ₹${returnedIssue.fine_amount}`);
            } else {
                setSuccess('Book returned successfully!');
                toast.success('Book returned successfully!');
            }

            setReturnDialogOpen(false);
            setIssueToReturn(null);
            setReturnBarcodeInput('');
            fetchActiveIssues();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to return book');
            toast.error(err.response?.data?.error || 'Failed to return book');
        } finally {
            setLoading(false);
        }
    };

    const resetIssueForm = () => {
        setBarcodeInput('');
        setMemberIdInput('');
        setSelectedBook(null);
        setSelectedMember(null);
    };

    const getDaysOverdue = (dueDate: string): number => {
        return Math.max(0, differenceInDays(new Date(), new Date(dueDate)));
    };

    const getStatusChip = (issue: BookIssue) => {
        const daysOverdue = getDaysOverdue(issue.due_date);
        if (daysOverdue > 0) {
            return <Chip label={`${daysOverdue} days overdue`} color="error" size="small" />;
        }
        const daysRemaining = differenceInDays(new Date(issue.due_date), new Date());
        if (daysRemaining <= 2) {
            return <Chip label={`Due in ${daysRemaining} days`} color="warning" size="small" />;
        }
        return <Chip label="Active" color="success" size="small" />;
    };

    return (
        <Box sx={{ p: 3, minHeight: '100vh', bgcolor: '#f8fafc' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
                        📚 Library Circulation
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Issue and return books, manage fines
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={fetchActiveIssues}
                >
                    Refresh
                </Button>
            </Box>

            {/* Alerts */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        borderRadius: 3,
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Assignment fontSize="large" />
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                        {activeIssues.length}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        Active Issues
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        color: 'white',
                        borderRadius: 3,
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Warning fontSize="large" />
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                        {overdueIssues.length}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        Overdue Books
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Tabs */}
            <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, newValue) => setActiveTab(newValue)}
                    sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
                >
                    <Tab icon={<ArrowForward />} iconPosition="start" label="Issue Book" />
                    <Tab icon={<ArrowBack />} iconPosition="start" label="Return Book" />
                    <Tab icon={<Schedule />} iconPosition="start" label="Active Issues" />
                    <Tab icon={<Warning />} iconPosition="start" label="Overdue" />
                </Tabs>

                {/* Issue Book Tab */}
                <TabPanel value={activeTab} index={0}>
                    <Box sx={{ p: 3 }}>
                        <Grid container spacing={4}>
                            {/* Book Lookup */}
                            <Grid item xs={12} md={6}>
                                <Card sx={{ borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                    <CardContent>
                                        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Book color="primary" /> Book Lookup
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            label="Scan or Enter Book Barcode"
                                            value={barcodeInput}
                                            onChange={(e) => setBarcodeInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && lookupBook()}
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton onClick={lookupBook}>
                                                            <Search />
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                            }}
                                            sx={{ mb: 2 }}
                                        />

                                        {selectedBook && (
                                            <Box sx={{ p: 2, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #86efac' }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                    {selectedBook.book_title}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Author: {selectedBook.book_author}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    ISBN: {selectedBook.book_isbn}
                                                </Typography>
                                                <Chip
                                                    label={selectedBook.status}
                                                    color={selectedBook.status === 'AVAILABLE' ? 'success' : 'error'}
                                                    size="small"
                                                    sx={{ mt: 1 }}
                                                />
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Member Lookup */}
                            <Grid item xs={12} md={6}>
                                <Card sx={{ borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                    <CardContent>
                                        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Person color="primary" /> Member Lookup
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            label="Enter Member ID or Name"
                                            value={memberIdInput}
                                            onChange={(e) => setMemberIdInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && lookupMember()}
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton onClick={lookupMember}>
                                                            <Search />
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                            }}
                                            sx={{ mb: 2 }}
                                        />

                                        {selectedMember && (
                                            <Box sx={{ p: 2, bgcolor: '#eff6ff', borderRadius: 2, border: '1px solid #93c5fd' }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                    {selectedMember.student_name || selectedMember.staff_name || 'Member'}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Type: {selectedMember.member_type}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Books Issued: {selectedMember.books_issued_count} / {selectedMember.max_books_allowed}
                                                </Typography>
                                                {selectedMember.total_fines_due > 0 && (
                                                    <Chip
                                                        label={`Fine Due: ₹${selectedMember.total_fines_due}`}
                                                        color="error"
                                                        size="small"
                                                        sx={{ mt: 1 }}
                                                    />
                                                )}
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        {/* Issue Button */}
                        <Box sx={{ mt: 3, textAlign: 'center' }}>
                            <Button
                                variant="contained"
                                size="large"
                                disabled={!selectedBook || !selectedMember || selectedBook.status !== 'AVAILABLE' || loading}
                                onClick={() => setIssueDialogOpen(true)}
                                sx={{
                                    px: 6,
                                    py: 1.5,
                                    borderRadius: 2,
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                }}
                            >
                                Issue Book
                            </Button>
                        </Box>
                    </Box>
                </TabPanel>

                {/* Return Book Tab */}
                <TabPanel value={activeTab} index={1}>
                    <Box sx={{ p: 3, maxWidth: 500, mx: 'auto' }}>
                        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                            <CardContent sx={{ p: 4 }}>
                                <Box sx={{ textAlign: 'center', mb: 3 }}>
                                    <LocalLibrary sx={{ fontSize: 48, color: '#667eea', mb: 1 }} />
                                    <Typography variant="h6">Return a Book</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Scan or enter the book barcode to return
                                    </Typography>
                                </Box>

                                <TextField
                                    fullWidth
                                    label="Book Barcode"
                                    value={returnBarcodeInput}
                                    onChange={(e) => setReturnBarcodeInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && lookupIssueForReturn()}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <QrCodeScanner />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ mb: 2 }}
                                />

                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={lookupIssueForReturn}
                                    disabled={!returnBarcodeInput.trim() || loading}
                                    sx={{
                                        py: 1.5,
                                        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                    }}
                                >
                                    Find & Return
                                </Button>
                            </CardContent>
                        </Card>
                    </Box>
                </TabPanel>

                {/* Active Issues Tab */}
                <TabPanel value={activeTab} index={2}>
                    <Box sx={{ p: 3 }}>
                        {loading ? (
                            <Skeleton variant="rectangular" height={300} />
                        ) : activeIssues.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 6 }}>
                                <CheckCircle sx={{ fontSize: 64, color: '#22c55e', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary">
                                    No active issues
                                </Typography>
                            </Box>
                        ) : (
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                            <TableCell>Book</TableCell>
                                            <TableCell>Member</TableCell>
                                            <TableCell>Issued Date</TableCell>
                                            <TableCell>Due Date</TableCell>
                                            <TableCell>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {activeIssues.map((issue) => (
                                            <TableRow key={issue.id} hover>
                                                <TableCell>
                                                    <Box>
                                                        <Typography variant="subtitle2">{issue.copy.book_title}</Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {issue.copy.barcode}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    {issue.member.student_name || issue.member.staff_name || 'Member'}
                                                </TableCell>
                                                <TableCell>
                                                    {format(new Date(issue.issued_date), 'MMM dd, yyyy')}
                                                </TableCell>
                                                <TableCell>
                                                    {format(new Date(issue.due_date), 'MMM dd, yyyy')}
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusChip(issue)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Box>
                </TabPanel>

                {/* Overdue Tab */}
                <TabPanel value={activeTab} index={3}>
                    <Box sx={{ p: 3 }}>
                        {overdueIssues.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 6 }}>
                                <CheckCircle sx={{ fontSize: 64, color: '#22c55e', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary">
                                    No overdue books! 🎉
                                </Typography>
                            </Box>
                        ) : (
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#fef2f2' }}>
                                            <TableCell>Book</TableCell>
                                            <TableCell>Member</TableCell>
                                            <TableCell>Due Date</TableCell>
                                            <TableCell>Days Overdue</TableCell>
                                            <TableCell>Estimated Fine</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {overdueIssues.map((issue) => {
                                            const daysOverdue = getDaysOverdue(issue.due_date);
                                            const estimatedFine = daysOverdue * 5;
                                            return (
                                                <TableRow key={issue.id} hover sx={{ bgcolor: '#fef2f2' }}>
                                                    <TableCell>
                                                        <Box>
                                                            <Typography variant="subtitle2">{issue.copy.book_title}</Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {issue.copy.barcode}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        {issue.member.student_name || issue.member.staff_name || 'Member'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {format(new Date(issue.due_date), 'MMM dd, yyyy')}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={`${daysOverdue} days`}
                                                            color="error"
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography sx={{ fontWeight: 600, color: '#dc2626' }}>
                                                            ₹{estimatedFine}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Box>
                </TabPanel>
            </Paper>

            {/* Issue Confirmation Dialog */}
            <Dialog open={issueDialogOpen} onClose={() => setIssueDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Confirm Book Issue</DialogTitle>
                <DialogContent>
                    {selectedBook && selectedMember && (
                        <Box>
                            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, mb: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">Book</Typography>
                                <Typography variant="h6">{selectedBook.book_title}</Typography>
                                <Typography variant="body2">{selectedBook.book_author}</Typography>
                            </Box>
                            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, mb: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">Member</Typography>
                                <Typography variant="h6">
                                    {selectedMember.student_name || selectedMember.staff_name}
                                </Typography>
                                <Typography variant="body2">{selectedMember.member_type}</Typography>
                            </Box>
                            <Box sx={{ p: 2, bgcolor: '#fef3c7', borderRadius: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">Due Date</Typography>
                                <Typography variant="h6">
                                    {format(addDays(new Date(), 14), 'MMMM dd, yyyy')}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    (14 days from today)
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIssueDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleIssueBook}
                        disabled={loading}
                    >
                        {loading ? 'Issuing...' : 'Confirm Issue'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Return Confirmation Dialog */}
            <Dialog open={returnDialogOpen} onClose={() => setReturnDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Confirm Book Return</DialogTitle>
                <DialogContent>
                    {issueToReturn && (
                        <Box>
                            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, mb: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">Book</Typography>
                                <Typography variant="h6">{issueToReturn.copy.book_title}</Typography>
                            </Box>
                            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, mb: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">Member</Typography>
                                <Typography variant="h6">
                                    {issueToReturn.member.student_name || issueToReturn.member.staff_name}
                                </Typography>
                            </Box>
                            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, mb: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">Due Date</Typography>
                                <Typography variant="h6">
                                    {format(new Date(issueToReturn.due_date), 'MMMM dd, yyyy')}
                                </Typography>
                            </Box>
                            {getDaysOverdue(issueToReturn.due_date) > 0 && (
                                <Alert severity="warning" sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2">
                                        Book is {getDaysOverdue(issueToReturn.due_date)} days overdue
                                    </Typography>
                                    <Typography variant="body2">
                                        Fine: ₹{getDaysOverdue(issueToReturn.due_date) * 5}
                                    </Typography>
                                </Alert>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setReturnDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="success"
                        onClick={handleReturnBook}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Confirm Return'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default LibraryCirculation;
