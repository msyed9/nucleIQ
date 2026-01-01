/**
 * NucleIQ Design System - KPI Card Component
 * Enhanced stat card with trend indicators and icons
 */

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import './KPICard.css';

export interface KPICardProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Icon component */
    icon: LucideIcon;

    /** KPI label */
    label: string;

    /** KPI value */
    value: string | number;

    /** Trend data */
    trend?: {
        value: number;
        direction: 'up' | 'down';
        label?: string;
    };

    /** Color scheme */
    colorScheme: 'blue' | 'green' | 'purple' | 'orange' | 'red';

    /** Enable hover effect */
    hoverable?: boolean;

    /** Click handler */
    onClick?: () => void;
}

const colorMap = {
    blue: {
        bg: 'rgba(33, 150, 243, 0.05)',
        iconBg: 'rgba(33, 150, 243, 0.1)',
        iconColor: '#2196F3',
        border: '#2196F3',
    },
    green: {
        bg: 'rgba(76, 175, 80, 0.05)',
        iconBg: 'rgba(76, 175, 80, 0.1)',
        iconColor: '#4CAF50',
        border: '#4CAF50',
    },
    purple: {
        bg: 'rgba(156, 39, 176, 0.05)',
        iconBg: 'rgba(156, 39, 176, 0.1)',
        iconColor: '#9C27B0',
        border: '#9C27B0',
    },
    orange: {
        bg: 'rgba(255, 152, 0, 0.05)',
        iconBg: 'rgba(255, 152, 0, 0.1)',
        iconColor: '#FF9800',
        border: '#FF9800',
    },
    red: {
        bg: 'rgba(244, 67, 54, 0.05)',
        iconBg: 'rgba(244, 67, 54, 0.1)',
        iconColor: '#F44336',
        border: '#F44336',
    },
} as const;

export const KPICard: React.FC<KPICardProps> = ({
    icon: Icon,
    label,
    value,
    trend,
    colorScheme,
    hoverable = true,
    onClick,
    className = '',
    ...props
}) => {
    const colors = colorMap[colorScheme];

    const classes = [
        'ds-kpi-card',
        hoverable && 'ds-kpi-card--hoverable',
        onClick && 'ds-kpi-card--clickable',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div
            className={classes}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            style={{
                background: `linear-gradient(135deg, ${colors.bg}, rgba(255,255,255,0.02))`,
                borderLeft: `4px solid ${colors.border}`,
            }}
            {...props}
        >
            <div className="ds-kpi-card__icon-container" style={{ background: colors.iconBg }}>
                <Icon size={32} color={colors.iconColor} strokeWidth={2} aria-hidden="true" />
            </div>

            <div className="ds-kpi-card__content">
                <div className="ds-kpi-card__value">{value}</div>
                <div className="ds-kpi-card__label">{label}</div>

                {trend && (
                    <div className={`ds-kpi-card__trend ds-kpi-card__trend--${trend.direction}`}>
                        {trend.direction === 'up' ? (
                            <TrendingUp size={14} aria-hidden="true" />
                        ) : (
                            <TrendingDown size={14} aria-hidden="true" />
                        )}
                        <span>
                            {trend.direction === 'up' ? '+' : '-'}
                            {Math.abs(trend.value)}%
                        </span>
                        {trend.label && <span className="ds-kpi-card__trend-label">{trend.label}</span>}
                    </div>
                )}
            </div>
        </div>
    );
};

KPICard.displayName = 'KPICard';
