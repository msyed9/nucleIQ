/**
 * Exam Scheduler - Schedule exams with conflict detection
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ExamScheduler.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface Exam {
    id: string;
    name: string;
    subject_name: string;
    grade_level_name: string;
    term_name: string;
    total_marks: number;
    duration_minutes: number;
    status: string;
}

interface ExamSchedule {
    id: string;
    exam_name: string;
    section_name: string;
    exam_date: string;
    start_time: string;
    end_time: string;
    room: string;
    invigilator_name?: string;
}

const ExamScheduler: React.FC = () => {
    const [exams, setExams] = useState<Exam[]>([]);
    const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

    // Schedule form state
    const [scheduleData, setScheduleData] = useState({
        start_date: '',
        start_time: '09:00',
        rooms: ['101', '102', '103']
    });

    useEffect(() => {
        fetchExams();
        fetchSchedules();
    }, []);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('access_token');
        const tenantId = localStorage.getItem('tenant_id');
        return {
            'Authorization': `Bearer ${token}`,
            'X-Tenant-ID': tenantId || '',
        };
    };

    const fetchExams = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/exams/exams/`, {
                headers: getAuthHeaders(),
            });
            setExams(response.data.results || response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error fetching exams');
        } finally {
            setLoading(false);
        }
    };

    const fetchSchedules = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/exams/schedules/`, {
                headers: getAuthHeaders(),
            });
            setSchedules(response.data.results || response.data);
        } catch (err: any) {
            console.error('Error fetching schedules:', err);
        }
    };

    const handleGenerateSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedExam) return;

        try {
            await axios.post(
                `${API_BASE_URL}/exams/schedules/generate_schedule/`,
                {
                    exam_id: selectedExam.id,
                    start_date: scheduleData.start_date,
                    start_time: scheduleData.start_time,
                    duration_minutes: selectedExam.duration_minutes,
                    rooms: scheduleData.rooms
                },
                { headers: getAuthHeaders() }
            );

            setShowScheduleModal(false);
            fetchSchedules();
            alert('Schedule generated successfully!');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error generating schedule');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusBadge = (status: string) => {
        const badges: { [key: string]: string } = {
            'DRAFT': 'status-draft',
            'SCHEDULED': 'status-scheduled',
            'IN_PROGRESS': 'status-progress',
            'COMPLETED': 'status-completed',
            'CANCELLED': 'status-cancelled'
        };
        return badges[status] || 'status-default';
    };

    // Group schedules by date
    const schedulesByDate = schedules.reduce((acc, schedule) => {
        const date = schedule.exam_date;
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(schedule);
        return acc;
    }, {} as { [key: string]: ExamSchedule[] });

    return (
        <div className="exam-scheduler">
            <div className="scheduler-header">
                <h1>📅 Exam Scheduler</h1>
                <p>Schedule exams with automatic conflict detection</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            {/* Exams List */}
            <div className="exams-section">
                <h2>Available Exams</h2>
                {loading ? (
                    <div className="loading">Loading exams...</div>
                ) : (
                    <div className="exams-grid">
                        {exams.map((exam) => (
                            <div key={exam.id} className="exam-card">
                                <div className="exam-header">
                                    <h3>{exam.name}</h3>
                                    <span className={`status-badge ${getStatusBadge(exam.status)}`}>
                                        {exam.status}
                                    </span>
                                </div>
                                <div className="exam-details">
                                    <div className="detail-row">
                                        <span className="label">Subject:</span>
                                        <span className="value">{exam.subject_name}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Grade:</span>
                                        <span className="value">{exam.grade_level_name}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Term:</span>
                                        <span className="value">{exam.term_name}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Duration:</span>
                                        <span className="value">{exam.duration_minutes} mins</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Total Marks:</span>
                                        <span className="value">{exam.total_marks}</span>
                                    </div>
                                </div>
                                <button
                                    className="btn-schedule"
                                    onClick={() => {
                                        setSelectedExam(exam);
                                        setShowScheduleModal(true);
                                    }}
                                >
                                    📅 Schedule Exam
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Scheduled Exams */}
            <div className="schedules-section">
                <h2>Exam Schedule Calendar</h2>
                {Object.keys(schedulesByDate).length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📅</div>
                        <h3>No Exams Scheduled</h3>
                        <p>Schedule exams to see them here</p>
                    </div>
                ) : (
                    <div className="schedule-calendar">
                        {Object.entries(schedulesByDate)
                            .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                            .map(([date, daySchedules]) => (
                                <div key={date} className="date-group">
                                    <div className="date-header">
                                        <h3>{formatDate(date)}</h3>
                                        <span className="exam-count">{daySchedules.length} exams</span>
                                    </div>
                                    <div className="schedule-list">
                                        {daySchedules
                                            .sort((a, b) => a.start_time.localeCompare(b.start_time))
                                            .map((schedule) => (
                                                <div key={schedule.id} className="schedule-item">
                                                    <div className="time-badge">
                                                        {schedule.start_time} - {schedule.end_time}
                                                    </div>
                                                    <div className="schedule-info">
                                                        <div className="exam-name">{schedule.exam_name}</div>
                                                        <div className="schedule-meta">
                                                            <span>📚 {schedule.section_name}</span>
                                                            <span>📍 {schedule.room}</span>
                                                            {schedule.invigilator_name && (
                                                                <span>👨‍🏫 {schedule.invigilator_name}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>

            {/* Schedule Generation Modal */}
            {showScheduleModal && selectedExam && (
                <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Generate Exam Schedule</h2>
                        <h3>{selectedExam.name}</h3>

                        <form onSubmit={handleGenerateSchedule}>
                            <div className="form-group">
                                <label>Start Date *</label>
                                <input
                                    type="date"
                                    value={scheduleData.start_date}
                                    onChange={(e) => setScheduleData({ ...scheduleData, start_date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Start Time *</label>
                                <input
                                    type="time"
                                    value={scheduleData.start_time}
                                    onChange={(e) => setScheduleData({ ...scheduleData, start_time: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Available Rooms (comma-separated)</label>
                                <input
                                    type="text"
                                    value={scheduleData.rooms.join(', ')}
                                    onChange={(e) => setScheduleData({
                                        ...scheduleData,
                                        rooms: e.target.value.split(',').map(r => r.trim())
                                    })}
                                    placeholder="101, 102, 103"
                                />
                            </div>

                            <div className="info-box">
                                <strong>ℹ️ Auto-Schedule Info:</strong>
                                <p>The system will automatically:</p>
                                <ul>
                                    <li>Schedule all sections for this exam</li>
                                    <li>Avoid time conflicts</li>
                                    <li>Distribute across available rooms</li>
                                    <li>Use exam duration: {selectedExam.duration_minutes} minutes</li>
                                </ul>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowScheduleModal(false)} className="btn-cancel">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-save">
                                    Generate Schedule
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExamScheduler;
