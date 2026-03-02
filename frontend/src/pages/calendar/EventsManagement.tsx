/**
 * Events Management Page
 * Create, edit, and manage school events
 */

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { useToast, ToastContainer } from '@/design-system';
import './Calendar.css';

interface SchoolEvent {
    id: string;
    title: string;
    description?: string;
    start_date: string;
    end_date?: string;
    start_time?: string;
    end_time?: string;
    event_type: 'ACADEMIC' | 'CULTURAL' | 'SPORTS' | 'MEETING' | 'EXAM' | 'OTHER';
    location?: string;
    is_all_day: boolean;
    notify_parents: boolean;
    notify_staff: boolean;
}

const EVENT_TYPES = [
    { value: 'ACADEMIC', label: 'Academic', color: '#3b82f6', icon: '📚' },
    { value: 'CULTURAL', label: 'Cultural', color: '#8b5cf6', icon: '🎭' },
    { value: 'SPORTS', label: 'Sports', color: '#10b981', icon: '⚽' },
    { value: 'MEETING', label: 'Meeting', color: '#6366f1', icon: '👥' },
    { value: 'EXAM', label: 'Exam', color: '#ec4899', icon: '📝' },
    { value: 'OTHER', label: 'Other', color: '#64748b', icon: '📌' },
];

