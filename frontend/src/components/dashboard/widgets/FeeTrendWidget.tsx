/**
 * Fee Trend Widget
 * Displays fee collection trends over time in a chart
 */

import React, { useMemo } from 'react';
import { TrendingUp, DollarSign } from 'lucide-react';
import './widgets.css';

interface FeeTrendDataPoint {
    period: string;
    amount: number;
}

interface FeeTrendData {
    data: FeeTrendDataPoint[];
    total_due?: number;
    collected?: number;
    pending?: number;
    collection_rate?: number;
}

interface FeeTrendWidgetProps {
    widgetId: string;
    config?: Record<string, any>;
    data: FeeTrendData;
    onRefresh?: () => void;
}

export const FeeTrendWidget: React.FC<FeeTrendWidgetProps> = ({
    widgetId,
    config,
    data,
    onRefresh
}) => {
    const { data: trendData = [], total_due, collected, pending, collection_rate } = data;

    const chartData = useMemo(() => {
        if (!trendData || trendData.length === 0) return null;

        const maxAmount = Math.max(...trendData.map(d => d.amount));
        const minAmount = Math.min(...trendData.map(d => d.amount));

        return trendData.map((point, index) => ({
            ...point,
            height: maxAmount > 0 ? (point.amount / maxAmount) * 100 : 0,
            isLast: index === trendData.length - 1
        }));
    }, [trendData]);

    const totalCollected = useMemo(() => {
        return collected || trendData.reduce((sum, d) => sum + d.amount, 0);
    }, [trendData, collected]);

    const formatCurrency = (amount: number) => {
        if (amount >= 10000000) {
            return `₹${(amount / 10000000).toFixed(1)}Cr`;
        }
        if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(1)}L`;
        }
        if (amount >= 1000) {
            return `₹${(amount / 1000).toFixed(1)}K`;
        }
        return `₹${amount}`;
    };

    if (!chartData || chartData.length === 0) {
        return (
            <div className="fee-trend-widget empty">
                <div className="empty-state">
                    <DollarSign size={32} />
                    <p>No fee data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fee-trend-widget">
            <div className="widget-header">
                <div className="header-left">
                    <TrendingUp size={18} />
                    <h3>Fee Collection Trend</h3>
                </div>
                <div className="header-right">
                    <span className="total-amount">{formatCurrency(totalCollected)}</span>
                    {collection_rate !== undefined && (
                        <span className="collection-rate">{collection_rate.toFixed(1)}% collected</span>
                    )}
                </div>
            </div>

            <div className="chart-container">
                <div className="bar-chart">
                    {chartData.map((point, index) => (
                        <div key={index} className="bar-wrapper">
                            <div
                                className={`bar ${point.isLast ? 'current' : ''}`}
                                style={{ height: `${point.height}%` }}
                            >
                                <div className="bar-tooltip">
                                    <strong>{formatCurrency(point.amount)}</strong>
                                    <span>{point.period}</span>
                                </div>
                            </div>
                            <span className="bar-label">{point.period}</span>
                        </div>
                    ))}
                </div>
            </div>

            {(total_due !== undefined || pending !== undefined) && (
                <div className="summary-row">
                    {total_due !== undefined && (
                        <div className="summary-item">
                            <span className="summary-label">Total Due</span>
                            <span className="summary-value">{formatCurrency(total_due)}</span>
                        </div>
                    )}
                    {collected !== undefined && (
                        <div className="summary-item success">
                            <span className="summary-label">Collected</span>
                            <span className="summary-value">{formatCurrency(collected)}</span>
                        </div>
                    )}
                    {pending !== undefined && (
                        <div className="summary-item warning">
                            <span className="summary-label">Pending</span>
                            <span className="summary-value">{formatCurrency(pending)}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FeeTrendWidget;
