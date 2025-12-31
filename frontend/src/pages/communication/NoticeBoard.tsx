/**
 * Notice Board - Digital circulars and announcements
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './NoticeBoard.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface Notice {
    id: string;
    title: string;
    content: string;
    priority: string;
    target_audience: string;
    target_class_names: string[];
    target_section_names: string[];
    attachment?: string;
    published_by_name?: string;
    published_at: string;
    valid_from: string;
    valid_until?: string;
    view_count: number;
}

const NoticeBoard: React.FC = () => {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filterPriority, setFilterPriority] = useState<string>('ALL');

    useEffect(() => {
        fetchNotices();
    }, []);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        const tenantId = localStorage.getItem('current_tenant') || localStorage.getItem('tenant_id');
        return {
            'Authorization': `Bearer ${token}`,
            'X-Tenant-ID': tenantId || '',
        };
    };

    const fetchNotices = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${API_BASE_URL}/communication/notices/active/`,
                { headers: getAuthHeaders() }
            );
            setNotices(response.data.results || response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error fetching notices');
        } finally {
            setLoading(false);
        }
    };

    const handleViewNotice = async (notice: Notice) => {
        setSelectedNotice(notice);

        // Increment view count
        try {
            await axios.post(
                `${API_BASE_URL}/communication/notices/${notice.id}/increment_view/`,
                {},
                { headers: getAuthHeaders() }
            );
            // Update local state
            setNotices(notices.map(n =>
                n.id === notice.id ? { ...n, view_count: n.view_count + 1 } : n
            ));
        } catch (err) {
            console.error('Error incrementing view count:', err);
        }
    };

    const getPriorityBadge = (priority: string) => {
        const badges: { [key: string]: string } = {
            'LOW': 'priority-low',
            'MEDIUM': 'priority-medium',
            'HIGH': 'priority-high',
            'URGENT': 'priority-urgent'
        };
        return badges[priority] || 'priority-medium';
    };

    const getPriorityIcon = (priority: string) => {
        const icons: { [key: string]: string } = {
            'LOW': '📌',
            'MEDIUM': '📢',
            'HIGH': '⚠️',
            'URGENT': '🚨'
        };
        return icons[priority] || '📢';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const filteredNotices = filterPriority === 'ALL'
        ? notices
        : notices.filter(n => n.priority === filterPriority);

    return (
        <div className="notice-board">
            <div className="notice-header">
                <h1>📋 Notice Board</h1>
                <p>Stay updated with latest announcements and circulars</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            {/* Filter */}
            <div className="filter-bar">
                <div className="filter-group">
                    <label>Filter by Priority:</label>
                    <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                        <option value="ALL">All Priorities</option>
                        <option value="URGENT">Urgent</option>
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                    </select>
                </div>
            </div>

            <div className="notice-container">
                {/* Notice List */}
                <div className="notice-list">
                    {loading ? (
                        <div className="loading">Loading notices...</div>
                    ) : filteredNotices.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📭</div>
                            <h3>No Notices</h3>
                            <p>There are no active notices at the moment</p>
                        </div>
                    ) : (
                        filteredNotices.map((notice) => (
                            <div
                                key={notice.id}
                                className={`notice-item ${selectedNotice?.id === notice.id ? 'active' : ''}`}
                                onClick={() => handleViewNotice(notice)}
                            >
                                <div className="notice-item-header">
                                    <span className={`priority-badge ${getPriorityBadge(notice.priority)}`}>
                                        {getPriorityIcon(notice.priority)} {notice.priority}
                                    </span>
                                    <span className="notice-date">{formatDate(notice.published_at)}</span>
                                </div>
                                <h3>{notice.title}</h3>
                                <div className="notice-meta">
                                    <span>👁️ {notice.view_count} views</span>
                                    {notice.target_audience !== 'ALL' && (
                                        <span>👥 {notice.target_audience}</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Notice Detail */}
                {selectedNotice && (
                    <div className="notice-detail">
                        <div className="detail-header">
                            <span className={`priority-badge ${getPriorityBadge(selectedNotice.priority)}`}>
                                {getPriorityIcon(selectedNotice.priority)} {selectedNotice.priority}
                            </span>
                            <button className="btn-close" onClick={() => setSelectedNotice(null)}>
                                ✕
                            </button>
                        </div>

                        <h2>{selectedNotice.title}</h2>

                        <div className="detail-meta">
                            <div className="meta-item">
                                <span className="meta-label">Published:</span>
                                <span className="meta-value">{formatDate(selectedNotice.published_at)}</span>
                            </div>
                            {selectedNotice.published_by_name && (
                                <div className="meta-item">
                                    <span className="meta-label">By:</span>
                                    <span className="meta-value">{selectedNotice.published_by_name}</span>
                                </div>
                            )}
                            <div className="meta-item">
                                <span className="meta-label">Valid From:</span>
                                <span className="meta-value">{formatDate(selectedNotice.valid_from)}</span>
                            </div>
                            {selectedNotice.valid_until && (
                                <div className="meta-item">
                                    <span className="meta-label">Valid Until:</span>
                                    <span className="meta-value">{formatDate(selectedNotice.valid_until)}</span>
                                </div>
                            )}
                            <div className="meta-item">
                                <span className="meta-label">Target:</span>
                                <span className="meta-value">{selectedNotice.target_audience}</span>
                            </div>
                            {selectedNotice.target_class_names.length > 0 && (
                                <div className="meta-item">
                                    <span className="meta-label">Classes:</span>
                                    <span className="meta-value">{selectedNotice.target_class_names.join(', ')}</span>
                                </div>
                            )}
                        </div>

                        <div className="detail-content">
                            <p>{selectedNotice.content}</p>
                        </div>

                        {selectedNotice.attachment && (
                            <div className="detail-attachment">
                                <a href={selectedNotice.attachment} target="_blank" rel="noopener noreferrer" className="btn-download">
                                    📎 Download Attachment
                                </a>
                            </div>
                        )}

                        <div className="detail-footer">
                            <span>👁️ {selectedNotice.view_count} views</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NoticeBoard;
