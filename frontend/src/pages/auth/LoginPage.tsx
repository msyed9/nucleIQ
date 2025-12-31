/**
 * Login Page Component
 * Styled with Shadcn UI and tenant branding
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const { branding } = useTheme();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const from = (location.state as any)?.from?.pathname || '/';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login({ email, password });
            navigate(from, { replace: true });
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Invalid email or password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left side - Login Form */}
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-background">
                <div className="max-w-md w-full space-y-8">
                    {/* Logo */}
                    <div className="text-center">
                        {branding?.logo_url ? (
                            <img
                                src={branding.logo_url}
                                alt="Logo"
                                className="mx-auto h-16 w-auto"
                            />
                        ) : (
                            <h1 className="text-4xl font-bold" style={{ color: branding?.primary_color || '#1976D2' }}>
                                NucleIQ
                            </h1>
                        )}
                        <h2 className="mt-6 text-3xl font-extrabold text-foreground">
                            Sign in to your account
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Enter your credentials to access the platform
                        </p>
                    </div>

                    {/* Login Form */}
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="rounded-md bg-destructive/10 p-4">
                                <div className="flex">
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-destructive">
                                            {error}
                                        </h3>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-foreground">
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="you@example.com"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-foreground">
                                    Remember me
                                </label>
                            </div>

                            <div className="text-sm">
                                <a
                                    href="/forgot-password"
                                    className="font-medium hover:underline"
                                    style={{ color: branding?.primary_color || '#1976D2' }}
                                >
                                    Forgot your password?
                                </a>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                style={{
                                    backgroundColor: branding?.primary_color || '#1976D2',
                                }}
                            >
                                {isLoading ? (
                                    <svg
                                        className="animate-spin h-5 w-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                ) : (
                                    'Sign in'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Right side - Branding/Image */}
            <div
                className="hidden lg:block lg:flex-1 bg-cover bg-center"
                style={{
                    backgroundImage: (branding as any)?.login_background_url
                        ? `url(${(branding as any).login_background_url})`
                        : `linear-gradient(135deg, ${(branding as any)?.primary_color || '#1976D2'} 0%, ${(branding as any)?.secondary_color || '#424242'} 100%)`,
                }}
            >
                <div className="h-full flex items-center justify-center bg-black bg-opacity-40">
                    <div className="text-center text-white px-8">
                        <h2 className="text-4xl font-bold mb-4">
                            Welcome to NucleIQ
                        </h2>
                        <p className="text-xl opacity-90">
                            Comprehensive School Management System
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
