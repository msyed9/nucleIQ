/**
 * Roles & Permissions Management Page
 * Comprehensive role management with checkbox-based permission assignment
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Check,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import api from '../../services/api';
import { Card, Button, useToast, ToastContainer } from '@/design-system';

interface Permission {
  id: string;
  resource: string;
  action: string;
  code: string;
  display_name: string;
  description: string;
  group: string;
}

interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  permissions: Permission[];
  user_count?: number;
}

interface PermissionGroup {
  name: string;
  permissions: Permission[];
}

const RolesPermissions: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  });
  const { toasts, removeToast, success, error } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      const permIds = new Set(selectedRole.permissions.map(p => p.id));
      setSelectedPermissions(permIds);
    }
  }, [selectedRole]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes, matrixRes] = await Promise.all([
        api.get('/users/roles/'),
        api.get('/users/permissions/'),
        api.get('/users/permissions-matrix/')
      ]);

      setRoles(rolesRes.data.results || rolesRes.data);
      setAllPermissions(permsRes.data.results || permsRes.data);

      if (matrixRes.data.groups) {
        setPermissionGroups(matrixRes.data.groups);
        setExpandedGroups(new Set(matrixRes.data.groups.map((g: any) => g.name)));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = (permissionId: string) => {
    setSelectedPermissions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId);
      } else {
        newSet.add(permissionId);
      }
      return newSet;
    });
  };

  const handleSelectAllInGroup = (group: PermissionGroup) => {
    const groupPermIds = group.permissions.map(p => p.id);
    const allSelected = groupPermIds.every(id => selectedPermissions.has(id));

    setSelectedPermissions(prev => {
      const newSet = new Set(prev);
      groupPermIds.forEach(id => {
        if (allSelected) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
      });
      return newSet;
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;

    try {
      setSaving(true);
      await api.patch('/users/permissions-matrix/bulk-update/', {
        role_id: selectedRole.id,
        permission_ids: Array.from(selectedPermissions),
      });

      success('Permissions updated successfully!');
      await fetchData();
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      error(error.response?.data?.message || 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateOrUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      if (editingRole) {
        await api.put(`/users/roles/${editingRole.id}/`, formData);
      } else {
        await api.post('/users/roles/', formData);
      }

      setShowRoleForm(false);
      setEditingRole(null);
      setFormData({ name: '', code: '', description: '' });
      await fetchData();
    } catch (error: any) {
      console.error('Error saving role:', error);
      alert(error.response?.data?.message || 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      await api.delete(`/users/roles/${roleId}/`);
      await fetchData();
      if (selectedRole?.id === roleId) {
        setSelectedRole(null);
      }
    } catch (error: any) {
      console.error('Error deleting role:', error);
      alert(error.response?.data?.message || 'Failed to delete role');
    }
  };

  const openEditRole = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      code: role.code,
      description: role.description || '',
    });
    setShowRoleForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={removeToast} position="top-right" />
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '2.25rem',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            margin: '0 0 0.5rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <Shield size={32} />
            Roles & Permissions
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', margin: 0 }}>
            Manage user roles and assign permissions
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
          {/* Roles List */}
          <div>
            <Card>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Roles</h2>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingRole(null);
                      setFormData({ name: '', code: '', description: '' });
                      setShowRoleForm(true);
                    }}
                  >
                    <Plus size={16} /> Add Role
                  </Button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {roles.map(role => (
                    <div
                      key={role.id}
                      onClick={() => setSelectedRole(role)}
                      style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        border: selectedRole?.id === role.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        backgroundColor: selectedRole?.id === role.id ? 'var(--color-primary-light)' : 'var(--color-background)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.25rem 0' }}>
                            {role.name}
                          </h3>
                          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: '0 0 0.5rem 0' }}>
                            {role.code}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', margin: 0 }}>
                            {role.user_count || 0} users  {role.permissions?.length || 0} permissions
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditRole(role);
                            }}
                            style={{
                              padding: '0.25rem',
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              color: 'var(--color-text-secondary)'
                            }}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRole(role.id);
                            }}
                            style={{
                              padding: '0.25rem',
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              color: 'var(--color-danger)'
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Permissions Panel */}
          <div>
            {selectedRole ? (
              <Card>
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>
                      Permissions for {selectedRole.name}
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                      Select permissions to grant to this role
                    </p>
                  </div>

                  <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    {permissionGroups.map(group => (
                      <div key={group.name} style={{ marginBottom: '1rem' }}>
                        <div
                          onClick={() => {
                            setExpandedGroups(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(group.name)) {
                                newSet.delete(group.name);
                              } else {
                                newSet.add(group.name);
                              }
                              return newSet;
                            });
                          }}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.75rem',
                            backgroundColor: 'var(--color-background-secondary)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            marginBottom: '0.5rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {expandedGroups.has(group.name) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            <strong>{group.name}</strong>
                            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                              ({group.permissions.filter(p => selectedPermissions.has(p.id)).length}/{group.permissions.length})
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectAllInGroup(group);
                            }}
                            style={{
                              padding: '0.25rem 0.75rem',
                              fontSize: '0.75rem',
                              border: '1px solid var(--color-border)',
                              borderRadius: '4px',
                              backgroundColor: 'white',
                              cursor: 'pointer'
                            }}
                          >
                            {group.permissions.every(p => selectedPermissions.has(p.id)) ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>

                        {expandedGroups.has(group.name) && (
                          <div style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {group.permissions.map(permission => (
                              <label
                                key={permission.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'start',
                                  gap: '0.75rem',
                                  padding: '0.75rem',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  backgroundColor: selectedPermissions.has(permission.id) ? 'var(--color-primary-light)' : 'transparent',
                                  border: '1px solid ' + (selectedPermissions.has(permission.id) ? 'var(--color-primary)' : 'transparent'),
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedPermissions.has(permission.id)}
                                  onChange={() => handleTogglePermission(permission.id)}
                                  style={{ marginTop: '0.25rem' }}
                                />
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 500 }}>{permission.display_name}</div>
                                  {permission.description && (
                                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                                      {permission.description}
                                    </div>
                                  )}
                                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>
                                    {permission.code}
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      onClick={handleSavePermissions}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : <><Save size={16} /> Save Permissions</>}
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card>
                <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p>Select a role to manage its permissions</p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Role Form Modal */}
        {showRoleForm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <Card style={{ maxWidth: '500px', width: '100%', margin: '1rem' }}>
              <div style={{ padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                  {editingRole ? 'Edit Role' : 'Create New Role'}
                </h2>

                <form onSubmit={handleCreateOrUpdateRole}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                      Role Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px'
                      }}
                      placeholder="e.g., Principal, Teacher"
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                      Role Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px'
                      }}
                      placeholder="e.g., principal, teacher"
                    />
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        resize: 'vertical'
                      }}
                      placeholder="Describe the role and its responsibilities"
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setShowRoleForm(false);
                        setEditingRole(null);
                        setFormData({ name: '', code: '', description: '' });
                      }}
                    >
                      <X size={16} /> Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Saving...' : <><Check size={16} /> {editingRole ? 'Update' : 'Create'}</>}
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        )}
      </div>
    </>
  );
};

export default RolesPermissions;
