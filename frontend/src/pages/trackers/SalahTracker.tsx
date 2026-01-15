/**
 * Salah Tracker - Full-featured Prayer Tracking Dashboard
 * Track daily prayers for students with analytics and bulk marking
 */

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { useToast, ToastContainer } from '@/design-system';
import './Trackers.css';

interface Student {
    id: string;
    first_name: string;
    last_name: string;
    admission_number: string;
    current_class?: string;
    photo?: string;
}

interface SalahRecord {
    id: string;
    student: string;
    date: string;
    salah_name: string;
    status: string;
    verified_by?: string;
}

interface Section {
    id: number;
    name: string;
    grade_level_name: string;
}

const SALAH_PRAYERS = [
    { key: 'FAJR', name: 'Fajr', icon: '🌅', time: '~5:30 AM' },
    { key: 'DHUHR', name: 'Dhuhr', icon: '☀️', time: '~1:00 PM' },
    { key: 'ASR', name: 'Asr', icon: '🌤️', time: '~4:30 PM' },
    { key: 'MAGHRIB', name: 'Maghrib', icon: '🌅', time: '~6:30 PM' },
    { key: 'ISHA', name: 'Isha', icon: '🌙', time: '~8:00 PM' },
];

const STATUS_OPTIONS = [
    { key: 'OFFERED', label: 'Jamaat', icon: '🕌', color: '#10b981' },
    { key: 'INDIVIDUAL', label: 'Individual', icon: '🙏', color: '#3b82f6' },
    { key: 'MISSED', label: 'Missed', icon: '❌', color: '#ef4444' },
    { key: 'EXCUSED', label: 'Excused', icon: '📝', color: '#f59e0b' },
];

