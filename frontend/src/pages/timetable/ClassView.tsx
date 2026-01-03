/**
 * Class Timetable View
 * Shows a section's weekly schedule
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ClassView.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

interface ClassSchedule {
    id: string;
    day: string;
    start_time: string;
    end_time: string;
    subject: string;
    teacher: string;
    teacher_id: string;
    room: string;
    period_number: number;
}

const ClassView: React.FC = () => {
    const [sections, setSections] = useState<any[]>([]);
    const [selectedSection, setSelectedSection] = useState<string>('');
    const [schedule, setSchedule] = useState<ClassSchedule[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchSections();
    }, []);

    useEffect(() => {
        if (selectedSection) {
            fetchClassSchedule();
        }
    }, [selectedSection]);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('access_token');
        const tenantId = localStorage.getItem('tenant_id');
        return {
            'Authorization': `Bearer ${token}`,
            'X-Tenant-ID': tenantId || '',
        };
    };

    const fetchSections = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/tenants/sections/`, {
                headers: getAuthHeaders(),
            });
            setSections(response.data.results || response.data);
        } catch (err) {
            console.error('Error fetching sections:', err);
        }
    };

    const fetchClassSchedule = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(
                `${API_BASE_URL}/timetable/slots/section_schedule/?section_id=${selectedSection}`,
                { headers: getAuthHeaders() }
            );
            setSchedule(response.data.schedule || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error fetching schedule');
        } finally {
            setLoading(false);
        }
    };

    /* const getScheduleForDay = (day: string) => {
        return schedule
            .filter((slot) => slot.day === day)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));
    }; */

    const selectedSectionData = sections.find((s) => s.id === selectedSection);

    return (
        <div className="class-view">
            <div className="class-view-header">
                <h1>📚 Class Schedule</h1>
                <p>View weekly class timetable</p>
            </div>

            <div className="section-selector">
                <label>Select Class/Section</label>
                <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                >
                    <option value="">Choose a section...</option>
                    {sections.map((section) => (
                        <option key={section.id} value={section.id}>
                            {section.grade_level?.name} - {section.name}
                        </option>
                    ))}
                </select>
            </div>

            {selectedSection && selectedSectionData && (
                <div className="section-info-card">
                    <div className="section-icon">📖</div>
                    <div className="section-details">
                        <h2>
                            {selectedSectionData.grade_level?.name} - {selectedSectionData.name}
                        </h2>
                        <p className="class-teacher">
                            Class Teacher: {selectedSectionData.class_teacher?.first_name || 'Not Assigned'}
                        </p>
                        <p className="room-number">Room: {selectedSectionData.room_number || 'N/A'}</p>
                    </div>
                    <div className="section-stats">
                        <div className="stat">
                            <div className="stat-value">{schedule.length}</div>
                            <div className="stat-label">Total Periods</div>
                        </div>
                        <div className="stat">
                            <div className="stat-value">
                                {new Set(schedule.map((s) => s.subject)).size}
                            </div>
                            <div className="stat-label">Subjects</div>
                        </div>
                        <div className="stat">
                            <div className="stat-value">{selectedSectionData.capacity || 0}</div>
                            <div className="stat-label">Capacity</div>
                        </div>
                    </div>
                </div>
            )}

            {loading && <div className="loading">Loading schedule...</div>}
            {error && <div className="error-message">{error}</div>}

            {selectedSection && !loading && schedule.length > 0 && (
                <div className="weekly-timetable">
                    <table className="timetable-table">
                        <thead>
                            <tr>
                                <th className="time-column">Time</th>
                                {DAYS.map((day) => (
                                    <th key={day}>{day}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {/* Get unique time slots */}
                            {Array.from(
                                new Set(schedule.map((s) => `${s.start_time}-${s.end_time}`))
                            )
                                .sort()
                                .map((timeSlot) => {
                                    const [start, end] = timeSlot.split('-');
                                    const period = schedule.find(
                                        (s) => s.start_time === start && s.end_time === end
                                    )?.period_number;

                                    return (
                                        <tr key={timeSlot}>
                                            <td className="time-column">
                                                <div className="period-info">
                                                    <span className="period">P{period}</span>
                                                    <span className="time">
                                                        {start} - {end}
                                                    </span>
                                                </div>
                                            </td>
                                            {DAYS.map((day) => {
                                                const slot = schedule.find(
                                                    (s) =>
                                                        s.day === day &&
                                                        s.start_time === start &&
                                                        s.end_time === end
                                                );

                                                return (
                                                    <td key={`${day}-${timeSlot}`} className="class-cell">
                                                        {slot ? (
                                                            <div className="class-info">
                                                                <div className="subject-name">{slot.subject}</div>
                                                                <div className="teacher-name">{slot.teacher}</div>
                                                                <div className="room-info">📍 {slot.room}</div>
                                                            </div>
                                                        ) : (
                                                            <div className="no-class">-</div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
            )}

            {selectedSection && !loading && schedule.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">📅</div>
                    <h3>No Schedule Found</h3>
                    <p>This section doesn't have any classes scheduled yet.</p>
                </div>
            )}
        </div>
    );
};

export default ClassView;
