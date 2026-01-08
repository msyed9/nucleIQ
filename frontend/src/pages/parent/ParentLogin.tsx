/**
 * Parent Login Page
 * 
 * Dedicated login page for parents with:
 * - Custom branding for parent portal
 * - Email or Mobile number authentication
 * - JWT token storage
 * - Redirect to parent portal on success
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
    Link,
    InputAdornment,
    IconButton,
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    People as ParentsIcon,
} from '@mui/icons-material';
import api from '../../services/api';

const ParentLogin: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError(null); // Clear error when user types
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.username || !formData.password) {
            setError('Please enter your email/mobile number and password');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/parent/auth/login/', formData);

            // Store tokens
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            localStorage.setItem('user_type', response.data.user_type);
            localStorage.setItem('parent_id', response.data.parent_id);

            // Store parent info for quick access
            if (response.data.email) {
                localStorage.setItem('parent_email', response.data.email);
            }
            if (response.data.phone_number) {
                localStorage.setItem('parent_phone', response.data.phone_number);
            }
            if (response.data.name) {
                localStorage.setItem('parent_name', response.data.name);
            }

            // Store student info for quick access
            localStorage.setItem('students', JSON.stringify(response.data.students));

            // Show success message
            console.log('Login successful:', response.data);

            // Redirect to parent portal
            navigate('/parent/portal');
        } catch (error: any) {
            console.error('Login error:', error);

            if (error.response?.status === 403) {
                setError(error.response.data.detail || 'Portal access is disabled. Please contact school administration.');
            } else if (error.response?.status === 401) {
                setError('Invalid email/mobile number or password');
            } else if (error.response?.data?.non_field_errors) {
                setError(error.response.data.non_field_errors[0]);
            } else if (typeof error.response?.data === 'object') {
                const firstError = Object.values(error.response.data)[0];
                setError(Array.isArray(firstError) ? firstError[0] : String(firstError));
            } else {
                setError(error.response?.data?.detail || 'Login failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                py: 4,
            }}
        >
            <Container maxWidth="sm">
                <Paper
                    elevation={10}
                    sx={{
                        p: 4,
                        borderRadius: 3,
                    }}
                >
                    {/* Logo & Header */}
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Box
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                mb: 2,
                            }}
                        >
                            <ParentsIcon sx={{ fontSize: 40, color: 'white' }} />
                        </Box>
                        <Typography variant="h4" gutterBottom fontWeight="bold">
                            Parent Portal
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            View your child's academic progress and information
                        </Typography>
                    </Box>

                    {/* Error Alert */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Email or Mobile Number"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            margin="normal"
                            required
                            autoComplete="email tel"
                            autoFocus
                            disabled={loading}
                            placeholder="Enter email or mobile number"
                            helperText="Use the email or phone number registered with the school"
                        />

                        <TextField
                            fullWidth
                            label="Password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={handleChange}
                            margin="normal"
                            required
                            autoComplete="current-password"
                            disabled={loading}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{
                                mt: 3,
                                mb: 2,
                                py: 1.5,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8d 100%)',
                                },
                            }}
                        >
                            {loading ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </form>

                    {/* Help Links */}
                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Forgot your password?{' '}
                            <Link href="#" underline="hover">
                                Contact School
                            </Link>
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Don't have access?{' '}
                            <Link href="#" underline="hover">
                                Request Portal Access
                            </Link>
                        </Typography>
                    </Box>

                    {/* Info Box */}
                    <Box
                        sx={{
                            mt: 4,
                            p: 2,
                            backgroundColor: 'info.light',
                            borderRadius: 2,
                        }}
                    >
                        <Typography variant="caption" color="info.dark">
                            <strong>Note:</strong> You can login using either your email address or mobile number registered with the school.
                            If you're having trouble logging in, please contact school administration.
                        </Typography>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default ParentLogin;