const SalahTracker: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<Student[]>([]);
    const [records, setRecords] = useState<SalahRecord[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [selectedSection, setSelectedSection] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedSalah, setSelectedSalah] = useState('DHUHR');
    const [viewMode, setViewMode] = useState<'marking' | 'history' | 'analytics'>('marking');
    const { toasts, removeToast, success, error } = useToast();

    useEffect(() => {
        fetchSections();
    }, []);

    useEffect(() => {
        if (selectedSection) {
            fetchStudents();
        }
    }, [selectedSection]);

    useEffect(() => {
        if (selectedSection && selectedDate) {
            fetchRecords();
        }
    }, [selectedSection, selectedDate, selectedSalah]);

    const fetchSections = async () => {
        try {
            const res = await api.get('/tenants/sections/');
            const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
            setSections(data);
            if (data.length > 0) {
                setSelectedSection(data[0].id.toString());
            }
        } catch (err) {
            console.error('Error fetching sections:', err);
        }
    };

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/students/students/?section=${selectedSection}`);
            const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
            setStudents(data);
        } catch (err) {
            console.error('Error fetching students:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecords = async () => {
        try {
            const res = await api.get(`/salah/records/?date=${selectedDate}`);
            const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
            setRecords(data);
        } catch (err) {
            console.error('Error fetching records:', err);
        }
    };

    const markAttendance = async (studentId: string, status: string) => {
        try {
            const existingRecord = records.find(
                r => r.student === studentId && r.salah_name === selectedSalah && r.date === selectedDate
            );

            if (existingRecord) {
                await api.patch(`/salah/records/${existingRecord.id}/`, { status });
            } else {
                await api.post('/salah/records/', {
                    student: studentId,
                    date: selectedDate,
                    salah_name: selectedSalah,
                    status: status,
                });
            }
            fetchRecords();
            success(`Prayer marked successfully!`);
        } catch (err: any) {
            console.error('Error marking salah:', err);
            error('Failed to mark prayer');
        }
    };

    const markAllStatus = async (status: string) => {
        try {
            for (const student of students) {
                const existingRecord = records.find(
                    r => r.student === student.id && r.salah_name === selectedSalah && r.date === selectedDate
                );
                if (!existingRecord) {
                    await api.post('/salah/records/', {
                        student: student.id,
                        date: selectedDate,
                        salah_name: selectedSalah,
                        status: status,
                    });
                }
            }
            fetchRecords();
            success(`All unmarked students marked as ${status}!`);
        } catch (err) {
            error('Failed to mark all students');
        }
    };

    const getStudentStatus = (studentId: string): string | undefined => {
        const record = records.find(
            r => r.student === studentId && r.salah_name === selectedSalah && r.date === selectedDate
        );
        return record?.status;
    };

    const getStats = () => {
        const salahRecords = records.filter(r => r.salah_name === selectedSalah && r.date === selectedDate);
        return {
            total: students.length,
            offered: salahRecords.filter(r => r.status === 'OFFERED').length,
            individual: salahRecords.filter(r => r.status === 'INDIVIDUAL').length,
            missed: salahRecords.filter(r => r.status === 'MISSED').length,
            excused: salahRecords.filter(r => r.status === 'EXCUSED').length,
            unmarked: students.length - salahRecords.length,
        };
    };

    const stats = getStats();

    if (loading && students.length === 0) {
        return <Loading fullScreen text="Loading Salah Tracker..." />;
    }

    return (
        <>
            <ToastContainer toasts={toasts} onDismiss={removeToast} position="top-right" />
            <div className="tracker-page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">🕌 Salah Tracker</h1>
                        <p className="page-subtitle">Track and manage daily prayers for students</p>
                    </div>
                </div>

                {/* Filters */}
                <Card className="filters-card">
                    <div className="tracker-filters">
                        <div className="filter-group">
                            <label>Section</label>
                            <select
                                value={selectedSection}
                                onChange={(e) => setSelectedSection(e.target.value)}
                            >
                                {sections.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.grade_level_name} - {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Date</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />
                        </div>
                        <div className="filter-group">
                            <label>Prayer</label>
                            <div className="salah-tabs">
                                {SALAH_PRAYERS.map(salah => (
                                    <button
                                        key={salah.key}
                                        className={`salah-tab ${selectedSalah === salah.key ? 'active' : ''}`}
                                        onClick={() => setSelectedSalah(salah.key)}
                                    >
                                        <span className="salah-icon">{salah.icon}</span>
                                        <span className="salah-name">{salah.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Stats Bar */}
                <div className="stats-bar">
                    <div className="stat-chip total">
                        <span className="stat-value">{stats.total}</span>
                        <span className="stat-label">Total</span>
                    </div>
                    <div className="stat-chip success">
                        <span className="stat-value">{stats.offered}</span>
                        <span className="stat-label">Jamaat</span>
                    </div>
                    <div className="stat-chip info">
                        <span className="stat-value">{stats.individual}</span>
                        <span className="stat-label">Individual</span>
                    </div>
                    <div className="stat-chip danger">
                        <span className="stat-value">{stats.missed}</span>
                        <span className="stat-label">Missed</span>
                    </div>
                    <div className="stat-chip warning">
                        <span className="stat-value">{stats.excused}</span>
                        <span className="stat-label">Excused</span>
                    </div>
                    <div className="stat-chip muted">
                        <span className="stat-value">{stats.unmarked}</span>
                        <span className="stat-label">Unmarked</span>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="quick-actions">
                    <span className="quick-label">Quick Mark All Unmarked:</span>
                    {STATUS_OPTIONS.map(opt => (
                        <button
                            key={opt.key}
                            className="quick-btn"
                            style={{ '--btn-color': opt.color } as React.CSSProperties}
                            onClick={() => markAllStatus(opt.key)}
                        >
                            {opt.icon} {opt.label}
                        </button>
                    ))}
                </div>

                {/* Student Grid */}
                <div className="student-grid">
                    {students.map(student => {
                        const status = getStudentStatus(student.id);
                        const statusInfo = STATUS_OPTIONS.find(s => s.key === status);

                        return (
                            <div
                                key={student.id}
                                className={`student-card ${status ? 'marked' : 'unmarked'}`}
                                style={status ? { '--status-color': statusInfo?.color } as React.CSSProperties : undefined}
                            >
                                <div className="student-avatar">
                                    {student.photo ? (
                                        <img src={student.photo} alt={student.first_name} />
                                    ) : (
                                        <span>{student.first_name[0]}{student.last_name?.[0] || ''}</span>
                                    )}
                                </div>
                                <div className="student-info">
                                    <h4>{student.first_name} {student.last_name}</h4>
                                    <p>{student.admission_number}</p>
                                </div>
                                {status && (
                                    <div className="current-status" style={{ background: statusInfo?.color }}>
                                        {statusInfo?.icon}
                                    </div>
                                )}
                                <div className="status-buttons">
                                    {STATUS_OPTIONS.map(opt => (
                                        <button
                                            key={opt.key}
                                            className={`status-btn ${status === opt.key ? 'selected' : ''}`}
                                            style={{ '--btn-color': opt.color } as React.CSSProperties}
                                            onClick={() => markAttendance(student.id, opt.key)}
                                            title={opt.label}
                                        >
                                            {opt.icon}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {students.length === 0 && !loading && (
                    <Card>
                        <div className="empty-state">
                            <span className="empty-icon">🕌</span>
                            <h3>No Students Found</h3>
                            <p>Select a section to view and mark student prayers</p>
                        </div>
                    </Card>
                )}
            </div>
        </>
    );
};

export default SalahTracker;
