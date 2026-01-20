/**
 * Timetable Widget
 * Displays today's schedule/timetable
 */

import React from 'react';
import { Clock, BookOpen, User, MapPin } from 'lucide-react';
import './widgets.css';

interface PeriodItem {
    time: string;
    subject: string;
    teacher?: string;
    room?: string;
    section?: string;
}

interface TimetableData {
    classes?: PeriodItem[];
    schedule?: PeriodItem[];
}

interface TimetableWidgetProps {
    widgetId: string;
    config?: Record<string, any>;
    data: TimetableData;
    onRefresh?: () => void;
}

export const TimetableWidget: React.FC<TimetableWidgetProps> = ({
    widgetId,
    data,
    onRefresh
}) => {
    const periods = data.classes || data.schedule || [];

    const isCurrentPeriod = (timeString: string): boolean => {
        try {
            const [hours, minutes] = timeString.split(':').map(Number);
            const now = new Date();
            const periodTime = new Date();
            periodTime.setHours(hours, minutes, 0, 0);

            const diff = now.getTime() - periodTime.getTime();
            return diff >= 0 && diff < 3600000; // Within 1 hour
        } catch {
            return false;
        }
    };

    if (periods.length === 0) {
        return (
            <div className="timetable-widget empty">
                <div className="empty-state">
                    <Clock size={32} />
                    <p>No classes scheduled for today</p>
                </div>
            </div>
        );
    }

    const isTeacherView = widgetId.includes('my_classes');

    return (
        <div className="timetable-widget">
            <div className="widget-header">
                <Clock size={18} />
                <h3>{isTeacherView ? "Today's Classes" : 'Schedule'}</h3>
            </div>

            <div className="periods-list">
                {periods.map((period, index) => {
                    const isCurrent = isCurrentPeriod(period.time);

                    return (
                        <div
                            key={index}
                            className={`period-item ${isCurrent ? 'current' : ''}`}
                        >
                            <div className="period-time">
                                <Clock size={14} />
                                <span>{period.time}</span>
                            </div>
                            <div className="period-info">
                                <div className="subject-name">
                                    <BookOpen size={14} />
                                    <span>{period.subject}</span>
                                </div>
                                {period.section && (
                                    <div className="section-name">{period.section}</div>
                                )}
                                <div className="period-meta">
                                    {period.teacher && (
                                        <span className="teacher">
                                            <User size={12} />
                                            {period.teacher}
                                        </span>
                                    )}
                                    {period.room && (
                                        <span className="room">
                                            <MapPin size={12} />
                                            {period.room}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {isCurrent && (
                                <div className="current-badge">Now</div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TimetableWidget;
