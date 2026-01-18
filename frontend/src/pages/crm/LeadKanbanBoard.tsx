/**
 * Lead Kanban Board - Drag-and-drop pipeline for lead management
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './LeadKanbanBoard.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface Lead {
    id: string;
    lead_number: string;
    student_name: string;
    parent_name: string;
    parent_phone: string;
    source: string;
    status: string;
    priority: string;
    grade_name?: string;
    assigned_to_name?: string;
    next_follow_up?: string;
    created_at: string;
}

interface KanbanColumn {
    name: string;
    leads: Lead[];
    count: number;
}

const LeadKanbanBoard: React.FC = () => {
    const [kanbanData, setKanbanData] = useState<{ [key: string]: KanbanColumn }>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

    useEffect(() => {
        fetchKanbanData();
    }, []);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('access_token');
        const tenantId = localStorage.getItem('tenant_id');
        return {
            'Authorization': `Bearer ${token}`,
            'X-Tenant-ID': tenantId || '',
        };
    };

    const fetchKanbanData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${API_BASE_URL}/crm/leads/kanban_data/`,
                { headers: getAuthHeaders() }
            );
            setKanbanData(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error fetching leads');
        } finally {
            setLoading(false);
        }
    };

    const handleDragStart = (lead: Lead) => {
        setDraggedLead(lead);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (newStatus: string) => {
        if (!draggedLead) return;

        try {
            await axios.post(
                `${API_BASE_URL}/crm/leads/${draggedLead.id}/update_status/`,
                { status: newStatus },
                { headers: getAuthHeaders() }
            );

            // Refresh data
            fetchKanbanData();
            setDraggedLead(null);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error updating status');
        }
    };

    const getPriorityColor = (priority: string) => {
        const colors: { [key: string]: string } = {
            'URGENT': '#dc2626',
            'HIGH': '#ea580c',
            'MEDIUM': '#2563eb',
            'LOW': '#64748b'
        };
        return colors[priority] || '#64748b';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    const statusOrder = ['NEW', 'CONTACTED', 'CAMPUS_VISIT', 'VISITED', 'APPLICATION_RECEIVED', 'SHORTLISTED', 'ADMITTED', 'LOST'];

    return (
        <div className="kanban-board">
            <div className="kanban-header">
                <h1>🎯 Lead Pipeline</h1>
                <div className="kanban-actions">
                    <button className="btn-refresh" onClick={fetchKanbanData}>
                        🔄 Refresh
                    </button>
                    <button className="btn-analytics" onClick={() => window.location.href = '/crm/analytics'}>
                        📊 Analytics
                    </button>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            {loading ? (
                <div className="loading">Loading pipeline...</div>
            ) : (
                <div className="kanban-columns">
                    {statusOrder.map((statusCode) => {
                        const column = kanbanData[statusCode];
                        if (!column) return null;

                        return (
                            <div
                                key={statusCode}
                                className="kanban-column"
                                onDragOver={handleDragOver}
                                onDrop={() => handleDrop(statusCode)}
                            >
                                <div className="column-header">
                                    <h3>{column.name}</h3>
                                    <span className="column-count">{column.count}</span>
                                </div>

                                <div className="column-cards">
                                    {column.leads.map((lead) => (
                                        <div
                                            key={lead.id}
                                            className="lead-card"
                                            draggable
                                            onDragStart={() => handleDragStart(lead)}
                                            onClick={() => setSelectedLead(lead)}
                                        >
                                            <div className="card-header">
                                                <span className="lead-number">{lead.lead_number}</span>
                                                <div
                                                    className="priority-dot"
                                                    style={{ backgroundColor: getPriorityColor(lead.priority) }}
                                                    title={lead.priority}
                                                />
                                            </div>

                                            <h4>{lead.student_name}</h4>

                                            <div className="card-details">
                                                <div className="detail-item">
                                                    <span className="label">Parent:</span>
                                                    <span>{lead.parent_name}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="label">Phone:</span>
                                                    <span>{lead.parent_phone}</span>
                                                </div>
                                                {lead.grade_name && (
                                                    <div className="detail-item">
                                                        <span className="label">Grade:</span>
                                                        <span>{lead.grade_name}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="card-footer">
                                                <span className="source-badge">{lead.source}</span>
                                                {lead.next_follow_up && (
                                                    <span className="follow-up">
                                                        📅 {formatDate(lead.next_follow_up)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {column.leads.length === 0 && (
                                        <div className="empty-column">
                                            <p>No leads in this stage</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Lead Detail Modal */}
            {selectedLead && (
                <div className="modal-overlay" onClick={() => setSelectedLead(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{selectedLead.student_name}</h2>
                            <button className="btn-close" onClick={() => setSelectedLead(null)}>
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="detail-grid">
                                <div className="detail-row">
                                    <span className="label">Lead Number:</span>
                                    <span className="value">{selectedLead.lead_number}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Parent:</span>
                                    <span className="value">{selectedLead.parent_name}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Phone:</span>
                                    <span className="value">{selectedLead.parent_phone}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Source:</span>
                                    <span className="value">{selectedLead.source}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Status:</span>
                                    <span className="value">{selectedLead.status}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Priority:</span>
                                    <span className="value">{selectedLead.priority}</span>
                                </div>
                                {selectedLead.grade_name && (
                                    <div className="detail-row">
                                        <span className="label">Grade:</span>
                                        <span className="value">{selectedLead.grade_name}</span>
                                    </div>
                                )}
                                {selectedLead.assigned_to_name && (
                                    <div className="detail-row">
                                        <span className="label">Assigned To:</span>
                                        <span className="value">{selectedLead.assigned_to_name}</span>
                                    </div>
                                )}
                            </div>

                            <div className="modal-actions">
                                <button className="btn-view-full" onClick={() => window.location.href = `/crm/leads/${selectedLead.id}`}>
                                    View Full Details
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeadKanbanBoard;
