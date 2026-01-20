/**
 * Attendance Heatmap Widget
 * Displays attendance data as a heatmap grid
 */

import React from 'react';
import { Calendar } from 'lucide-react';
import './widgets.css';

interface AttendanceDataPoint {
    date: string;
    rate: number | null;
}

interface SectionAttendance {
    section: string;
    class: string;
    data: AttendanceDataPoint[];
}

interface AttendanceHeatmapData {
    data: SectionAttendance[];
}

interface AttendanceHeatmapWidgetProps {
    widgetId: string;
    config?: Record<string, any>;
    data: AttendanceHeatmapData;
    onRefresh?: () => void;
}

const getColorForRate = (rate: number | null): string => {
    if (rate === null) return '#f1f5f9';
    if (rate >= 95) return '#22c55e';
    if (rate >= 85) return '#84cc16';
    if (rate >= 75) return '#eab308';
    if (rate >= 60) return '#f97316';
    return '#ef4444';
};

export const AttendanceHeatmapWidget: React.FC<AttendanceHeatmapWidgetProps> = ({
    data,
    onRefresh
}) => {
    const { data: sections = [] } = data;

    if (sections.length === 0) {
        return (
            <div className="attendance-heatmap-widget empty">
                <div className="empty-state">
                    <Calendar size={32} />
                    <p>No attendance data available</p>
                </div>
            </div>
        );
    }

    // Get last 14 days of dates for header
    const dates = sections[0]?.data.slice(-14) || [];

    return (
        <div className="attendance-heatmap-widget">
            <div className="widget-header">
                <Calendar size={18} />
                <h3>Attendance Heatmap</h3>
            </div>

            <div className="heatmap-container">
                <div className="heatmap-grid">
                    {/* Header row with dates */}
                    <div className="heatmap-row header">
                        <div className="section-label">Section</div>
                        {dates.map((point, index) => (
                            <div key={index} className="heatmap-cell header-cell">
                                {new Date(point.date).getDate()}
                            </div>
                        ))}
                    </div>

                    {/* Data rows */}
                    {sections.slice(0, 8).map((section, sectionIndex) => (
                        <div key={sectionIndex} className="heatmap-row">
                            <div className="section-label">
                                <span className="class-name">{section.class}</span>
                                <span className="section-name">{section.section}</span>
                            </div>
                            {section.data.slice(-14).map((point, index) => (
                                <div
                                    key={index}
                                    className="heatmap-cell"
                                    style={{ backgroundColor: getColorForRate(point.rate) }}
                                    title={point.rate !== null ? `${point.rate}%` : 'No data'}
                                >
                                    {point.rate !== null && (
                                        <span className="cell-value">
                                            {Math.round(point.rate)}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="heatmap-legend">
                <span className="legend-label">Low</span>
                <div className="legend-scale">
                    <div className="legend-color" style={{ backgroundColor: '#ef4444' }} />
                    <div className="legend-color" style={{ backgroundColor: '#f97316' }} />
                    <div className="legend-color" style={{ backgroundColor: '#eab308' }} />
                    <div className="legend-color" style={{ backgroundColor: '#84cc16' }} />
                    <div className="legend-color" style={{ backgroundColor: '#22c55e' }} />
                </div>
                <span className="legend-label">High</span>
            </div>
        </div>
    );
};

export default AttendanceHeatmapWidget;
