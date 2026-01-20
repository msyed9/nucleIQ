/**
 * Quick Stats Widget
 * Simple statistic display with icon and optional trend
 */

import React from 'react';
import { Users, GraduationCap, TrendingUp, TrendingDown } from 'lucide-react';
import './widgets.css';

interface QuickStatsData {
    value: number | string;
    change?: number;
    change_percentage?: number;
    label?: string;
}

interface QuickStatsWidgetProps {
    widgetId: string;
    config?: Record<string, any>;
    data: QuickStatsData;
    onRefresh?: () => void;
}

const WIDGET_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    student_count: {
        label: 'Total Students',
        icon: <Users size={24} />,
        color: '#3b82f6'
    },
    staff_count: {
        label: 'Total Staff',
        icon: <GraduationCap size={24} />,
        color: '#10b981'
    }
};

export const QuickStatsWidget: React.FC<QuickStatsWidgetProps> = ({
    widgetId,
    data,
    onRefresh
}) => {
    const config = WIDGET_CONFIG[widgetId] || {
        label: 'Statistics',
        icon: <Users size={24} />,
        color: '#6366f1'
    };

    const { value, change, change_percentage } = data;

    return (
        <div className="quick-stats-widget" style={{ '--stat-color': config.color } as React.CSSProperties}>
            <div className="stat-icon">
                {config.icon}
            </div>
            <div className="stat-content">
                <div className="stat-value">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </div>
                <div className="stat-label">{data.label || config.label}</div>
            </div>
            {(change !== undefined || change_percentage !== undefined) && (
                <div className={`stat-trend ${(change || change_percentage || 0) >= 0 ? 'positive' : 'negative'}`}>
                    {(change || change_percentage || 0) >= 0 ? (
                        <TrendingUp size={14} />
                    ) : (
                        <TrendingDown size={14} />
                    )}
                    <span>
                        {change_percentage !== undefined ? `${change_percentage}%` : change}
                    </span>
                </div>
            )}
        </div>
    );
};

export default QuickStatsWidget;
