/**
 * Recent Activity Widget
 * Displays recent activities with badges and timestamps
 */

import React from 'react';
import { Activity, Clock, CheckCircle, DollarSign, UserPlus, BookOpen, AlertTriangle } from 'lucide-react';
import './widgets.css';

interface ActivityItem {
    id?: string;
    type: string;
    title: string;
    description: string;
    time: string;
    badge: 'success' | 'primary' | 'info' | 'warning' | 'error';
}

interface RecentActivityData {
    activities?: ActivityItem[];
    payments?: any[];
    remarks?: any[];
    defaulters?: any[];
}

interface RecentActivityWidgetProps {
    widgetId: string;
    config?: Record<string, any>;
    data: RecentActivityData;
    onRefresh?: () => void;
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
    payment: <DollarSign size={14} />,
    admission: <UserPlus size={14} />,
    exam: <BookOpen size={14} />,
    attendance: <CheckCircle size={14} />,
    default: <Activity size={14} />,
};

const BADGE_COLORS: Record<string, string> = {
    success: '#22c55e',
    primary: '#3b82f6',
    info: '#06b6d4',
    warning: '#f59e0b',
    error: '#ef4444',
};

export const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({
    widgetId,
    data,
    onRefresh
}) => {
    // Handle different data formats
    let activities: ActivityItem[] = [];

    if (data.activities) {
        activities = data.activities;
    } else if (data.payments) {
        activities = data.payments.map((p: any) => ({
            id: p.id,
            type: 'payment',
            title: 'Fee Payment',
            description: `${p.student_name} paid ₹${p.amount}`,
            time: p.payment_date,
            badge: 'success' as const
        }));
    } else if (data.remarks) {
        activities = data.remarks.map((r: any) => ({
            id: r.id,
            type: r.type?.toLowerCase() || 'remark',
            title: r.type === 'POSITIVE' ? 'Positive Remark' : 'Remark',
            description: `${r.student_name}: ${r.content?.slice(0, 50)}...`,
            time: r.created_at,
            badge: r.type === 'POSITIVE' ? 'success' : 'warning' as const
        }));
    } else if (data.defaulters) {
        activities = data.defaulters.map((d: any) => ({
            id: d.student_id,
            type: 'defaulter',
            title: 'Fee Overdue',
            description: `${d.student_name} - ₹${d.amount} (${d.overdue_days} days)`,
            time: d.due_date,
            badge: 'error' as const
        }));
    }

    if (activities.length === 0) {
        return (
            <div className="recent-activity-widget empty">
                <div className="empty-state">
                    <Activity size={32} />
                    <p>No recent activity</p>
                </div>
            </div>
        );
    }

    const formatTime = (timeString: string) => {
        try {
            const date = new Date(timeString);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);

            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            if (diffDays < 7) return `${diffDays}d ago`;
            return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        } catch {
            return timeString;
        }
    };

    return (
        <div className="recent-activity-widget">
            <div className="widget-header">
                <Activity size={18} />
                <h3>Recent Activity</h3>
            </div>

            <div className="activity-list">
                {activities.slice(0, 8).map((activity, index) => (
                    <div key={activity.id || index} className="activity-item">
                        <div
                            className="activity-icon"
                            style={{ backgroundColor: `${BADGE_COLORS[activity.badge]}20`, color: BADGE_COLORS[activity.badge] }}
                        >
                            {ACTIVITY_ICONS[activity.type] || ACTIVITY_ICONS.default}
                        </div>
                        <div className="activity-content">
                            <div className="activity-title">{activity.title}</div>
                            <div className="activity-description">{activity.description}</div>
                        </div>
                        <div className="activity-time">
                            <Clock size={12} />
                            <span>{formatTime(activity.time)}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentActivityWidget;
