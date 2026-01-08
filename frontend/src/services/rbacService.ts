/**
 * RBAC API Service
 * Handles API calls for roles, permissions, and permission matrix
 */

import api from './api';
import type { Role, Permission } from '../types/auth';

export const rbacAPI = {
  // Roles
  getRoles: async (): Promise<Role[]> => {
    const response = await api.get('/users/roles/');
    return response.data.results || response.data;
  },

  getRole: async (id: string): Promise<Role> => {
    const response = await api.get(`/users/roles/${id}/`);
    return response.data;
  },

  createRole: async (data: Partial<Role>): Promise<Role> => {
    const response = await api.post('/users/roles/', data);
    return response.data;
  },

  updateRole: async (id: string, data: Partial<Role>): Promise<Role> => {
    const response = await api.put(`/users/roles/${id}/`, data);
    return response.data;
  },

  deleteRole: async (id: string): Promise<void> => {
    await api.delete(`/users/roles/${id}/`);
  },

  // Permission Modules
  getModules: async (): Promise<any[]> => {
    const response = await api.get('/users/permission-modules/');
    return response.data.results || response.data;
  },

  getModule: async (id: string): Promise<any> => {
    const response = await api.get(`/users/permission-modules/${id}/`);
    return response.data;
  },

  // Permissions
  getPermissions: async (params?: any): Promise<Permission[]> => {
    const response = await api.get('/users/permissions/', { params });
    return response.data.results || response.data;
  },

  // Permission Matrix
  getPermissionMatrix: async (): Promise<any> => {
    const response = await api.get('/users/permissions-matrix/');
    return response.data;
  },

  updatePermissionMatrix: async (roleId: string, permissionIds: string[]): Promise<void> => {
    await api.patch('/users/permissions-matrix/bulk-update/', {
      role_id: roleId,
      permission_ids: permissionIds,
    });
  },

  // User Permissions
  getUserPermissions: async (): Promise<any> => {
    const response = await api.get('/users/auth/permissions/');
    return response.data;
  },

  checkPermission: async (module: string, action: string): Promise<boolean> => {
    const response = await api.post('/users/auth/check-permission/', {
      module,
      action,
    });
    return response.data.has_permission;
  },
};
