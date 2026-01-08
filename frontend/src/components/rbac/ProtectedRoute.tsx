/**
 * ProtectedRoute Component
 * Route wrapper that enforces authentication and permissions
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: {
    module: string;
    action: string;
  };
  roles?: string[];
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  permission,
  roles,
  redirectTo = '/dashboard',
}) => {
  const { isAuthenticated, isLoading, isRole } = useAuth();
  const location = useLocation();

  const hasPermission = usePermission(
    permission?.module || '',
    permission?.action || ''
  );

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check permission if specified
  if (permission && !hasPermission) {
    return <Navigate to={redirectTo} state={{ error: 'Access denied' }} replace />;
  }

  // Check roles if specified
  if (roles && roles.length > 0) {
    const hasRole = roles.some(role => isRole(role));
    if (!hasRole) {
      return <Navigate to={redirectTo} state={{ error: 'Access denied' }} replace />;
    }
  }

  return <>{children}</>;
};
