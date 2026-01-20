/**
 * Overview Stats Widget
 * Displays key statistics in a compact grid
 */

import React from 'react';
import { Users, GraduationCap, DollarSign, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import './widgets.css';

interface OverviewStatsData {
    total_students: number;
    total_staff: number;
    attendance_rate: number;
    fee_collected_this_month: number;
    pending_fees: number;
}

interface OverviewStatsWidgetProps {
    widgetId: string;
    config?: Record<string, any>;
    data: OverviewStatsData;
    onRefresh?: () => void;
}

export const OverviewStatsWidget: React.FC<OverviewStatsWidgetProps> = ({
    data,
    onRefresh
}) => {
    const formatCurrency = (amount: number) => {
        if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(1)}L`;
        }
        if (amount >= 1000) {
            return `₹${(amount / 1000).toFixed(1)}K`;
        }
        return `₹${amount}`;
    };

    const stats = [
        {
            label: 'Total Students',
            value: data.total_students?.toLocaleString() || '0',
            icon: Users,
            color: '#3b82f6',
            trend: '+5%'
        },
        {
            label: 'Total Staff',
            value: data.total_staff?.toString() || '0',
            icon: GraduationCap,
            color: '#10b981',
            trend: '+2%'
        },
        {
            label: 'Attendance Rate',
            value: `${data.attendance_rate?.toFixed(1) || 0}%`,
            icon: CheckCircle,
            color: '#8b5cf6',
            trend: data.attendance_rate >= 90 ? '+' : '-'
        },
        {
            label: 'Collected This Month',
            value: formatCurrency(data.fee_collected_this_month || 0),
            icon: DollarSign,
            color: '#f59e0b',
            trend: null
        },
        {
            label: 'Pending Fees',
            value: formatCurrency(data.pending_fees || 0),
            icon: DollarSign,
            color: '#ef4444',
            trend: null
        }
    ];

    return (
        <div className="overview-stats-widget">
            {stats.map((stat, index) => (
                <div key={index} className="stat-card" style={{ '--stat-color': stat.color } as React.CSSProperties}>
                    <div className="stat-icon">
                        <stat.icon size={20} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stat.value}</div>
                        <div className="stat-label">{stat.label}</div>
                    </div>
                    {stat.trend && (
                        <div className={`stat-trend ${stat.trend.startsWith('+') ? 'positive' : 'negative'}`}>
                            {stat.trend.startsWith('+') ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            <span>{stat.trend}</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default OverviewStatsWidget;
