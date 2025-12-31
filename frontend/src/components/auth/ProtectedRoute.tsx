/**
 * Protected Route Component
 * Wraps routes that require authentication
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredPermission?: { resource: string; action: string };
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requiredPermission,
}) => {
    const { isAuthenticated, isLoading, checkPermission } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requiredPermission) {
        const { resource, action } = requiredPermission;
        if (!checkPermission(resource, action)) {
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-foreground mb-4">403</h1>
                        <p className="text-xl text-muted-foreground">
                            You don't have permission to access this page
                        </p>
                    </div>
                </div>
            );
        }
    }

    return <>{children}</>;
};
