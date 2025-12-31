/**
 * Leave Management - Apply, view, and manage leave applications
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './LeaveManage.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface LeaveType {
    id: string;
    name: string;
    code: string;
    default_quota: number;
    is_paid: boolean;
    max_consecutive_days?: number;
}

interface LeaveBalance {
    id: string;
    leave_type_name: string;
    total_quota: number;
    used: number;
    pending: number;
    available: number;
}

interface LeaveApplication {
    id: string;
    leave_type_name: string;
    start_date: string;
    end_date: string;
    total_days: number;
    reason: string;
    status: string;
    applied_on?: string;
    approved_by_name?: string;
    approval_remarks?: string;
}

const LeaveManage: React.FC = () => {
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [balances, setBalances] = useState<LeaveBalance[]>([]);
    const [applications, setApplications] = useState<LeaveApplication[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showApplyModal, setShowApplyModal] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        leave_type: '',
        start_date: '',
        end_date: '',
        reason: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('access_token');
        const tenantId = localStorage.getItem('tenant_id');
        return {
            'Authorization': `Bearer ${token}`,
            'X-Tenant-ID': tenantId || '',
        };
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [typesRes, balancesRes, appsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/hr/leave-types/`, { headers: getAuthHeaders() }),
                axios.get(`${API_BASE_URL}/hr/leave-balances/my_balances/`, { headers: getAuthHeaders() }),
                axios.get(`${API_BASE_URL}/hr/leave-applications/my_applications/`, { headers: getAuthHeaders() })
            ]);

            setLeaveTypes(typesRes.data.results || typesRes.data);
            setBalances(balancesRes.data.results || balancesRes.data);
            setApplications(appsRes.data.results || appsRes.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error fetching data');
        } finally {
            setLoading(false);
        }
    };

    const handleApplyLeave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Note: Add staff ID from current user
            const response = await axios.post(
                `${API_BASE_URL}/hr/leave-applications/`,
                formData,
                { headers: getAuthHeaders() }
            );

            // Submit the application
            await axios.post(
                `${API_BASE_URL}/hr/leave-applications/${response.data.id}/submit/`,
                {},
                { headers: getAuthHeaders() }
            );

            setShowApplyModal(false);
            fetchData();
            setFormData({ leave_type: '', start_date: '', end_date: '', reason: '' });
            alert('Leave application submitted successfully!');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error applying for leave');
        }
    };

    const handleCancelLeave = async (id: string) => {
        if (!confirm('Are you sure you want to cancel this leave application?')) return;

        try {
            await axios.post(
                `${API_BASE_URL}/hr/leave-applications/${id}/cancel/`,
                {},
                { headers: getAuthHeaders() }
            );
            fetchData();
            alert('Leave application cancelled');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error cancelling leave');
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: { [key: string]: string } = {
            'DRAFT': 'status-draft',
            'PENDING': 'status-pending',
            'APPROVED': 'status-approved',
            'REJECTED': 'status-rejected',
            'CANCELLED': 'status-cancelled'
        };
        return badges[status] || 'status-default';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="leave-manage">
            <div className="leave-header">
                <h1>🏖️ Leave Management</h1>
                <p>Manage your leave applications and balances</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            {/* Leave Balances */}
            <div className="balances-section">
                <h2>Leave Balances</h2>
                <div className="balances-grid">
                    {balances.map((balance) => (
                        <div key={balance.id} className="balance-card">
                            <h3>{balance.leave_type_name}</h3>
                            <div className="balance-stats">
                                <div className="stat">
                                    <div className="stat-value">{balance.total_quota}</div>
                                    <div className="stat-label">Total</div>
                                </div>
                                <div className="stat">
                                    <div className="stat-value">{balance.used}</div>
                                    <div className="stat-label">Used</div>
                                </div>
                                <div className="stat">
                                    <div className="stat-value">{balance.pending}</div>
                                    <div className="stat-label">Pending</div>
                                </div>
                                <div className="stat highlight">
                                    <div className="stat-value">{balance.available}</div>
                                    <div className="stat-label">Available</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Apply Leave Button */}
            <div className="action-bar">
                <button className="btn-apply" onClick={() => setShowApplyModal(true)}>
                    ➕ Apply for Leave
                </button>
            </div>

            {/* Leave Applications */}
            <div className="applications-section">
                <h2>My Leave Applications</h2>
                {loading ? (
                    <div className="loading">Loading...</div>
                ) : applications.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📝</div>
                        <h3>No Leave Applications</h3>
                        <p>Apply for leave to see your applications here</p>
                    </div>
                ) : (
                    <div className="applications-list">
                        {applications.map((app) => (
                            <div key={app.id} className="application-card">
                                <div className="app-header">
                                    <h3>{app.leave_type_name}</h3>
                                    <span className={`status-badge ${getStatusBadge(app.status)}`}>
                                        {app.status}
                                    </span>
                                </div>
                                <div className="app-details">
                                    <div className="detail-row">
                                        <span className="label">Period:</span>
                                        <span className="value">
                                            {formatDate(app.start_date)} - {formatDate(app.end_date)}
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Days:</span>
                                        <span className="value">{app.total_days}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Reason:</span>
                                        <span className="value">{app.reason}</span>
                                    </div>
                                    {app.applied_on && (
                                        <div className="detail-row">
                                            <span className="label">Applied On:</span>
                                            <span className="value">{formatDate(app.applied_on)}</span>
                                        </div>
                                    )}
                                    {app.approved_by_name && (
                                        <div className="detail-row">
                                            <span className="label">Processed By:</span>
                                            <span className="value">{app.approved_by_name}</span>
                                        </div>
                                    )}
                                    {app.approval_remarks && (
                                        <div className="detail-row">
                                            <span className="label">Remarks:</span>
                                            <span className="value">{app.approval_remarks}</span>
                                        </div>
                                    )}
                                </div>
                                {(app.status === 'PENDING' || app.status === 'APPROVED') && (
                                    <div className="app-actions">
                                        <button
                                            className="btn-cancel"
                                            onClick={() => handleCancelLeave(app.id)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Apply Leave Modal */}
            {showApplyModal && (
                <div className="modal-overlay" onClick={() => setShowApplyModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Apply for Leave</h2>
                        <form onSubmit={handleApplyLeave}>
                            <div className="form-group">
                                <label>Leave Type *</label>
                                <select
                                    value={formData.leave_type}
                                    onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                                    required
                                >
                                    <option value="">Select leave type</option>
                                    {leaveTypes.map((type) => (
                                        <option key={type.id} value={type.id}>
                                            {type.name} ({type.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Start Date *</label>
                                    <input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>End Date *</label>
                                    <input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Reason *</label>
                                <textarea
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    rows={4}
                                    required
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowApplyModal(false)} className="btn-cancel-modal">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-submit">
                                    Apply
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaveManage;
