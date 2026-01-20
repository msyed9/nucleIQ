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
import { Card, Button, useToast, ToastContainer, PageLayout, Input, Checkbox, Badge } from '@/design-system';

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
        api.get('/roles/'),
        api.get('/permissions/'),
        api.get('/permissions-matrix/')
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
      await api.patch('/permissions-matrix/bulk-update/', {
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
        await api.put(`/roles/${editingRole.id}/`, formData);
      } else {
        await api.post('/roles/', formData);
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
      await api.delete(`/roles/${roleId}/`);
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
      <PageLayout
        title="Roles & Permissions"
        subtitle="Manage user roles and assign granular permissions for system resources"
        actions={
          <Button
            onClick={() => {
              setEditingRole(null);
              setFormData({ name: '', code: '', description: '' });
              setShowRoleForm(true);
            }}
            iconLeft={Plus}
          >
            Add Role
          </Button>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem', alignItems: 'start' }}>
          {/* Roles List */}
          <div>
            <Card title="Roles" style={{ overflow: 'hidden' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem' }}>
                {roles.map(role => (
                  <div
                    key={role.id}
                    onClick={() => setSelectedRole(role)}
                    style={{
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid ' + (selectedRole?.id === role.id ? 'var(--color-primary)' : 'var(--color-border-light)'),
                      backgroundColor: selectedRole?.id === role.id ? 'var(--color-bg-primary-light)' : 'var(--color-bg-paper)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {selectedRole?.id === role.id && (
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '4px',
                        backgroundColor: 'var(--color-primary)'
                      }} />
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.25rem 0', color: 'var(--color-text-primary)' }}>
                          {role.name}
                        </h3>
                        <code>{role.code}</code>
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                          <Badge variant="neutral" size="sm">{role.user_count || 0} users</Badge>
                          <Badge variant="primary" size="sm">{role.permissions?.length || 0} perms</Badge>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          iconOnly={Edit}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditRole(role);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          iconOnly={Trash2}
                          style={{ color: 'var(--color-danger)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRole(role.id);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Permissions Panel */}
          <div>
            {selectedRole ? (
              <Card
                title={`Permissions for ${selectedRole.name}`}
                subtitle="Select granular permissions to grant to this role"
                actions={
                  <Button
                    onClick={handleSavePermissions}
                    loading={saving}
                    iconLeft={Save}
                  >
                    Save Changes
                  </Button>
                }
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '0.5rem' }}>
                  {permissionGroups.map(group => (
                    <div key={group.name} style={{
                      border: '1px solid var(--color-border-light)',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden'
                    }}>
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
                          padding: '1rem 1.25rem',
                          backgroundColor: 'var(--color-bg-secondary)',
                          cursor: 'pointer',
                          borderBottom: expandedGroups.has(group.name) ? '1px solid var(--color-border-light)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ color: 'var(--color-text-tertiary)' }}>
                            {expandedGroups.has(group.name) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: '1rem' }}>{group.name}</span>
                          <Badge variant="outline" size="sm">
                            {group.permissions.filter(p => selectedPermissions.has(p.id)).length} / {group.permissions.length}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAllInGroup(group);
                          }}
                        >
                          {group.permissions.every(p => selectedPermissions.has(p.id)) ? 'Deselect All' : 'Select All'}
                        </Button>
                      </div>

                      {expandedGroups.has(group.name) && (
                        <div style={{
                          padding: '1.25rem',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                          gap: '1rem',
                          backgroundColor: 'var(--color-bg-paper)'
                        }}>
                          {group.permissions.map(permission => (
                            <Checkbox
                              key={permission.id}
                              label={permission.display_name}
                              helperText={permission.description}
                              checked={selectedPermissions.has(permission.id)}
                              onChange={() => handleTogglePermission(permission.id)}
                              className="permission-item"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card>
                <div style={{ padding: '6rem 2rem', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                  <Shield size={64} style={{ margin: '0 auto 1.5rem', opacity: 0.2 }} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>No Role Selected</h3>
                  <p>Select a role from the sidebar to manage its granular permissions</p>
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
              <div style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>
                    {editingRole ? 'Edit Role' : 'Create New Role'}
                  </h2>
                  <Button variant="ghost" iconOnly={X} onClick={() => setShowRoleForm(false)} />
                </div>

                <form onSubmit={handleCreateOrUpdateRole}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                    <Input
                      label="Role Name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Principal, Teacher"
                      fullWidth
                    />

                    <Input
                      label="Role Code"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                      placeholder="e.g., principal_admin"
                      helperText="Unique identifier used by the system"
                      fullWidth
                    />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-md)',
                          resize: 'vertical',
                          fontSize: '0.875rem',
                          fontFamily: 'inherit'
                        }}
                        placeholder="Describe the role and its responsibilities..."
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setShowRoleForm(false);
                        setEditingRole(null);
                        setFormData({ name: '', code: '', description: '' });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" loading={saving} iconLeft={editingRole ? Save : Check}>
                      {editingRole ? 'Update Role' : 'Create Role'}
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        )}
      </PageLayout>
    </>
  );
};

export default RolesPermissions;
