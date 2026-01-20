/**
 * Example App.tsx showing how to integrate Auth and Theme contexts
 * This is a reference implementation - adapt to your needs
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';

// Example Dashboard component
const Dashboard: React.FC = () => {
    const { user } = useAuth();

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">Welcome, {user?.full_name}!</h1>
            <p className="text-muted-foreground">
                This is your dashboard. You are logged in as {user?.email}
            </p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 bg-card rounded-lg shadow">
                    <h3 className="font-semibold mb-2">Your Roles</h3>
                    <ul className="space-y-1">
                        {user?.roles.map((role) => (
                            <li key={role.id} className="text-sm">{role.name}</li>
                        ))}
                    </ul>
                </div>

                <div className="p-6 bg-card rounded-lg shadow">
                    <h3 className="font-semibold mb-2">Preferences</h3>
                    <p className="text-sm">Theme: {user?.preference.theme_mode}</p>
                    <p className="text-sm">Language: {user?.preference.language}</p>
                    <p className="text-sm">RTL: {user?.preference.is_rtl ? 'Yes' : 'No'}</p>
                </div>

                <div className="p-6 bg-card rounded-lg shadow">
                    <h3 className="font-semibold mb-2">Tenant</h3>
                    <p className="text-sm">{user?.tenant_name || 'Platform Admin'}</p>
                </div>
            </div>
        </div>
    );
};

// Example Students page (requires permission)
const StudentsPage: React.FC = () => {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">Students</h1>
            <p>Student management interface goes here...</p>
        </div>
    );
};

// Example Settings page
const SettingsPage: React.FC = () => {
    const { user, updatePreferences } = useAuth();

    const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
        try {
            await updatePreferences({ theme_mode: theme });
        } catch (error) {
            console.error('Failed to update theme:', error);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">Settings</h1>

            <div className="max-w-2xl space-y-6">
                <div>
                    <h3 className="font-semibold mb-2">Theme</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleThemeChange('light')}
                            className={`px-4 py-2 rounded ${user?.preference.theme_mode === 'light'
                                ? 'bg-primary text-white'
                                : 'bg-secondary'
                                }`}
                        >
                            Light
                        </button>
                        <button
                            onClick={() => handleThemeChange('dark')}
                            className={`px-4 py-2 rounded ${user?.preference.theme_mode === 'dark'
                                ? 'bg-primary text-white'
                                : 'bg-secondary'
                                }`}
                        >
                            Dark
                        </button>
                        <button
                            onClick={() => handleThemeChange('system')}
                            className={`px-4 py-2 rounded ${user?.preference.theme_mode === 'system'
                                ? 'bg-primary text-white'
                                : 'bg-secondary'
                                }`}
                        >
                            System
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

function App() {
    return (
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Protected routes */}
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />

            {/* Protected route with permission check */}
            <Route
                path="/students"
                element={
                    <ProtectedRoute
                        requiredPermission={{ resource: 'student_module', action: 'read' }}
                    >
                        <StudentsPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/settings"
                element={
                    <ProtectedRoute>
                        <SettingsPage />
                    </ProtectedRoute>
                }
            />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
