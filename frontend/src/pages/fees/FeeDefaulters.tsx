import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import './FeeDefaulters.css';

interface Student {
    id: string;
    first_name: string;
    last_name: string;
    roll_number: string;
    email: string;
    phone: string;
    photo?: string;
    grade_level?: string;
    section?: string;
}

interface Defaulter {
    id: string;
    student: string;
    student_details?: Student;
    total_due: number;
    overdue_days: number;
    access_stopped: boolean;
    stop_access_date: string | null;
    last_reminder_sent: string | null;
    reminder_count: number;
    created_at: string;
    updated_at: string;
}

const FeeDefaulters: React.FC = () => {
    const [filter, setFilter] = useState<'all' | 'active' | 'stopped'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [notificationType, setNotificationType] = useState<'sms' | 'whatsapp' | 'both'>('both');
    const [selectedDefaulters, setSelectedDefaulters] = useState<string[]>([]);
    const [showBulkDialog, setShowBulkDialog] = useState(false);
    const queryClient = useQueryClient();

    // Fetch defaulters
    const { data: defaulters, isLoading } = useQuery<Defaulter[]>({
        queryKey: ['defaulters', filter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filter === 'stopped') {
                params.append('access_stopped', 'true');
            } else if (filter === 'active') {
                params.append('access_stopped', 'false');
            }
            const response = await axios.get(`/api/fees/defaulters/?${params.toString()}`);

            // Fetch student details for each defaulter
            const defaultersWithDetails = await Promise.all(
                response.data.map(async (defaulter: Defaulter) => {
                    try {
                        const studentResponse = await axios.get(`/api/students/students/${defaulter.student}/`);
                        return {
                            ...defaulter,
                            student_details: studentResponse.data
                        };
                    } catch (error) {
                        return defaulter;
                    }
                })
            );

            return defaultersWithDetails;
        }
    });

    // Update defaulters mutation
    const updateDefaultersMutation = useMutation({
        mutationFn: async () => {
            const response = await axios.post('/api/fees/defaulters/update_all/');
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['defaulters'] });
            alert('Defaulters list updated successfully!');
        },
        onError: () => {
            alert('Failed to update defaulters list');
        }
    });

    // Send reminder mutation
    const sendReminderMutation = useMutation({
        mutationFn: async ({ defaulterId, notificationType }: { defaulterId: string, notificationType: string }) => {
            const response = await axios.post(`/api/fees/defaulters/${defaulterId}/send_reminder/`, {
                notification_type: notificationType
            });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['defaulters'] });
            const results = (data as any).results || {};
            const messages: string[] = [];
            if (results.sms === 'sent') messages.push('SMS sent');
            if (results.whatsapp === 'sent') messages.push('WhatsApp sent');
            if (data.errors && data.errors.length > 0) {
                alert(`Reminder sent with warnings:\n${messages.join(', ')}\n\nWarnings:\n${data.errors.join('\n')}`);
            } else {
                alert(`Reminder sent successfully!\n${messages.join(', ')}`);
            }
        },
        onError: (error: any) => {
            alert(`Failed to send reminder: ${error.response?.data?.error || error.message}`);
        }
    });

    // Send bulk reminders mutation
    const sendBulkRemindersMutation = useMutation({
        mutationFn: async ({ defaulterIds, notificationType }: { defaulterIds: string[], notificationType: string }) => {
            const response = await axios.post('/api/fees/defaulters/send_bulk_reminders/', {
                defaulter_ids: defaulterIds.length > 0 ? defaulterIds : undefined,
                notification_type: notificationType
            });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['defaulters'] });
            setShowBulkDialog(false);
            setSelectedDefaulters([]);

            const message = `${data.message}\n\nSuccess: ${data.success_count}\nFailed: ${data.failed_count}`;
            const errors = data.errors && data.errors.length > 0 ? `\n\nSample Errors:\n${data.errors.join('\n')}` : '';
            alert(message + errors);
        },
        onError: (error: any) => {
            alert(`Failed to send bulk reminders: ${error.response?.data?.error || error.message}`);
        }
    });

    // Filter defaulters by search term
    const filteredDefaulters = defaulters?.filter((defaulter) => {
        if (!searchTerm) return true;
        const student = defaulter.student_details;
        if (!student) return false;

        const searchLower = searchTerm.toLowerCase();
        return (
            student.first_name.toLowerCase().includes(searchLower) ||
            student.last_name.toLowerCase().includes(searchLower) ||
            student.roll_number.toLowerCase().includes(searchLower) ||
            student.email?.toLowerCase().includes(searchLower) ||
            student.phone?.toLowerCase().includes(searchLower)
        );
    });

    // Calculate statistics
    const stats = {
        total: defaulters?.length || 0,
        active: defaulters?.filter(d => !d.access_stopped).length || 0,
        stopped: defaulters?.filter(d => d.access_stopped).length || 0,
        totalDue: defaulters?.reduce((sum, d) => sum + parseFloat(d.total_due.toString()), 0) || 0
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getDaysColor = (days: number) => {
        if (days < 30) return 'warning';
        if (days < 60) return 'danger';
        return 'critical';
    };

    return (
        <div className="defaulters-container">
            <div className="page-header">
                <div className="header-content">
                    <h1>💰 Fee Defaulters</h1>
                    <p>Track and manage students with pending fee payments</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => updateDefaultersMutation.mutate()}
                    disabled={updateDefaultersMutation.isPending}
                >
                    {updateDefaultersMutation.isPending ? '🔄 Updating...' : '🔄 Update List'}
                </button>
            </div>

            {/* Statistics Cards */}
            <div className="stats-grid">
                <div className="stat-card total">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">Total Defaulters</div>
                    </div>
                </div>

                <div className="stat-card active">
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.active}</div>
                        <div className="stat-label">Active Access</div>
                    </div>
                </div>

                <div className="stat-card stopped">
                    <div className="stat-icon">🚫</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.stopped}</div>
                        <div className="stat-label">Access Stopped</div>
                    </div>
                </div>

                <div className="stat-card amount">
                    <div className="stat-icon">💵</div>
                    <div className="stat-content">
                        <div className="stat-value">{formatCurrency(stats.totalDue)}</div>
                        <div className="stat-label">Total Outstanding</div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="controls-section">
                <div className="filter-tabs">
                    <button
                        className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All ({stats.total})
                    </button>
                    <button
                        className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
                        onClick={() => setFilter('active')}
                    >
                        Active ({stats.active})
                    </button>
                    <button
                        className={`filter-tab ${filter === 'stopped' ? 'active' : ''}`}
                        onClick={() => setFilter('stopped')}
                    >
                        Stopped ({stats.stopped})
                    </button>
                </div>

                <div className="search-box">
                    <input
                        type="text"
                        placeholder="🔍 Search by name, roll number, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            {/* Notification Controls */}
            <div className="notification-controls">
                <div className="notification-type-selector">
                    <label>📱 Send Via:</label>
                    <div className="radio-group">
                        <label className="radio-label">
                            <input
                                type="radio"
                                name="notificationType"
                                value="sms"
                                checked={notificationType === 'sms'}
                                onChange={(e) => setNotificationType(e.target.value as 'sms' | 'whatsapp' | 'both')}
                            />
                            <span>SMS Only</span>
                        </label>
                        <label className="radio-label">
                            <input
                                type="radio"
                                name="notificationType"
                                value="whatsapp"
                                checked={notificationType === 'whatsapp'}
                                onChange={(e) => setNotificationType(e.target.value as 'sms' | 'whatsapp' | 'both')}
                            />
                            <span>WhatsApp Only</span>
                        </label>
                        <label className="radio-label">
                            <input
                                type="radio"
                                name="notificationType"
                                value="both"
                                checked={notificationType === 'both'}
                                onChange={(e) => setNotificationType(e.target.value as 'sms' | 'whatsapp' | 'both')}
                            />
                            <span>Both (SMS + WhatsApp)</span>
                        </label>
                    </div>
                </div>

                <div className="bulk-actions">
                    <button
                        className="btn btn-bulk-send"
                        onClick={() => setShowBulkDialog(true)}
                        disabled={sendBulkRemindersMutation.isPending}
                    >
                        {sendBulkRemindersMutation.isPending ? '📤 Sending...' : '📤 Send Bulk Reminders'}
                    </button>
                    {selectedDefaulters.length > 0 && (
                        <span className="selection-count">
                            {selectedDefaulters.length} selected
                        </span>
                    )}
                </div>
            </div>

            {/* Bulk Send Confirmation Dialog */}
            {showBulkDialog && (
                <div className="modal-overlay" onClick={() => setShowBulkDialog(false)}>
                    <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>📤 Send Bulk Reminders</h2>
                            <button className="close-btn" onClick={() => setShowBulkDialog(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p>
                                {selectedDefaulters.length > 0
                                    ? `Send reminders to ${selectedDefaulters.length} selected defaulters?`
                                    : `Send reminders to all ${filteredDefaulters?.length || 0} defaulters?`}
                            </p>
                            <p className="notification-info">
                                Notification type: <strong>{notificationType.toUpperCase()}</strong>
                            </p>
                            <div className="warning-message">
                                ⚠️ This action will send notifications immediately and cannot be undone.
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowBulkDialog(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    sendBulkRemindersMutation.mutate({
                                        defaulterIds: selectedDefaulters,
                                        notificationType
                                    });
                                }}
                                disabled={sendBulkRemindersMutation.isPending}
                            >
                                {sendBulkRemindersMutation.isPending ? 'Sending...' : 'Send Reminders'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Defaulters Table */}
            {isLoading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading defaulters...</p>
                </div>
            ) : filteredDefaulters && filteredDefaulters.length > 0 ? (
                <div className="defaulters-card">
                    <div className="table-container">
                        <table className="defaulters-table">
                            <thead>
                                <tr>
                                    <th>
                                        <input
                                            type="checkbox"
                                            checked={selectedDefaulters.length === filteredDefaulters.length}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedDefaulters(filteredDefaulters.map(d => d.id));
                                                } else {
                                                    setSelectedDefaulters([]);
                                                }
                                            }}
                                        />
                                    </th>
                                    <th>Student</th>
                                    <th>Contact</th>
                                    <th>Amount Due</th>
                                    <th>Overdue Days</th>
                                    <th>Last Reminder</th>
                                    <th>Reminders</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDefaulters.map((defaulter) => {
                                    const student = defaulter.student_details;
                                    if (!student) return null;

                                    return (
                                        <tr key={defaulter.id} className={defaulter.access_stopped ? 'stopped-row' : ''}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDefaulters.includes(defaulter.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedDefaulters([...selectedDefaulters, defaulter.id]);
                                                        } else {
                                                            setSelectedDefaulters(selectedDefaulters.filter(id => id !== defaulter.id));
                                                        }
                                                    }}
                                                />
                                            </td>
                                            <td>
                                                <div className="student-info">
                                                    {student.photo && (
                                                        <img
                                                            src={student.photo}
                                                            alt={`${student.first_name} ${student.last_name}`}
                                                            className="student-photo"
                                                        />
                                                    )}
                                                    <div className="student-details">
                                                        <div className="student-name">
                                                            {student.first_name} {student.last_name}
                                                        </div>
                                                        <div className="student-roll">
                                                            Roll: {student.roll_number}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="contact-info">
                                                    {student.email && (
                                                        <div className="contact-item">
                                                            📧 {student.email}
                                                        </div>
                                                    )}
                                                    {student.phone && (
                                                        <div className="contact-item">
                                                            📱 {student.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="amount-due">
                                                    {formatCurrency(parseFloat(defaulter.total_due.toString()))}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`days-badge ${getDaysColor(defaulter.overdue_days)}`}>
                                                    {defaulter.overdue_days} days
                                                </span>
                                            </td>
                                            <td>
                                                <div className="reminder-date">
                                                    {formatDate(defaulter.last_reminder_sent)}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="reminder-count">
                                                    {defaulter.reminder_count}
                                                </div>
                                            </td>
                                            <td>
                                                {defaulter.access_stopped ? (
                                                    <span className="status-badge stopped">
                                                        🚫 Stopped
                                                    </span>
                                                ) : (
                                                    <span className="status-badge active">
                                                        ✅ Active
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="btn-icon btn-reminder"
                                                        onClick={() => sendReminderMutation.mutate({
                                                            defaulterId: defaulter.id,
                                                            notificationType
                                                        })}
                                                        disabled={sendReminderMutation.isPending}
                                                        title={`Send Reminder via ${notificationType.toUpperCase()}`}
                                                    >
                                                        📨
                                                    </button>
                                                    <button
                                                        className="btn-icon btn-view"
                                                        onClick={() => window.location.href = `/students/${defaulter.student}`}
                                                        title="View Student"
                                                    >
                                                        👁️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-icon">🎉</div>
                    <h3>No Defaulters Found</h3>
                    <p>
                        {searchTerm
                            ? 'No defaulters match your search criteria'
                            : 'Great! All students have paid their fees on time.'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default FeeDefaulters;
