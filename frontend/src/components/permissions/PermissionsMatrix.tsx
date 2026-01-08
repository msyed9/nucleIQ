import React, { useState, useEffect, useMemo } from 'react';
import { Search, Save, Loader2, AlertCircle, Check } from 'lucide-react';
import api from '../../services/api';

interface Permission {
  id: string;
  resource: string;
  action: string;
  code: string;
  display_name: string;
  description: string;
}

interface PermissionGroup {
  name: string;
  permissions: Permission[];
}

interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  permission_ids: string[];
}

interface MatrixData {
  groups: PermissionGroup[];
  roles: Role[];
}

export const PermissionsMatrix: React.FC = () => {
  const [matrixData, setMatrixData] = useState<MatrixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [permissionChanges, setPermissionChanges] = useState<Map<string, Set<string>>>(new Map());
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Fetch matrix data
  useEffect(() => {
    fetchMatrixData();
  }, []);

  // Auto-expand all groups initially
  useEffect(() => {
    if (matrixData) {
      setExpandedGroups(new Set(matrixData.groups.map(g => g.name)));
    }
  }, [matrixData]);

  const fetchMatrixData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/permissions-matrix/');
      setMatrixData(response.data);

      // Initialize permission changes map with current state
      const initialChanges = new Map<string, Set<string>>();
      response.data.roles.forEach((role: Role) => {
        initialChanges.set(role.id, new Set(role.permission_ids));
      });
      setPermissionChanges(initialChanges);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load permissions matrix');
      console.error('Error fetching matrix:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  const togglePermission = (roleId: string, permissionId: string) => {
    setPermissionChanges(prev => {
      const newMap = new Map(prev);
      const rolePerms = new Set(newMap.get(roleId) || []);

      if (rolePerms.has(permissionId)) {
        rolePerms.delete(permissionId);
      } else {
        rolePerms.add(permissionId);
      }

      newMap.set(roleId, rolePerms);
      return newMap;
    });
  };

  const hasPermission = (roleId: string, permissionId: string): boolean => {
    return permissionChanges.get(roleId)?.has(permissionId) || false;
  };

  const toggleAllInRow = (permission: Permission) => {
    if (!matrixData) return;

    // Check if all roles have this permission
    const allHaveIt = matrixData.roles.every(role =>
      hasPermission(role.id, permission.id)
    );

    setPermissionChanges(prev => {
      const newMap = new Map(prev);
      matrixData.roles.forEach(role => {
        const rolePerms = new Set(newMap.get(role.id) || []);
        if (allHaveIt) {
          rolePerms.delete(permission.id);
        } else {
          rolePerms.add(permission.id);
        }
        newMap.set(role.id, rolePerms);
      });
      return newMap;
    });
  };

  const toggleAllInColumn = (roleId: string) => {
    if (!matrixData) return;

    // Get all visible permissions
    const allPermissions = filteredGroups.flatMap(g => g.permissions);
    const rolePerms = permissionChanges.get(roleId) || new Set();

    // Check if all visible permissions are selected
    const allSelected = allPermissions.every(p => rolePerms.has(p.id));

    setPermissionChanges(prev => {
      const newMap = new Map(prev);
      const newRolePerms = new Set(rolePerms);

      allPermissions.forEach(perm => {
        if (allSelected) {
          newRolePerms.delete(perm.id);
        } else {
          newRolePerms.add(perm.id);
        }
      });

      newMap.set(roleId, newRolePerms);
      return newMap;
    });
  };

  const saveChanges = async () => {
    if (!matrixData) return;

    try {
      setSaving(true);
      setSaveMessage(null);

      // Save each role's permissions
      for (const role of matrixData.roles) {
        const permissionIds = Array.from(permissionChanges.get(role.id) || []);

        await api.patch(`/permissions-matrix/bulk_update/`, {
          role_id: role.id,
          permission_ids: permissionIds,
        });
      }

      setSaveMessage('Permissions saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);

      // Refresh data
      await fetchMatrixData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save permissions');
      console.error('Error saving permissions:', err);
    } finally {
      setSaving(false);
    }
  };

  // Filter groups and permissions based on search
  const filteredGroups = useMemo(() => {
    if (!matrixData || !searchQuery.trim()) return matrixData?.groups || [];

    const query = searchQuery.toLowerCase();
    return matrixData.groups
      .map(group => ({
        ...group,
        permissions: group.permissions.filter(perm =>
          perm.display_name.toLowerCase().includes(query) ||
          perm.resource.toLowerCase().includes(query) ||
          perm.action.toLowerCase().includes(query) ||
          perm.description.toLowerCase().includes(query)
        ),
      }))
      .filter(group => group.permissions.length > 0);
  }, [matrixData, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          <p className="text-gray-400">Loading permissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="flex flex-col items-center gap-3 text-red-400">
          <AlertCircle className="w-8 h-8" />
          <p>{error}</p>
          <button
            onClick={fetchMatrixData}
            className="px-4 py-2 mt-4 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!matrixData) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Role Permissions</h1>
        <p className="text-gray-400">Manage role-based access control permissions</p>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 mb-6 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search permissions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        {/* Save Button */}
        <button
          onClick={saveChanges}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white font-medium rounded-lg transition-colors"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Save Success Message */}
      {saveMessage && (
        <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-lg text-green-200 flex items-center gap-2">
          <Check className="w-5 h-5" />
          {saveMessage}
        </div>
      )}

      {/* Permissions Matrix Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-700">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 sticky left-0 bg-gray-900 z-10 min-w-[300px]">
                  Feature
                </th>
                {matrixData.roles.map(role => (
                  <th
                    key={role.id}
                    className="px-4 py-3 text-center text-sm font-semibold text-gray-300 min-w-[120px]"
                  >
                    <div>
                      <div>{role.name}</div>
                      <button
                        onClick={() => toggleAllInColumn(role.id)}
                        className="mt-1 text-xs text-gray-500 hover:text-red-400"
                        title="Toggle all in column"
                      >
                        Select All
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map(group => (
                <React.Fragment key={group.name}>
                  {/* Group Header */}
                  <tr className="bg-gray-850 border-b border-gray-700">
                    <td
                      colSpan={matrixData.roles.length + 1}
                      className="px-4 py-2 sticky left-0 bg-gray-850 z-10"
                    >
                      <button
                        onClick={() => toggleGroup(group.name)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-200 hover:text-white w-full text-left"
                      >
                        <span className="text-gray-500">
                          {expandedGroups.has(group.name) ? '' : ''}
                        </span>
                        {group.name}
                        <span className="text-gray-500 text-xs">
                          ({group.permissions.length})
                        </span>
                      </button>
                    </td>
                  </tr>

                  {/* Group Permissions */}
                  {expandedGroups.has(group.name) &&
                    group.permissions.map(permission => (
                      <tr
                        key={permission.id}
                        className="border-b border-gray-700 hover:bg-gray-750 transition-colors"
                      >
                        <td className="px-4 py-3 sticky left-0 bg-gray-800 hover:bg-gray-750 z-10">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm text-gray-200">
                                {permission.display_name}
                              </div>
                              {permission.description && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {permission.description}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => toggleAllInRow(permission)}
                              className="text-xs text-gray-500 hover:text-red-400 ml-2"
                              title="Toggle all in row"
                            >
                              All
                            </button>
                          </div>
                        </td>
                        {matrixData.roles.map(role => (
                          <td
                            key={`${role.id}-${permission.id}`}
                            className="px-4 py-3 text-center"
                          >
                            <div className="flex items-center justify-center">
                              <label className="cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={hasPermission(role.id, permission.id)}
                                  onChange={() => togglePermission(role.id, permission.id)}
                                  className="sr-only peer"
                                />
                                <div className="w-5 h-5 border-2 border-gray-600 rounded peer-checked:bg-red-600 peer-checked:border-red-600 transition-all flex items-center justify-center">
                                  {hasPermission(role.id, permission.id) && (
                                    <Check className="w-3 h-3 text-white" />
                                  )}
                                </div>
                              </label>
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* No Results */}
      {filteredGroups.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No permissions found matching "{searchQuery}"
        </div>
      )}
    </div>
  );
};

export default PermissionsMatrix;
