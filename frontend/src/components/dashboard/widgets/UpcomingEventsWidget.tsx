/**
 * Upcoming Events Widget
 * Displays upcoming school events
 */

import React from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import './widgets.css';

interface EventItem {
    id: string;
    title: string;
    date: string;
    description: string;
    type: string;
    location?: string;
}

interface UpcomingEventsData {
    events: EventItem[];
}

interface UpcomingEventsWidgetProps {
    widgetId: string;
    config?: Record<string, any>;
    data: UpcomingEventsData;
    onRefresh?: () => void;
}

const EVENT_COLORS: Record<string, string> = {
    exam: '#ef4444',
    holiday: '#22c55e',
    meeting: '#3b82f6',
    sports: '#f59e0b',
    cultural: '#8b5cf6',
    default: '#6366f1'
};

export const UpcomingEventsWidget: React.FC<UpcomingEventsWidgetProps> = ({
    data,
    onRefresh
}) => {
    const { events = [] } = data;

    const formatEventDate = (dateString: string): { day: string; month: string } => {
        try {
            const date = new Date(dateString);
            return {
                day: date.getDate().toString(),
                month: date.toLocaleDateString('en-IN', { month: 'short' })
            };
        } catch {
            return { day: '--', month: '---' };
        }
    };

    if (events.length === 0) {
        return (
            <div className="upcoming-events-widget empty">
                <div className="empty-state">
                    <Calendar size={32} />
                    <p>No upcoming events</p>
                </div>
            </div>
        );
    }

    return (
        <div className="upcoming-events-widget">
            <div className="widget-header">
                <Calendar size={18} />
                <h3>Upcoming Events</h3>
            </div>

            <div className="events-list">
                {events.slice(0, 5).map((event, index) => {
                    const { day, month } = formatEventDate(event.date);
                    const color = EVENT_COLORS[event.type?.toLowerCase()] || EVENT_COLORS.default;

                    return (
                        <div key={event.id || index} className="event-item">
                            <div
                                className="event-date"
                                style={{ '--event-color': color } as React.CSSProperties}
                            >
                                <span className="day">{day}</span>
                                <span className="month">{month}</span>
                            </div>
                            <div className="event-info">
                                <div className="event-title">{event.title}</div>
                                <div className="event-description">{event.description}</div>
                                {event.location && (
                                    <div className="event-location">
                                        <MapPin size={12} />
                                        <span>{event.location}</span>
                                    </div>
                                )}
                            </div>
                            <div
                                className="event-type"
                                style={{ backgroundColor: `${color}20`, color }}
                            >
                                {event.type}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default UpcomingEventsWidget;
