/**
 * Simple Protected Route Component
 * Checks for authentication token in localStorage
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const location = useLocation();
    const token = localStorage.getItem('access_token');

    if (!token) {
        // Redirect to login if no token found
        const isParentRoute = location.pathname.startsWith('/parent');
        return <Navigate to={isParentRoute ? '/parent/login' : '/login'} state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
