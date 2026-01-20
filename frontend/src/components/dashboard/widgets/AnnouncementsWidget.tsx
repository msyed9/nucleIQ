/**
 * Announcements Widget
 * Displays school announcements
 */

import React from 'react';
import { Bell, AlertCircle, Info, Clock } from 'lucide-react';
import './widgets.css';

interface AnnouncementItem {
    id: string;
    title: string;
    content: string;
    created_at: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface AnnouncementsData {
    announcements: AnnouncementItem[];
}

interface AnnouncementsWidgetProps {
    widgetId: string;
    config?: Record<string, any>;
    data: AnnouncementsData;
    onRefresh?: () => void;
}

const PRIORITY_CONFIG = {
    HIGH: { color: '#ef4444', icon: AlertCircle },
    MEDIUM: { color: '#f59e0b', icon: Bell },
    LOW: { color: '#3b82f6', icon: Info }
};

export const AnnouncementsWidget: React.FC<AnnouncementsWidgetProps> = ({
    data,
    onRefresh
}) => {
    const { announcements = [] } = data;

    const formatTime = (dateString: string): string => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffHours / 24);

            if (diffHours < 24) return `${diffHours}h ago`;
            if (diffDays < 7) return `${diffDays}d ago`;
            return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        } catch {
            return '';
        }
    };

    if (announcements.length === 0) {
        return (
            <div className="announcements-widget empty">
                <div className="empty-state">
                    <Bell size={32} />
                    <p>No announcements</p>
                </div>
            </div>
        );
    }

    return (
        <div className="announcements-widget">
            <div className="widget-header">
                <Bell size={18} />
                <h3>Announcements</h3>
            </div>

            <div className="announcements-list">
                {announcements.slice(0, 5).map((announcement, index) => {
                    const config = PRIORITY_CONFIG[announcement.priority] || PRIORITY_CONFIG.LOW;
                    const Icon = config.icon;

                    return (
                        <div key={announcement.id || index} className="announcement-item">
                            <div className="announcement-icon" style={{ color: config.color }}>
                                <Icon size={16} />
                            </div>
                            <div className="announcement-content">
                                <div className="announcement-title">{announcement.title}</div>
                                <div className="announcement-excerpt">
                                    {announcement.content.length > 100
                                        ? `${announcement.content.slice(0, 100)}...`
                                        : announcement.content}
                                </div>
                                <div className="announcement-meta">
                                    <Clock size={12} />
                                    <span>{formatTime(announcement.created_at)}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AnnouncementsWidget;
