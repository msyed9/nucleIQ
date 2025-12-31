import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { t } = useTranslation();

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
                // Store tokens and user info
                // Keep legacy keys for compatibility and also store `auth_tokens` expected by api client
                localStorage.setItem('access_token', data.access);
                localStorage.setItem('refresh_token', data.refresh);
                localStorage.setItem('auth_tokens', JSON.stringify({ access: data.access, refresh: data.refresh }));
                localStorage.setItem('user', JSON.stringify(data.user));

                // Persist current tenant id so frontend sends `X-Tenant-ID` header
                if (data.user && data.user.tenant) {
                    localStorage.setItem('current_tenant', String(data.user.tenant));
                }

                // Set legacy keys for older utilities expecting `token`/`refresh`
                try {
                    localStorage.setItem('token', data.access);
                    localStorage.setItem('refresh', data.refresh);
                } catch (_) {
                    // ignore
                }

                // Use React Router navigate instead of window.location
                navigate('/dashboard', { replace: true });
            } else {
                const data = await response.json();
                setError(data.detail || 'Invalid email or password');
            }
        } catch (err) {
            setError('Connection error. Please check if the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>{t('auth.login')} <span className="brand">NucleIQ</span></h1>
                    <p className="subtitle">{t('auth.subtitle')}</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="error-message">
                            <span className="error-icon">⚠️</span>
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">{t('auth.email')}</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t('auth.email') === 'Email address' ? 'admin@nucleiq.com' : ''}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">{t('auth.password')}</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t('auth.password') === 'Password' ? 'Enter your password' : ''}
                            required
                        />
                    </div>

                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                {t('auth.logging_in')}
                            </>
                        ) : (
                            t('auth.sign_in')
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <p className="demo-credentials">
                        <strong>{t('auth.demo_credentials')}</strong><br />
                        {t('auth.demo_email')}: admin@nucleiq.com<br />
                        {t('auth.demo_password')}: admin123
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
