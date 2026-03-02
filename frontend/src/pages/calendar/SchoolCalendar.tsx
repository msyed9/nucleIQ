/**
 * School Calendar - Interactive Calendar with Holidays, Events & Attendance Integration
 */

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import './Calendar.css';

interface Holiday {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    holiday_type: 'PUBLIC' | 'SCHOOL' | 'RESTRICTED' | 'VACATION';
    description?: string;
    is_recurring: boolean;
}

interface SchoolEvent {
    id: string;
    title: string;
    description?: string;
    start_date: string;
    end_date?: string;
    event_type: 'ACADEMIC' | 'CULTURAL' | 'SPORTS' | 'MEETING' | 'EXAM' | 'OTHER';
    location?: string;
    is_all_day: boolean;
}

interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    isWeekend: boolean;
    isSunday: boolean;
    holidays: Holiday[];
    events: SchoolEvent[];
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const HOLIDAY_COLORS: Record<string, string> = {
    PUBLIC: '#ef4444',
    SCHOOL: '#f97316',
    RESTRICTED: '#eab308',
    VACATION: '#22c55e',
};

const EVENT_COLORS: Record<string, string> = {
    ACADEMIC: '#3b82f6',
    CULTURAL: '#8b5cf6',
    SPORTS: '#10b981',
    MEETING: '#6366f1',
    EXAM: '#ec4899',
    OTHER: '#64748b',
};

