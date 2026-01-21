import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Input, Badge } from '@/design-system';
import api from '@/services/api';

interface ParentCredential {
    id: string;
    relation_type: 'FATHER' | 'MOTHER' | 'GUARDIAN';
    portal_access_enabled: boolean;
    last_login_at: string | null;
    user_email: string;
    user_phone: string;
    user_name: string;
    students_count: number;
    students: Array<{
        id: string;
        admission_number: string;
        first_name: string;
        last_name: string;
    }>;
}

interface ResetInfo {
    parent_id: string;
    user_email: string;
    user_phone: string;
    user_name: string;
    password: string;
}

const ParentCredentials: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [items, setItems] = useState<ParentCredential[]>([]);
    const [resetInfo, setResetInfo] = useState<ResetInfo | null>(null);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/students/parent-credentials/');
            setItems(response.data || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load parent credentials');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredItems = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return items;
        return items.filter((item) => {
            return [
                item.user_name,
                item.user_email,
                item.user_phone,
                item.relation_type
            ].some((value) => (value || '').toLowerCase().includes(term));
        });
    }, [items, search]);

    const resetPassword = async (id: string) => {
        if (!confirm('Reset password for this parent account?')) {
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const response = await api.post(`/students/parent-credentials/${id}/reset-password/`);
            setResetInfo(response.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                    <h2 style={{ fontSize: '22px', fontWeight: 600 }}>Parent Credentials</h2>
                    <p style={{ color: '#6b7280' }}>View parent login details and reset passwords</p>
                </div>
                <Button variant="outline" onClick={loadData} disabled={loading}>
                    Refresh
                </Button>
            </div>

            {error && (
                <div className="error-banner" style={{ marginBottom: '16px' }}>
                    {error}
                </div>
            )}

            {resetInfo && (
                <Card style={{ marginBottom: '16px', padding: '16px' }}>
                    <h4 style={{ marginBottom: '8px' }}>New Password Generated</h4>
                    <div style={{ display: 'grid', gap: '4px' }}>
                        <div><strong>Name:</strong> {resetInfo.user_name}</div>
                        <div><strong>Email:</strong> {resetInfo.user_email}</div>
                        <div><strong>Phone:</strong> {resetInfo.user_phone}</div>
                        <div><strong>Temporary Password:</strong> {resetInfo.password}</div>
                    </div>
                </Card>
            )}

            <Card style={{ padding: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <Input
                        placeholder="Search by name, email, phone, relation"
                        value={search}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                    />
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                                <th style={{ padding: '8px' }}>Name</th>
                                <th style={{ padding: '8px' }}>Relation</th>
                                <th style={{ padding: '8px' }}>Phone</th>
                                <th style={{ padding: '8px' }}>Email</th>
                                <th style={{ padding: '8px' }}>Students</th>
                                <th style={{ padding: '8px' }}>Linked Children</th>
                                <th style={{ padding: '8px' }}>Last Login</th>
                                <th style={{ padding: '8px' }}>Status</th>
                                <th style={{ padding: '8px' }} />
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((item) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '8px' }}>{item.user_name || 'Parent'}</td>
                                    <td style={{ padding: '8px' }}>{item.relation_type}</td>
                                    <td style={{ padding: '8px' }}>{item.user_phone || '-'}</td>
                                    <td style={{ padding: '8px' }}>{item.user_email || '-'}</td>
                                    <td style={{ padding: '8px' }}>{item.students_count}</td>
                                    <td style={{ padding: '8px' }}>
                                        {item.students?.length ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                {item.students.map((student) => (
                                                    <div key={student.id}>
                                                        {student.first_name} {student.last_name}
                                                        {student.admission_number ? ` (${student.admission_number})` : ''}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                    <td style={{ padding: '8px' }}>{item.last_login_at ? new Date(item.last_login_at).toLocaleString() : '-'}</td>
                                    <td style={{ padding: '8px' }}>
                                        <Badge variant={item.portal_access_enabled ? 'success' : 'neutral'}>
                                            {item.portal_access_enabled ? 'Enabled' : 'Disabled'}
                                        </Badge>
                                    </td>
                                    <td style={{ padding: '8px' }}>
                                        <Button
                                            variant="outline"
                                            onClick={() => resetPassword(item.id)}
                                            disabled={loading}
                                        >
                                            Reset Password
                                        </Button>
                                    </td>
                                </tr>
                            ))}

                            {filteredItems.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={9} style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>
                                        No parent credentials found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default ParentCredentials;