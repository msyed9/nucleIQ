/**
 * RBAC Context Provider
 * Manages roles, permissions, and permission matrix
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Role, Permission } from '../types/auth';
import { rbacAPI } from '../services/rbacService';

interface PermissionMatrix {
  groups: PermissionGroup[];
  roles: RoleWithPermissions[];
}

interface PermissionGroup {
  name: string;
  permissions: PermissionDetail[];
}

interface PermissionDetail {
  id: string;
  resource: string;
  action: string;
  code: string;
  display_name: string;
  description?: string;
}

interface RoleWithPermissions {
  id: string;
  name: string;
  code: string;
  description?: string;
  permission_ids: string[];
}

interface RBACContextType {
  roles: Role[];
  modules: any[];
  permissions: Permission[];
  permissionMatrix: PermissionMatrix | null;
  loading: boolean;
  error: string | null;
  fetchRoles: () => Promise<void>;
  fetchModules: () => Promise<void>;
  fetchPermissions: () => Promise<void>;
  fetchPermissionMatrix: () => Promise<void>;
  createRole: (roleData: Partial<Role>) => Promise<Role>;
  updateRole: (roleId: string, roleData: Partial<Role>) => Promise<Role>;
  deleteRole: (roleId: string) => Promise<void>;
  updatePermissionMatrix: (roleId: string, permissionIds: string[]) => Promise<void>;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
};

interface RBACProviderProps {
  children: React.ReactNode;
}

export const RBACProvider: React.FC<RBACProviderProps> = ({ children }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionMatrix, setPermissionMatrix] = useState<PermissionMatrix | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await rbacAPI.getRoles();
      setRoles(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch roles');
      console.error('Failed to fetch roles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchModules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await rbacAPI.getModules();
      setModules(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch modules');
      console.error('Failed to fetch modules:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await rbacAPI.getPermissions();
      setPermissions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch permissions');
      console.error('Failed to fetch permissions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPermissionMatrix = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await rbacAPI.getPermissionMatrix();
      setPermissionMatrix(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch permission matrix');
      console.error('Failed to fetch permission matrix:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createRole = useCallback(async (roleData: Partial<Role>): Promise<Role> => {
    try {
      setLoading(true);
      setError(null);
      const newRole = await rbacAPI.createRole(roleData);
      await fetchRoles(); // Refresh roles list
      return newRole;
    } catch (err: any) {
      setError(err.message || 'Failed to create role');
      console.error('Failed to create role:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchRoles]);

  const updateRole = useCallback(async (roleId: string, roleData: Partial<Role>): Promise<Role> => {
    try {
      setLoading(true);
      setError(null);
      const updatedRole = await rbacAPI.updateRole(roleId, roleData);
      await fetchRoles(); // Refresh roles list
      return updatedRole;
    } catch (err: any) {
      setError(err.message || 'Failed to update role');
      console.error('Failed to update role:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchRoles]);

  const deleteRole = useCallback(async (roleId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await rbacAPI.deleteRole(roleId);
      await fetchRoles(); // Refresh roles list
    } catch (err: any) {
      setError(err.message || 'Failed to delete role');
      console.error('Failed to delete role:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchRoles]);

  const updatePermissionMatrix = useCallback(async (roleId: string, permissionIds: string[]): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await rbacAPI.updatePermissionMatrix(roleId, permissionIds);
      await fetchPermissionMatrix(); // Refresh matrix
    } catch (err: any) {
      setError(err.message || 'Failed to update permissions');
      console.error('Failed to update permissions:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPermissionMatrix]);

  const value: RBACContextType = {
    roles,
    modules,
    permissions,
    permissionMatrix,
    loading,
    error,
    fetchRoles,
    fetchModules,
    fetchPermissions,
    fetchPermissionMatrix,
    createRole,
    updateRole,
    deleteRole,
    updatePermissionMatrix,
  };

  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>;
};
