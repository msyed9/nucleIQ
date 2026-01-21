/**
 * User Management Page
 * Modern UI with checkbox-based role assignment matching RolesPermissions design
 */

import React, { useState, useEffect } from 'react';
import {
    Users,
    Plus,
    Edit,
    Trash2,
    Save,
    X,
    Check,
    Search,
    Filter,
    UserCheck,
    UserX,
    Mail,
    Phone,
    Calendar,
    Shield
} from 'lucide-react';
import api from '../../services/api';
import { Card, Button, useToast, ToastContainer, PageLayout, Select, Input, Toggle, Badge, Checkbox } from '@/design-system';

interface Role {
    id: string;
    name: string;
    code: string;
    description: string;
}

interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
    is_staff: boolean;
    roles: Role[];
    phone_number?: string;
    date_joined: string;
    is_parent?: boolean;
}

interface UserFormData {
    email: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    password?: string;
    password_confirm?: string;
    is_active: boolean;
    is_staff: boolean;
    role_ids: string[];
}

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
    const [showUserForm, setShowUserForm] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const { toasts, removeToast, success, error } = useToast();

    const [formData, setFormData] = useState<UserFormData>({
        email: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        password: '',
        password_confirm: '',
        is_active: true,
        is_staff: false,
        role_ids: []
    });

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedUser) {
            const roleIds = new Set(selectedUser.roles.map(r => r.id));
            setSelectedRoles(roleIds);
        }
    }, [selectedUser]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersRes, rolesRes] = await Promise.all([
                api.get('/users/'),
                api.get('/roles/')
            ]);

            setUsers(usersRes.data.results || usersRes.data);
            setRoles(rolesRes.data.results || rolesRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleRole = (roleId: string) => {
        setSelectedRoles(prev => {
            const newSet = new Set(prev);
            if (newSet.has(roleId)) {
                newSet.delete(roleId);
            } else {
                newSet.add(roleId);
            }
            return newSet;
        });
    };

    const handleSaveUserRoles = async () => {
        if (!selectedUser) return;

        try {
            setSaving(true);
            await api.patch(`/users/${selectedUser.id}/`, {
                role_ids: Array.from(selectedRoles),
            });

            success('User roles updated successfully!');
            await fetchData();
        } catch (error: any) {
            console.error('Error saving user roles:', error);
            error(error.response?.data?.message || 'Failed to save user roles');
        } finally {
            setSaving(false);
        }
    };

    const handleCreateOrUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setSaving(true);
            if (editingUser) {
                await api.put(`/users/${editingUser.id}/`, formData);
            } else {
                await api.post('/users/', formData);
            }

            setShowUserForm(false);
            setEditingUser(null);
            setFormData({
                email: '',
                first_name: '',
                last_name: '',
                phone_number: '',
                password: '',
                password_confirm: '',
                is_active: true,
                is_staff: false,
                role_ids: []
            });
            await fetchData();
        } catch (error: any) {
            console.error('Error saving user:', error);
            error(error.response?.data?.message || 'Failed to save user');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            await api.delete(`/users/${userId}/`);
            await fetchData();
            if (selectedUser?.id === userId) {
                setSelectedUser(null);
            }
        } catch (error: any) {
            console.error('Error deleting user:', error);
            error(error.response?.data?.message || 'Failed to delete user');
        }
    };

    const handleToggleActive = async (user: User) => {
        try {
            await api.patch(`/users/${user.id}/`, { is_active: !user.is_active });
            await fetchData();
        } catch (error) {
            console.error('Error toggling user status:', error);
        }
    };

    const openEditUser = (user: User) => {
        setEditingUser(user);
        setFormData({
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            phone_number: user.phone_number || '',
            is_active: user.is_active,
            is_staff: user.is_staff,
            role_ids: user.roles.map(r => r.id)
        });
        setShowUserForm(true);
    };

    const filteredUsers = users.filter(user => {
        if (user.is_parent) {
            return false;
        }
        const matchesSearch =
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.last_name.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = !filterRole || user.roles.some(r => r.id === filterRole);
        const matchesStatus = !filterStatus ||
            (filterStatus === 'active' && user.is_active) ||
            (filterStatus === 'inactive' && !user.is_active);

        return matchesSearch && matchesRole && matchesStatus;
    });

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
                title="User Management"
                subtitle="Manage system users and assign roles"
                actions={
                    <Button
                        onClick={() => {
                            setEditingUser(null);
                            setFormData({
                                email: '',
                                first_name: '',
                                last_name: '',
                                phone_number: '',
                                password: '',
                                password_confirm: '',
                                is_active: true,
                                is_staff: false,
                                role_ids: []
                            });
                            setShowUserForm(true);
                        }}
                        iconLeft={Plus}
                    >
                        Add User
                    </Button>
                }
            >
                {/* Filters */}
                <Card style={{ marginBottom: '2rem', overflow: 'visible' }}>
                    <div style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 250px 200px 150px', gap: '1rem', alignItems: 'end' }}>
                            <Input
                                placeholder="Search users by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                iconLeft={Search}
                                fullWidth
                            />

                            <Select
                                value={filterRole}
                                onChange={setFilterRole}
                                placeholder="All Roles"
                                options={[
                                    { value: '', label: 'All Roles' },
                                    ...roles.map(role => ({ value: role.id, label: role.name }))
                                ]}
                                fullWidth
                            />

                            <Select
                                value={filterStatus}
                                onChange={setFilterStatus}
                                placeholder="All Status"
                                options={[
                                    { value: '', label: 'All Status' },
                                    { value: 'active', label: 'Active' },
                                    { value: 'inactive', label: 'Inactive' }
                                ]}
                                fullWidth
                            />

                            <Button
                                variant="outline"
                                fullWidth
                                onClick={() => {
                                    setSearchTerm('');
                                    setFilterRole('');
                                    setFilterStatus('');
                                }}
                            >
                                Reset
                            </Button>
                        </div>
                    </div>
                </Card>

                <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '2rem' }}>
                    {/* Users List */}
                    <div>
                        <Card>
                            <div style={{ padding: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                                    Users ({filteredUsers.length})
                                </h2>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '700px', overflowY: 'auto' }}>
                                    {filteredUsers.map(user => (
                                        <div
                                            key={user.id}
                                            onClick={() => setSelectedUser(user)}
                                            style={{
                                                padding: '1rem',
                                                borderRadius: '8px',
                                                border: selectedUser?.id === user.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                                backgroundColor: selectedUser?.id === user.id ? 'var(--color-primary-light)' : 'var(--color-background)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                                <div style={{ flex: 1 }}>
                                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        {user.first_name} {user.last_name}
                                                        {user.is_staff && (
                                                            <Badge variant="success" size="sm">STAFF</Badge>
                                                        )}
                                                    </h3>
                                                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                        <Mail size={14} />
                                                        {user.email}
                                                    </div>
                                                    {user.phone_number && (
                                                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                            <Phone size={14} />
                                                            {user.phone_number}
                                                        </div>
                                                    )}
                                                </div>
                                                <Badge variant={user.is_active ? "success" : "neutral"}>
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </div>

                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                                                {user.roles.map(role => (
                                                    <Badge key={role.id} variant="primary" size="sm">
                                                        {role.name}
                                                    </Badge>
                                                ))}
                                            </div>

                                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    style={{ flex: 1 }}
                                                    onClick={(e: React.MouseEvent) => {
                                                        e.stopPropagation();
                                                        openEditUser(user);
                                                    }}
                                                    iconLeft={Edit}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant={user.is_active ? "outline" : "success"}
                                                    size="sm"
                                                    style={{ flex: 1, ...(user.is_active ? { color: 'var(--color-danger)', borderColor: 'var(--color-danger)' } : {}) }}
                                                    onClick={(e: React.MouseEvent) => {
                                                        e.stopPropagation();
                                                        handleToggleActive(user);
                                                    }}
                                                    iconLeft={user.is_active ? UserX : UserCheck}
                                                >
                                                    {user.is_active ? 'Deactivate' : 'Activate'}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e: React.MouseEvent) => {
                                                        e.stopPropagation();
                                                        handleDeleteUser(user.id);
                                                    }}
                                                    iconOnly={Trash2}
                                                    style={{ color: 'var(--color-danger)' }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Roles Assignment Panel */}
                    <div>
                        {selectedUser ? (
                            <Card>
                                <div style={{ padding: '1.5rem' }}>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>
                                            Roles for {selectedUser.first_name} {selectedUser.last_name}
                                        </h2>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                                            Select roles to assign to this user
                                        </p>
                                    </div>

                                    <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {roles.map(role => (
                                                <Checkbox
                                                    key={role.id}
                                                    label={role.name}
                                                    helperText={role.description}
                                                    checked={selectedRoles.has(role.id)}
                                                    onChange={() => handleToggleRole(role.id)}
                                                    className="role-checkbox-item"
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button
                                            onClick={handleSaveUserRoles}
                                            disabled={saving}
                                            iconLeft={Save}
                                        >
                                            {saving ? 'Saving...' : 'Save Roles'}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ) : (
                            <Card>
                                <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                    <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                                    <p>Select a user to manage their roles</p>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>

                {/* User Form Modal */}
                {showUserForm && (
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
                        <Card style={{ maxWidth: '600px', width: '100%', margin: '1rem', position: 'relative' }}>
                            <div style={{ padding: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>
                                        {editingUser ? 'Edit User' : 'Create New User'}
                                    </h2>
                                    <Button variant="ghost" iconOnly={X} onClick={() => setShowUserForm(false)} />
                                </div>

                                <form onSubmit={handleCreateOrUpdateUser}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                        <Input
                                            label="First Name"
                                            required
                                            value={formData.first_name}
                                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                            placeholder="John"
                                            fullWidth
                                        />
                                        <Input
                                            label="Last Name"
                                            required
                                            value={formData.last_name}
                                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                            placeholder="Doe"
                                            fullWidth
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                        <Input
                                            label="Email Address"
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="john.doe@example.com"
                                            fullWidth
                                        />
                                        <Input
                                            label="Phone Number"
                                            type="tel"
                                            value={formData.phone_number}
                                            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                            placeholder="+1234567890"
                                            fullWidth
                                        />
                                    </div>

                                    {!editingUser && (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                            <Input
                                                label="Password"
                                                type="password"
                                                required={!editingUser}
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                placeholder="••••••••"
                                                fullWidth
                                            />
                                            <Input
                                                label="Confirm Password"
                                                type="password"
                                                required={!editingUser}
                                                value={formData.password_confirm}
                                                onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
                                                placeholder="••••••••"
                                                fullWidth
                                            />
                                        </div>
                                    )}

                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                                            Roles
                                        </label>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                            gap: '0.75rem',
                                            padding: '1rem',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-md)',
                                            maxHeight: '200px',
                                            overflowY: 'auto'
                                        }}>
                                            {roles.map(role => (
                                                <Checkbox
                                                    key={role.id}
                                                    label={role.name}
                                                    checked={formData.role_ids.includes(role.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFormData({ ...formData, role_ids: [...formData.role_ids, role.id] });
                                                        } else {
                                                            setFormData({ ...formData, role_ids: formData.role_ids.filter(r => r !== role.id) });
                                                        }
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        gap: '2rem',
                                        marginBottom: '2rem',
                                        padding: '1.25rem',
                                        backgroundColor: 'var(--color-bg-secondary)',
                                        borderRadius: 'var(--radius-lg)',
                                        border: '1px solid var(--color-border-light)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <Toggle
                                                checked={formData.is_active}
                                                onChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                            />
                                            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Active Account</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <Toggle
                                                checked={formData.is_staff}
                                                onChange={(checked) => setFormData({ ...formData, is_staff: checked })}
                                            />
                                            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Staff Access</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => setShowUserForm(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" loading={saving} iconLeft={editingUser ? Save : Plus}>
                                            {editingUser ? 'Update User' : 'Create User'}
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

export default UserManagement;
