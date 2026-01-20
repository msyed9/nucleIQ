/**
 * Fee Summary Widget
 * Displays fee overview for parents and accountants
 */

import React from 'react';
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import './widgets.css';

interface FeeSummaryItem {
    student_id?: string;
    student_name?: string;
    total_due: number;
    paid: number;
    pending: number;
}

interface FeeSummaryData {
    summary?: FeeSummaryItem[];
    total_due?: number;
    collected?: number;
    pending?: number;
    collected_this_month?: number;
    collection_rate?: number;
}

interface FeeSummaryWidgetProps {
    widgetId: string;
    config?: Record<string, any>;
    data: FeeSummaryData;
    onRefresh?: () => void;
}

const formatCurrency = (amount: number): string => {
    if (amount >= 10000000) {
        return `₹${(amount / 10000000).toFixed(1)}Cr`;
    }
    if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(1)}L`;
    }
    if (amount >= 1000) {
        return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount.toFixed(0)}`;
};

export const FeeSummaryWidget: React.FC<FeeSummaryWidgetProps> = ({
    widgetId,
    data,
    onRefresh
}) => {
    const { summary = [], total_due, collected, pending, collected_this_month, collection_rate } = data;

    // Overview mode (for accountants)
    if (total_due !== undefined) {
        return (
            <div className="fee-summary-widget overview">
                <div className="summary-header">
                    <DollarSign size={18} />
                    <h3>Fee Overview</h3>
                </div>

                <div className="fee-stats">
                    <div className="fee-stat">
                        <div className="stat-icon total">
                            <DollarSign size={18} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{formatCurrency(total_due || 0)}</span>
                            <span className="stat-label">Total Due</span>
                        </div>
                    </div>

                    <div className="fee-stat">
                        <div className="stat-icon success">
                            <CheckCircle size={18} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{formatCurrency(collected || 0)}</span>
                            <span className="stat-label">Collected</span>
                        </div>
                    </div>

                    <div className="fee-stat">
                        <div className="stat-icon warning">
                            <AlertTriangle size={18} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{formatCurrency(pending || 0)}</span>
                            <span className="stat-label">Pending</span>
                        </div>
                    </div>

                    {collected_this_month !== undefined && (
                        <div className="fee-stat">
                            <div className="stat-icon primary">
                                <TrendingUp size={18} />
                            </div>
                            <div className="stat-content">
                                <span className="stat-value">{formatCurrency(collected_this_month)}</span>
                                <span className="stat-label">This Month</span>
                            </div>
                        </div>
                    )}
                </div>

                {collection_rate !== undefined && (
                    <div className="collection-progress">
                        <div className="progress-header">
                            <span>Collection Rate</span>
                            <span className="rate">{collection_rate.toFixed(1)}%</span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress"
                                style={{ width: `${Math.min(collection_rate, 100)}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Children fee summary (for parents)
    if (summary.length === 0) {
        return (
            <div className="fee-summary-widget empty">
                <div className="empty-state">
                    <DollarSign size={32} />
                    <p>No fee data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fee-summary-widget">
            <div className="summary-header">
                <DollarSign size={18} />
                <h3>Fee Summary</h3>
            </div>

            <div className="summary-list">
                {summary.map((item, index) => (
                    <div key={item.student_id || index} className="summary-item">
                        <div className="student-info">
                            <div className="student-name">{item.student_name}</div>
                        </div>
                        <div className="fee-details">
                            <div className="fee-row">
                                <span className="fee-label">Total Due</span>
                                <span className="fee-value">{formatCurrency(item.total_due)}</span>
                            </div>
                            <div className="fee-row success">
                                <span className="fee-label">Paid</span>
                                <span className="fee-value">{formatCurrency(item.paid)}</span>
                            </div>
                            <div className="fee-row warning">
                                <span className="fee-label">Pending</span>
                                <span className="fee-value">{formatCurrency(item.pending)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FeeSummaryWidget;
