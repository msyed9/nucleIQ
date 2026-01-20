/**
 * Login Page - Redesigned with NucleiQ Design System
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
            const response = await fetch('/api/auth/login/', {
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
                                NucleiQ
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
                </div>
            </Card>
        </div>
    );
};

export default Login;
