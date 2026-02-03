/**
 * Leave Type Configuration Page
 * Manage leave types for the organization
 */

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Edit2,
    Trash2,
    Save,
    X,
    Check,
    Calendar,
    Clock,
    AlertCircle,
    RefreshCw
} from 'lucide-react';
import api from '../../services/api';
import './HR.css';

interface LeaveType {
    id: string;
    name: string;
    code: string;
    description: string;
    default_quota: number;
    is_paid: boolean;
    requires_approval: boolean;
    max_consecutive_days: number | null;
    carry_forward: boolean;
    max_carry_forward: number | null;
    is_active: boolean;
}

const LeaveTypeConfig: React.FC = () => {
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingType, setEditingType] = useState<LeaveType | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<Partial<LeaveType>>({
        name: '',
        code: '',
        description: '',
        default_quota: 0,
        is_paid: true,
        requires_approval: true,
        max_consecutive_days: null,
        carry_forward: false,
        max_carry_forward: null,
        is_active: true
    });

    useEffect(() => {
        fetchLeaveTypes();
    }, []);

    const fetchLeaveTypes = async () => {
        try {
            setLoading(true);
            const response = await api.get('/hr/leave-types/');
            const data = Array.isArray(response.data) ? response.data : response.data?.results || [];
            setLeaveTypes(data);
        } catch (error) {
            console.error('Error fetching leave types:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (leaveType?: LeaveType) => {
        if (leaveType) {
            setEditingType(leaveType);
            setFormData(leaveType);
        } else {
            setEditingType(null);
            setFormData({
                name: '',
                code: '',
                description: '',
                default_quota: 0,
                is_paid: true,
                requires_approval: true,
                max_consecutive_days: null,
                carry_forward: false,
                max_carry_forward: null,
                is_active: true
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingType(null);
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (editingType) {
                await api.patch(`/hr/leave-types/${editingType.id}/`, formData);
            } else {
                await api.post('/hr/leave-types/', formData);
            }
            fetchLeaveTypes();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving leave type:', error);
            alert('Failed to save leave type');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this leave type?')) return;

        try {
            await api.delete(`/hr/leave-types/${id}/`);
            fetchLeaveTypes();
        } catch (error) {
            console.error('Error deleting leave type:', error);
            alert('Failed to delete leave type');
        }
    };

    const toggleActive = async (leaveType: LeaveType) => {
        try {
            await api.patch(`/hr/leave-types/${leaveType.id}/`, {
                is_active: !leaveType.is_active
            });
            fetchLeaveTypes();
        } catch (error) {
            console.error('Error toggling leave type status:', error);
        }
    };

    if (loading) {
        return (
            <div className="hr-loading">
                <RefreshCw className="spin" size={32} />
                <p>Loading leave types...</p>
            </div>
        );
    }

    return (
        <div className="hr-page">
            <div className="hr-header">
                <div>
                    <h1>📅 Leave Type Configuration</h1>
                    <p>Manage leave types for staff and teachers</p>
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={18} />
                    Add Leave Type
                </button>
            </div>

            {/* Leave Types Grid */}
            <div className="leave-types-grid">
                {leaveTypes.length === 0 ? (
                    <div className="empty-state">
                        <Calendar size={48} />
                        <h3>No Leave Types Configured</h3>
                        <p>Create leave types to manage staff leave applications</p>
                        <button className="btn-primary" onClick={() => handleOpenModal()}>
                            <Plus size={18} />
                            Create First Leave Type
                        </button>
                    </div>
                ) : (
                    leaveTypes.map(leaveType => (
                        <div
                            key={leaveType.id}
                            className={`leave-type-card ${!leaveType.is_active ? 'inactive' : ''}`}
                        >
                            <div className="leave-type-header">
                                <div className="leave-type-badge">{leaveType.code}</div>
                                <div className="leave-type-actions">
                                    <button
                                        className="btn-icon"
                                        onClick={() => handleOpenModal(leaveType)}
                                        title="Edit"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        className="btn-icon danger"
                                        onClick={() => handleDelete(leaveType.id)}
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="leave-type-name">{leaveType.name}</h3>
                            <p className="leave-type-desc">{leaveType.description || 'No description'}</p>

                            <div className="leave-type-details">
                                <div className="detail-item">
                                    <Clock size={14} />
                                    <span><strong>{leaveType.default_quota}</strong> days/year</span>
                                </div>
                                {leaveType.max_consecutive_days && (
                                    <div className="detail-item">
                                        <AlertCircle size={14} />
                                        <span>Max {leaveType.max_consecutive_days} consecutive days</span>
                                    </div>
                                )}
                            </div>

                            <div className="leave-type-tags">
                                {leaveType.is_paid && (
                                    <span className="tag paid">Paid Leave</span>
                                )}
                                {!leaveType.is_paid && (
                                    <span className="tag unpaid">Unpaid</span>
                                )}
                                {leaveType.requires_approval && (
                                    <span className="tag approval">Requires Approval</span>
                                )}
                                {leaveType.carry_forward && (
                                    <span className="tag carry">Carry Forward</span>
                                )}
                            </div>

                            <div className="leave-type-footer">
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={leaveType.is_active}
                                        onChange={() => toggleActive(leaveType)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                                <span className={leaveType.is_active ? 'status-active' : 'status-inactive'}>
                                    {leaveType.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content leave-type-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingType ? 'Edit Leave Type' : 'Add Leave Type'}</h2>
                            <button className="btn-close" onClick={handleCloseModal}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Leave Type Name *</label>
                                        <input
                                            type="text"
                                            value={formData.name || ''}
                                            onChange={e => handleChange('name', e.target.value)}
                                            placeholder="e.g., Sick Leave"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Code *</label>
                                        <input
                                            type="text"
                                            value={formData.code || ''}
                                            onChange={e => handleChange('code', e.target.value.toUpperCase())}
                                            placeholder="e.g., SL"
                                            maxLength={10}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        value={formData.description || ''}
                                        onChange={e => handleChange('description', e.target.value)}
                                        placeholder="Leave type description..."
                                        rows={3}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Default Annual Quota (days) *</label>
                                        <input
                                            type="number"
                                            value={formData.default_quota || 0}
                                            onChange={e => handleChange('default_quota', parseFloat(e.target.value))}
                                            min="0"
                                            step="0.5"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Max Consecutive Days</label>
                                        <input
                                            type="number"
                                            value={formData.max_consecutive_days || ''}
                                            onChange={e => handleChange('max_consecutive_days', e.target.value ? parseInt(e.target.value) : null)}
                                            min="1"
                                            placeholder="No limit"
                                        />
                                    </div>
                                </div>

                                <div className="form-row checkboxes">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_paid || false}
                                            onChange={e => handleChange('is_paid', e.target.checked)}
                                        />
                                        <span>Paid Leave</span>
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.requires_approval || false}
                                            onChange={e => handleChange('requires_approval', e.target.checked)}
                                        />
                                        <span>Requires Approval</span>
                                    </label>
                                </div>

                                <div className="form-row checkboxes">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.carry_forward || false}
                                            onChange={e => handleChange('carry_forward', e.target.checked)}
                                        />
                                        <span>Allow Carry Forward</span>
                                    </label>
                                    {formData.carry_forward && (
                                        <div className="form-group inline">
                                            <label>Max Carry Forward</label>
                                            <input
                                                type="number"
                                                value={formData.max_carry_forward || ''}
                                                onChange={e => handleChange('max_carry_forward', e.target.value ? parseFloat(e.target.value) : null)}
                                                min="0"
                                                step="0.5"
                                                placeholder="Unlimited"
                                            />
                                        </div>
                                    )}
                                </div>

                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active || false}
                                        onChange={e => handleChange('is_active', e.target.checked)}
                                    />
                                    <span>Active</span>
                                </label>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? (
                                        <>
                                            <RefreshCw size={16} className="spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} />
                                            {editingType ? 'Update' : 'Create'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaveTypeConfig;
