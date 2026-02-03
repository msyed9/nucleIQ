/**
 * Unified Login Page - Redesigned with NucleiQ Design System
 * 
 * This is the SINGLE login page for ALL user types:
 * - Platform Administrators
 * - Tenant Administrators
 * - Staff (Teachers, Accountants, etc.)
 * - Parents
 * 
 * Supports login via email OR phone number.
 * Automatically redirects to appropriate portal based on user type.
 * Uses tenant branding for logo and background customization.
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, Globe, LogIn } from 'lucide-react';
import axios from 'axios';
import { Button, Input, Card } from '@/design-system';
import './Login.css';

// Simple branding fetch for login page (before context is available)
interface LoginBranding {
    tenant_name: string;
    large_logo_url: string | null;
    small_logo_url: string | null;
    logo_url: string;
    login_banner_url: string | null;
    login_background_url: string;
    primary_color: string;
}

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [username, setUsername] = useState(''); // Can be email OR phone number
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [branding, setBranding] = useState<LoginBranding | null>(null);

    const currentLanguage = i18n.language || 'en';

    // Fetch branding for login page (public endpoint wouldn't require auth)
    // For now, we'll use the stored branding or default values
    useEffect(() => {
        // Try to get cached branding from localStorage if available
        const cachedBranding = localStorage.getItem('login_branding');
        if (cachedBranding) {
            try {
                setBranding(JSON.parse(cachedBranding));
            } catch (e) {
                // Ignore parse errors
            }
        }
    }, []);

    const toggleLanguage = () => {
        const newLang = currentLanguage === 'en' ? 'te' : 'en';
        i18n.changeLanguage(newLang);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Use the unified login endpoint that handles all user types
            const response = await fetch('/api/auth/unified-login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                const data = await response.json();

                // Store tokens and user info
                localStorage.setItem('access_token', data.access);
                localStorage.setItem('refresh_token', data.refresh);
                localStorage.setItem('auth_tokens', JSON.stringify({ access: data.access, refresh: data.refresh }));
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('user_type', data.user_type);

                // Persist current tenant id
                const tenantId = data.tenant ?? data.user?.tenant;
                if (tenantId) {
                    localStorage.setItem('current_tenant', String(tenantId));
                }

                // Persist platform-admin flag
                const isPlatformAdmin = data.user?.is_platform_admin ?? false;
                localStorage.setItem('is_platform_admin', String(Boolean(isPlatformAdmin)));

                // Set axios default Authorization header
                axios.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;

                // Attach tenant header for non-platform-admins
                if (!isPlatformAdmin && tenantId) {
                    axios.defaults.headers.common['X-Tenant-Id'] = String(tenantId);
                } else {
                    delete axios.defaults.headers.common['X-Tenant-Id'];
                }

                // Store parent-specific data if user is a parent
                if (data.user_type === 'parent') {
                    if (data.user.parent_id) {
                        localStorage.setItem('parent_id', String(data.user.parent_id));
                    }
                    if (data.user.students) {
                        localStorage.setItem('students', JSON.stringify(data.user.students));
                    }
                }

                // Legacy keys for compatibility
                try {
                    localStorage.setItem('token', data.access);
                    localStorage.setItem('refresh', data.refresh);
                } catch (_) {
                    // ignore
                }

                // Navigate to the appropriate portal based on user type
                // The backend provides the redirect_url based on user_type
                const redirectUrl = data.redirect_url || '/dashboard';
                navigate(redirectUrl, { replace: true });
            } else {
                const data = await response.json();
                // Handle error response
                const errorMessage = data.detail ||
                    (data.non_field_errors && data.non_field_errors[0]) ||
                    t('auth.invalid_credentials', { defaultValue: 'Invalid email/phone or password' });
                setError(errorMessage);
            }
        } catch (err) {
            setError(t('auth.connection_error', { defaultValue: 'Connection error. Please check if the backend is running.' }));
        } finally {
            setLoading(false);
        }
    };

    // Get logo URL with fallback chain
    const logoUrl = branding?.large_logo_url || branding?.small_logo_url || branding?.logo_url;

    // Get login banner URL with fallback
    const loginBannerUrl = branding?.login_banner_url || branding?.login_background_url;

    // Get tenant name
    const tenantName = branding?.tenant_name || 'NucleiQ';

    return (
        <div
            className="login-container-modern"
            style={{
                backgroundImage: loginBannerUrl ? `url(${loginBannerUrl})` : 'var(--login-bg-image)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}
        >
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
                    {/* Header with Logo */}
                    <div className="login-header-modern">
                        {/* Display tenant logo if available */}
                        {logoUrl ? (
                            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                <img
                                    src={logoUrl}
                                    alt={tenantName}
                                    style={{
                                        maxHeight: '80px',
                                        maxWidth: '200px',
                                        objectFit: 'contain'
                                    }}
                                    loading="lazy"
                                />
                            </div>
                        ) : null}

                        <h1 style={{
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: logoUrl ? '1.5rem' : '2rem',
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
                                {tenantName}
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
                                id="username"
                                type="text"
                                label={t('auth.email_or_phone', { defaultValue: 'Email or Mobile Number' })}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder={t('auth.email_phone_placeholder', { defaultValue: 'Enter email or mobile number' })}
                                iconLeft={User}
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
