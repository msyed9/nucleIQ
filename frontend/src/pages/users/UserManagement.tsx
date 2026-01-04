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
import { Card, Button, useToast, ToastContainer } from '@/design-system';

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
    phone?: string;
    date_joined: string;
}

interface UserFormData {
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
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
        phone: '',
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
                api.get('/users/roles/')
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
                phone: '',
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
            phone: user.phone || '',
            is_active: user.is_active,
            is_staff: user.is_staff,
            role_ids: user.roles.map(r => r.id)
        });
        setShowUserForm(true);
    };

    const filteredUsers = users.filter(user => {
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
                        <Users size={32} />
                        User Management
                    </h1>
                    <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                        Manage system users and assign roles
                    </p>
                </div>

                {/* Filters */}
                <Card style={{ marginBottom: '2rem' }}>
                    <div style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 200px auto', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={20} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 0.75rem 0.75rem 2.75rem',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '8px',
                                        fontSize: '0.875rem'
                                    }}
                                />
                            </div>
                            <select
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                                style={{
                                    padding: '0.75rem',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '8px',
                                    fontSize: '0.875rem'
                                }}
                            >
                                <option value="">All Roles</option>
                                {roles.map(role => (
                                    <option key={role.id} value={role.id}>{role.name}</option>
                                ))}
                            </select>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                style={{
                                    padding: '0.75rem',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '8px',
                                    fontSize: '0.875rem'
                                }}
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                            <Button
                                onClick={() => {
                                    setEditingUser(null);
                                    setFormData({
                                        email: '',
                                        first_name: '',
                                        last_name: '',
                                        phone: '',
                                        password: '',
                                        password_confirm: '',
                                        is_active: true,
                                        is_staff: false,
                                        role_ids: []
                                    });
                                    setShowUserForm(true);
                                }}
                            >
                                <Plus size={16} /> Add User
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
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                                <div style={{ flex: 1 }}>
                                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        {user.first_name} {user.last_name}
                                                        {user.is_staff && (
                                                            <span style={{
                                                                fontSize: '0.625rem',
                                                                padding: '0.125rem 0.5rem',
                                                                backgroundColor: 'var(--color-warning)',
                                                                color: 'white',
                                                                borderRadius: '4px',
                                                                fontWeight: 500
                                                            }}>
                                                                STAFF
                                                            </span>
                                                        )}
                                                    </h3>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                                                        <Mail size={12} />
                                                        {user.email}
                                                    </div>
                                                    {user.phone && (
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                                                            <Phone size={12} />
                                                            {user.phone}
                                                        </div>
                                                    )}
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <Calendar size={12} />
                                                        Joined {new Date(user.date_joined).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '12px',
                                                    backgroundColor: user.is_active ? 'var(--color-success-light)' : 'var(--color-danger-light)',
                                                    color: user.is_active ? 'var(--color-success)' : 'var(--color-danger)',
                                                    fontWeight: 500
                                                }}>
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.75rem' }}>
                                                {user.roles.map(role => (
                                                    <span
                                                        key={role.id}
                                                        style={{
                                                            fontSize: '0.75rem',
                                                            padding: '0.25rem 0.5rem',
                                                            backgroundColor: 'var(--color-primary-light)',
                                                            color: 'var(--color-primary)',
                                                            borderRadius: '4px',
                                                            fontWeight: 500
                                                        }}
                                                    >
                                                        {role.name}
                                                    </span>
                                                ))}
                                            </div>

                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEditUser(user);
                                                    }}
                                                    style={{
                                                        flex: 1,
                                                        padding: '0.5rem',
                                                        fontSize: '0.75rem',
                                                        border: '1px solid var(--color-border)',
                                                        borderRadius: '6px',
                                                        backgroundColor: 'white',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '0.25rem'
                                                    }}
                                                >
                                                    <Edit size={14} /> Edit
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleActive(user);
                                                    }}
                                                    style={{
                                                        flex: 1,
                                                        padding: '0.5rem',
                                                        fontSize: '0.75rem',
                                                        border: '1px solid var(--color-border)',
                                                        borderRadius: '6px',
                                                        backgroundColor: user.is_active ? 'var(--color-danger-light)' : 'var(--color-success-light)',
                                                        color: user.is_active ? 'var(--color-danger)' : 'var(--color-success)',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '0.25rem'
                                                    }}
                                                >
                                                    {user.is_active ? <><UserX size={14} /> Deactivate</> : <><UserCheck size={14} /> Activate</>}
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteUser(user.id);
                                                    }}
                                                    style={{
                                                        padding: '0.5rem',
                                                        border: '1px solid var(--color-danger)',
                                                        borderRadius: '6px',
                                                        backgroundColor: 'transparent',
                                                        color: 'var(--color-danger)',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
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
                                                <label
                                                    key={role.id}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'start',
                                                        gap: '0.75rem',
                                                        padding: '1rem',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        backgroundColor: selectedRoles.has(role.id) ? 'var(--color-primary-light)' : 'transparent',
                                                        border: '1px solid ' + (selectedRoles.has(role.id) ? 'var(--color-primary)' : 'var(--color-border)'),
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedRoles.has(role.id)}
                                                        onChange={() => handleToggleRole(role.id)}
                                                        style={{ marginTop: '0.25rem', width: '18px', height: '18px', cursor: 'pointer' }}
                                                    />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <Shield size={16} />
                                                            {role.name}
                                                        </div>
                                                        {role.description && (
                                                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                                                {role.description}
                                                            </div>
                                                        )}
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                                                            {role.code}
                                                        </div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button
                                            onClick={handleSaveUserRoles}
                                            disabled={saving}
                                        >
                                            {saving ? 'Saving...' : <><Save size={16} /> Save Roles</>}
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
                        <Card style={{ maxWidth: '600px', width: '100%', margin: '1rem', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ padding: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                                    {editingUser ? 'Edit User' : 'Create New User'}
                                </h2>

                                <form onSubmit={handleCreateOrUpdateUser}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
                                                First Name *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.first_name}
                                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    border: '1px solid var(--color-border)',
                                                    borderRadius: '6px'
                                                }}
                                                placeholder="John"
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
                                                Last Name *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.last_name}
                                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    border: '1px solid var(--color-border)',
                                                    borderRadius: '6px'
                                                }}
                                                placeholder="Doe"
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
                                                Email *
                                            </label>
                                            <input
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    border: '1px solid var(--color-border)',
                                                    borderRadius: '6px'
                                                }}
                                                placeholder="john.doe@example.com"
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
                                                Phone
                                            </label>
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    border: '1px solid var(--color-border)',
                                                    borderRadius: '6px'
                                                }}
                                                placeholder="+1234567890"
                                            />
                                        </div>
                                    </div>

                                    {!editingUser && (
                                        <>
                                            <div style={{ marginBottom: '1rem' }}>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
                                                    Password *
                                                </label>
                                                <input
                                                    type="password"
                                                    required={!editingUser}
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.75rem',
                                                        border: '1px solid var(--color-border)',
                                                        borderRadius: '6px'
                                                    }}
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                            <div style={{ marginBottom: '1rem' }}>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
                                                    Confirm Password *
                                                </label>
                                                <input
                                                    type="password"
                                                    required={!editingUser}
                                                    value={formData.password_confirm}
                                                    onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.75rem',
                                                        border: '1px solid var(--color-border)',
                                                        borderRadius: '6px'
                                                    }}
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 500, fontSize: '0.875rem' }}>
                                            Roles
                                        </label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '6px' }}>
                                            {roles.map(role => (
                                                <label key={role.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '4px', backgroundColor: formData.role_ids.includes(role.id) ? 'var(--color-primary-light)' : 'transparent' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.role_ids.includes(role.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setFormData({ ...formData, role_ids: [...formData.role_ids, role.id] });
                                                            } else {
                                                                setFormData({ ...formData, role_ids: formData.role_ids.filter(r => r !== role.id) });
                                                            }
                                                        }}
                                                        style={{ width: '16px', height: '16px' }}
                                                    />
                                                    <span style={{ fontSize: '0.875rem' }}>{role.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--color-background-secondary)', borderRadius: '8px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.is_active}
                                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                                style={{ width: '18px', height: '18px' }}
                                            />
                                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Active</span>
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.is_staff}
                                                onChange={(e) => setFormData({ ...formData, is_staff: e.target.checked })}
                                                style={{ width: '18px', height: '18px' }}
                                            />
                                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Staff Access</span>
                                        </label>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => {
                                                setShowUserForm(false);
                                                setEditingUser(null);
                                                setFormData({
                                                    email: '',
                                                    first_name: '',
                                                    last_name: '',
                                                    phone: '',
                                                    password: '',
                                                    is_active: true,
                                                    is_staff: false,
                                                    role_ids: []
                                                });
                                            }}
                                        >
                                            <X size={16} /> Cancel
                                        </Button>
                                        <Button type="submit" disabled={saving}>
                                            {saving ? 'Saving...' : <><Check size={16} /> {editingUser ? 'Update' : 'Create'}</>}
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

export default UserManagement;
