/**
 * Forgot Password Page Component
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../lib/api';
import { useTheme } from '../../contexts/ThemeContext';

export const ForgotPasswordPage: React.FC = () => {
    const { branding } = useTheme();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await authAPI.resetPassword({ email });
            setIsSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to send reset email');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-background">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                            <svg
                                className="h-6 w-6 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                        <h2 className="mt-6 text-3xl font-extrabold text-foreground">
                            Check your email
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            If an account exists for {email}, you will receive a password reset link shortly.
                        </p>
                        <div className="mt-6">
                            <Link
                                to="/login"
                                className="font-medium hover:underline"
                                style={{ color: branding?.primary_color || '#1976D2' }}
                            >
                                Back to login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-background">
            <div className="max-w-md w-full space-y-8">
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
                        Reset your password
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Enter your email address and we'll send you a link to reset your password
                    </p>
                </div>

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
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            style={{
                                backgroundColor: branding?.primary_color || '#1976D2',
                            }}
                        >
                            {isLoading ? 'Sending...' : 'Send reset link'}
                        </button>
                    </div>

                    <div className="text-center">
                        <Link
                            to="/login"
                            className="font-medium text-sm hover:underline"
                            style={{ color: branding?.primary_color || '#1976D2' }}
                        >
                            Back to login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};
