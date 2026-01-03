import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    FormControl,
    FormControlLabel,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    Switch,
    Tab,
    Tabs,
    TextField,
    Typography,
    Alert,
    Snackbar,
    Divider,
    Paper,
} from '@mui/material';
import {
    Save as SaveIcon,
    School as SchoolIcon,
    AttachMoney as MoneyIcon,
    CheckCircle as AttendanceIcon,
    Assignment as ExamIcon,
    Email as EmailIcon,
    Security as SecurityIcon,
    Backup as BackupIcon,
    Build as MaintenanceIcon,
} from '@mui/icons-material';
import api from '../../services/api';

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

const SystemSettings: React.FC = () => {
    const [tabValue, setTabValue] = useState(0);
    const [settings, setSettings] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/tenants/settings/');
            setSettings(response.data);
        } catch (error) {
            console.error('Error fetching settings:', error);
            showSnackbar('Failed to fetch settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        try {
            setLoading(true);
            await api.put('/api/tenants/settings/', settings);
            showSnackbar('Settings saved successfully', 'success');
        } catch (error: any) {
            console.error('Error saving settings:', error);
            showSnackbar(error.response?.data?.detail || 'Failed to save settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: string, value: any) => {
        setSettings((prev: any) => ({ ...prev, [field]: value }));
    };

    const showSnackbar = (message: string, severity: 'success' | 'error') => {
        setSnackbar({ open: true, message, severity });
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">System Settings</Typography>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveSettings} disabled={loading}>
                    Save All Settings
                </Button>
            </Box>

            <Paper sx={{ width: '100%' }}>
                <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} variant="scrollable" scrollButtons="auto">
                    <Tab icon={<SchoolIcon />} label="Academic" />
                    <Tab icon={<MoneyIcon />} label="Fees" />
                    <Tab icon={<AttendanceIcon />} label="Attendance" />
                    <Tab icon={<ExamIcon />} label="Exams" />
                    <Tab icon={<EmailIcon />} label="Email/SMS" />
                    <Tab icon={<SecurityIcon />} label="Security" />
                    <Tab icon={<BackupIcon />} label="Backup" />
                    <Tab icon={<MaintenanceIcon />} label="Maintenance" />
                </Tabs>

                {/* Academic Settings */}
                <TabPanel value={tabValue} index={0}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Academic Configuration
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Academic Year Format"
                                        value={settings.academic_year_format || 'YYYY-YYYY'}
                                        onChange={(e) => handleChange('academic_year_format', e.target.value)}
                                        helperText="e.g., 2024-2025"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Term System</InputLabel>
                                        <Select
                                            value={settings.term_system || 'TERM'}
                                            label="Term System"
                                            onChange={(e) => handleChange('term_system', e.target.value)}
                                        >
                                            <MenuItem value="TERM">Term System</MenuItem>
                                            <MenuItem value="SEMESTER">Semester System</MenuItem>
                                            <MenuItem value="QUARTER">Quarter System</MenuItem>
                                            <MenuItem value="TRIMESTER">Trimester System</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Grading System</InputLabel>
                                        <Select
                                            value={settings.grading_system || 'PERCENTAGE'}
                                            label="Grading System"
                                            onChange={(e) => handleChange('grading_system', e.target.value)}
                                        >
                                            <MenuItem value="PERCENTAGE">Percentage</MenuItem>
                                            <MenuItem value="GPA">GPA (4.0 Scale)</MenuItem>
                                            <MenuItem value="LETTER">Letter Grades</MenuItem>
                                            <MenuItem value="CGPA">CGPA (10.0 Scale)</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </TabPanel>

                {/* Fee Settings */}
                <TabPanel value={tabValue} index={1}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Fee Configuration
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Currency Code"
                                        value={settings.fee_currency || 'INR'}
                                        onChange={(e) => handleChange('fee_currency', e.target.value)}
                                        helperText="ISO 4217 code"
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Currency Symbol"
                                        value={settings.fee_currency_symbol || '₹'}
                                        onChange={(e) => handleChange('fee_currency_symbol', e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Grace Period (Days)"
                                        value={settings.grace_period_days || 7}
                                        onChange={(e) => handleChange('grace_period_days', parseInt(e.target.value))}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settings.late_fee_enabled || false}
                                                onChange={(e) => handleChange('late_fee_enabled', e.target.checked)}
                                            />
                                        }
                                        label="Enable Late Fees"
                                    />
                                </Grid>
                                {settings.late_fee_enabled && (
                                    <>
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="Late Fee Amount"
                                                value={settings.late_fee_amount || 0}
                                                onChange={(e) => handleChange('late_fee_amount', parseFloat(e.target.value))}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="Late Fee Percentage"
                                                value={settings.late_fee_percentage || 0}
                                                onChange={(e) => handleChange('late_fee_percentage', parseFloat(e.target.value))}
                                                helperText="% of total fee"
                                            />
                                        </Grid>
                                    </>
                                )}
                            </Grid>
                        </CardContent>
                    </Card>
                </TabPanel>

                {/* Attendance Settings */}
                <TabPanel value={tabValue} index={2}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Attendance Configuration
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="time"
                                        label="Default Marking Time"
                                        value={settings.attendance_marking_time || '09:00'}
                                        onChange={(e) => handleChange('attendance_marking_time', e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Lock After (Days)"
                                        value={settings.attendance_lock_days || 7}
                                        onChange={(e) => handleChange('attendance_lock_days', parseInt(e.target.value))}
                                        helperText="Days after which attendance cannot be modified"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Minimum Attendance %"
                                        value={settings.minimum_attendance_percentage || 75}
                                        onChange={(e) => handleChange('minimum_attendance_percentage', parseFloat(e.target.value))}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Late Arrival Threshold (Minutes)"
                                        value={settings.late_arrival_threshold_minutes || 15}
                                        onChange={(e) => handleChange('late_arrival_threshold_minutes', parseInt(e.target.value))}
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </TabPanel>

                {/* Exam Settings */}
                <TabPanel value={tabValue} index={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Exam Configuration
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Result Publish Delay (Days)"
                                        value={settings.result_publish_delay_days || 7}
                                        onChange={(e) => handleChange('result_publish_delay_days', parseInt(e.target.value))}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settings.allow_online_exams !== false}
                                                onChange={(e) => handleChange('allow_online_exams', e.target.checked)}
                                            />
                                        }
                                        label="Allow Online Exams"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settings.exam_proctoring_enabled || false}
                                                onChange={(e) => handleChange('exam_proctoring_enabled', e.target.checked)}
                                            />
                                        }
                                        label="Enable Exam Proctoring"
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </TabPanel>

                {/* Email/SMS Settings */}
                <TabPanel value={tabValue} index={4}>
                    <Card sx={{ mb: 2 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Email Configuration
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settings.email_enabled !== false}
                                                onChange={(e) => handleChange('email_enabled', e.target.checked)}
                                            />
                                        }
                                        label="Enable Email Notifications"
                                    />
                                </Grid>
                                {settings.email_enabled !== false && (
                                    <>
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="SMTP Host"
                                                value={settings.smtp_host || ''}
                                                onChange={(e) => handleChange('smtp_host', e.target.value)}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="SMTP Port"
                                                value={settings.smtp_port || 587}
                                                onChange={(e) => handleChange('smtp_port', parseInt(e.target.value))}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="SMTP Username"
                                                value={settings.smtp_username || ''}
                                                onChange={(e) => handleChange('smtp_username', e.target.value)}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                type="password"
                                                label="SMTP Password"
                                                value={settings.smtp_password || ''}
                                                onChange={(e) => handleChange('smtp_password', e.target.value)}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                type="email"
                                                label="From Email"
                                                value={settings.from_email || ''}
                                                onChange={(e) => handleChange('from_email', e.target.value)}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={settings.smtp_use_tls !== false}
                                                        onChange={(e) => handleChange('smtp_use_tls', e.target.checked)}
                                                    />
                                                }
                                                label="Use TLS"
                                            />
                                        </Grid>
                                    </>
                                )}
                            </Grid>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                SMS Configuration
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settings.sms_enabled || false}
                                                onChange={(e) => handleChange('sms_enabled', e.target.checked)}
                                            />
                                        }
                                        label="Enable SMS Notifications"
                                    />
                                </Grid>
                                {settings.sms_enabled && (
                                    <>
                                        <Grid item xs={12} md={6}>
                                            <FormControl fullWidth>
                                                <InputLabel>SMS Provider</InputLabel>
                                                <Select
                                                    value={settings.sms_provider || 'TWILIO'}
                                                    label="SMS Provider"
                                                    onChange={(e) => handleChange('sms_provider', e.target.value)}
                                                >
                                                    <MenuItem value="TWILIO">Twilio</MenuItem>
                                                    <MenuItem value="MSG91">MSG91</MenuItem>
                                                    <MenuItem value="AWS_SNS">AWS SNS</MenuItem>
                                                    <MenuItem value="CUSTOM">Custom</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="SMS Sender ID"
                                                value={settings.sms_sender_id || ''}
                                                onChange={(e) => handleChange('sms_sender_id', e.target.value)}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                type="password"
                                                label="SMS API Key"
                                                value={settings.sms_api_key || ''}
                                                onChange={(e) => handleChange('sms_api_key', e.target.value)}
                                            />
                                        </Grid>
                                    </>
                                )}
                            </Grid>
                        </CardContent>
                    </Card>
                </TabPanel>

                {/* Security Settings */}
                <TabPanel value={tabValue} index={5}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Security & Password Policy
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Minimum Password Length"
                                        value={settings.password_min_length || 8}
                                        onChange={(e) => handleChange('password_min_length', parseInt(e.target.value))}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Session Timeout (Minutes)"
                                        value={settings.session_timeout_minutes || 60}
                                        onChange={(e) => handleChange('session_timeout_minutes', parseInt(e.target.value))}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Max Login Attempts"
                                        value={settings.max_login_attempts || 5}
                                        onChange={(e) => handleChange('max_login_attempts', parseInt(e.target.value))}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Lockout Duration (Minutes)"
                                        value={settings.lockout_duration_minutes || 30}
                                        onChange={(e) => handleChange('lockout_duration_minutes', parseInt(e.target.value))}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="subtitle2" gutterBottom>
                                        Password Requirements
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settings.password_require_uppercase !== false}
                                                onChange={(e) => handleChange('password_require_uppercase', e.target.checked)}
                                            />
                                        }
                                        label="Require Uppercase Letters"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settings.password_require_lowercase !== false}
                                                onChange={(e) => handleChange('password_require_lowercase', e.target.checked)}
                                            />
                                        }
                                        label="Require Lowercase Letters"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settings.password_require_numbers !== false}
                                                onChange={(e) => handleChange('password_require_numbers', e.target.checked)}
                                            />
                                        }
                                        label="Require Numbers"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settings.password_require_special || false}
                                                onChange={(e) => handleChange('password_require_special', e.target.checked)}
                                            />
                                        }
                                        label="Require Special Characters"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settings.two_factor_auth_required || false}
                                                onChange={(e) => handleChange('two_factor_auth_required', e.target.checked)}
                                            />
                                        }
                                        label="Require 2FA for All Users"
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </TabPanel>

                {/* Backup Settings */}
                <TabPanel value={tabValue} index={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Backup Configuration
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settings.auto_backup_enabled !== false}
                                                onChange={(e) => handleChange('auto_backup_enabled', e.target.checked)}
                                            />
                                        }
                                        label="Enable Automatic Backups"
                                    />
                                </Grid>
                                {settings.auto_backup_enabled !== false && (
                                    <>
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="Backup Frequency (Days)"
                                                value={settings.backup_frequency_days || 1}
                                                onChange={(e) => handleChange('backup_frequency_days', parseInt(e.target.value))}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="Retention Period (Days)"
                                                value={settings.backup_retention_days || 30}
                                                onChange={(e) => handleChange('backup_retention_days', parseInt(e.target.value))}
                                            />
                                        </Grid>
                                    </>
                                )}
                            </Grid>
                        </CardContent>
                    </Card>
                </TabPanel>

                {/* Maintenance Settings */}
                <TabPanel value={tabValue} index={7}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Maintenance Mode
                            </Typography>
                            <Alert severity="warning" sx={{ mb: 3 }}>
                                Enabling maintenance mode will prevent all users (except admins) from accessing the system.
                            </Alert>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settings.maintenance_mode || false}
                                                onChange={(e) => handleChange('maintenance_mode', e.target.checked)}
                                            />
                                        }
                                        label="Enable Maintenance Mode"
                                    />
                                </Grid>
                                {settings.maintenance_mode && (
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={4}
                                            label="Maintenance Message"
                                            value={settings.maintenance_message || ''}
                                            onChange={(e) => handleChange('maintenance_message', e.target.value)}
                                            helperText="Message to display to users during maintenance"
                                        />
                                    </Grid>
                                )}
                            </Grid>
                        </CardContent>
                    </Card>
                </TabPanel>
            </Paper>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default SystemSettings;
