/**
 * Attendance Summary Widget
 * Displays attendance percentages for children or self
 */

import React from 'react';
import { CheckCircle, Calendar, Clock } from 'lucide-react';
import './widgets.css';

interface AttendanceSummaryItem {
    student_id?: string;
    student_name?: string;
    present_days: number;
    total_days: number;
    percentage: number;
}

interface AttendanceSummaryData {
    summary?: AttendanceSummaryItem[];
    attendance?: {
        present: number;
        total: number;
        percentage: number;
    };
}

interface AttendanceSummaryWidgetProps {
    widgetId: string;
    config?: Record<string, any>;
    data: AttendanceSummaryData;
    onRefresh?: () => void;
}

export const AttendanceSummaryWidget: React.FC<AttendanceSummaryWidgetProps> = ({
    data,
    onRefresh
}) => {
    const { summary = [], attendance } = data;

    const getColorForPercentage = (percentage: number): string => {
        if (percentage >= 90) return '#22c55e';
        if (percentage >= 75) return '#eab308';
        return '#ef4444';
    };

    // Single attendance view
    if (attendance) {
        const color = getColorForPercentage(attendance.percentage);
        return (
            <div className="attendance-summary-widget single">
                <div className="summary-header">
                    <CheckCircle size={18} />
                    <h3>My Attendance</h3>
                </div>
                <div className="attendance-circle" style={{ '--progress-color': color } as React.CSSProperties}>
                    <svg viewBox="0 0 100 100">
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="var(--color-border)"
                            strokeWidth="8"
                        />
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke={color}
                            strokeWidth="8"
                            strokeDasharray={`${attendance.percentage * 2.83} ${283 - attendance.percentage * 2.83}`}
                            strokeLinecap="round"
                            transform="rotate(-90 50 50)"
                        />
                    </svg>
                    <div className="circle-content">
                        <span className="percentage">{attendance.percentage.toFixed(1)}%</span>
                        <span className="label">Attendance</span>
                    </div>
                </div>
                <div className="attendance-stats">
                    <div className="stat">
                        <span className="stat-value">{attendance.present}</span>
                        <span className="stat-label">Present</span>
                    </div>
                    <div className="stat">
                        <span className="stat-value">{attendance.total}</span>
                        <span className="stat-label">Total Days</span>
                    </div>
                </div>
            </div>
        );
    }

    // Multiple children summary
    if (summary.length === 0) {
        return (
            <div className="attendance-summary-widget empty">
                <div className="empty-state">
                    <Calendar size={32} />
                    <p>No attendance data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="attendance-summary-widget">
            <div className="summary-header">
                <CheckCircle size={18} />
                <h3>Attendance Summary</h3>
            </div>

            <div className="summary-list">
                {summary.map((item, index) => {
                    const color = getColorForPercentage(item.percentage);
                    return (
                        <div key={item.student_id || index} className="summary-item">
                            <div className="student-info">
                                <div className="student-name">{item.student_name}</div>
                                <div className="attendance-days">
                                    {item.present_days}/{item.total_days} days
                                </div>
                            </div>
                            <div className="progress-bar">
                                <div
                                    className="progress"
                                    style={{
                                        width: `${item.percentage}%`,
                                        backgroundColor: color
                                    }}
                                />
                            </div>
                            <div className="percentage" style={{ color }}>
                                {item.percentage.toFixed(1)}%
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AttendanceSummaryWidget;
