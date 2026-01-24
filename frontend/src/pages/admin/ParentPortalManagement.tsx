/**
 * Parent Portal Management Page
 * Admin interface to manage parent accounts, view linked children, and reset credentials
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Input, Badge, PageLayout } from '@/design-system';
import api from '@/services/api';
import './ParentPortalManagement.css';

interface LinkedStudent {
    id: string;
    admission_number: string;
    first_name: string;
    last_name: string;
    grade_level_name?: string;
    section_name?: string;
    photo_url?: string;
}

interface ParentAccount {
    id: string;
    relation_type: 'FATHER' | 'MOTHER' | 'GUARDIAN';
    portal_access_enabled: boolean;
    last_login_at: string | null;
    user_email: string;
    user_phone: string;
    user_name: string;
    students_count: number;
    students: LinkedStudent[];
    occupation?: string;
    preferred_language?: string;
}

interface ResetInfo {
    parent_id: string;
    user_email: string;
    user_phone: string;
    user_name: string;
    password: string;
}

type FilterType = 'all' | 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'active' | 'inactive' | 'never_logged_in';

const ParentPortalManagement: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [items, setItems] = useState<ParentAccount[]>([]);
    const [resetInfo, setResetInfo] = useState<ResetInfo | null>(null);
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [expandedParent, setExpandedParent] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/students/parent-credentials/');
            // Handle both paginated and non-paginated responses
            const data = response.data;
            if (Array.isArray(data)) {
                setItems(data);
            } else if (data && Array.isArray(data.results)) {
                // Paginated response format: { count, next, previous, results }
                setItems(data.results);
            } else {
                setItems([]);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load parent accounts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Clear messages after 5 seconds
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const filteredItems = useMemo(() => {
        let filtered = items;

        // Apply type/status filter
        switch (filterType) {
            case 'FATHER':
            case 'MOTHER':
            case 'GUARDIAN':
                filtered = filtered.filter(item => item.relation_type === filterType);
                break;
            case 'active':
                filtered = filtered.filter(item => item.portal_access_enabled);
                break;
            case 'inactive':
                filtered = filtered.filter(item => !item.portal_access_enabled);
                break;
            case 'never_logged_in':
                filtered = filtered.filter(item => !item.last_login_at);
                break;
        }

        // Apply search
        const term = search.trim().toLowerCase();
        if (term) {
            filtered = filtered.filter((item) => {
                const studentNames = item.students?.map(s => `${s.first_name} ${s.last_name}`.toLowerCase()).join(' ') || '';
                const admissionNumbers = item.students?.map(s => s.admission_number?.toLowerCase()).join(' ') || '';

                return [
                    item.user_name,
                    item.user_email,
                    item.user_phone,
                    item.relation_type,
                    studentNames,
                    admissionNumbers
                ].some((value) => (value || '').toLowerCase().includes(term));
            });
        }

        return filtered;
    }, [items, search, filterType]);

    const resetPassword = async (id: string) => {
        if (!confirm('Reset password for this parent account? A new temporary password will be generated.')) {
            return;
        }

        try {
            setProcessingId(id);
            setError(null);
            const response = await api.post(`/students/parent-credentials/${id}/reset-password/`);
            setResetInfo(response.data);
            setSuccessMessage('Password reset successfully!');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to reset password');
        } finally {
            setProcessingId(null);
        }
    };

    const togglePortalAccess = async (parent: ParentAccount) => {
        const action = parent.portal_access_enabled ? 'disable' : 'enable';
        if (!confirm(`Are you sure you want to ${action} portal access for ${parent.user_name}?`)) {
            return;
        }

        try {
            setProcessingId(parent.id);
            setError(null);
            await api.patch(`/students/parent-credentials/${parent.id}/toggle-access/`, {
                portal_access_enabled: !parent.portal_access_enabled
            });

            // Update local state
            setItems(prev => prev.map(item =>
                item.id === parent.id
                    ? { ...item, portal_access_enabled: !item.portal_access_enabled }
                    : item
            ));
            setSuccessMessage(`Portal access ${action}d successfully for ${parent.user_name}`);
        } catch (err: any) {
            setError(err.response?.data?.error || `Failed to ${action} portal access`);
        } finally {
            setProcessingId(null);
        }
    };

    const getRelationBadgeVariant = (type: string): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral' => {
        switch (type) {
            case 'FATHER': return 'primary';
            case 'MOTHER': return 'secondary';
            case 'GUARDIAN': return 'warning';
            default: return 'neutral';
        }
    };

    const formatLastLogin = (dateStr: string | null): string => {
        if (!dateStr) return 'Never';
        const date = new Date(dateStr);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return date.toLocaleDateString();
    };

    // Statistics
    const stats = useMemo(() => ({
        total: items.length,
        fathers: items.filter(i => i.relation_type === 'FATHER').length,
        mothers: items.filter(i => i.relation_type === 'MOTHER').length,
        guardians: items.filter(i => i.relation_type === 'GUARDIAN').length,
        active: items.filter(i => i.portal_access_enabled).length,
        inactive: items.filter(i => !i.portal_access_enabled).length,
        neverLoggedIn: items.filter(i => !i.last_login_at).length,
        totalChildren: items.reduce((sum, i) => sum + i.students_count, 0)
    }), [items]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setSuccessMessage('Copied to clipboard!');
    };

    return (
        <PageLayout
            title="Parent Portal Management"
            subtitle="Manage parent accounts, view linked children, and reset login credentials"
            actions={
                <Button variant="outline" onClick={loadData} disabled={loading}>
                    {loading ? 'Refreshing...' : 'Refresh'}
                </Button>
            }
        >
            {/* Statistics Cards */}
            <div className="ppm-stats-grid">
                <div className="ppm-stat-card" onClick={() => setFilterType('all')}>
                    <div className="ppm-stat-icon total">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                    <div className="ppm-stat-content">
                        <span className="ppm-stat-value">{stats.total}</span>
                        <span className="ppm-stat-label">Total Parents</span>
                    </div>
                </div>

                <div className="ppm-stat-card" onClick={() => setFilterType('active')}>
                    <div className="ppm-stat-icon active">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>
                    <div className="ppm-stat-content">
                        <span className="ppm-stat-value">{stats.active}</span>
                        <span className="ppm-stat-label">Active Accounts</span>
                    </div>
                </div>

                <div className="ppm-stat-card" onClick={() => setFilterType('never_logged_in')}>
                    <div className="ppm-stat-icon warning">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                    <div className="ppm-stat-content">
                        <span className="ppm-stat-value">{stats.neverLoggedIn}</span>
                        <span className="ppm-stat-label">Never Logged In</span>
                    </div>
                </div>

                <div className="ppm-stat-card">
                    <div className="ppm-stat-icon children">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                            <path d="M12 2a10 10 0 0 1 10 10" />
                        </svg>
                    </div>
                    <div className="ppm-stat-content">
                        <span className="ppm-stat-value">{stats.totalChildren}</span>
                        <span className="ppm-stat-label">Linked Children</span>
                    </div>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="ppm-alert ppm-alert-error">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <span>{error}</span>
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            {successMessage && (
                <div className="ppm-alert ppm-alert-success">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span>{successMessage}</span>
                    <button onClick={() => setSuccessMessage(null)}>×</button>
                </div>
            )}

            {/* Password Reset Banner */}
            {resetInfo && (
                <Card className="ppm-reset-info-card">
                    <div className="ppm-reset-header">
                        <h4>New Password Generated</h4>
                        <button onClick={() => setResetInfo(null)} className="ppm-close-btn">×</button>
                    </div>
                    <div className="ppm-reset-grid">
                        <div className="ppm-reset-item">
                            <label>Name</label>
                            <span>{resetInfo.user_name}</span>
                        </div>
                        <div className="ppm-reset-item">
                            <label>Email</label>
                            <span>{resetInfo.user_email}</span>
                        </div>
                        <div className="ppm-reset-item">
                            <label>Phone (Username)</label>
                            <span>{resetInfo.user_phone}</span>
                        </div>
                        <div className="ppm-reset-item password">
                            <label>Temporary Password</label>
                            <div className="ppm-password-display">
                                <code>{resetInfo.password}</code>
                                <button
                                    onClick={() => copyToClipboard(resetInfo.password)}
                                    className="ppm-copy-btn"
                                    title="Copy to clipboard"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                    <p className="ppm-reset-note">
                        Please share these credentials with the parent. They should change their password after first login.
                    </p>
                </Card>
            )}

            {/* Filter & Search */}
            <Card className="ppm-filter-card">
                <div className="ppm-filter-row">
                    <div className="ppm-search-wrapper">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        <Input
                            placeholder="Search by name, phone, email, or student..."
                            value={search}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                            className="ppm-search-input"
                        />
                    </div>

                    <div className="ppm-filter-buttons">
                        <button
                            className={`ppm-filter-btn ${filterType === 'all' ? 'active' : ''}`}
                            onClick={() => setFilterType('all')}
                        >
                            All ({stats.total})
                        </button>
                        <button
                            className={`ppm-filter-btn ${filterType === 'FATHER' ? 'active' : ''}`}
                            onClick={() => setFilterType('FATHER')}
                        >
                            Fathers ({stats.fathers})
                        </button>
                        <button
                            className={`ppm-filter-btn ${filterType === 'MOTHER' ? 'active' : ''}`}
                            onClick={() => setFilterType('MOTHER')}
                        >
                            Mothers ({stats.mothers})
                        </button>
                        <button
                            className={`ppm-filter-btn ${filterType === 'GUARDIAN' ? 'active' : ''}`}
                            onClick={() => setFilterType('GUARDIAN')}
                        >
                            Guardians ({stats.guardians})
                        </button>
                    </div>
                </div>
            </Card>

            {/* Parents List */}
            <div className="ppm-parents-list">
                {loading && items.length === 0 ? (
                    <Card className="ppm-loading-card">
                        <div className="ppm-loading-spinner" />
                        <p>Loading parent accounts...</p>
                    </Card>
                ) : filteredItems.length === 0 ? (
                    <Card className="ppm-empty-card">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                        </svg>
                        <h3>No parent accounts found</h3>
                        <p>
                            {search || filterType !== 'all'
                                ? 'Try adjusting your search or filter criteria'
                                : 'Parent accounts will appear here when students are registered with parent login enabled'
                            }
                        </p>
                    </Card>
                ) : (
                    filteredItems.map((parent) => (
                        <Card
                            key={parent.id}
                            className={`ppm-parent-card ${expandedParent === parent.id ? 'expanded' : ''}`}
                        >
                            <div className="ppm-parent-header" onClick={() => setExpandedParent(
                                expandedParent === parent.id ? null : parent.id
                            )}>
                                <div className="ppm-parent-avatar">
                                    {parent.user_name?.charAt(0)?.toUpperCase() || 'P'}
                                </div>

                                <div className="ppm-parent-info">
                                    <div className="ppm-parent-name-row">
                                        <h3>{parent.user_name || 'Parent'}</h3>
                                        <Badge variant={getRelationBadgeVariant(parent.relation_type)}>
                                            {parent.relation_type}
                                        </Badge>
                                        <Badge variant={parent.portal_access_enabled ? 'success' : 'error'}>
                                            {parent.portal_access_enabled ? 'Active' : 'Disabled'}
                                        </Badge>
                                    </div>
                                    <div className="ppm-parent-contact">
                                        {parent.user_phone && (
                                            <span className="ppm-contact-item">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72" />
                                                </svg>
                                                {parent.user_phone}
                                            </span>
                                        )}
                                        {parent.user_email && (
                                            <span className="ppm-contact-item">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                                    <polyline points="22,6 12,13 2,6" />
                                                </svg>
                                                {parent.user_email}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="ppm-parent-meta">
                                    <div className="ppm-meta-item">
                                        <span className="ppm-meta-label">Children</span>
                                        <span className="ppm-meta-value">{parent.students_count}</span>
                                    </div>
                                    <div className="ppm-meta-item">
                                        <span className="ppm-meta-label">Last Login</span>
                                        <span className="ppm-meta-value">{formatLastLogin(parent.last_login_at)}</span>
                                    </div>
                                </div>

                                <div className="ppm-expand-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points={expandedParent === parent.id ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
                                    </svg>
                                </div>
                            </div>

                            {expandedParent === parent.id && (
                                <div className="ppm-parent-details">
                                    <div className="ppm-children-section">
                                        <h4>Linked Children</h4>
                                        <div className="ppm-children-grid">
                                            {parent.students?.map((student) => (
                                                <div key={student.id} className="ppm-child-card">
                                                    <div className="ppm-child-avatar">
                                                        {student.photo_url ? (
                                                            <img src={student.photo_url} alt={`${student.first_name}'s photo`} />
                                                        ) : (
                                                            <span>{student.first_name?.charAt(0)?.toUpperCase()}</span>
                                                        )}
                                                    </div>
                                                    <div className="ppm-child-info">
                                                        <strong>{student.first_name} {student.last_name}</strong>
                                                        <span className="ppm-admission-no">{student.admission_number}</span>
                                                        {(student.grade_level_name || student.section_name) && (
                                                            <span className="ppm-class-info">
                                                                {student.grade_level_name} {student.section_name && `- ${student.section_name}`}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="ppm-actions-section">
                                        <h4>Actions</h4>
                                        <div className="ppm-actions-grid">
                                            <Button
                                                variant="outline"
                                                onClick={() => resetPassword(parent.id)}
                                                disabled={processingId === parent.id}
                                                className="ppm-action-btn"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                </svg>
                                                {processingId === parent.id ? 'Resetting...' : 'Reset Password'}
                                            </Button>

                                            <Button
                                                variant={parent.portal_access_enabled ? 'danger' : 'primary'}
                                                onClick={() => togglePortalAccess(parent)}
                                                disabled={processingId === parent.id}
                                                className="ppm-action-btn"
                                            >
                                                {parent.portal_access_enabled ? (
                                                    <>
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                                        </svg>
                                                        Disable Access
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                            <polyline points="22 4 12 14.01 9 11.01" />
                                                        </svg>
                                                        Enable Access
                                                    </>
                                                )}
                                            </Button>

                                            <Button
                                                variant="secondary"
                                                onClick={() => copyToClipboard(`Username: ${parent.user_phone}\nEmail: ${parent.user_email}`)}
                                                className="ppm-action-btn"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                </svg>
                                                Copy Credentials
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))
                )}
            </div>
        </PageLayout>
    );
};

export default ParentPortalManagement;
