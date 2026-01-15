/**
 * Holidays Management Page
 * Create, edit, and manage school holidays
 */

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { useToast, ToastContainer } from '@/design-system';
import './Calendar.css';

interface Holiday {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    holiday_type: 'PUBLIC' | 'SCHOOL' | 'RESTRICTED' | 'VACATION';
    description?: string;
    is_recurring: boolean;
    academic_year?: string;
}

const HOLIDAY_TYPES = [
    { value: 'PUBLIC', label: 'Public Holiday', color: '#ef4444' },
    { value: 'SCHOOL', label: 'School Holiday', color: '#f97316' },
    { value: 'RESTRICTED', label: 'Restricted Holiday', color: '#eab308' },
    { value: 'VACATION', label: 'Vacation', color: '#22c55e' },
];

const HolidaysManagement: React.FC = () => {
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        start_date: '',
        end_date: '',
        holiday_type: 'SCHOOL',
        description: '',
        is_recurring: false,
    });
    const { toasts, removeToast, success, error } = useToast();

    useEffect(() => {
        fetchHolidays();
    }, []);

    const fetchHolidays = async () => {
        setLoading(true);
        try {
            const response = await api.get('/tenants/holidays/');
            setHolidays(Array.isArray(response.data) ? response.data : response.data?.results || []);
        } catch (err) {
            console.error('Error fetching holidays:', err);
            error('Failed to load holidays');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingHoliday) {
                await api.patch(`/tenants/holidays/${editingHoliday.id}/`, formData);
                success('Holiday updated successfully!');
            } else {
                await api.post('/tenants/holidays/', formData);
                success('Holiday created successfully!');
            }
            setShowModal(false);
            resetForm();
            fetchHolidays();
        } catch (err: any) {
            console.error('Error saving holiday:', err);
            error(err.response?.data?.message || 'Failed to save holiday');
        }
    };

    const handleEdit = (holiday: Holiday) => {
        setEditingHoliday(holiday);
        setFormData({
            name: holiday.name,
            start_date: holiday.start_date,
            end_date: holiday.end_date,
            holiday_type: holiday.holiday_type,
            description: holiday.description || '',
            is_recurring: holiday.is_recurring,
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this holiday?')) return;

        try {
            await api.delete(`/tenants/holidays/${id}/`);
            success('Holiday deleted successfully!');
            fetchHolidays();
        } catch (err) {
            console.error('Error deleting holiday:', err);
            error('Failed to delete holiday');
        }
    };

    const resetForm = () => {
        setEditingHoliday(null);
        setFormData({
            name: '',
            start_date: '',
            end_date: '',
            holiday_type: 'SCHOOL',
            description: '',
            is_recurring: false,
        });
    };

    const getHolidayColor = (type: string) => {
        return HOLIDAY_TYPES.find(t => t.value === type)?.color || '#64748b';
    };

    const formatDateRange = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);

        if (startDate.toDateString() === endDate.toDateString()) {
            return startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }

        return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    };

    if (loading) {
        return <Loading fullScreen text="Loading Holidays..." />;
    }

    return (
        <>
            <ToastContainer toasts={toasts} onDismiss={removeToast} position="top-right" />
            <div className="holidays-page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">🌴 Holiday Management</h1>
                        <p className="page-subtitle">Manage school holidays and vacation schedules</p>
                    </div>
                    <Button variant="primary" onClick={() => { resetForm(); setShowModal(true); }}>
                        ➕ Add Holiday
                    </Button>
                </div>

                {holidays.length === 0 ? (
                    <Card>
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <span style={{ fontSize: '4rem' }}>📅</span>
                            <h3 style={{ marginTop: '1rem', color: 'var(--color-text-secondary)' }}>
                                No holidays configured yet
                            </h3>
                            <p style={{ color: 'var(--color-text-tertiary)', marginBottom: '1.5rem' }}>
                                Add holidays to integrate with attendance and calendar
                            </p>
                            <Button variant="primary" onClick={() => setShowModal(true)}>
                                Create First Holiday
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <div className="holidays-grid">
                        {holidays.map(holiday => (
                            <div key={holiday.id} className="holiday-card">
                                <div
                                    className="holiday-card-header"
                                    style={{ backgroundColor: getHolidayColor(holiday.holiday_type) }}
                                >
                                    <div>
                                        <h3>{holiday.name}</h3>
                                        <div className="dates">{formatDateRange(holiday.start_date, holiday.end_date)}</div>
                                    </div>
                                    <span className="holiday-type-badge">{holiday.holiday_type}</span>
                                </div>
                                <div className="holiday-card-body">
                                    {holiday.description && <p>{holiday.description}</p>}
                                    {holiday.is_recurring && (
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>
                                            🔄 Recurring annually
                                        </p>
                                    )}
                                    <div className="holiday-actions">
                                        <Button size="small" variant="outline" onClick={() => handleEdit(holiday)}>
                                            ✏️ Edit
                                        </Button>
                                        <Button size="small" variant="danger" onClick={() => handleDelete(holiday.id)}>
                                            🗑️ Delete
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Holiday Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
                        <div className="modal-content holiday-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}</h2>
                                <button className="modal-close" onClick={() => { setShowModal(false); resetForm(); }}>✕</button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>Holiday Name *</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g., Independence Day"
                                            required
                                        />
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
                                        <label>Holiday Type *</label>
                                        <select
                                            value={formData.holiday_type}
                                            onChange={(e) => setFormData({ ...formData, holiday_type: e.target.value })}
                                            required
                                        >
                                            {HOLIDAY_TYPES.map(type => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={3}
                                            placeholder="Optional description..."
                                        />
                                    </div>

                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_recurring}
                                            onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                                        />
                                        Recurring annually (applies to future years)
                                    </label>
                                </div>
                                <div className="modal-footer">
                                    <Button type="button" variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" variant="primary">
                                        {editingHoliday ? 'Update Holiday' : 'Create Holiday'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default HolidaysManagement;
