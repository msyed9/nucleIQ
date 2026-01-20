/**
 * Homework Widget
 * Displays pending homework assignments
 */

import React from 'react';
import { BookOpen, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import './widgets.css';

interface HomeworkItem {
    id: string;
    title: string;
    subject: string;
    section?: string;
    due_date: string;
    is_urgent?: boolean;
    submitted?: number;
    total?: number;
    percentage?: number;
}

interface HomeworkData {
    homework?: HomeworkItem[];
}

interface HomeworkWidgetProps {
    widgetId: string;
    config?: Record<string, any>;
    data: HomeworkData;
    onRefresh?: () => void;
}

export const HomeworkWidget: React.FC<HomeworkWidgetProps> = ({
    widgetId,
    data,
    onRefresh
}) => {
    const { homework = [] } = data;

    const formatDueDate = (dateString: string): string => {
        try {
            const date = new Date(dateString);
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            if (date.toDateString() === today.toDateString()) {
                return 'Today';
            }
            if (date.toDateString() === tomorrow.toDateString()) {
                return 'Tomorrow';
            }
            return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        } catch {
            return dateString;
        }
    };

    // Teacher view (with submission stats)
    const isTeacherView = homework.length > 0 && homework[0].submitted !== undefined;

    if (homework.length === 0) {
        return (
            <div className="homework-widget empty">
                <div className="empty-state">
                    <BookOpen size={32} />
                    <p>No pending homework</p>
                </div>
            </div>
        );
    }

    return (
        <div className="homework-widget">
            <div className="widget-header">
                <BookOpen size={18} />
                <h3>{isTeacherView ? 'Homework Status' : 'Pending Homework'}</h3>
            </div>

            <div className="homework-list">
                {homework.slice(0, 6).map((item, index) => (
                    <div key={item.id || index} className={`homework-item ${item.is_urgent ? 'urgent' : ''}`}>
                        <div className="homework-info">
                            <div className="homework-title">{item.title}</div>
                            <div className="homework-meta">
                                <span className="subject">{item.subject}</span>
                                {item.section && <span className="section">{item.section}</span>}
                            </div>
                        </div>

                        {isTeacherView ? (
                            <div className="submission-stats">
                                <div className="progress-ring">
                                    <svg viewBox="0 0 36 36">
                                        <path
                                            d="M18 2.0845
                                            a 15.9155 15.9155 0 0 1 0 31.831
                                            a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke="#e2e8f0"
                                            strokeWidth="3"
                                        />
                                        <path
                                            d="M18 2.0845
                                            a 15.9155 15.9155 0 0 1 0 31.831
                                            a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke={item.percentage && item.percentage >= 80 ? '#22c55e' : '#f59e0b'}
                                            strokeWidth="3"
                                            strokeDasharray={`${item.percentage || 0}, 100`}
                                        />
                                    </svg>
                                    <span className="ring-text">{item.submitted}/{item.total}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="due-info">
                                {item.is_urgent && <AlertTriangle size={14} className="urgent-icon" />}
                                <Clock size={12} />
                                <span className={item.is_urgent ? 'urgent-text' : ''}>{formatDueDate(item.due_date)}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HomeworkWidget;
