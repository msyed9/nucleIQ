import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Grid,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    Download as DownloadIcon,
    Visibility as VisibilityIcon,
} from '@mui/icons-material';
import api from '../../services/api';

interface AuditLog {
    id: string;
    timestamp: string;
    user: string;
    action: string;
    module: string;
    resource: string;
    resource_id: string;
    ip_address: string;
    changes?: any;
    status: 'success' | 'failed';
}

const AuditLogs: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [totalCount, setTotalCount] = useState(0);

    // Filters
    const [filterUser, setFilterUser] = useState('');
    const [filterModule, setFilterModule] = useState('all');
    const [filterAction, setFilterAction] = useState('all');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    // Detail dialog
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);

    useEffect(() => {
        fetchLogs();
    }, [page, rowsPerPage, filterUser, filterModule, filterAction, filterStartDate, filterEndDate]);

    const fetchLogs = async () => {
        try {
            const params = new URLSearchParams();
            params.append('page', (page + 1).toString());
            params.append('page_size', rowsPerPage.toString());

            if (filterUser) params.append('user', filterUser);
            if (filterModule !== 'all') params.append('module', filterModule);
            if (filterAction !== 'all') params.append('action', filterAction);
            if (filterStartDate) params.append('start_date', filterStartDate);
            if (filterEndDate) params.append('end_date', filterEndDate);

            const response = await api.get(`/api/audit-logs/?${params.toString()}`);
            setLogs(response.data.results || response.data);
            setTotalCount(response.data.count || response.data.length);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        }
    };

    const handleExport = async () => {
        try {
            const params = new URLSearchParams();
            if (filterUser) params.append('user', filterUser);
            if (filterModule !== 'all') params.append('module', filterModule);
            if (filterAction !== 'all') params.append('action', filterAction);
            if (filterStartDate) params.append('start_date', filterStartDate);
            if (filterEndDate) params.append('end_date', filterEndDate);

            const response = await api.get(`/api/audit-logs/export/?${params.toString()}`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `audit-logs-${new Date().toISOString()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting logs:', error);
        }
    };

    const handleViewDetails = (log: AuditLog) => {
        setSelectedLog(log);
        setDetailDialogOpen(true);
    };

    const getActionColor = (action: string) => {
        switch (action.toLowerCase()) {
            case 'create':
                return 'success';
            case 'update':
                return 'info';
            case 'delete':
                return 'error';
            case 'login':
                return 'primary';
            case 'logout':
                return 'default';
            default:
                return 'default';
        }
    };

    const getStatusColor = (status: string) => {
        return status === 'success' ? 'success' : 'error';
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Audit Logs</Typography>
                <Button startIcon={<DownloadIcon />} onClick={handleExport} variant="outlined">
                    Export Logs
                </Button>
            </Box>

            {/* Filters */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                label="User"
                                value={filterUser}
                                onChange={(e) => setFilterUser(e.target.value)}
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Module</InputLabel>
                                <Select
                                    value={filterModule}
                                    label="Module"
                                    onChange={(e) => setFilterModule(e.target.value)}
                                >
                                    <MenuItem value="all">All Modules</MenuItem>
                                    <MenuItem value="students">Students</MenuItem>
                                    <MenuItem value="staff">Staff</MenuItem>
                                    <MenuItem value="finance">Finance</MenuItem>
                                    <MenuItem value="library">Library</MenuItem>
                                    <MenuItem value="exams">Exams</MenuItem>
                                    <MenuItem value="attendance">Attendance</MenuItem>
                                    <MenuItem value="settings">Settings</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Action</InputLabel>
                                <Select
                                    value={filterAction}
                                    label="Action"
                                    onChange={(e) => setFilterAction(e.target.value)}
                                >
                                    <MenuItem value="all">All Actions</MenuItem>
                                    <MenuItem value="create">Create</MenuItem>
                                    <MenuItem value="update">Update</MenuItem>
                                    <MenuItem value="delete">Delete</MenuItem>
                                    <MenuItem value="login">Login</MenuItem>
                                    <MenuItem value="logout">Logout</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                label="Start Date"
                                type="date"
                                value={filterStartDate}
                                onChange={(e) => setFilterStartDate(e.target.value)}
                                size="small"
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                label="End Date"
                                type="date"
                                value={filterEndDate}
                                onChange={(e) => setFilterEndDate(e.target.value)}
                                size="small"
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={() => {
                                    setFilterUser('');
                                    setFilterModule('all');
                                    setFilterAction('all');
                                    setFilterStartDate('');
                                    setFilterEndDate('');
                                }}
                            >
                                Clear Filters
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Logs Table */}
            <Card>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Timestamp</TableCell>
                                <TableCell>User</TableCell>
                                <TableCell>Action</TableCell>
                                <TableCell>Module</TableCell>
                                <TableCell>Resource</TableCell>
                                <TableCell>IP Address</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                                    <TableCell>{log.user}</TableCell>
                                    <TableCell>
                                        <Chip label={log.action} size="small" color={getActionColor(log.action) as any} />
                                    </TableCell>
                                    <TableCell>{log.module}</TableCell>
                                    <TableCell>
                                        {log.resource} ({log.resource_id})
                                    </TableCell>
                                    <TableCell>{log.ip_address}</TableCell>
                                    <TableCell>
                                        <Chip label={log.status} size="small" color={getStatusColor(log.status) as any} />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton size="small" onClick={() => handleViewDetails(log)}>
                                            <VisibilityIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    count={totalCount}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    rowsPerPageOptions={[10, 25, 50, 100]}
                />
            </Card>

            {/* Detail Dialog */}
            <Dialog
                open={detailDialogOpen}
                onClose={() => setDetailDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Audit Log Details</DialogTitle>
                <DialogContent>
                    {selectedLog && (
                        <Box>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Timestamp
                                    </Typography>
                                    <Typography variant="body1">
                                        {new Date(selectedLog.timestamp).toLocaleString()}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        User
                                    </Typography>
                                    <Typography variant="body1">{selectedLog.user}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Action
                                    </Typography>
                                    <Typography variant="body1">{selectedLog.action}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Module
                                    </Typography>
                                    <Typography variant="body1">{selectedLog.module}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Resource
                                    </Typography>
                                    <Typography variant="body1">{selectedLog.resource}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Resource ID
                                    </Typography>
                                    <Typography variant="body1">{selectedLog.resource_id}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        IP Address
                                    </Typography>
                                    <Typography variant="body1">{selectedLog.ip_address}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Status
                                    </Typography>
                                    <Chip label={selectedLog.status} size="small" color={getStatusColor(selectedLog.status) as any} />
                                </Grid>
                                {selectedLog.changes && (
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Changes
                                        </Typography>
                                        <Box
                                            component="pre"
                                            sx={{
                                                bgcolor: 'background.default',
                                                p: 2,
                                                borderRadius: 1,
                                                overflow: 'auto',
                                                maxHeight: 300,
                                            }}
                                        >
                                            {JSON.stringify(selectedLog.changes, null, 2)}
                                        </Box>
                                    </Grid>
                                )}
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AuditLogs;
