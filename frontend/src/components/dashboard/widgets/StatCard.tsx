/**
 * Stat Card Widget
 * Reusable card component for displaying statistics
 */

import React from 'react';
import './StatCard.css';

interface StatCardProps {
    title: string;
    value: number | string;
    icon: string;
    color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
    change?: number;
    changeLabel?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    icon,
    color = 'blue',
    change,
    changeLabel,
}) => {
    const isPositive = change !== undefined && change >= 0;

    return (
        <div className={`stat-card-widget ${color}`}>
            <div className="stat-card-header">
                <div className="stat-card-icon">{icon}</div>
                <div className="stat-card-title">{title}</div>
            </div>

            <div className="stat-card-body">
                <div className="stat-card-value">{value}</div>

                {change !== undefined && (
                    <div className={`stat-card-change ${isPositive ? 'positive' : 'negative'}`}>
                        <span className="change-icon">{isPositive ? '↑' : '↓'}</span>
                        <span className="change-value">{Math.abs(change)}%</span>
                        {changeLabel && <span className="change-label">{changeLabel}</span>}
                    </div>
                )}
            </div>
        </div>
    );
};
