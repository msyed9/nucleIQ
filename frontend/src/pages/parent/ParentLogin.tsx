/**
 * Parent Login Page
 * 
 * Parent-branded login page that uses the unified login API.
 * Keeps the parent-specific branding but uses the same backend endpoint.
 * 
 * NOTE: Parents can also login via the main /login page - this page
 * provides a parent-focused experience with dedicated branding.
 */

import React, { useState, useEffect } from 'react';
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
import axios from 'axios';

const ParentLogin: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check if already logged in
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const userType = localStorage.getItem('user_type');
        if (token && userType === 'parent') {
            navigate('/parent/portal', { replace: true });
        }
    }, [navigate]);

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
            // Use the unified login endpoint
            const response = await fetch('/api/auth/unified-login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Store tokens
                localStorage.setItem('access_token', data.access);
                localStorage.setItem('refresh_token', data.refresh);
                localStorage.setItem('user_type', data.user_type);
                localStorage.setItem('user', JSON.stringify(data.user));

                // Set axios defaults
                axios.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;

                // Store parent-specific info if this is a parent
                if (data.user_type === 'parent') {
                    if (data.user.parent_id) {
                        localStorage.setItem('parent_id', String(data.user.parent_id));
                    }
                    if (data.user.email) {
                        localStorage.setItem('parent_email', data.user.email);
                    }
                    if (data.user.phone_number) {
                        localStorage.setItem('parent_phone', data.user.phone_number);
                    }
                    if (data.user.full_name) {
                        localStorage.setItem('parent_name', data.user.full_name);
                    }
                    if (data.user.students) {
                        localStorage.setItem('students', JSON.stringify(data.user.students));
                    }
                }

                // Navigate based on redirect_url from backend
                const redirectUrl = data.redirect_url || '/parent/portal';
                navigate(redirectUrl, { replace: true });
            } else {
                // Handle error
                const errorMessage = data.detail ||
                    (data.non_field_errors && data.non_field_errors[0]) ||
                    'Login failed. Please check your credentials.';
                setError(errorMessage);
            }
        } catch (error: any) {
            console.error('Login error:', error);
            setError('We can’t reach the server right now. Please check your connection and try again.');
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

