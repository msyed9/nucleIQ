/**
 * Permission Hooks
 * Custom hooks for permission checking and role management
 */

import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Hook to check if user has a specific permission
 */
export const usePermission = (module: string, action: string): boolean => {
  const { hasPermission } = useAuth();
  
  return useMemo(() => {
    return hasPermission(module, action);
  }, [hasPermission, module, action]);
};

/**
 * Hook for role-related checks
 */
export const useRole = () => {
  const { user, isRole, isSuperadmin, getUserRoles } = useAuth();
  
  return useMemo(() => ({
    role: user?.roles?.[0] || null,
    roles: getUserRoles(),
    isRole,
    isSuperadmin,
    isAdmin: () => isRole('school_admin'),
    isTeacher: () => isRole('teacher'),
    isAccountant: () => isRole('accountant'),
    isLibrarian: () => isRole('librarian'),
    isTransportManager: () => isRole('transport_manager'),
    isHostelWarden: () => isRole('hostel_warden'),
    isReceptionist: () => isRole('receptionist'),
  }), [user, isRole, isSuperadmin, getUserRoles]);
};

/**
 * Hook for dynamic permission checking (useful for computed permissions)
 */
export const usePermissionCheck = () => {
  const { hasPermission } = useAuth();
  
  return {
    checkPermission: (module: string, action: string) => hasPermission(module, action),
  };
};

/**
 * Hook to check if user has ANY of the provided permissions
 */
export const useAnyPermission = (...permissions: Array<[string, string]>): boolean => {
  const { hasPermission } = useAuth();
  
  return useMemo(() => {
    return permissions.some(([module, action]) => hasPermission(module, action));
  }, [hasPermission, permissions]);
};

/**
 * Hook to check if user has ALL of the provided permissions
 */
export const useAllPermissions = (...permissions: Array<[string, string]>): boolean => {
  const { hasPermission } = useAuth();
  
  return useMemo(() => {
    return permissions.every(([module, action]) => hasPermission(module, action));
  }, [hasPermission, permissions]);
};
