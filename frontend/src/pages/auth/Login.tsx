/**
 * Login Page - Redesigned with NucleIQ Design System
 * Modern, accessible login with social auth and language toggle
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Globe, LogIn } from 'lucide-react';
import axios from 'axios';
import { Button, Input, Card } from '@/design-system';
import './Login.css';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    const currentLanguage = i18n.language || 'en';

    const toggleLanguage = () => {
        const newLang = currentLanguage === 'en' ? 'te' : 'en';
        i18n.changeLanguage(newLang);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:8000/api/auth/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const data = await response.json();

                // Prevent parent users from logging in via admin portal
                if (data.user && data.user.is_parent) {
                    setError(t('auth.parent_login_error', { defaultValue: 'Please use the Parent Portal to log in' }));
                    setLoading(false);
                    return;
                }

                // Store tokens and user info
                localStorage.setItem('access_token', data.access);
                localStorage.setItem('refresh_token', data.refresh);
                localStorage.setItem('auth_tokens', JSON.stringify({ access: data.access, refresh: data.refresh }));
                // store user
                localStorage.setItem('user', JSON.stringify(data.user));

                // Persist current tenant id (prefer top-level `tenant` from backend)
                const tenantId = data.tenant ?? data.user?.tenant;
                if (tenantId) {
                    localStorage.setItem('current_tenant', String(tenantId));
                }

                // Persist platform-admin flag and set axios defaults accordingly
                const isPlatformAdmin = data.is_platform_admin ?? data.user?.is_platform_admin ?? false;
                localStorage.setItem('is_platform_admin', String(Boolean(isPlatformAdmin)));

                // Set axios default Authorization header
                axios.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;

                // Attach tenant header for non-platform-admins
                if (!isPlatformAdmin && tenantId) {
                    axios.defaults.headers.common['X-Tenant-Id'] = String(tenantId);
                } else {
                    delete axios.defaults.headers.common['X-Tenant-Id'];
                }

                // Legacy keys for compatibility
                try {
                    localStorage.setItem('token', data.access);
                    localStorage.setItem('refresh', data.refresh);
                } catch (_) {
                    // ignore
                }

                // Navigate to dashboard
                navigate('/dashboard', { replace: true });
            } else {
                const data = await response.json();
                setError(data.detail || t('auth.invalid_credentials', { defaultValue: 'Invalid email or password' }));
            }
        } catch (err) {
            setError(t('auth.connection_error', { defaultValue: 'Connection error. Please check if the backend is running.' }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container-modern">
            {/* Language Toggle */}
            <button
                className="language-toggle-modern"
                onClick={toggleLanguage}
                aria-label={t('auth.toggle_language', { defaultValue: 'Toggle language' })}
            >
                <Globe size={18} />
                <span>{currentLanguage === 'en' ? 'తెలుగు' : 'English'}</span>
            </button>

            <Card className="login-card-modern" padding="none">
                <div style={{ padding: '3rem' }}>
                    {/* Header */}
                    <div className="login-header-modern">
                        <h1 style={{
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: '2rem',
                            fontWeight: 700,
                            color: 'var(--color-text-primary)',
                            margin: '0 0 0.5rem 0',
                            textAlign: 'center'
                        }}>
                            {t('auth.welcome', { defaultValue: 'Welcome to' })}{' '}
                            <span style={{
                                background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>
                                NucleIQ
                            </span>
                        </h1>
                        <p style={{
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: '1rem',
                            color: 'var(--color-text-secondary)',
                            textAlign: 'center',
                            margin: '0 0 2rem 0'
                        }}>
                            {t('auth.subtitle', { defaultValue: 'School Management Made Simple' })}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
                        {error && (
                            <div style={{
                                background: 'var(--color-error)',
                                color: 'white',
                                padding: '1rem',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.875rem'
                            }}>
                                <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                                {error}
                            </div>
                        )}

                        <div style={{ marginBottom: '1.5rem' }}>
                            <Input
                                id="email"
                                type="email"
                                label={t('auth.email', { defaultValue: 'Email Address' })}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@nucleiq.com"
                                iconLeft={Mail}
                                required
                                fullWidth
                                size="lg"
                                autoFocus
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                label={t('auth.password', { defaultValue: 'Password' })}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t('auth.enter_password', { defaultValue: 'Enter your password' })}
                                iconLeft={Lock}
                                required
                                fullWidth
                                size="lg"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '1rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-text-tertiary)',
                                    cursor: 'pointer',
                                    padding: '0.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginTop: '1.5rem'
                                }}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1.5rem'
                        }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.875rem',
                                color: 'var(--color-text-secondary)',
                                cursor: 'pointer'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    style={{ cursor: 'pointer' }}
                                />
                                {t('auth.remember_me', { defaultValue: 'Remember me' })}
                            </label>

                            <a
                                href="/forgot-password"
                                style={{
                                    fontSize: '0.875rem',
                                    color: 'var(--color-primary-700)',
                                    textDecoration: 'none',
                                    fontWeight: 500
                                }}
                            >
                                {t('auth.forgot_password', { defaultValue: 'Forgot Password?' })}
                            </a>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            fullWidth
                            loading={loading}
                            iconRight={LogIn}
                        >
                            {t('auth.sign_in', { defaultValue: 'Sign In' })}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        margin: '2rem 0',
                        color: 'var(--color-text-tertiary)',
                        fontSize: '0.875rem'
                    }}>
                        <div style={{ flex: 1, height: '1px', background: 'var(--color-border-light)' }} />
                        <span style={{ padding: '0 1rem' }}>
                            {t('auth.or_continue_with', { defaultValue: 'or continue with' })}
                        </span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--color-border-light)' }} />
                    </div>

                    {/* Social Login */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '1rem',
                        marginBottom: '1.5rem'
                    }}>
                        <Button
                            variant="outline"
                            size="md"
                            onClick={() => console.log('Google login')}
                        >
                            <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: '0.5rem' }}>
                                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
                                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
                                <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z" />
                                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
                            </svg>
                            Google
                        </Button>

                        <Button
                            variant="outline"
                            size="md"
                            onClick={() => console.log('Microsoft login')}
                        >
                            <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: '0.5rem' }}>
                                <path fill="#f25022" d="M0 0h8.5v8.5H0z" />
                                <path fill="#00a4ef" d="M9.5 0H18v8.5H9.5z" />
                                <path fill="#7fba00" d="M0 9.5h8.5V18H0z" />
                                <path fill="#ffb900" d="M9.5 9.5H18V18H9.5z" />
                            </svg>
                            Microsoft
                        </Button>
                    </div>

                    {/* Demo Credentials */}
                    <div style={{
                        background: 'rgba(33, 150, 243, 0.05)',
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        color: 'var(--color-text-secondary)',
                        border: '1px solid rgba(33, 150, 243, 0.1)'
                    }}>
                        <strong style={{ color: 'var(--color-text-primary)', display: 'block', marginBottom: '0.5rem' }}>
                            🎓 {t('auth.demo_credentials', { defaultValue: 'Demo School?' })}
                        </strong>
                        <div style={{ lineHeight: 1.6 }}>
                            {t('auth.demo_email', { defaultValue: 'Email' })}: <strong style={{ color: 'var(--color-primary-700)' }}>admin@nucleiq.com</strong><br />
                            {t('auth.demo_password', { defaultValue: 'Password' })}: <strong style={{ color: 'var(--color-primary-700)' }}>admin123</strong>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Login;