const SchoolCalendar: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [events, setEvents] = useState<SchoolEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
    const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

    useEffect(() => {
        fetchCalendarData();
    }, [currentDate]);

    const fetchCalendarData = async () => {
        setLoading(true);
        try {
            const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

            const startDate = startOfMonth.toISOString().split('T')[0];
            const endDate = endOfMonth.toISOString().split('T')[0];

            const [holidaysRes, eventsRes] = await Promise.all([
                api.get(`/tenants/holidays/calendar_view/?start_date=${startDate}&end_date=${endDate}`),
                api.get(`/communication/events/?start_date=${startDate}&end_date=${endDate}`).catch(() => ({ data: [] }))
            ]);

            setHolidays(Array.isArray(holidaysRes.data) ? holidaysRes.data : []);
            setEvents(Array.isArray(eventsRes.data) ? eventsRes.data : eventsRes.data?.results || []);
        } catch (error) {
            console.error('Error fetching calendar data:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateCalendarDays = (): CalendarDay[] => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const today = new Date();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const startingDayOfWeek = firstDayOfMonth.getDay();

        const days: CalendarDay[] = [];

        // Previous month days
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            const date = new Date(year, month - 1, prevMonthLastDay - i);
            days.push(createCalendarDay(date, false, today));
        }

        // Current month days
        for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
            const date = new Date(year, month, day);
            days.push(createCalendarDay(date, true, today));
        }

        // Next month days
        const remainingDays = 42 - days.length;
        for (let day = 1; day <= remainingDays; day++) {
            const date = new Date(year, month + 1, day);
            days.push(createCalendarDay(date, false, today));
        }

        return days;
    };

    const createCalendarDay = (date: Date, isCurrentMonth: boolean, today: Date): CalendarDay => {
        const localDateStr = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, '0'),
            String(date.getDate()).padStart(2, '0')
        ].join('-');

        const dayHolidays = holidays.filter(h => {
            const startDateStr = h.start_date.split('T')[0];
            const endDateStr = h.end_date ? h.end_date.split('T')[0] : startDateStr;
            return localDateStr >= startDateStr && localDateStr <= endDateStr;
        });

        const dayEvents = events.filter(e => {
            const startDateStr = e.start_date.split('T')[0];
            const endDateStr = e.end_date ? e.end_date.split('T')[0] : startDateStr;
            return localDateStr >= startDateStr && localDateStr <= endDateStr;
        });

        return {
            date,
            isCurrentMonth,
            isToday: date.toDateString() === today.toDateString(),
            isWeekend: date.getDay() === 0 || date.getDay() === 6,
            isSunday: date.getDay() === 0,
            holidays: dayHolidays,
            events: dayEvents,
        };
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (direction === 'prev') {
                newDate.setMonth(newDate.getMonth() - 1);
            } else {
                newDate.setMonth(newDate.getMonth() + 1);
            }
            return newDate;
        });
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const calendarDays = generateCalendarDays();

    if (loading) {
        return <Loading fullScreen text="Loading Calendar..." />;
    }

    return (
        <div className="school-calendar-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">📅 School Calendar</h1>
                    <p className="page-subtitle">View holidays, events, and school activities</p>
                </div>
                <div className="header-actions">
                    <Button variant="outline" onClick={goToToday}>
                        Today
                    </Button>
                </div>
            </div>

            <div className="calendar-container">
                <Card className="calendar-card">
                    {/* Calendar Header */}
                    <div className="calendar-header">
                        <button className="nav-btn" onClick={() => navigateMonth('prev')}>
                            ◀
                        </button>
                        <h2 className="calendar-title">
                            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h2>
                        <button className="nav-btn" onClick={() => navigateMonth('next')}>
                            ▶
                        </button>
                    </div>

                    {/* Weekday Headers */}
                    <div className="calendar-weekdays">
                        {WEEKDAYS.map(day => (
                            <div key={day} className="weekday-header">{day}</div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="calendar-grid">
                        {calendarDays.map((day, index) => (
                            <div
                                key={index}
                                className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${day.isToday ? 'today' : ''} ${day.isWeekend ? 'weekend' : ''} ${day.isSunday ? 'sunday' : ''} ${day.holidays.length > 0 ? 'has-holiday' : ''}`}
                                onClick={() => setSelectedDay(day)}
                            >
                                <span className="day-number">{day.date.getDate()}</span>

                                <div className="day-markers">
                                    {day.holidays.slice(0, 2).map((h, i) => (
                                        <div
                                            key={i}
                                            className="holiday-marker"
                                            style={{ backgroundColor: HOLIDAY_COLORS[h.holiday_type] }}
                                            title={h.name}
                                        />
                                    ))}
                                    {day.events.slice(0, 2).map((e, i) => (
                                        <div
                                            key={i}
                                            className="event-marker"
                                            style={{ backgroundColor: EVENT_COLORS[e.event_type] }}
                                            title={e.title}
                                        />
                                    ))}
                                    {(day.holidays.length + day.events.length) > 2 && (
                                        <span className="more-count">+{day.holidays.length + day.events.length - 2}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Legend & Selected Day Info */}
                <div className="calendar-sidebar">
                    <Card>
                        <h3 className="sidebar-title">🎨 Legend</h3>
                        <div className="legend-section">
                            <h4>Holidays</h4>
                            {Object.entries(HOLIDAY_COLORS).map(([type, color]) => (
                                <div key={type} className="legend-item">
                                    <span className="legend-dot" style={{ backgroundColor: color }} />
                                    <span>{type.charAt(0) + type.slice(1).toLowerCase()}</span>
                                </div>
                            ))}
                        </div>
                        <div className="legend-section">
                            <h4>Events</h4>
                            {Object.entries(EVENT_COLORS).map(([type, color]) => (
                                <div key={type} className="legend-item">
                                    <span className="legend-dot" style={{ backgroundColor: color }} />
                                    <span>{type.charAt(0) + type.slice(1).toLowerCase()}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {selectedDay && (
                        <Card className="selected-day-card">
                            <h3 className="sidebar-title">
                                📌 {selectedDay.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </h3>

                            {selectedDay.holidays.length === 0 && selectedDay.events.length === 0 ? (
                                <p className="no-items">No holidays or events on this day</p>
                            ) : (
                                <>
                                    {selectedDay.holidays.map(h => (
                                        <div key={h.id} className="day-item holiday-item">
                                            <span className="item-dot" style={{ backgroundColor: HOLIDAY_COLORS[h.holiday_type] }} />
                                            <div>
                                                <strong>{h.name}</strong>
                                                <span className="item-type">{h.holiday_type}</span>
                                                {h.description && <p>{h.description}</p>}
                                            </div>
                                        </div>
                                    ))}
                                    {selectedDay.events.map(e => (
                                        <div key={e.id} className="day-item event-item">
                                            <span className="item-dot" style={{ backgroundColor: EVENT_COLORS[e.event_type] }} />
                                            <div>
                                                <strong>{e.title}</strong>
                                                <span className="item-type">{e.event_type}</span>
                                                {e.location && <p>📍 {e.location}</p>}
                                                {e.description && <p>{e.description}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </Card>
                    )}

                    <Card>
                        <h3 className="sidebar-title">📊 This Month</h3>
                        <div className="month-stats">
                            <div className="stat-item">
                                <span className="stat-value">{holidays.length}</span>
                                <span className="stat-label">Holidays</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{events.length}</span>
                                <span className="stat-label">Events</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">
                                    {calendarDays.filter(d => d.isCurrentMonth && !d.isWeekend && d.holidays.length === 0).length}
                                </span>
                                <span className="stat-label">Working Days</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SchoolCalendar;
