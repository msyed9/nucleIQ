import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import './Users.css';

interface Role {
    id: number;
    name: string;
    description: string;
}

interface User {
    id: number;
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
    is_active: boolean;
    is_staff: boolean;
    roles: number[];
}

const UserManagement: React.FC = () => {
    const { t } = useTranslation();
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const [formData, setFormData] = useState<UserFormData>({
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        password: '',
        is_active: true,
        is_staff: false,
        roles: []
    });

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/users/');
            setUsers(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await api.get('/roles/');
            setRoles(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    };

    const handleOpenModal = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                phone: user.phone || '',
                is_active: user.is_active,
                is_staff: user.is_staff,
                roles: user.roles.map(r => r.id)
            });
        } else {
            setEditingUser(null);
            setFormData({
                email: '',
                first_name: '',
                last_name: '',
                phone: '',
                password: '',
                is_active: true,
                is_staff: false,
                roles: []
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingUser(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await api.put(`/users/${editingUser.id}/`, formData);
                alert(t('users.update_success', { defaultValue: 'User updated successfully!' }));
            } else {
                await api.post('/users/', formData);
                alert(t('users.create_success', { defaultValue: 'User created successfully!' }));
            }
            handleCloseModal();
            fetchUsers();
        } catch (error: any) {
            console.error('Error saving user:', error);
            alert(error.response?.data?.detail || t('users.save_error', { defaultValue: 'Failed to save user' }));
        }
    };

    const handleToggleActive = async (user: User) => {
        try {
            await api.patch(`/users/${user.id}/`, { is_active: !user.is_active });
            fetchUsers();
        } catch (error) {
            console.error('Error toggling user status:', error);
        }
    };

    const handleDeleteUser = async (userId: number) => {
        if (!confirm(t('users.confirm_delete', { defaultValue: 'Are you sure you want to delete this user?' }))) {
            return;
        }
        try {
            await api.delete(`/users/${userId}/`);
            alert(t('users.delete_success', { defaultValue: 'User deleted successfully!' }));
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            alert(t('users.delete_error', { defaultValue: 'Failed to delete user' }));
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.last_name.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = !filterRole || user.roles.some(r => r.id.toString() === filterRole);
        const matchesStatus = !filterStatus ||
            (filterStatus === 'active' && user.is_active) ||
            (filterStatus === 'inactive' && !user.is_active);

        return matchesSearch && matchesRole && matchesStatus;
    });

    if (loading) return <Loading fullScreen text={t('common.loading')} />;

    return (
        <div className="users-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">👥 {t('users.management_title', { defaultValue: 'User Management' })}</h1>
                    <p className="page-subtitle">{t('users.management_subtitle', { defaultValue: 'Manage system users and their access' })}</p>
                </div>
                <Button variant="primary" onClick={() => handleOpenModal()}>
                    ➕ {t('users.add_new', { defaultValue: 'Add User' })}
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <div className="filters-row">
                    <input
                        type="text"
                        placeholder={t('users.search_placeholder', { defaultValue: 'Search users...' })}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">{t('users.all_roles', { defaultValue: 'All Roles' })}</option>
                        {roles.map(role => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                    </select>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">{t('users.all_status', { defaultValue: 'All Status' })}</option>
                        <option value="active">{t('common.active')}</option>
                        <option value="inactive">{t('common.inactive')}</option>
                    </select>
                </div>
            </Card>

            {/* Users Table */}
            <Card>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{t('users.name')}</th>
                                <th>{t('users.email')}</th>
                                <th>{t('users.phone', { defaultValue: 'Phone' })}</th>
                                <th>{t('users.roles')}</th>
                                <th>{t('users.status')}</th>
                                <th>{t('users.joined', { defaultValue: 'Joined' })}</th>
                                <th>{t('users.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <td className="user-name">
                                        {user.first_name} {user.last_name}
                                        {user.is_staff && <span className="badge badge-staff">Staff</span>}
                                    </td>
                                    <td>{user.email}</td>
                                    <td>{user.phone || '-'}</td>
                                    <td>
                                        <div className="role-badges">
                                            {user.roles.map((role) => (
                                                <span key={role.id} className="role-badge">
                                                    {role.name}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge status-${user.is_active ? 'active' : 'inactive'}`}>
                                            {user.is_active ? t('users.status_active') : t('users.status_inactive')}
                                        </span>
                                    </td>
                                    <td>{new Date(user.date_joined).toLocaleDateString()}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <Button size="small" variant="outline" onClick={() => handleOpenModal(user)}>
                                                ✏️ {t('common.edit')}
                                            </Button>
                                            <Button
                                                size="small"
                                                variant={user.is_active ? 'danger' : 'success'}
                                                onClick={() => handleToggleActive(user)}
                                            >
                                                {user.is_active ? '🚫' : '✅'} {user.is_active ? t('users.deactivate') : t('users.activate')}
                                            </Button>
                                            <Button size="small" variant="danger" onClick={() => handleDeleteUser(user.id)}>
                                                🗑️
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingUser ? t('users.edit_user') : t('users.add_user')}</h2>
                            <button className="modal-close" onClick={handleCloseModal}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>{t('users.first_name', { defaultValue: 'First Name' })}</label>
                                        <input
                                            type="text"
                                            value={formData.first_name}
                                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>{t('users.last_name', { defaultValue: 'Last Name' })}</label>
                                        <input
                                            type="text"
                                            value={formData.last_name}
                                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>{t('users.email')}</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>{t('users.phone', { defaultValue: 'Phone' })}</label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                                {!editingUser && (
                                    <div className="form-group">
                                        <label>{t('users.password', { defaultValue: 'Password' })}</label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required={!editingUser}
                                        />
                                    </div>
                                )}
                                <div className="form-group">
                                    <label>{t('users.roles')}</label>
                                    <div className="checkbox-group">
                                        {roles.map(role => (
                                            <label key={role.id} className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.roles.includes(role.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFormData({ ...formData, roles: [...formData.roles, role.id] });
                                                        } else {
                                                            setFormData({ ...formData, roles: formData.roles.filter(r => r !== role.id) });
                                                        }
                                                    }}
                                                />
                                                {role.name}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-row">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        />
                                        {t('users.is_active', { defaultValue: 'Active' })}
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_staff}
                                            onChange={(e) => setFormData({ ...formData, is_staff: e.target.checked })}
                                        />
                                        {t('users.is_staff', { defaultValue: 'Staff Access' })}
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <Button type="button" variant="outline" onClick={handleCloseModal}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" variant="primary">
                                    {editingUser ? t('common.update') : t('common.create')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
