import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './LeaveApproval.css';

interface LeaveRequest {
    id: number;
    staff_name: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    days: number;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    applied_date: string;
    approver_remarks?: string;
}

const LeaveApproval: React.FC = () => {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [remarks, setRemarks] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/hr/leave-requests/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(response.data.results || response.data);
        } catch (err) {
            console.error('Error fetching requests:', err);
        }
    };

    const handleApprove = async (requestId: number, remarks: string) => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            await axios.post(`/api/hr/leave-requests/${requestId}/approve/`, {
                remarks
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess('Leave request approved successfully!');
            setShowModal(false);
            fetchRequests();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to approve request');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async (requestId: number, remarks: string) => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            await axios.post(`/api/hr/leave-requests/${requestId}/reject/`, {
                remarks
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess('Leave request rejected');
            setShowModal(false);
            fetchRequests();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to reject request');
        } finally {
            setLoading(false);
        }
    };

    const filteredRequests = requests.filter(req => {
        if (filter === 'all') return true;
        return req.status.toLowerCase() === filter;
    });

    const statusColors: { [key: string]: string } = {
        'PENDING': '#f59e0b',
        'APPROVED': '#22c55e',
        'REJECTED': '#ef4444',
    };

    return (
        <div className="leave-approval">
            <div className="approval-header">
                <h1>✅ Leave Approval</h1>
                <p>Approve or reject staff leave requests</p>
            </div>

            {success && <div className="alert alert-success"><span className="icon">✅</span>{success}</div>}
            {error && <div className="alert alert-error"><span className="icon">⚠️</span>{error}</div>}

            <div className="filter-tabs">
                <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>
                    Pending ({requests.filter(r => r.status === 'PENDING').length})
                </button>
                <button className={filter === 'approved' ? 'active' : ''} onClick={() => setFilter('approved')}>
                    Approved ({requests.filter(r => r.status === 'APPROVED').length})
                </button>
                <button className={filter === 'rejected' ? 'active' : ''} onClick={() => setFilter('rejected')}>
                    Rejected ({requests.filter(r => r.status === 'REJECTED').length})
                </button>
                <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
                    All ({requests.length})
                </button>
            </div>

            <div className="requests-grid">
                {filteredRequests.map(request => (
                    <div key={request.id} className="request-card">
                        <div className="request-header">
                            <h3>{request.staff_name}</h3>
                            <span className="status-badge" style={{ background: statusColors[request.status] }}>
                                {request.status}
                            </span>
                        </div>
                        <div className="request-details">
                            <div className="detail-row"><span className="icon">📅</span><span>{request.leave_type}</span></div>
                            <div className="detail-row"><span className="icon">🗓️</span><span>{new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}</span></div>
                            <div className="detail-row"><span className="icon">⏱️</span><span>{request.days} days</span></div>
                        </div>
                        <div className="reason-section">
                            <strong>Reason:</strong>
                            <p>{request.reason}</p>
                        </div>
                        {request.approver_remarks && (
                            <div className="remarks-section">
                                <strong>Remarks:</strong>
                                <p>{request.approver_remarks}</p>
                            </div>
                        )}
                        {request.status === 'PENDING' && (
                            <div className="action-buttons">
                                <button className="btn-approve" onClick={() => { setSelectedRequest(request); setRemarks(''); setShowModal(true); }}>
                                    ✅ Approve
                                </button>
                                <button className="btn-reject" onClick={() => { setSelectedRequest(request); setRemarks(''); setShowModal(true); }}>
                                    ❌ Reject
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {showModal && selectedRequest && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Leave Request Action</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="request-summary">
                                <h3>{selectedRequest.staff_name}</h3>
                                <p>{selectedRequest.leave_type} • {selectedRequest.days} days</p>
                            </div>
                            <div className="form-group">
                                <label>Remarks (Optional)</label>
                                <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} className="form-control" rows={3} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-approve" onClick={() => handleApprove(selectedRequest.id, remarks)} disabled={loading}>
                                {loading ? '⏳ Processing...' : '✅ Approve'}
                            </button>
                            <button className="btn btn-reject" onClick={() => handleReject(selectedRequest.id, remarks)} disabled={loading}>
                                {loading ? '⏳ Processing...' : '❌ Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaveApproval;
