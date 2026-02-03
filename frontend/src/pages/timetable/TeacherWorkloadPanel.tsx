/**
 * Teacher Workload Panel
 * Shows teacher schedule summary and highlights overloaded teachers
 */

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

interface TimetableSlot {
    id: string;
    teacher: string;
    teacher_name: string;
    subject_name: string;
    day_of_week: string;
    period_number: number;
}

interface TeacherWorkload {
    teacher_id: string;
    teacher_name: string;
    total_periods: number;
    periods_by_day: Record<string, number>;
    subjects: string[];
    is_overloaded: boolean;
    back_to_back_count: number;
}

interface WorkloadPanelProps {
    slots: TimetableSlot[];
    maxPeriodsPerDay?: number;
    maxPeriodsPerWeek?: number;
    onTeacherClick?: (teacherId: string) => void;
    isOpen: boolean;
    onToggle: () => void;
}

const DAYS_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const TeacherWorkloadPanel: React.FC<WorkloadPanelProps> = ({
    slots,
    maxPeriodsPerDay = 6,
    maxPeriodsPerWeek = 30,
    onTeacherClick,
    isOpen,
    onToggle
}) => {
    const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'name' | 'load'>('load');

    // Calculate workload for all teachers
    const teacherWorkloads = useMemo(() => {
        const workloadMap = new Map<string, TeacherWorkload>();

        slots.forEach(slot => {
            if (!slot.teacher) return;

            if (!workloadMap.has(slot.teacher)) {
                workloadMap.set(slot.teacher, {
                    teacher_id: slot.teacher,
                    teacher_name: slot.teacher_name || 'Unknown',
                    total_periods: 0,
                    periods_by_day: {},
                    subjects: [],
                    is_overloaded: false,
                    back_to_back_count: 0
                });
            }

            const workload = workloadMap.get(slot.teacher)!;
            workload.total_periods += 1;
            workload.periods_by_day[slot.day_of_week] =
                (workload.periods_by_day[slot.day_of_week] || 0) + 1;

            if (!workload.subjects.includes(slot.subject_name)) {
                workload.subjects.push(slot.subject_name);
            }
        });

        // Calculate overload status and back-to-back periods
        workloadMap.forEach((workload, teacherId) => {
            // Check if overloaded by week
            if (workload.total_periods > maxPeriodsPerWeek) {
                workload.is_overloaded = true;
            }

            // Check if overloaded by any day
            Object.values(workload.periods_by_day).forEach(count => {
                if (count > maxPeriodsPerDay) {
                    workload.is_overloaded = true;
                }
            });

            // Calculate back-to-back periods
            const teacherSlots = slots.filter(s => s.teacher === teacherId);
            DAYS_ORDER.forEach(day => {
                const daySlots = teacherSlots
                    .filter(s => s.day_of_week === day)
                    .map(s => s.period_number)
                    .sort((a, b) => a - b);

                for (let i = 0; i < daySlots.length - 1; i++) {
                    if (daySlots[i + 1] - daySlots[i] === 1) {
                        workload.back_to_back_count += 1;
                    }
                }
            });
        });

        // Convert to array and sort
        const workloads = Array.from(workloadMap.values());

        if (sortBy === 'load') {
            workloads.sort((a, b) => b.total_periods - a.total_periods);
        } else {
            workloads.sort((a, b) => a.teacher_name.localeCompare(b.teacher_name));
        }

        return workloads;
    }, [slots, maxPeriodsPerDay, maxPeriodsPerWeek, sortBy]);

    const overloadedCount = teacherWorkloads.filter(w => w.is_overloaded).length;
    const totalTeachers = teacherWorkloads.length;
    const avgLoad = totalTeachers > 0
        ? Math.round(teacherWorkloads.reduce((sum, w) => sum + w.total_periods, 0) / totalTeachers)
        : 0;

    const handleTeacherClick = (teacherId: string) => {
        setSelectedTeacher(selectedTeacher === teacherId ? null : teacherId);
        onTeacherClick?.(teacherId);
    };

    const getLoadColor = (periods: number): string => {
        const percentage = (periods / maxPeriodsPerWeek) * 100;
        if (percentage >= 100) return '#ef4444'; // Red - overloaded
        if (percentage >= 80) return '#f59e0b'; // Orange - high
        if (percentage >= 50) return '#10b981'; // Green - moderate
        return '#6b7280'; // Gray - low
    };

    const getLoadPercentage = (periods: number): number => {
        return Math.min(100, (periods / maxPeriodsPerWeek) * 100);
    };

    if (!isOpen) {
        return (
            <button className="workload-toggle-btn" onClick={onToggle} title="Teacher Workload">
                👥 {overloadedCount > 0 && <span className="badge-warning">{overloadedCount}</span>}
            </button>
        );
    }

    return (
        <div className="workload-panel">
            <div className="workload-header">
                <h3>👥 Teacher Workload</h3>
                <button className="close-btn" onClick={onToggle}>×</button>
            </div>

            {/* Summary Stats */}
            <div className="workload-summary">
                <div className="summary-stat">
                    <span className="stat-value">{totalTeachers}</span>
                    <span className="stat-label">Teachers</span>
                </div>
                <div className="summary-stat">
                    <span className="stat-value">{avgLoad}</span>
                    <span className="stat-label">Avg Periods</span>
                </div>
                <div className={`summary-stat ${overloadedCount > 0 ? 'warning' : ''}`}>
                    <span className="stat-value">{overloadedCount}</span>
                    <span className="stat-label">Overloaded</span>
                </div>
            </div>

            {/* Sort Controls */}
            <div className="workload-controls">
                <button
                    className={`sort-btn ${sortBy === 'load' ? 'active' : ''}`}
                    onClick={() => setSortBy('load')}
                >
                    By Load
                </button>
                <button
                    className={`sort-btn ${sortBy === 'name' ? 'active' : ''}`}
                    onClick={() => setSortBy('name')}
                >
                    By Name
                </button>
            </div>

            {/* Teacher List */}
            <div className="workload-list">
                {teacherWorkloads.map(workload => (
                    <div
                        key={workload.teacher_id}
                        className={`workload-item ${selectedTeacher === workload.teacher_id ? 'selected' : ''} ${workload.is_overloaded ? 'overloaded' : ''}`}
                        onClick={() => handleTeacherClick(workload.teacher_id)}
                    >
                        <div className="teacher-info">
                            <span className="teacher-name">
                                {workload.is_overloaded && '⚠️ '}
                                {workload.teacher_name}
                            </span>
                            <span className="teacher-subjects">
                                {workload.subjects.slice(0, 2).join(', ')}
                                {workload.subjects.length > 2 && ` +${workload.subjects.length - 2}`}
                            </span>
                        </div>

                        <div className="workload-bar-container">
                            <div
                                className="workload-bar"
                                style={{
                                    width: `${getLoadPercentage(workload.total_periods)}%`,
                                    backgroundColor: getLoadColor(workload.total_periods)
                                }}
                            />
                            <span className="workload-value">{workload.total_periods}</span>
                        </div>

                        {/* Expanded Details */}
                        {selectedTeacher === workload.teacher_id && (
                            <div className="workload-details">
                                <div className="detail-row">
                                    <span>Max per day: {maxPeriodsPerDay}</span>
                                    <span>Max per week: {maxPeriodsPerWeek}</span>
                                </div>
                                <div className="daily-breakdown">
                                    {DAYS_ORDER.map(day => {
                                        const count = workload.periods_by_day[day] || 0;
                                        const isHigh = count > maxPeriodsPerDay;
                                        return (
                                            <div key={day} className={`day-count ${isHigh ? 'high' : ''}`}>
                                                <span className="day-label">{day.substring(0, 3)}</span>
                                                <span className="day-value">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                {workload.back_to_back_count > 0 && (
                                    <div className="back-to-back">
                                        📌 {workload.back_to_back_count} back-to-back periods
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {teacherWorkloads.length === 0 && (
                    <div className="empty-message">
                        No teachers scheduled yet
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherWorkloadPanel;