const EventsManagement: React.FC = () => {
    const [events, setEvents] = useState<SchoolEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<SchoolEvent | null>(null);
    const [filter, setFilter] = useState<string>('all');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        start_time: '',
        end_time: '',
        event_type: 'OTHER',
        location: '',
        is_all_day: true,
        notify_parents: false,
        notify_staff: false,
    });
    const { toasts, removeToast, success, error } = useToast();

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const response = await api.get('/communication/events/');
            setEvents(Array.isArray(response.data) ? response.data : response.data?.results || []);
        } catch (err) {
            console.error('Error fetching events:', err);
            // Events endpoint may not exist yet, so we silently fail
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                end_date: formData.end_date || formData.start_date,
                start_time: formData.start_time || null,
                end_time: formData.end_time || null,
            };

            if (editingEvent) {
                await api.patch(`/communication/events/${editingEvent.id}/`, payload);
                success('Event updated successfully!');
            } else {
                await api.post('/communication/events/', payload);
                success('Event created successfully!');
            }
            setShowModal(false);
            resetForm();
            fetchEvents();
        } catch (err: any) {
            console.error('Error saving event:', err);
            error(err.response?.data?.message || 'Failed to save event');
        }
    };

    const handleEdit = (event: SchoolEvent) => {
        setEditingEvent(event);
        setFormData({
            title: event.title,
            description: event.description || '',
            start_date: event.start_date,
            end_date: event.end_date || '',
            start_time: event.start_time || '',
            end_time: event.end_time || '',
            event_type: event.event_type,
            location: event.location || '',
            is_all_day: event.is_all_day,
            notify_parents: event.notify_parents,
            notify_staff: event.notify_staff,
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this event?')) return;

        try {
            await api.delete(`/communication/events/${id}/`);
            success('Event deleted successfully!');
            fetchEvents();
        } catch (err) {
            console.error('Error deleting event:', err);
            error('Failed to delete event');
        }
    };

    const resetForm = () => {
        setEditingEvent(null);
        setFormData({
            title: '',
            description: '',
            start_date: '',
            end_date: '',
            start_time: '',
            end_time: '',
            event_type: 'OTHER',
            location: '',
            is_all_day: true,
            notify_parents: false,
            notify_staff: false,
        });
    };

    const getEventType = (type: string) => {
        return EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[5];
    };

    const filteredEvents = filter === 'all'
        ? events
        : events.filter(e => e.event_type === filter);

    // Sort events by date
    const sortedEvents = [...filteredEvents].sort((a, b) =>
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );

    if (loading) {
        return <Loading fullScreen text="Loading Events..." />;
    }

    return (
        <>
            <ToastContainer toasts={toasts} onDismiss={removeToast} position="top-right" />
            <div className="events-page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">🎉 Events Management</h1>
                        <p className="page-subtitle">Schedule and manage school events</p>
                    </div>
                    <Button variant="primary" onClick={() => { resetForm(); setShowModal(true); }}>
                        ➕ Add Event
                    </Button>
                </div>

                {/* Filter Tabs */}
                <div className="tabs" style={{ marginBottom: '1.5rem' }}>
                    <button
                        className={`tab ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All Events ({events.length})
                    </button>
                    {EVENT_TYPES.map(type => {
                        const count = events.filter(e => e.event_type === type.value).length;
                        return (
                            <button
                                key={type.value}
                                className={`tab ${filter === type.value ? 'active' : ''}`}
                                onClick={() => setFilter(type.value)}
                            >
                                {type.icon} {type.label} ({count})
                            </button>
                        );
                    })}
                </div>

                {sortedEvents.length === 0 ? (
                    <Card>
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <span style={{ fontSize: '4rem' }}>📅</span>
                            <h3 style={{ marginTop: '1rem', color: 'var(--color-text-secondary)' }}>
                                {filter === 'all' ? 'No events scheduled' : `No ${filter.toLowerCase()} events`}
                            </h3>
                            <p style={{ color: 'var(--color-text-tertiary)', marginBottom: '1.5rem' }}>
                                Create events to keep everyone informed
                            </p>
                            <Button variant="primary" onClick={() => setShowModal(true)}>
                                Create First Event
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <div className="events-list">
                        {sortedEvents.map(event => {
                            const eventType = getEventType(event.event_type);
                            const startDate = new Date(event.start_date);

                            return (
                                <div key={event.id} className="event-row">
                                    <div className="event-date-badge" style={{ backgroundColor: eventType.color }}>
                                        <span className="month">{startDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                                        <span className="day">{startDate.getDate()}</span>
                                    </div>

                                    <div className="event-info">
                                        <h4>{eventType.icon} {event.title}</h4>
                                        <div className="event-meta">
                                            {event.location && <span>📍 {event.location}</span>}
                                            {!event.is_all_day && event.start_time && (
                                                <span> • 🕐 {event.start_time}</span>
                                            )}
                                            {event.description && (
                                                <span> • {event.description.substring(0, 50)}...</span>
                                            )}
                                        </div>
                                    </div>

                                    <span
                                        className="event-type-tag"
                                        style={{ backgroundColor: `${eventType.color}20`, color: eventType.color }}
                                    >
                                        {eventType.label}
                                    </span>

                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <Button size="small" variant="outline" onClick={() => handleEdit(event)}>
                                            ✏️
                                        </Button>
                                        <Button size="small" variant="danger" onClick={() => handleDelete(event.id)}>
                                            🗑️
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Event Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
                        <div className="modal-content event-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{editingEvent ? 'Edit Event' : 'Add New Event'}</h2>
                                <button className="modal-close" onClick={() => { setShowModal(false); resetForm(); }}>✕</button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>Event Title *</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="e.g., Annual Day Celebration"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Event Type *</label>
                                        <select
                                            value={formData.event_type}
                                            onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                                            required
                                        >
                                            {EVENT_TYPES.map(type => (
                                                <option key={type.value} value={type.value}>
                                                    {type.icon} {type.label}
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
                                            <label>End Date</label>
                                            <input
                                                type="date"
                                                value={formData.end_date}
                                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_all_day}
                                            onChange={(e) => setFormData({ ...formData, is_all_day: e.target.checked })}
                                        />
                                        All day event
                                    </label>

                                    {!formData.is_all_day && (
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Start Time</label>
                                                <input
                                                    type="time"
                                                    value={formData.start_time}
                                                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>End Time</label>
                                                <input
                                                    type="time"
                                                    value={formData.end_time}
                                                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="form-group">
                                        <label>Location</label>
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            placeholder="e.g., School Auditorium"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={3}
                                            placeholder="Event details..."
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={formData.notify_parents}
                                                onChange={(e) => setFormData({ ...formData, notify_parents: e.target.checked })}
                                            />
                                            Notify Parents
                                        </label>
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={formData.notify_staff}
                                                onChange={(e) => setFormData({ ...formData, notify_staff: e.target.checked })}
                                            />
                                            Notify Staff
                                        </label>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <Button type="button" variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" variant="primary">
                                        {editingEvent ? 'Update Event' : 'Create Event'}
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

export default EventsManagement;
