import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import api from '../../services/api';
import './Users.css';
import { useTranslation } from 'react-i18next';

interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
    roles: string[];
}

const UserList: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users/');
            setUsers(response.data.results || response.data);
        } catch (error) {
            // Mock data
            setUsers([
                {
                    id: '1',
                    email: 'admin@school.com',
                    first_name: 'School',
                    last_name: 'Admin',
                    is_active: true,
                    roles: ['ADMIN'],
                },
                {
                    id: '2',
                    email: 'teacher@school.com',
                    first_name: 'John',
                    last_name: 'Teacher',
                    is_active: true,
                    roles: ['TEACHER'],
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(
        (user) =>
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.last_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const { t } = useTranslation();

    if (loading) return <Loading fullScreen text={t('common.loading', 'Loading...')} />;

    return (
        <div className="users-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">{t('users.title', 'User Management')}</h1>
                    <p className="page-subtitle">{t('users.subtitle', 'Manage system users and roles')}</p>
                </div>
                <Button variant="primary">{t('users.add', 'Add User')}</Button>
            </div>

            <Card>
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder={t('users.search_placeholder', 'Search users...')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{t('users.name', 'Name')}</th>
                                <th>{t('users.email', 'Email')}</th>
                                <th>{t('users.roles', 'Roles')}</th>
                                <th>{t('users.status', 'Status')}</th>
                                <th>{t('users.actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <td className="user-name">
                                        {user.first_name} {user.last_name}
                                    </td>
                                    <td>{user.email}</td>
                                    <td>
                                        <div className="role-badges">
                                            {user.roles.map((role) => (
                                                <span key={role} className="role-badge">
                                                    {role}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td>
                                        <span
                                            className={`status-badge status-${user.is_active ? 'active' : 'inactive'
                                                }`}
                                        >
                                            {user.is_active ? t('users.status_active', 'Active') : t('users.status_inactive', 'Inactive')}
                                        </span>
                                    </td>
                                    <td>
                                        <Button size="small" variant="outline">
                                            {t('common.edit', 'Edit')}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default UserList;