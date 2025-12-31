/**
 * Teacher Timetable View
 * Shows a teacher's weekly schedule
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TeacherView.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

interface TeacherSchedule {
    id: string;
    day: string;
    start_time: string;
    end_time: string;
    section: string;
    subject: string;
    room: string;
    period_number: number;
}

const TeacherView: React.FC = () => {
    const [teachers, setTeachers] = useState<any[]>([]);
    const [selectedTeacher, setSelectedTeacher] = useState<string>('');
    const [schedule, setSchedule] = useState<TeacherSchedule[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTeachers();
    }, []);

    useEffect(() => {
        if (selectedTeacher) {
            fetchTeacherSchedule();
        }
    }, [selectedTeacher]);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('access_token');
        const tenantId = localStorage.getItem('tenant_id');
        return {
            'Authorization': `Bearer ${token}`,
            'X-Tenant-ID': tenantId || '',
        };
    };

    const fetchTeachers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/staff/`, {
                headers: getAuthHeaders(),
            });
            setTeachers(response.data.results || response.data);
        } catch (err) {
            console.error('Error fetching teachers:', err);
        }
    };

    const fetchTeacherSchedule = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(
                `${API_BASE_URL}/timetable/slots/teacher_schedule/?teacher_id=${selectedTeacher}`,
                { headers: getAuthHeaders() }
            );
            setSchedule(response.data.schedule || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error fetching schedule');
        } finally {
            setLoading(false);
        }
    };

    const getScheduleForDay = (day: string) => {
        return schedule
            .filter((slot) => slot.day === day)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));
    };

    const selectedTeacherData = teachers.find((t) => t.id === selectedTeacher);

    return (
        <div className="teacher-view">
            <div className="teacher-view-header">
                <h1>👨‍🏫 Teacher Schedule</h1>
                <p>View weekly teaching schedule</p>
            </div>

            <div className="teacher-selector">
                <label>Select Teacher</label>
                <select
                    value={selectedTeacher}
                    onChange={(e) => setSelectedTeacher(e.target.value)}
                >
                    <option value="">Choose a teacher...</option>
                    {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                            {teacher.first_name} {teacher.last_name} - {teacher.designation}
                        </option>
                    ))}
                </select>
            </div>

            {selectedTeacher && selectedTeacherData && (
                <div className="teacher-info-card">
                    <div className="teacher-avatar">
                        {selectedTeacherData.photo ? (
                            <img src={selectedTeacherData.photo} alt={selectedTeacherData.first_name} />
                        ) : (
                            <div className="avatar-placeholder">
                                {selectedTeacherData.first_name[0]}
                                {selectedTeacherData.last_name[0]}
                            </div>
                        )}
                    </div>
                    <div className="teacher-details">
                        <h2>
                            {selectedTeacherData.first_name} {selectedTeacherData.last_name}
                        </h2>
                        <p className="designation">{selectedTeacherData.designation}</p>
                        <p className="employee-id">Employee ID: {selectedTeacherData.employee_id}</p>
                    </div>
                    <div className="schedule-stats">
                        <div className="stat">
                            <div className="stat-value">{schedule.length}</div>
                            <div className="stat-label">Total Classes</div>
                        </div>
                        <div className="stat">
                            <div className="stat-value">
                                {new Set(schedule.map((s) => s.subject)).size}
                            </div>
                            <div className="stat-label">Subjects</div>
                        </div>
                    </div>
                </div>
            )}

            {loading && <div className="loading">Loading schedule...</div>}
            {error && <div className="error-message">{error}</div>}

            {selectedTeacher && !loading && schedule.length > 0 && (
                <div className="weekly-schedule">
                    {DAYS.map((day) => {
                        const daySchedule = getScheduleForDay(day);
                        return (
                            <div key={day} className="day-schedule">
                                <div className="day-header">
                                    <h3>{day}</h3>
                                    <span className="class-count">{daySchedule.length} classes</span>
                                </div>
                                <div className="day-slots">
                                    {daySchedule.length > 0 ? (
                                        daySchedule.map((slot) => (
                                            <div key={slot.id} className="schedule-slot">
                                                <div className="slot-time">
                                                    <span className="period">P{slot.period_number}</span>
                                                    <span className="time-range">
                                                        {slot.start_time} - {slot.end_time}
                                                    </span>
                                                </div>
                                                <div className="slot-details">
                                                    <div className="slot-subject">{slot.subject}</div>
                                                    <div className="slot-section">{slot.section}</div>
                                                    <div className="slot-room">📍 {slot.room}</div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-classes">No classes scheduled</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedTeacher && !loading && schedule.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">📅</div>
                    <h3>No Schedule Found</h3>
                    <p>This teacher doesn't have any classes scheduled yet.</p>
                </div>
            )}
        </div>
    );
};

export default TeacherView;
